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
  // The Worker lazily `import()`s the Next server and every route module the first time an isolate
  // handles a request, and that evaluation is billed to whichever request triggers it — which is
  // where the 0.3-1s CPU spikes in the analytics come from. Preloading the routes in `waitUntil`
  // moves that work off the critical path so only the isolate's first response carries it.
  routePreloadingBehavior: "withWaitUntil",
});
