# madhu.edit

Portfolio for N Madhu Kumar at [nmadhukumar.com](https://nmadhukumar.com): a public site with an interactive Drawing Room (`/room`), and a private editor (Studio) for changing every word and image without touching code. "madhu.edit" is the brand name only; it is not a website.

Next.js 16 (App Router), React 19, TypeScript, Prisma 7 on PostgreSQL, Auth.js v5, Cloudflare Workers (public site), Vercel (Studio), Cloudflare R2 (media). Package manager: pnpm 11. Node 20 LTS or newer.

## Where to read next

| You want to                                                      | Read                             |
| ---------------------------------------------------------------- | -------------------------------- |
| Take over the site (accounts, secrets, runbook, checklist)       | [`HANDOVER.md`](HANDOVER.md)     |
| Deploy or change hosting (env vars, Cloudflare and Vercel setup) | [`DEPLOYMENT.md`](DEPLOYMENT.md) |

## Run it locally

```bash
pnpm install
cp .env.example .env     # set DATABASE_URL at minimum; the Prisma CLI reads .env, not .env.local
pnpm prisma migrate deploy
pnpm db:seed             # first run only: overwrites every section, draft and published
pnpm admin:create        # creates the Studio owner from ADMIN_EMAIL / ADMIN_PASSWORD
pnpm dev                 # http://localhost:3000, Studio at /studio
```

No Postgres to hand? `docker-compose.dev.yml` starts one on `127.0.0.1:5432`. It reads `POSTGRES_DB`, `POSTGRES_USER` and `POSTGRES_PASSWORD` from your environment or an env file:

```bash
docker compose -f docker-compose.dev.yml up -d
```

## Checks

| Command                                      | What it does                                               |
| -------------------------------------------- | ---------------------------------------------------------- |
| `pnpm check`                                 | The "done" gate: lint, typecheck, `prisma validate`, build |
| `pnpm lint`, `pnpm typecheck`, `pnpm format` | Individual checks (`pnpm format:write` fixes formatting)   |

`pnpm check` runs `next build`, which reads the published content from `DATABASE_URL`.

## Deploying

The same repo builds twice: the public site to a Cloudflare Worker, the Studio to Vercel. The Worker build does **not** work on native Windows; use WSL, macOS, Linux or CI. Steps and the full environment-variable list are in [`DEPLOYMENT.md`](DEPLOYMENT.md).

Never commit `.env` or any secret. `.env.example` lists every variable with empty values.
