# Handover: madhu.edit / nmadhukumar.com

Everything the new owner needs to run, edit, deploy and recover this site. Technical depth lives in [`DEPLOYMENT.md`](DEPLOYMENT.md) (hosting and env vars). This file is the entry point.

## 1. What you are receiving

- **Public site** at `https://nmadhukumar.com`: home page (hero, about, impact, clients, work, praise, experience, resume, contact) and the interactive **Drawing Room** at `/room`. "madhu.edit" is the brand name only; it is not a website.
- **Studio**, the private editor at `https://studio.nmadhukumar.com`. One owner account. Edit content on a live preview, save drafts, publish all at once, or revert to the last published version.
- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Prisma 7, PostgreSQL, Auth.js v5 (credentials), Cloudflare Workers (public), Vercel (Studio), Cloudflare R2 (media). Package manager: pnpm 11. Node 20 LTS or newer.

## 2. Accounts and ownership transfer

Transfer or invite the new owner to each of these. Until this is done the previous owner still controls the site.

| Account            | Controls                                                                                                                                                         | Transfer action                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Domain registrar   | `nmadhukumar.com` registration and renewal                                                                                                                       | Transfer or add as owner; turn on auto-renew                                                       |
| Cloudflare         | DNS, Worker `madhuportfolio`, R2 buckets `images` and `madhuportfolio-cache`, D1 `madhuportfolio-tag-cache`, Hyperdrive `madhu-edit-db`, WAF and Transform Rules | Add as Super Administrator, then remove the old owner                                              |
| Vercel             | Studio hosting and its environment variables                                                                                                                     | Move the project to the owner's team or add as Owner                                               |
| PostgreSQL host    | All content, users, sessions, activity log                                                                                                                       | Transfer the project; record the connection string                                                 |
| GitHub             | Source (`iamarjun23/MadhuPortfolio`), `main` branch                                                                                                              | Transfer the repo or add as Admin                                                                  |
| Studio owner login | Email and password in the `User` table                                                                                                                           | Run `pnpm admin:create` with the owner's email (see section 6), then change the password in Studio |

Record the following in a password manager, never in the repo: `DATABASE_URL`, `AUTH_SECRET`, `REVALIDATE_SECRET`, the R2 API token (access key ID and secret), and the Studio owner password.

**After transfer, rotate every secret** the previous owner or developer has seen: `AUTH_SECRET`, `REVALIDATE_SECRET`, the R2 token, the database password, and the Studio password. `AUTH_SECRET` and `REVALIDATE_SECRET` must be changed on both hosts. Changing `AUTH_SECRET` signs everyone out.

## 3. How the site is wired

```
Visitor ──> nmadhukumar.com  (Cloudflare Worker, cached, read-only)
              ├─ /studio/*, /login, /api/auth/*  ──redirect──> studio.nmadhukumar.com
              └─ images and video are served from media.nmadhukumar.com (R2 custom domain)

Owner ───> studio.nmadhukumar.com  (Vercel: database writes, full renders)
              ├─ uploads: browser PUTs straight to R2 via a signed URL (never through Vercel)
              └─ publish: POSTs to nmadhukumar.com/api/revalidate so the Worker clears its cache

Both read and write one PostgreSQL database (Worker via Hyperdrive, Vercel via DATABASE_URL).
```

Rule for future work: **nothing in `src/app/(public)` may write to the database or do heavy rendering.** It would exceed the Worker CPU limit (Cloudflare error 1102).

Content model: one `Section` table keyed by `(key, status)`, where status is `DRAFT` or `PUBLISHED` and `data` is JSON checked by a Zod schema in `src/schemas/`. Sections: hero, about, impact, clients, work, praise, experience, resume, room, contact, settings. Every save, publish and revert writes an `Activity` row.

## 4. Environment variables

Full table and where each goes: `DEPLOYMENT.md`. Template: `.env.example`. Summary:

