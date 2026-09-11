import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import doShardedTagCache from "@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

// Without these overrides OpenNext resolves every cache to its "dummy" no-op implementation, so
// `unstable_cache`, ISR and the full route cache all silently do nothing: every request re-runs the
// Postgres reads and a full React render inside the Worker. That is what pushed p99 CPU per request
// to ~0.5-1s and produced the 1102 "Worker exceeded CPU time limit" errors on /studio.
//
// R2 holds the cache entries; the regional (Cache API) layer in front of it keeps a colo-local copy
// so a warm page never leaves the edge. The sharded tag cache is what makes `updateTag` in
// lib/revalidate.ts actually invalidate a published section, and the queue de-duplicates the ISR
// revalidations those invalidations trigger.
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" }),
  tagCache: doShardedTagCache({ baseShardSize: 4, regionalCache: true }),
  queue: doQueue,
  // Serve a cached page from the Worker's own routing layer instead of booting the Next server to
  // do it. That server boot is the single biggest slice of per-request CPU here, and a cache hit
  // does not need it. Flagged "dangerous" upstream because the interception happens before Next's
  // own resolution, so a route relying on PPR or on middleware rewriting into a cached path would
  // be served the pre-rewrite entry — nothing this app does. Every cacheable route here is a plain
  // prerendered page.
  enableCacheInterception: true,
  // NOTE: `routePreloadingBehavior: "withWaitUntil"` was set here and has been removed. Preloading
  // evaluates every route module in `waitUntil`, and that CPU is still billed to the invocation
  // that scheduled it. Against a 10ms budget that turns a cheap request into a killed one — the
  // error rate went up, not down, on the version that shipped it. Only worth revisiting on a plan
  // where the per-invocation CPU ceiling is seconds rather than milliseconds.
});
