# madhu.edit

Next.js foundation for N Madhu Kumar's portfolio, Drawing Room, and Studio CMS.

The public navigation label “Studio” opens `/process`, which presents the editing workflow,
turnaround guidance, and Photobooth. The protected content-management workspace remains at
`/studio`.

## Phase

Current implementation: Phase 12 deployment hardening from the PRD.

## Requirements

- Node 20 LTS or newer for the target deployment environment.
- pnpm.
- PostgreSQL database URL in `.env.local` before running Prisma migrations.

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm prisma:migrate
pnpm db:seed
pnpm dev
```

For a local Docker PostgreSQL database, run this first:

```bash
docker compose --env-file .env.postgres.local -f docker-compose.dev.yml up -d
```

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm prisma:validate
pnpm build
```

`pnpm check` runs the supported local checks together.

`pnpm db:seed` upserts the complete initial content set into both the `DRAFT` and
`PUBLISHED` rows for all 10 sections. It requires a reachable `DATABASE_URL`.

Create the single Studio owner with `pnpm admin:create` after setting `DATABASE_URL`,
`ADMIN_EMAIL`, and `ADMIN_PASSWORD_HASH` in `.env.local`.

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

For UploadThing v7, create an app in the UploadThing dashboard and add its V7
`UPLOADTHING_TOKEN` to `.env.local`. The upload controls deliberately remain disabled until that
token is configured; URL fields continue to work without it. Upload endpoints require an
authenticated Studio owner.

Hero video uploads are limited to 64 MB. The upload route verifies the limit on both the declared
content length and the received payload before storing a file.

## Source References

The original static references are kept in the root:

- `index_6.html`
- `admin_1.html`

## Project Memory

Phase decisions and handoff notes are tracked in `MEMORY.md`.