| Variable                                                                 | Cloudflare Worker | Vercel (Studio)                  | Notes                                      |
| ------------------------------------------------------------------------ | ----------------- | -------------------------------- | ------------------------------------------ |
| `DATABASE_URL`                                                           | build variable    | yes                              | Also needed to run Prisma commands locally |
| `AUTH_SECRET`                                                            | no                | yes, 32+ chars                   | Production scope only                      |
| `AUTH_URL`                                                               | no                | `https://studio.nmadhukumar.com` | Required for production builds             |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | no                | yes                              | Empty = uploads disabled                   |
| `NEXT_PUBLIC_MEDIA_URL`                                                  | build variable    | yes                              | `https://media.nmadhukumar.com`            |
| `NEXT_PUBLIC_SITE_URL`                                                   | build variable    | yes                              | `https://nmadhukumar.com`                  |
| `STUDIO_URL`                                                             | build variable    | **do not set**                   | Worker build fails without it              |
| `PUBLIC_SITE_URL`                                                        | no                | yes                              | Required for Vercel production builds      |
| `REVALIDATE_SECRET`                                                      | secret            | yes                              | Must match on both                         |

## 5. Day-to-day use (for the site owner)

1. Go to `https://nmadhukumar.com/studio` (it redirects to the Studio) and sign in.
2. Pick a section from the rail. Edit on the preview; the right-hand panel holds the fields, with limits shown per field.
3. **Save** stores a draft only. Visitors see nothing yet.
4. **Publish** sends all drafts live. The live site refreshes within seconds. If you see "the live site did not refresh", press **Refresh live site**.
5. **Revert** discards drafts and returns to the last published version.
6. **Settings** holds the site domain, password change, the unused-uploads clean-up and the danger zone. Keep the domain set to `nmadhukumar.com`.
7. Uploads: drag a file onto an image or video field. Images and videos are checked by file signature, not just extension. A file still used by a draft or the live site cannot be deleted, and the card shows where it is used.
8. Sign-in is limited: five wrong tries lock the email or IP (1 minute, doubling to 1 hour). Sessions last a week, and changing the password signs out every device.

## 6. Developer tasks

```bash
pnpm install --frozen-lockfile       # never let a build rewrite pnpm-lock.yaml
cp .env.example .env                 # fill DATABASE_URL at minimum
pnpm prisma migrate deploy           # apply migrations (run BEFORE deploying code that needs them)
pnpm db:seed                         # first-time content only: overwrites every section, draft and published
pnpm admin:create                    # reads ADMIN_EMAIL / ADMIN_PASSWORD; creates or resets the owner and ends all sessions
pnpm dev                             # local server
pnpm check                           # lint + typecheck + prisma validate + build: the "done" gate
```

Deploy:

- **Studio:** push to `main`; Vercel builds automatically.
- **Public site:** `STUDIO_URL=https://studio.nmadhukumar.com pnpm deploy`, or Cloudflare Workers Builds with the commands in `DEPLOYMENT.md`. **Not on native Windows**: use WSL, macOS, Linux or CI.
- Run `pnpm prisma migrate deploy` first whenever `prisma/migrations/` gains a folder. Login depends on the `LoginAttempt` and `Session` tables.

## 7. Runbook

| Symptom                                     | Likely cause                                                            | Fix                                                                                                                           |
| ------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Owner locked out                            | Five failed sign-ins                                                    | Wait, or delete the `email:` / `ip:` row from `LoginAttempt`                                                                  |
| Forgot password                             | n/a                                                                     | Set `ADMIN_EMAIL` and `ADMIN_PASSWORD`, run `pnpm admin:create`, then remove the password from `.env`                         |
| Sign everyone out                           | Stolen cookie, lost device                                              | Delete all rows from `Session`, or change the password                                                                        |
| Published but the live site is unchanged    | Worker cache not cleared                                                | Press **Refresh live site**; check `PUBLIC_SITE_URL` and `REVALIDATE_SECRET` match on both hosts                              |
| Cloudflare error 1102 on the public site    | Cache bucket or D1 tag cache missing, or heavy code added to `(public)` | Check the R2 `madhuportfolio-cache` bucket and D1 binding in `wrangler.jsonc`; see `DEPLOYMENT.md`                            |
| Page shows the error page                   | Stored JSON no longer matches its schema                                | Search logs for `section failed validation`; fix the row or schema                                                            |
| Upload fails                                | R2 CORS, token scope or signed content type                             | Check the CORS rule in `DEPLOYMENT.md` and the R2 token's read and write scope                                                |
| Instagram or LinkedIn card shows a fallback | Platform changed its markup, or the post was removed                    | Logs: `Instagram thumbnail for` / `LinkedIn thumbnail for`                                                                    |
| Health check                                | any time                                                                | `GET https://studio.nmadhukumar.com/api/health` returns 200 or 503 (details with `Authorization: Bearer <REVALIDATE_SECRET>`) |

