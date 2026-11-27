# Production Deployment

The same repo deploys twice, against one Postgres database:

| Serves                                                                         | Platform                      | Why                                                                                               |
| ------------------------------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------- |
| Public site — `/`, `/room`, the thumbnail APIs, `/api/revalidate`              | Cloudflare Workers (OpenNext) | Prerendered and cached in R2 + D1, so a request costs almost no CPU                               |
| Studio — `/studio`, `/login`, `/api/auth`, the upload and media server actions | Vercel                        | Database writes and full renders per request; on Workers they hit error 1102 (CPU limit exceeded) |
| Uploads                                                                        | R2 bucket `images`            | Served from the bucket's custom domain, so requests never reach the Worker                        |

Postgres is reached through Hyperdrive from the Worker and through `DATABASE_URL` from Vercel. Examples below use `nmadhukumar.com`, `studio.nmadhukumar.com` and `media.nmadhukumar.com`; substitute your own hostnames. Deploying requires Node 20 LTS or newer and pnpm 11.

How the two halves talk to each other:

- The Worker redirects `/studio/:path*` to `STUDIO_URL` with that prefix dropped, and `/login`/`/api/auth` unchanged (see `redirects()` in `next.config.mjs`). The Vercel deployment's own middleware (`src/middleware.ts`) then maps those bare paths back onto the `/studio` route tree, so `studio.nmadhukumar.com` never shows `/studio` and never serves the public pages. Old `/api/media/<key>` links redirect to `NEXT_PUBLIC_MEDIA_URL`.
- The studio signs a short-lived R2 URL, and the browser PUTs the file straight to R2. Vercel rejects function request bodies over 4.5MB, so uploads can't pass through it. `finishUpload` then checks the stored object and records it.
- After a publish, the studio POSTs to `PUBLIC_SITE_URL/api/revalidate` with `REVALIDATE_SECRET` so the Worker clears its own cache. Clearing Vercel's cache doesn't touch the Worker's.

