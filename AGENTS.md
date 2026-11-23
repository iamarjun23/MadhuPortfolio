# AGENTS.md

Project instructions for Codex. Keep every change small, safe, and consistent with this file.

## Project Overview

- `madhu.edit` (the brand name) at `nmadhukumar.com` (the only live domain; `madhu.edit` does not resolve as a website): Next.js 16 (App Router) + React 19 + TypeScript (strict) portfolio for N Madhu Kumar, with a database-backed Studio CMS and an interactive "Drawing Room" page. Package manager: pnpm.
- Data: PostgreSQL via Prisma 7. Content lives in one `Section` table keyed by `(key, status)` (`DRAFT`/`PUBLISHED`), `data` is JSON validated by a per-section Zod schema in `src/schemas/` (hero, about, impact, clients, work, praise, experience, resume, room, contact, settings). Typed reads go through `src/lib/content.ts` (`getHero`, `getAbout`, …), which batch-reads all sections in one cached `findMany` and memoizes per request.
- Studio (`/studio`, owner-only, single `OWNER` role via NextAuth v5 beta credentials + bcrypt): edits drafts (`src/actions/save-draft.ts`), publishes all drafts to live (`src/actions/publish.ts` → `publishAll()`), or reverts drafts from the last publish (`revertDraftsToPublished()`); every save/publish/revert logs an `Activity` row.
- **Split deployment — this shapes where new code belongs:** the same repo builds twice.
  - Public routes (`(public)` group: `/`, `/room`, thumbnail APIs, `/api/revalidate`) deploy to **Cloudflare Workers** via OpenNext — cheap, cached, no DB writes.
  - Studio (`/studio`, `/login`, `/api/auth`, uploads) deploys to **Vercel** because it does DB writes + full renders per request, which trips Cloudflare's Worker CPU limit (error 1102). `src/middleware.ts` rewrites bare Vercel paths onto `/studio/*`; the Worker (`next.config.mjs` `redirects()`) sends `/studio/*`, `/login`, `/api/auth/*` to `STUDIO_URL` instead.
  - Media uploads PUT straight to an R2 bucket via a signed URL (`src/actions/media.ts`, `aws4fetch`) and are served from R2's own custom domain — never through the Worker.
  - Full topology, env vars, and cutover steps: [`DEPLOYMENT.md`](DEPLOYMENT.md). Do not add DB reads/writes or heavy rendering to anything in `(public)` — it has to stay cheap enough for the Worker.
- `index_6.html` and `admin_1.html` at the repo root are **legacy static source references only** — kept intentionally per prior decisions, not part of the running app. Don't treat them as the live implementation.
- Directory map: `src/app` (routes), `src/components/public` + `src/components/studio`, `src/lib` (shared/server helpers), `src/schemas` (Zod), `src/actions` (server actions), `src/stores` (zustand studio store), `src/styles` (`tokens.css`, `base.css`, `studio-inspector.css`), `prisma/` (schema, migrations, seed).
- Full phase-by-phase build history and decisions: [`MEMORY.md`](MEMORY.md). Setup/checks: [`README.md`](README.md). In-flight architecture work: [`HANDOVER.md`](HANDOVER.md).

## Setup And Commands