Logs: Cloudflare, Workers & Pages, `madhuportfolio`, Logs; and Vercel, project, Logs. Nothing alerts automatically. Point an uptime monitor at `/api/health` on both hosts.

Backups: take regular PostgreSQL backups at the database host and keep a copy of the R2 `images` bucket. There is no backup job in this repo.

## 8. Security posture

Done in code: bcrypt passwords with length limits, database-backed sessions that can be revoked, sign-in throttling, per-request CSP nonce on the Studio, signed single-file upload URLs with content type, file-signature checks, no `eval`, errors logged without leaking internals, and a security audit on 2026-11-04 whose findings were addressed.

Settings that live only in the dashboards, and must be checked after transfer (details in `DEPLOYMENT.md`, "Security settings outside the repository"):

- WAF rule limiting `cdn-cgi/image` options on the media domain (prevents transformation quota abuse)
- `X-Content-Type-Options: nosniff` Transform Rule on the media domain
- `resume download` Transform Rule on the media domain
- Vercel secrets scoped to Production only
- `workers_dev` and preview URLs stay off in `wrangler.jsonc`

## 9. Known gaps and verification status

State at handover prep (2026-11-24, branch `chore/handover-prep`):

| Check                                                  | Result                                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `pnpm check` (lint, typecheck, Prisma validate, build) | Passes on Windows with the upgraded dependencies                                                                    |
| `pnpm format`, `pnpm audit --prod`                     | Clean (`effect` pinned to 3.22.x by an override in `pnpm-workspace.yaml`)                                           |
| Git history secret scan                                | Only `.env.example` was ever committed; no secret-shaped values found (pattern scan, not a guarantee)               |
| Cloudflare Worker build                                | **Not run locally** (native Windows; WSL has no Node). Run `pnpm cf:build` from WSL, macOS or Linux                 |
| Studio uploads on the live site                        | **Not tested live**. Upload one image and one video over 4.5 MB and confirm both load from `media.nmadhukumar.com`  |
| Mobile layout (home and `/room` sketchbook)            | **Not checked on a real phone**                                                                                     |
| Studio CSP                                             | After each Studio deploy, open every tab with DevTools open and look for `Refused to execute inline script`         |
| Alerts, error tracking                                 | Not set up. Point an uptime monitor at `/api/health` on both hosts; add Sentry or a Vercel log drain only if wanted |
| Backups                                                | Not set up in this repo: enable them at the database host                                                           |

Repo housekeeping, done:

- Repo trimmed to what runs the site: tests, CI, the browser smoke script, agent notes and legacy static references removed.
- `docker-compose.dev.yml` is kept: a loopback-only local Postgres, documented in the README.

## 10. Acceptance checklist (run once, tick each)

- [ ] `pnpm check` passes on a clean clone
- [ ] `https://nmadhukumar.com` and `/room` load; title, canonical link, sitemap and robots use `nmadhukumar.com`
- [ ] `/studio` and `/login` on the public host redirect to the Studio host; the Studio host does not serve public pages
- [ ] Owner can sign in, save a draft, publish, and see the change on the live site
- [ ] Owner can upload and delete an image and a video over 4.5 MB
- [ ] An old `/api/media/<key>` link redirects to the media domain
- [ ] No CSP errors in DevTools on the public site, the Studio and during uploads
- [ ] `/api/health` returns 200 with `database`, `media` and `liveRefresh` all `ok`
- [ ] Phone check on the home page and `/room`
- [ ] All accounts in section 2 transferred, every secret rotated, old access removed
- [ ] Database and R2 backups scheduled
