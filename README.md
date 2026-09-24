# madhu.edit

Next.js foundation for N Madhu Kumar's portfolio, Drawing Room, and Studio CMS.

The public pages are `/` (the portfolio), `/room` (the Drawing Room) and `/resume`. The protected
content-management workspace is at `/studio`.

## Phase

Current implementation: Phase 12 deployment hardening from the PRD.

## Requirements

- Node 20 LTS or newer for the target deployment environment.
- pnpm.
- PostgreSQL database URL in `.env` before running Prisma migrations (the Prisma CLI and the
  scripts read `.env`, not `.env.local`).

## Setup

```bash
pnpm install
cp .env.example .env
pnpm prisma:migrate
pnpm db:seed
pnpm dev
```

Builds and CI must never rewrite `pnpm-lock.yaml`. pnpm refuses an out-of-date lockfile by itself
whenever `CI` is set (Vercel sets it), but any install command written for a build or CI job should
say so explicitly: `pnpm install --frozen-lockfile`. If the lockfile really needs to change, run
`pnpm install` locally and commit the result.

For a local Docker PostgreSQL database, run this first:

```bash
docker compose --env-file .env.postgres.local -f docker-compose.dev.yml up -d
```

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm prisma:validate
pnpm build
```

`pnpm check` runs the supported local checks together.

`pnpm test` runs `tests/*.test.ts` with Node's built-in test runner through `tsx` (already a dev
dependency, so it resolves the `@/` paths). The tests cover pure logic only and need no database or
R2: link and media URL validation, section schemas and duplicate IDs, upload file signatures, the
R2 list parser, thumbnail redirect/size/concurrency guards, login lockout timing and the live-site
refresh's failure reporting.

`pnpm test:browser [url]` is a read-only browser smoke test of the public site (headless Chrome over
the DevTools Protocol, no extra dependency; set `CHROME_PATH` if Chrome is elsewhere). It defaults to
`http://localhost:3100`, so run `pnpm build && pnpm start -p 3100` first, or pass the live URL after
a deploy. At desktop, phone and phone-landscape sizes it checks that `/`, `/room`, `/resume` and a
missing page load without console errors (CSP violations included) or sideways scroll, that the
Impact, Work and Drawing Room pop-ups open on screen with their close button visible, close on Escape
and hand focus back, and that `/studio` sends a signed-out visitor to sign in. It never signs in, so
Studio flows (upload, save, publish) are still checked by hand.

`pnpm db:seed` upserts the complete initial content set into both the `DRAFT` and
`PUBLISHED` rows for all 10 sections. It requires a reachable `DATABASE_URL`.

Create the single Studio owner with `pnpm admin:create` after setting `DATABASE_URL`,
`ADMIN_EMAIL`, and `ADMIN_PASSWORD` (the plaintext password) in `.env`. The script hashes it
with PBKDF2 and upserts the owner, so re-running it also resets an existing password.

The Studio is protected at `/studio`. Every section has a schema-validated draft editor,
sortable repeated rows, SaveBar integration, live previews that render the matching public
section, and media controls. Existing
media URLs remain editable; uploaded files are saved as media records and can then be saved into
the current draft. Every saved draft is logged on the dashboard. Publish copies all drafts to the
live version in one transaction and refreshes public content; Settings includes a guarded revert to
restore every draft from the last published site.

## Environment

See `.env.example` for required variables.

Production configuration, database migration, release, and smoke-check steps are in
[`DEPLOYMENT.md`](DEPLOYMENT.md).

Uploads go straight to Cloudflare R2: a Studio server action (owner only) signs a short-lived PUT
URL, the browser sends the file to the bucket, and `finishUpload` records it. Files are served from
the bucket's custom domain (`NEXT_PUBLIC_MEDIA_URL`), never through the app. To enable uploads,
set the `R2_*` variables in `.env` (see `.env.example` and the R2 steps in `DEPLOYMENT.md`); until
then the Studio's upload controls stay disabled and URL fields still work.

Each upload slot has its own type and size limit (videos 64 MB, the resume PDF 10 MB, images
4 MB; see `src/lib/upload-endpoints.ts`). `createUpload` checks the type and size the browser
declares before signing the upload URL. That is only the browser's word, and the signed URL does
not cap the size, so `finishUpload` checks the object R2 actually stored: its real size and type,
and its first bytes against the known file signatures (`src/lib/file-signature.ts`), so HTML or
SVG renamed to `.jpg` is refused. An upload that fails any check is deleted from the bucket (if
that delete fails, it is logged and Settings → unused uploads cleans it up later), and the
recorded type is the one the bytes prove.

## Source References

The original static references are kept in the root:

- `index_6.html`
- `admin_1.html`

## Project Memory

Phase decisions and handoff notes are tracked in `MEMORY.md`.