> **Windows note:** OpenNext's Cloudflare build (`pnpm cf:build` / `pnpm deploy`) does not reliably work on native Windows — esbuild trips over pnpm's symlinked `node_modules` when bundling the worker. Run these from WSL, macOS, Linux, or CI (e.g. a GitHub Actions Linux runner, or Cloudflare's own Workers Builds, which runs on Linux). `pnpm dev`, `pnpm build`, `pnpm lint`, and `pnpm typecheck` are unaffected and work fine on Windows.

## One-time Cloudflare setup

1. Add your domain to a Cloudflare account and point its nameservers at Cloudflare.
2. `wrangler login` (opens a browser OAuth flow).
3. Create the Hyperdrive binding so Workers can reach Postgres (Workers can't open raw TCP sockets to Postgres directly — Hyperdrive proxies the connection):
   ```bash
   wrangler hyperdrive create madhu-edit-db --connection-string="$DATABASE_URL"
   ```
   Copy the returned `id` into `wrangler.jsonc`'s `hyperdrive[0].id`.
4. Set up the uploads bucket, `images`:
   - **R2 → images → Settings → Custom Domains**: connect `media.nmadhukumar.com`. This origin is `NEXT_PUBLIC_MEDIA_URL`.
   - **R2 → images → Settings → CORS policy**: let the studio PUT to the bucket, and GET/HEAD so the focal-point "Auto-detect" can read an image's pixels (it applies on the `media.` custom domain too). Add `http://localhost:3000` to `AllowedOrigins` if you upload from `pnpm dev`.
     ```json
     [
       {
         "AllowedOrigins": ["https://studio.nmadhukumar.com"],
         "AllowedMethods": ["PUT", "GET", "HEAD"],
         "AllowedHeaders": ["content-type", "cache-control"],
         "MaxAgeSeconds": 3600
       }
     ]
     ```
   - **R2 → Manage API tokens**: create a token with Object Read & Write, scoped to `images`. Its access key ID, secret, and your account ID are the `R2_*` variables below.
   - New uploads store `Cache-Control: public, max-age=31536000, immutable`. Files uploaded before this change carry none. If you want them cached the same way, add a Cache Rule for the media hostname.
   - **Rules → Transform Rules → Modify Response Header** (zone `nmadhukumar.com`): create a rule, _If_ `Hostname equals media.nmadhukumar.com`, _Then_ **Set static** `X-Content-Type-Options` = `nosniff`. R2 serves these files directly, so the headers in `next.config.mjs` never apply to them; without this a browser may guess a file's type from its contents instead of trusting `Content-Type`. Check with `curl -sI https://media.nmadhukumar.com/<any key> | grep -i x-content-type`.
   - **Same place, a second rule `resume download`**: _If_ (custom expression) `http.host eq "media.nmadhukumar.com" and starts_with(http.request.uri.path, "/resumeFile/") and http.request.uri.query contains "download=1"`, _Then_ **Set static** `Content-Disposition` = `attachment; filename="N-Madhu-Kumar-Resume.pdf"`. Clicking the menu's Resume link opens `<pdf>` in a new tab and fetches `<pdf>?download=1` for the saved copy; browsers ignore the `download` attribute across origins, and putting the header on the object itself would stop the new tab from showing it inline. Check with `curl -sI "https://media.nmadhukumar.com/resumeFile/<key>?download=1" | grep -i content-disposition`.
5. Create the R2 bucket that backs Next's incremental cache (`r2_buckets[0]`, bound as `NEXT_INC_CACHE_R2_BUCKET`):
   ```bash
   wrangler r2 bucket create madhuportfolio-cache
   ```
   Without it OpenNext falls back to its no-op "dummy" cache: `unstable_cache`, ISR and the full route cache all silently do nothing, every request re-queries Postgres and re-renders inside the Worker, and the CPU that burns is what produced the 1102 errors. The tag cache lives in D1 (`NEXT_TAG_CACHE_D1`): create it once with `wrangler d1 create madhuportfolio-tag-cache` and put its id in `wrangler.jsonc`; deploy creates the table. (A Durable Objects tag cache was used before and exhausted the free plan's daily DO quota — every page view made dozens of DO calls.)
6. Set the Worker secret the studio uses to clear its cache:
   ```bash
   wrangler secret put REVALIDATE_SECRET
   ```
   The Worker no longer serves sign-in, so any `AUTH_*` secrets set on it are unused.
7. Set these **build** variables. `next.config.mjs` reads them during `next build`, so runtime secrets don't work:
   - `STUDIO_URL=https://studio.nmadhukumar.com`
   - `NEXT_PUBLIC_MEDIA_URL=https://media.nmadhukumar.com`
   - `NEXT_PUBLIC_SITE_URL=https://nmadhukumar.com` (LinkedIn/Instagram card thumbnails are resized and edge-cached from here; unset, they load full-size and uncached)
   - `DATABASE_URL` (see below)

## One-time Vercel setup

1. Import this repo as a Next.js project. The default build (`pnpm build`) is correct. Leave the install command at its default, or set it to `pnpm install --frozen-lockfile`. The default is safe only because Vercel sets `CI=1`, which makes pnpm refuse an out-of-date lockfile instead of rewriting it.
2. Add the domain `studio.nmadhukumar.com`. In Cloudflare DNS, add a CNAME `studio` → the target Vercel shows, set to **DNS only** (grey cloud). The root domain stays on the Worker.
3. Environment variables:

   | Variable                                                    | Value                                                                                                                                                                                         |
   | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `DATABASE_URL`                                              | Direct Postgres connection string. Prefer the provider's pooled endpoint: each request opens its own small pool.                                                                              |
   | `AUTH_SECRET`                                               | The value the Worker used, so existing sessions stay valid, or a new one (`openssl rand -base64 32`). **Required, 32+ characters: every Vercel build fails without it.**                      |
   | `AUTH_URL`                                                  | `https://studio.nmadhukumar.com`. **Required for Production builds, which fail without an `https://` value.** It pins every sign-in URL to this origin.                                       |
   | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | From the R2 API token above                                                                                                                                                                   |
   | `R2_BUCKET`                                                 | `images`                                                                                                                                                                                      |
   | `NEXT_PUBLIC_MEDIA_URL`                                     | `https://media.nmadhukumar.com`                                                                                                                                                               |
   | `NEXT_PUBLIC_SITE_URL`                                      | `https://nmadhukumar.com`, so the studio preview's LinkedIn/Instagram thumbnails load resized too                                                                                             |
   | `PUBLIC_SITE_URL`                                           | `https://nmadhukumar.com`. **Required for Production builds, which fail without an `https://` value.**                                                                                        |
   | `REVALIDATE_SECRET`                                         | Same value as the Worker secret. **Required for Production builds.** A wrong value shows up after a publish as "the live site did not refresh", with a **Refresh live site** button to retry. |

   Don't set `STUDIO_URL` on Vercel. It's ignored there anyway, so the studio can't redirect to itself.

## Cutover

Run these in order. **Don't publish from the studio until step 3 is done.** Until then the live Worker has no `/api/revalidate` route and its CSP blocks the media domain.

1. Finish both setups above.
2. Deploy to Vercel. Sign in at `https://studio.nmadhukumar.com/login`, upload a video larger than 4.5MB, and check it loads from the media domain.
3. Deploy the Worker. `nmadhukumar.com/studio` now redirects to the studio.
4. Rewrite the stored `/api/media/...` addresses and clear the live site's cache, with `DATABASE_URL`, `NEXT_PUBLIC_MEDIA_URL`, `PUBLIC_SITE_URL` and `REVALIDATE_SECRET` set:
   ```bash
   pnpm media:rewrite-urls
   ```
   Until this runs, cached pages still point at `/api/media/...`. Those links redirect to the media domain, so nothing breaks in the meantime. The script is safe to run again.

## If deploying the Worker via Cloudflare Workers Builds (git-connected auto-deploy)

Workers Builds runs its own build/deploy commands, separate from `wrangler.jsonc`. In the project's dashboard settings:

- **Build command:** `npx pnpm@11.9.0 install --frozen-lockfile && npx pnpm@11.9.0 cf:build`
- **Deploy command:** `npx wrangler deploy`

`wrangler deploy` auto-detects the OpenNext project and calls `opennextjs-cloudflare deploy`, which expects the `.open-next/` directory produced by the build command above to already exist — a build command of just `pnpm install` will fail with "Could not find compiled Open Next config".

`DATABASE_URL` **does** need to be set as a build-time variable. `prisma generate` alone would not need it — `prisma.config.ts` falls back to a placeholder connection string — but the public routes (`/`, `/room`) are prerendered during `next build`, so the build reads the published sections straight from Postgres. Without a reachable database the build fails while prerendering `/robots.txt` (checked 2026-11-24 with a placeholder URL). CI therefore builds against a throwaway Postgres service container, never production.

`opennextjs-cloudflare deploy` (invoked by `wrangler deploy` above) always starts a local Miniflare proxy to collect env vars before the real remote deploy, and that proxy needs to emulate the Hyperdrive binding or it fails with `UserError: ... set the value of the 'CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE' variable`. Setting that as a Workers Builds environment variable is unreliable — the separate Deploy command process doesn't always inherit it — so `wrangler.jsonc`'s `hyperdrive[0].localConnectionString` is set to a dummy Postgres URI instead. It's never actually connected to (it only satisfies this local bootstrap step), so it's safe to commit — the deployed Worker still reaches Postgres through the real `hyperdrive[0].id` binding at runtime.

## Database

Run these commands against the production `DATABASE_URL` before the first deploy:

```bash
pnpm prisma migrate deploy
pnpm db:seed
pnpm admin:create
```

Run `pnpm db:seed` only to create or deliberately reset the initial content set. It updates every seeded draft and published section.

Run `pnpm prisma migrate deploy` again whenever `prisma/migrations/` gains a folder, **before** deploying the code that needs it. Studio sign-in reads the `LoginAttempt` table on every attempt (each attempt is counted before the password is checked; an email or IP locks after five tries, from 1 minute doubling up to 1 hour, and a key left alone for a day starts again from zero), so deploying it without that migration breaks login. The change-password form shares those counters. An email lock does not block an address the owner has signed in from before; those addresses are kept as `trusted:<email>|<ip>` rows in the same table. To lift a lockout early, delete the matching `email:…` / `ip:…` row from `LoginAttempt`. Each Studio sign-in is also a row in the `Session` table, and a session works only while its row exists: logging out deletes that row (a copied cookie stops working too), changing the password or running `pnpm admin:create` deletes every row, and a session ends a week after sign-in even if used daily. To sign out every device by hand, delete all rows from `Session`. The first deploy of this behaviour signs out every session issued before it.

## Local development

`src/lib/db.ts` resolves its Postgres connection from the Hyperdrive binding when running on Workers, falling back to `DATABASE_URL` otherwise. For `next dev` to emulate the Hyperdrive binding, set an env var named after the binding:

```
CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE="<same value as DATABASE_URL>"
```

(already set in the local `.env`, which is gitignored). This is only required for `next dev` — `next build` no longer needs it.

Uploads need the `R2_*` variables and `NEXT_PUBLIC_MEDIA_URL` in `.env`, plus `http://localhost:3000` in the bucket's CORS rule. Without them the studio runs with uploads disabled. Leave `STUDIO_URL` and `PUBLIC_SITE_URL` unset locally, because one server serves everything.

## Deploy

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm deploy
```

`pnpm deploy` builds and deploys the Worker (`prisma generate`, the OpenNext Cloudflare build, and `wrangler deploy`). The Worker build stops unless `STUDIO_URL` is set (run it as `STUDIO_URL=https://studio.nmadhukumar.com pnpm deploy`, or `http://localhost:3000` for a local `pnpm preview`), so a Worker can never ship without the Studio redirects. Use `pnpm preview` first to run the built Worker locally via Wrangler. The studio deploys through Vercel's git integration.

## Watching for failures

Nothing pages anyone yet. Every failure below writes one log line, so a quick search after a deploy or a publish shows whether anything broke. The public site's lines are in **Cloudflare → Workers & Pages → madhuportfolio → Logs** (Workers Logs, on via `observability` in `wrangler.jsonc`). The studio's are in **Vercel → project → Logs**.

| What failed                                 | Where                    | Search for                                                                                          | What it means                                                                                                                                                                                                      |
| ------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Instagram / LinkedIn thumbnail              | Worker (warn)            | `Instagram thumbnail for` / `LinkedIn thumbnail for`                                                | The card fell back to its cover or gradient. The line names the post and the cause (`HTTP 4xx`, timeout, no image in the page). The same message on every post usually means the platform changed its page markup. |
| Stored content no longer matches its schema | Worker or Vercel (error) | `section failed validation`                                                                         | Names the section, DRAFT or PUBLISHED, and each failing field. The page shows the error page. Fix the row (or the schema) before the next publish.                                                                 |
| A page failed to render                     | Worker or Vercel (error) | the digest from the error page's "Reference: …"                                                     | Next logs the full error with that digest.                                                                                                                                                                         |
| Live-site refresh after publish             | Vercel (error)           | `Refreshing the live site`                                                                          | The Worker cache wasn't cleared. The studio offers **Refresh live site**. Check `PUBLIC_SITE_URL` / `REVALIDATE_SECRET` if it keeps failing.                                                                       |
| Warming a page after publish                | Vercel (error)           | `Warming /`                                                                                         | Content is fresh; only the next visitor waits for the render.                                                                                                                                                      |
| R2 delete                                   | Vercel (error)           | `Deleting the upload`, `Could not remove the unused upload`, `Could not remove the orphaned upload` | The file stays in the bucket and its row stays, so Settings → unused uploads retries it.                                                                                                                           |
| R2 bucket listing                           | Vercel (error)           | `Listing the media bucket failed`                                                                   | The unused-uploads check fell back to rows only. Give the R2 token list permission.                                                                                                                                |

**Health check:** `GET /api/health` answers `200 {"ok":true}`, or `503 {"ok":false}` when any check failed. Per-check detail (`"checks":{…}`) is only included when the request sends `Authorization: Bearer <REVALIDATE_SECRET>`, and each instance reuses its result for 10 s. The reason goes to the log as `Health check "<name>" failed`. On the studio (`studio.nmadhukumar.com/api/health`) it checks the database (`SELECT 1`), R2 (a signed HEAD for a key that never exists: 404 is healthy, 403 means bad credentials) and the live-site refresh (a `GET` to the Worker's `/api/revalidate`, which only confirms `REVALIDATE_SECRET` and clears nothing). On the Worker (`nmadhukumar.com/api/health`) only the database is configured; the others read `"not configured"`. Each check times out after 5 s. An uptime monitor can poll either URL. `/api/ping` stays the cheap liveness probe the studio polls every 30 s.

For alerts rather than searching, the options are a Vercel log drain or an error-tracking service (e.g. Sentry). Both are new setup or a new dependency, so neither is in place yet.

## Security settings outside the repository

The security audit (2026-11-04) left these to the dashboards, because no code can set them:

- **Media zone transformation quota.** Anyone can request `media.nmadhukumar.com/cdn-cgi/image/<options>/<key>` (and `/cdn-cgi/media/...`) with option strings the site never emits, and each new combination counts as a transformation. Add a WAF custom rule on the zone (_Block_) for: `(http.host eq "media.nmadhukumar.com" and starts_with(http.request.uri.path, "/cdn-cgi/image/") and not http.request.uri.path matches "^/cdn-cgi/image/width=(128|256|384|640|960|1280|1920|2560),quality=90,format=auto/")`. Keep the widths in step with `deviceSizes`/`imageSizes` in `next.config.mjs`. Check how `/cdn-cgi/media/` options are used (`src/components/public/Hero.tsx`) before adding a similar rule for that path.
- **Vercel env scoping.** Set `AUTH_SECRET`, `DATABASE_URL`, `REVALIDATE_SECRET` and the `R2_*` keys for the **Production** environment only (preview builds do not require `AUTH_URL`, so a preview sharing the production secret could mint production sessions).
- **Workers.dev disabled.** `wrangler.jsonc` sets `workers_dev: false` and `preview_urls: false`, so the Worker answers only on `nmadhukumar.com`. The next `pnpm deploy` turns the workers.dev hostname off.
- **Signed upload type.** Upload URLs now sign the `Content-Type`. The R2 CORS rule above already allows the `content-type` header; after deploying, upload one image and one video to confirm R2 accepts the signature.
- **Studio CSP.** On Vercel the middleware sends a per-request nonce policy with no `unsafe-inline` scripts (`src/lib/studio-csp.ts`); `next.config.mjs` sends the public policy only on the Worker. After a Studio deploy, sign in and open each tab with DevTools open: any `Refused to execute inline script` message means a script is missing the nonce.
- **Worker self-reference.** `wrangler.jsonc` binds `WORKER_SELF_REFERENCE` to the `madhuportfolio` Worker, which OpenNext uses for background page refreshes. If the Worker is ever renamed, rename the binding target too.
- **Media headers.** Re-check the `nosniff` Transform Rule above with its `curl` after any zone change.

## Smoke Check

After deployment, verify:

- `/` and `/room` return `200` with the expected title, metadata, sitemap, and robots output. The canonical link, `og:url`, sitemap URLs and robots `Sitemap:` line all use `https://nmadhukumar.com` (they come from Studio → Site & Navigation → domain, which must be `nmadhukumar.com`; `madhu.edit` is the brand name only, since `.edit` isn't a real top-level domain).
- `nmadhukumar.com/studio` and `/login` redirect to the studio host at the bare path (e.g. `/studio/work` → `studio.nmadhukumar.com/work`), and an anonymous request to `studio.nmadhukumar.com/` redirects to its login. `studio.nmadhukumar.com/room` and other public-site paths do not serve the public pages.
- An owner can save a draft, publish it, and see the page on `nmadhukumar.com` update immediately.
- An owner can upload an image and a video over 4.5MB, see both served from `media.nmadhukumar.com`, and delete them afterwards.
- An old `nmadhukumar.com/api/media/<key>` link redirects to the media domain.
- Browser DevTools has no CSP violations for the portfolio, Studio, or uploads.
- `curl -H "Authorization: Bearer $REVALIDATE_SECRET" https://studio.nmadhukumar.com/api/health` returns `200` with `database`, `media` and `liveRefresh` all `"ok"` (deploy the Worker first: until it has the `GET /api/revalidate` handler, `liveRefresh` fails with a 405).
