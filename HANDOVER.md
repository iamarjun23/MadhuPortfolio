# Migration Handover: Split Studio (Vercel) / Display (Cloudflare)

## Why

`/studio` was tripping Cloudflare error **1102** ("Worker exceeded CPU time limit"): it does DB reads/writes + full React renders per request, against a ~10ms Worker CPU budget. The public `(public)` display routes are already cached (R2 + Durable Objects, see [open-next.config.ts](open-next.config.ts)) and stay cheap.

**Fix:** move everything CPU-heavy off Cloudflare Workers. Cloudflare keeps serving the cached public site only.

## Target architecture

| Route group | Platform | Why |
|---|---|---|
| `(public)` — homepage, `/process`, `/room` | Cloudflare (opennextjs-cloudflare) | Already cached, cheap, unaffected |
| `/studio`, `/studio/[section]`, `/login` | Vercel | CPU-heavy, no Workers CPU ceiling on Vercel |
| `/api/upload/[endpoint]` | Vercel | Writes to R2, needs to run alongside studio auth |
| `/api/auth` (NextAuth) | Vercel | Session/auth logic lives with studio |
| `/api/media/[...key]` | **Deleted** | Replaced by R2 custom domain, see below |
| `/api/instagram-thumb`, `/api/linkedin-thumb` | Cloudflare (stays) | Used by public pages, lightweight fetch/cache |
| Media storage (images/video) | R2, served via custom domain `media.yourdomain.com` | Bypasses the Worker entirely — request never enters `.open-next/worker.js`, so 1102 is structurally impossible on that path |
| Postgres | Same DB, two connection paths | Cloudflare → Hyperdrive; Vercel → direct `DATABASE_URL` |

## Steps you do (dashboard/account — no repo access needed)

1. **Cloudflare dashboard → R2 → bucket `images` → Settings → Custom Domains** → connect `media.yourdomain.com`. This alone removes 1102 risk for media serving, permanently — the request path no longer touches the Worker at all.
2. **Create the Vercel project**, link this repo, set `studio.yourdomain.com` as its domain.
3. **DNS**: add `studio` CNAME → Vercel. Leave the root domain pointed at Cloudflare (unchanged).
4. **Vercel env vars**:
   - `DATABASE_URL` — direct Postgres connection string (no Hyperdrive; that's Cloudflare-only)
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` — R2's S3-compatible API credentials (Cloudflare dashboard → R2 → Manage API tokens), needed by the upload route since Vercel can't use the Worker's native `R2Bucket` binding
   - `NEXTAUTH_URL=https://studio.yourdomain.com`
   - Any other secrets currently only set in `wrangler.jsonc`/Cloudflare env that studio/auth/upload code reads

## Steps I do (code — not yet started, waiting on go-ahead)

1. Rewrite [`src/app/api/upload/[endpoint]/route.ts`](src/app/api/upload/[endpoint]/route.ts): replace `env.MEDIA_BUCKET` (Worker-only binding) with the AWS S3 SDK pointed at R2's S3-compatible endpoint, so it runs on Vercel's Node runtime instead of `workerd`.
2. Update stored `media.url` values (and any code that builds media URLs) to point at `media.yourdomain.com` instead of `/api/media/...`.
3. Delete [`src/app/api/media/[...key]/route.ts`](src/app/api/media/[...key]/route.ts) — superseded by the R2 custom domain.
4. Exclude `/studio`, `/login`, `/api/*` from the Cloudflare build (`opennextjs-cloudflare`) so that Worker only ever builds/serves `(public)`.
5. Swap [`src/lib/db.ts`](src/lib/db.ts) to use a plain Postgres connection when running on Vercel (no Hyperdrive dependency there — Hyperdrive is Cloudflare-only).
6. Verify `requireOwner()` / NextAuth session handling works standalone on Vercel's runtime (currently runs inside the same Worker as everything else — confirm no Cloudflare-specific request context is assumed).

## Open decisions

- Existing media already stored under `/api/media/<key>` URLs in the DB — decide: rewrite all `media.url` rows to the new domain in a migration, or keep the old route alive as a redirect for existing links.
- Confirm R2 object keys (UUIDs) are fine to expose on a public custom domain — no auth/signing today, matches current behavior.

---
*Generated 2026-09-12 — companion to the architecture discussion in this session.*