- `pnpm install`, then `cp .env.example .env` and set `DATABASE_URL` before running Prisma commands (the Prisma CLI and scripts read `.env` via `dotenv`, not `.env.local`).
- Any build or CI install uses `pnpm install --frozen-lockfile`; a build must never rewrite `pnpm-lock.yaml` (change it only with a local `pnpm install`, committed deliberately).
- `pnpm dev` — local dev server (emulates the Cloudflare bindings via OpenNext).
- `pnpm lint` / `pnpm typecheck` / `pnpm format` (`format:write` to fix) / `pnpm build` — individual checks.
- `pnpm test` — unit tests in `tests/*.test.ts` (Node's test runner via `tsx`; pure logic, no DB or R2 needed).
- `pnpm check` — runs lint, typecheck, test, `prisma:validate`, and `build` together; this is the standard "done" gate.
- `pnpm prisma:migrate`, `pnpm db:seed` (upserts full seed content into both DRAFT and PUBLISHED), `pnpm admin:create` (bootstraps the single Studio owner from `ADMIN_EMAIL`/`ADMIN_PASSWORD`).
- `pnpm cf:build` / `pnpm preview` / `pnpm deploy` — Cloudflare Worker build/preview/deploy via OpenNext. **Does not work on native Windows** (esbuild trips on pnpm's symlinked `node_modules`); run from WSL, macOS, Linux, or CI. `dev`/`build`/`lint`/`typecheck` are unaffected on Windows.
- For UI changes, manually verify common desktop and mobile widths before considering the task done.

## Dependency Rules

- Do not install or add dependencies without asking first.
- Do not add packages for small utilities that can be implemented clearly with existing code.
- Prefer maintained, widely used packages only when a dependency is genuinely justified.

## Security Rules

- Never commit secrets, API keys, tokens, passwords, private certificates, or `.env` files.
- Use environment variables or a secret manager for sensitive configuration.
- Validate and sanitize all user-controlled input at trust boundaries.
- Do not trust client-side validation alone for security-critical behavior.
- Avoid `eval`, dynamic code execution, unsafe deserialization, and string-built commands.
- Escape output correctly for the target context: HTML, URL, shell, JSON, logs.
- Do not expose stack traces, secrets, internal paths, or sensitive debug data to users.
- Do not silently swallow errors; handle them, rethrow them, or log them with context.

## Code Safety Rules

- No `any`, `as any`, unsafe casts, or type bypasses if TypeScript is introduced later.
- No unused imports, variables, dead code, or commented-out code.
- Prefer clarity over cleverness and avoid unnecessary abstraction.
- Match existing naming conventions and project structure.
- Keep functions small, focused, and testable.
- Add comments only when intent is not obvious from the code.
- Never leave `console.log`, `print`, or debug statements in shipped code.

## Configuration Rules

- Do not hardcode environment-specific URLs, ports, feature flags, or secrets in source.
- Do not introduce a new config mechanism when the project already has one.
- Document any new environment variable in an appropriate example or config doc.

## Layout And UI Rules

- Navbar and footer must use the same horizontal page padding as the main content.
- Main page body content should live inside the shared content container unless full-bleed layout is intentional.
- Keep spacing consistent across header, main content, sections, and footer.
- Do not let text, buttons, cards, or navigation items overlap at any viewport size.
- Use responsive constraints instead of hard-coded desktop-only sizes.
- Follow the existing design system, theme tokens, and component patterns.
- Do not create one-off padding, color, or typography styles when a shared token or component exists.
- All interactive elements must have accessible names, visible focus states, and keyboard support.
- Images need meaningful alt text unless decorative.

## Documentation Rules

- Update README, docs, and inline comments when behavior changes.
- Update `MEMORY.md` at the end of every phase with status, decisions, checks, and next-phase notes.
- Document exported functions, types, and public interfaces if the project adds modules later.
- Treat stale documentation as a bug.

## Testing And Verification Rules

- Write or update tests for new logic, bug fixes, security checks, and validation rules if a test setup exists.
- Run tests, lint, typecheck, and build when the repo supports them.
- Do not delete, skip, or weaken failing tests to make checks pass.
- For UI changes, verify common desktop and mobile widths.

## Git And Workflow Rules

- Keep changes small and focused.
- Do not refactor unrelated code while fixing a bug.
- Do not change public APIs or interfaces without flagging it explicitly.
- Do not delete files unless explicitly asked.
- Make clear commits with concise messages when commits are requested.
- Use Conventional Commits style if the repo has no existing convention.
- Do not commit directly to `main` or `master`; use a branch when applicable.
- Never force-push shared branches.
- Before editing, check the current file state and preserve user changes.

## Done Definition

- A task is done only after supported local checks pass.
- If a check cannot be run in this environment, say so explicitly and provide the exact command.
- Before finishing, confirm security rules were followed, no debug output was left, layout remains responsive, and changes stayed scoped to the task.

## When Something Is Unclear

- State the assumption and proceed when risk is low.
- Ask before proceeding if the change is risky, destructive, security-sensitive, or touches many files.
- If a command cannot be run, explain why and provide the exact command that should be run.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
