# MEMORY.md

Running project memory for the `madhu.edit` build. Update this after every phase so future work can resume without re-reading the whole thread.

## Production Publish Refresh Recovery (2026-09-12)

- Diagnosed Studio uploads being absent from `nmadhukumar.com` even though the database had no pending drafts and recorded successful publish activity.
- Confirmed the public Cloudflare pages were still serving prerendered HTML with no published media URLs because `/api/revalidate` rejected the configured Studio credential with HTTP 401.
- Aligned the Cloudflare Worker `REVALIDATE_SECRET` with the local Studio-configured value and triggered a successful authenticated cache refresh.
- Verification: `/api/revalidate` returned HTTP 200; regenerated public HTML contained 12 media references on `/`, 3 on `/room`, and 7 on `/process`.
- Follow-up: the deployed Vercel Studio still reported that the live site did not refresh. Matching values in Vercel settings do not affect an already-running deployment; redeploy the production Studio so its functions receive the current `REVALIDATE_SECRET` and `PUBLIC_SITE_URL` values, then retest publishing.

## Hero Metadata Typography Pass (2026-09-08)

- Refined the highlighted hero metadata: the top reel label now uses a stronger display/mono hierarchy, the orange role line has a cleaner mono treatment and glow, and the bottom-right credit has improved contrast plus a small orange rule.
- Kept the existing content, animation, theme tokens, and responsive structure unchanged.
- Verification: static review completed; manual browser width verification remains to be performed in the current session.
- Follow-up: strengthened the numeric details too, including the aspect ratio, live timecode, and estimated-year marker.

## Laptop And Mac Responsive Pass (2026-09-05)

- Added a dedicated medium-desktop breakpoint for 13–14 inch laptop widths, reducing the Work canvas height, card size, and preview dialog dimensions while preserving the existing mobile breakpoint.
- Kept the layout fluid so browser zoom and Retina scaling do not depend on fixed physical pixels.
- Verification: `git diff --check` passed.

## Work Preview Auto-Scroll (2026-09-05)

- Work card previews now scroll the Work canvas into the viewport before the modal is shown, preventing the dialog from opening below the visible area of the tall freeform canvas.
- The existing body-scroll lock remains active while the preview is open.

## External Work Preview Fallback (2026-09-05)

- Fixed the Work preview modal for projects whose links are not YouTube URLs, such as LinkedIn event posts.
- The modal now provides a direct external link in the media panel instead of leaving the panel visually empty.
- Verification: `git diff --check` passed. Local Prettier and TypeScript commands could not run because the installed command shims were unavailable in this environment.

## Hero Video Upload Ceiling (2026-09-05)

- Raised the Hero video upload limit from 48 MB to 64 MB in the shared server endpoint configuration and Studio dropzone UI.
- Kept the image upload limit at 4 MB. The current Worker route buffers uploads in memory, so larger videos require a direct or multipart R2 upload flow rather than only increasing this number.
- Verification: targeted TypeScript and formatting checks are pending.

## Click-To-Edit Preview (2026-09-05)

- Made rendered preview copy selectable: clicking a visible heading, paragraph, label, card caption, or button resolves it to the exact nested draft path and opens that field in the Inspector.
- Changed Inspector selection from top-level section keys to full nested paths, allowing focused editing of individual collection items without navigating through broad object trees first.
- Verification: targeted Prettier, TypeScript, ESLint, and diff checks pass. URL, ID, type, colour, and layout metadata are deliberately excluded from text-click matching and remain available through the field index.

## Studio Inspector Redesign (2026-09-05)

- Reorganized the section Inspector into dedicated Content and Media tabs, with media shown only where direct uploads exist.
- Replaced the tall vertical field menu with a compact indexed field strip and gave the selected field a larger, calmer editing workspace.
- Kept draft saving anchored at the bottom of the Inspector so it remains visible without competing with field navigation.
- Verification: targeted Prettier, TypeScript, ESLint, and diff checks pass; responsive rules return the Inspector to normal document flow below 860px.

## Drawing Room And Studio Utility Pass (2026-09-05)

- Made the Drawing Room mood-board surface true black with a dark neutral frame.
- Changed the Drawing Room Studio preview from the homepage invitation to the actual interactive mood board, keeping all board copy, cards, positions, drag, and shuffle settings editable in the existing Inspector.
- Added an actual navigation and footer rendering to Site & Navigation so changes can be judged in context instead of against an empty placeholder.
- Reworked the Studio dashboard around direct editing actions, live-site access, content-readiness checks based on draft data, recent activity, and a secondary all-sections map.
- Verification: targeted Prettier, TypeScript, ESLint, and diff checks pass. The production build is blocked only by the environment's inability to fetch the four existing Google Font imports.

## Studio Public-Component Previews And Larger Video Uploads (2026-09-05)

- Replaced the Studio's custom Hero and generic section mock-ups with the matching public components for all nine content sections; the Inspector remains the editing surface and a schema-invalid transient draft presents a clear preview-state message.
- Raised the Hero video limit from 32 MB to 48 MB in the Studio control and upload endpoint. Both the request header and received payload are still checked before an R2 write.

## Work Cloud Containment And Motion (2026-09-05)

- Kept work-project video cards inside the Work canvas by clipping the cloud boundary and clamping each draggable card's stored position to that canvas.
- Added a small, staggered vertical float to the cards. The shared reduced-motion rules disable it for visitors who request less motion.
- Verification: static review confirms the animation preserves the card's existing offset and rotation; the drag clamp uses the rendered card and canvas bounds.

## Visual Studio Canvas Redesign (2026-09-01)

## Studio Image Upload Clarity And Typography Refresh (2026-09-01)

- Replaced the public and Studio display/body typography with Space Grotesk and DM Sans for a cleaner, more legible hierarchy; JetBrains Mono and Instrument Serif remain in their existing roles.
- Made existing secure Studio media uploads unmistakable: every section with direct media fields now has a permanently visible **Images & video** upload area at the top of its inspector. Upload actions use direct labels, state their 4 MB image or 32 MB video limit, and explain that the admin must save the draft after uploading. Image fields continue to accept descriptive alt text.
- Connected an uploaded Hero video to the Studio canvas so it appears immediately behind the editable Hero copy, with the same muted, looping, poster-aware behavior expected of a preview.
- Normalized legacy SSL modes on both local `DATABASE_URL` and Hyperdrive connection strings, preventing the PostgreSQL driver's `sslmode=require` compatibility warning during local Studio requests.
- Changed R2 media writes to use a buffered `ArrayBuffer`, because the local Cloudflare runtime rejects an unknown-length request stream. The upload endpoint now validates the real byte size after reading it and records that verified size.
- Replaced forwarding a non-serializable request `Headers` object to R2 when serving byte-ranged media. The media route now parses standard HTTP byte ranges into R2's plain-object range form and returns the matching range content length, restoring browser video playback in local Studio.
- Avoided R2's `writeHttpMetadata()` helper in the local Cloudflare runtime, which cannot serialize a `Headers` instance across its RPC bridge. The media route now copies serializable HTTP metadata properties onto its response headers directly.
- Added a narrowly scoped media URL schema: uploaded same-origin `/api/media/<approved-endpoint>/<UUID>` paths now validate alongside full external URLs. This fixes saving drafts immediately after an admin upload while preventing arbitrary relative paths from being treated as media.
- Made the Studio inspector's complete edit list vertically visible and scrollable instead of concealing it in a horizontal strip. Media entries are now explicitly labelled as upload controls in both the canvas and inspector. About already gives a saved portrait video priority over a portrait image; its previously missing video was caused by the media serving errors fixed above.
- Verification: Prettier and TypeScript pass. Browser checks at desktop and 390 px mobile widths confirm the new font families load and the page has no horizontal overflow. The production build could not run concurrently with the user-owned dev server because Next's build cleanup encountered its active `.next/dev` cache; an earlier sandbox build attempt was additionally prevented from reaching Google Fonts.

- Reframed every Studio section around a primary live canvas and a secondary contextual Inspector. The former permanently expanded page form is no longer the main editing surface.
- Hero copy is directly editable in the canvas: eyebrow, both headline lines, description, and primary CTA update immediately. The rotating cut words remain selectable from the canvas and are edited in the Inspector. Other sections expose their primary text fields directly in the canvas, with complex content blocks opening the Inspector.
- Kept every current generic editor capability available in the Inspector, including nested settings, uploads, links, repeatable content, drag sorting, validation, draft saving, and publishing; other sections now share the new canvas/Inspector structure and use their Inspector for detailed edits.
- Added desktop/mobile canvas modes, visible editable-field focus treatment, a responsive one-column Inspector layout, and fixed scalar-array path updates so individual strings in collections can now be saved correctly.
- Verification: targeted Prettier formatting, TypeScript, and production build pass. ESLint has no errors and retains the existing React Hook Form compiler-skip warning in `SectionEditor.tsx`. Browser access reached the protected Studio sign-in screen, but no local editor session was available for authenticated visual QA.

## Cloudflare Studio Database Detection Fix (2026-09-01)

- Corrected the production database-config check so Cloudflare Worker requests recognize the `HYPERDRIVE` binding as a valid database connection. Previously, content and Studio dashboard reads checked only `DATABASE_URL`, which is deliberately absent from the deployed Worker and could make Studio use its local fallback instead of live content.
- Kept `DATABASE_URL` as the fallback for local development, scripts, and build-time rendering. The connection resolver and configuration check now share the same Hyperdrive detection.
- Documented that deployed `AUTH_URL` must be the real HTTPS site URL and `AUTH_TRUST_HOST` must be `true`, otherwise the Studio sign-in callback cannot return correctly on Cloudflare.

## Cloudflare Prisma WASM Compatibility Fix (2026-09-01)

- Diagnosed deployed homepage and Studio crashes as Prisma's WebAssembly query compiler failing inside the Worker. The affected build locked `next@16.2.12` while `@opennextjs/cloudflare@1.20.4` supports Next.js `16.3.3+`; this prevents a supported OpenNext WASM-loader pairing.
- Updated `next` and `eslint-config-next` to `16.3.3`, retaining the existing OpenNext adapter and Prisma versions. Cloudflare's Linux build will apply the adapter's workerd-safe WASM loader patch.
- Verification: TypeScript, ESLint (one existing React Hook Form compiler-skip warning), and `pnpm build` pass. `pnpm cf:build` reaches OpenNext bundling but cannot finish on native Windows due OpenNext/pnpm symlink access errors; deploy through Cloudflare Workers Builds or WSL/Linux.

## Explicit Prisma Cloudflare Runtime Fix (2026-09-01)

- The deployed Worker continued to fail at Prisma's `getQueryCompilerWasmModule`, so the Prisma 7 generator now uses `provider = "prisma-client"`, an explicit generated output, and `runtime = "cloudflare"`.
- Server, action, seed, and admin-bootstrap imports now use the generated Cloudflare client. This packages the small PostgreSQL query compiler as a Worker module instead of relying on the default Node-oriented client path.
- Generated client files remain untracked and are recreated by `prisma generate`, which already runs during install/build/deploy. Added the generated output to `.gitignore`.
- Verification: `pnpm prisma:generate`, TypeScript, ESLint (only existing React Hook Form warning), Prisma validation, and `pnpm build` pass. The Next production output contains the Prisma small query-compiler chunks.

## Cloudflare Auth Trusted Host Fix (2026-09-01)

- Cloudflare logs identified Auth.js `UntrustedHost` errors for the deployed custom domain's `/api/auth/*` endpoints, blocking Studio sign-in despite the intended Worker environment variable.
- Set `trustHost: true` directly in the shared Auth.js configuration so Cloudflare's TLS-proxied same-origin requests are accepted consistently.
- Verification: TypeScript passed; ESLint has only the existing React Hook Form compiler-skip warning.

## Global Decisions

- User explicitly overrode the attached PRD where it pins older assumptions: use the latest available Next.js and latest Prisma.
- Registry check on 2026-07-27 found latest versions: `next@16.2.12`, `prisma@7.9.0`, `@prisma/client@7.9.0`.
- The custom Prisma 7 generated-client output also requires the matching direct runtime dependency `@prisma/client-runtime-utils@7.9.0` so Next.js can bundle database-backed server components.
- Prisma 7 requires datasource URLs in `prisma.config.ts`, so `prisma/schema.prisma` keeps only the datasource provider.
- Keep the original static references in the repo root: `index_6.html` and `admin_1.html`.
- Build in phases and update this file at the end of each phase.

## Phase 0 - Foundation

- Goal: create a clean Next.js foundation with strict TypeScript, Prisma schema/migrations, env example, lint/format config, and a minimal home page.
- Status: complete.
- Current stack target: `next@16.2.12`, React 19, `prisma@7.9.0`, `@prisma/client@7.9.0`, TypeScript strict, CSS variables.
- Notes: `pnpm` build-script approvals were required for Prisma, esbuild, sharp, and resolver packages.
- Latest Prisma direct Postgres usage requires `@prisma/adapter-pg`; it is installed and the seed uses `PrismaPg`.
- TypeScript 7 is the registry latest, but Next 16.2.12 and Next's ESLint plugin stack do not support it cleanly yet. TypeScript is pinned to `6.0.3`, the newest TypeScript 6 version found during the registry check.
- ESLint 10 is the registry latest, but Next's React lint plugin stack failed under ESLint 10. ESLint is pinned to `9.39.5`, the newest supported ESLint 9 version found during the registry check.
- Prisma 7 generated client output is explicit: `src/generated/prisma`.
- Local environment caveat: the installed Node is `v25.9.0`, while Prisma reports support for Node `20.19+`, `22.12+`, and `24.0+`. Use one of those supported Node lines for normal development/deploy.
- Verification completed:
  - `pnpm prisma:validate` passed with placeholder `DATABASE_URL`.
  - `pnpm prisma:generate` passed with placeholder `DATABASE_URL`.
  - `pnpm lint` passed.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.
- Database migration file exists at `prisma/migrations/20260726200000_init/migration.sql`; it has not been applied locally because no real database URL was provided.

## Phase 1 - Design System

- Goal: port "The Editing Suite" design foundation from the static source into the Next app.
- Status: complete.
- Implemented:
  - `src/styles/tokens.css` now carries the source ember, signal, ink, paper, state, radius, shadow, glow, easing, and animation tokens.
  - `src/styles/base.css` now carries reset styles, `::selection`, focus-visible, scrollbars, `.wrap`, `.slate`, `.lede`, `.skip`, and a minimal branded design specimen.
  - Root `src/app/layout.tsx` reads the `theme` cookie server-side and applies `data-theme` to `<html>` before hydration.
  - `next/font/google` is wired with CSS variables `--f-display`, `--f-body`, and `--f-mono`.
  - `src/components/public/ThemeToggle.tsx` persists `dark`/`light` theme choice to a cookie and updates `data-theme`.
  - Phase 1 home screen is a small branded specimen only; public shell/sections remain Phase 3/4 work.
- Deviations/notes:
  - Source CSS uses negative letter spacing in places, but project UI rules require letter spacing to stay at `0`, so the base heading styles keep `letter-spacing: 0`.
  - Settings-backed default theme is deferred until the content/settings API exists in Phase 2.
- Verification completed:
  - `pnpm lint` passed.
  - `pnpm typecheck` passed.
  - `pnpm prisma:validate` passed with placeholder `DATABASE_URL`.
  - `pnpm build` passed.

## Phase 2 - Content API Layer

- Goal: create typed content reads that the public site and Studio can share, then seed the complete initial content set.
- Status: complete.
- Implemented:
  - Added `zod@4.4.3` and individual schemas for `hero`, `about`, `impact`, `work`, `booth`, `praise`, `experience`, `room`, `contact`, and `settings` under `src/schemas/`.
  - Added inferred content types and a shared `src/schemas/index.ts` export surface.
  - Added `src/lib/db.ts`, which creates the Prisma 7 client lazily with `PrismaPg` and requires `DATABASE_URL` only when content is accessed.
  - Added `src/lib/content.ts` with typed `getHero`, `getAbout`, `getImpact`, `getWork`, `getBooth`, `getPraise`, `getExperience`, `getRoom`, `getContact`, and `getSettings` functions. Each reads a `(key, status)` row, validates JSON via Zod, and caches by a `content:<section>` tag.
  - Added `src/lib/revalidate.ts` and `revalidateContent(sectionKey)` using Next 16's `revalidateTag(tag, "max")` API for later publish actions.
  - Replaced the minimal seed with complete source content from `index_6.html` for all 10 sections, including work links, room board geometry, copy, layout hints, and both `DRAFT` and `PUBLISHED` rows.
  - Added `pnpm db:seed`, backed by Prisma's configured seed command.
  - Updated `README.md` with the current phase and database seeding instruction.
- Decisions/notes:
  - The local `IMG-20241213-WA0000.jpg` reference was normalized to `https://madhu.edit/IMG-20241213-WA0000.jpg` in seed data because the schema intentionally requires valid URLs. Replace it through media uploads when Phase 9 is implemented.
  - The initial portfolio still renders the Phase 1 specimen; database content will be consumed by the public shell and sections in Phases 3–5.
  - No `DATABASE_URL` for a reachable PostgreSQL instance is available locally, so migration application and `pnpm db:seed` have not been run. The seed is type-checked and schema-validated.
- Verification completed:
  - `pnpm format:write` passed.
  - `pnpm typecheck` passed.
  - `pnpm lint` passed.
  - `pnpm prisma:validate` passed with a placeholder `DATABASE_URL`.
  - `pnpm build` passed.
- Next step: Phase 4 portfolio sections, consuming the typed content getters added in Phase 2.

## Phase 3 - Public Shell

- Goal: establish the shared public-site chrome, real two-route navigation, and placeholder section structure before implementing individual portfolio and Drawing Room experiences.
- Status: complete.
- Implemented:
  - Moved the root portfolio page into the `(public)` route group and added a real `/(public)/room` route.
  - Added the shared public layout, which reads `getContact()` and `getSettings()` server-side and supplies the shell with content-backed availability, footer, social, and theme-toggle state.
  - Added route-aware `<Nav />`, `<Footer />`, `<AvailabilityBadge />`, `<ScrollScrubber />`, and `<SectionPlaceholder />` components.
  - `/` now carries structural empty placeholders for every future portfolio section and its skip link points to the real `#work` anchor.
  - `/room` has its own server-rendered page and its navigation presents the `The Drawing Room` tag plus a Portfolio link.
  - Added responsive shared shell styling: sticky glass nav, scroll scrubber, availability indicators, 3-column footer, and compact mobile behavior.
  - Added `@prisma/client-runtime-utils@7.9.0`, matching Prisma exactly, to fix Next.js bundling of the custom generated Prisma client.
  - Updated `README.md` to reflect the current implementation phase.
- Decisions/notes:
  - The Phase 3 pages intentionally contain only empty semantic section wrappers. Public portfolio and Drawing Room content belongs to Phases 4 and 5.
  - The new shell reads its state from the database when `DATABASE_URL` is configured. Without the environment variable, it deliberately renders a minimal shell for local UI review and hides database-backed availability, contact details, and socials. A configured but unreachable database still fails normally rather than being hidden.
- Verification completed:
  - Touched Phase 3 files were formatted with Prettier.
  - `pnpm typecheck` passed after Next regenerated moved-route declarations.
  - `pnpm lint` passed.
  - `pnpm prisma:validate` passed with a placeholder `DATABASE_URL`.
  - `pnpm build` passed and reports dynamic `/` and `/room` routes.
  - The existing dev server responds with `200` on both `/` and `/room` without a local database.
- Next step: Phase 4 portfolio sections, consuming the existing typed content getters for the hero, about, impact, work console, photobooth, testimonials, experience, Drawing Room teaser, and contact block.

## Phase 4 - Portfolio Sections

- Status: complete.
- Implemented all public portfolio sections: full-bleed video hero, about, animated impact strip, accessible work tabs, photobooth lightbox, testimonials, experience, Drawing Room teaser, and contact block.
- The public page now reads all eight typed content sections server-side.
- Seed data is now reusable as a validated fallback only when `DATABASE_URL` is absent, so the full local portfolio preview works without duplicating content in components. The seed script only runs when invoked directly.
- Corrected the initial SEO description to meet the existing 160-character Zod limit.
- Verification: production build passes; local `/` returns `200` and renders seeded hero/work content; lint has no errors and four `next/image` warnings for uploaded-media paths, deferred to the PRD's Phase 11 image optimization.
- Next step: Phase 5 Drawing Room interaction and card variants.

## Phase 5 - Drawing Room

- Status: complete.
- Replaced the `/room` placeholder with a server-backed Drawing Room page using `getRoom()`.
- Added the interactive `<MoodBoard />` with all five seeded card variants, desktop pointer dragging, source-compatible boundaries, shuffle, reset, and a mobile stacked layout.
- Verification: `pnpm typecheck` and `pnpm build` pass; local `/room` returns `200` and renders the board.
- Next step: Phase 6 owner authentication for Studio.

## Phase 6 - Owner Authentication

- Status: complete.
- Added Auth.js v5 beta credentials authentication with bcrypt password verification against the owner user record.
- Added the auth API route, login page, `/studio` protection, `requireOwner()` helper for future server actions, and `pnpm admin:create` bootstrap script.
- Anonymous `/studio` access redirects to `/login`; authenticated Studio currently renders a minimal guarded placeholder until the Phase 7 shell.
- Verification: `pnpm typecheck` and `pnpm build` pass; `/login` returns `200` and anonymous `/studio` returns `307`.
- Note: Next 16 reports the middleware-to-proxy convention deprecation warning. The requested `middleware.ts` works correctly and can be migrated to the newer naming convention in a future maintenance pass.
- Next step: Phase 7 Studio shell.

## Phase 7 - Studio Shell

- Status: complete.
- Implemented:
  - Added a protected `/studio` workspace with a 264px desktop rail, sticky topbar, responsive mobile drawer/scrim, and all requested content and site navigation links.
  - Rail active state uses `usePathname()` and exposes server-derived work lane, booth slot, and testimonial counts.
  - Topbar supplies the requested Site crumb, theme control, external View site link, and publish gate. Publish becomes available only when a persisted draft is newer than its published section; actual publish behavior remains Phase 10 work.
  - Added browser-safe Studio navigation contracts, a Prisma-backed shell-data helper, and explicit client/server module boundaries so no database code enters the client bundle.
  - Added the PRD-required `zustand@5.0.14` state store, a dirty-state SaveBar, and auto-dismissing 2600ms toast queue. Phase 8 forms can call `markDirty(section)` directly.
  - Added direct placeholder routes for all Studio content sections, avoiding dead rail links while reserving those editor surfaces for Phase 8.
  - Repaired the existing unescaped Drawing Room quotation lint error uncovered during Phase 7 validation.
- Verification completed:
  - `pnpm format:write` passed.
  - `pnpm check` passed with a temporary placeholder `DATABASE_URL`, covering lint, typecheck, Prisma validation, and production build.
  - Lint retains four pre-existing `@next/next/no-img-element` warnings in portfolio components; no lint errors remain.
  - Fresh dev server route checks: `/` returns `200`; anonymous `/studio` returns `307` to `/login`.
- Notes:
  - The dev server is running at `http://127.0.0.1:3000` after verification.
  - The Next middleware-to-proxy deprecation warning remains unchanged from Phase 6.
  - Local PostgreSQL was subsequently provisioned with Docker Desktop using `docker-compose.dev.yml` and the gitignored `.env.postgres.local`. The existing migration was applied, 20 draft/published section rows were seeded, and one owner account was bootstrapped. Keep the container running with `docker compose --env-file .env.postgres.local -f docker-compose.dev.yml up -d`.
- Next step: Phase 8 Studio editing forms and draft persistence.

## Phase 8 - Studio Editors And Draft Persistence

- Status: complete.
- Implemented:
  - Added the PRD-required `react-hook-form`, Zod resolver, and dnd-kit dependencies.
  - Replaced every `/studio/[section]` placeholder route with a schema-aware editor that loads its `DRAFT` section data, renders nested section fields, supports add/remove controls, and saves validated draft JSON through an owner-gated Server Action.
  - Repeated object records with an `id` are drag-sortable with dnd-kit, covering content such as work lanes, projects, booth slots, testimonials, experience entries, and Drawing Room cards.
  - Added global SaveBar form registration: dirty edits show the section name, Save Draft calls the active editor's authenticated save action, and Discard restores the most recently saved draft. Toasts report save/validation outcomes.
  - Added the Hero live browser preview with draft-bound copy and a reduced-motion-aware 2600ms cut-word cycle.
  - Upgraded the dashboard with Live/Draft status, work/photo/testimonial counts, quick links, and the latest five activity rows. Save activity logging itself remains Phase 10 work.
  - Media fields are currently URL/edit controls only; real upload dropzones are intentionally deferred to Phase 9.
- Verification completed:
  - `pnpm format:write` passed.
  - `pnpm check` passed with a placeholder database URL, covering lint, typecheck, Prisma validation, and production build.
  - Lint warnings remain limited to four pre-existing `next/image` notices and React Hook Form's compiler-skip notice; no errors remain.
- Next step: Phase 9 media uploads.

## Phase 9 - Authenticated Media Uploads

- Status: complete.
- Implemented:
  - Added `uploadthing@7.7.4` and `@uploadthing/react@7.3.3`, using UploadThing v7's single `UPLOADTHING_TOKEN` configuration rather than the retired secret/app-ID pair.
  - Added the owner-gated `/api/uploadthing/core` router with six scoped routes: hero video, portrait, booth image, logo, Drawing Room image, and Open Graph image. Every completion persists a `Media` record and returns its URL, key, and dimensions fields to the Studio client.
  - Added a Studio dropzone with drag state, file-type filtering, local Object URL previews, upload progress, completion feedback, and a server action that removes a just-uploaded object from UploadThing plus its database row.
  - Wired media controls into Hero, About, Booth, Experience, Drawing Room, and Settings. Current URL and alt/poster fields are intentionally retained, so existing seeded content and deployments without UploadThing credentials remain editable.
  - Added a configuration guard: when `UPLOADTHING_TOKEN` is absent or still the sample value, the route returns `503` and Studio upload controls stay disabled with a clear setup hint.
  - Updated `.env.example` and README with the v7 UploadThing token setup.
- Verification completed:
  - Direct local TypeScript check (`.\\node_modules\\.bin\\tsc.cmd --noEmit`) passed after pnpm's dependency-status guard blocked `pnpm typecheck` because optional `msgpackr-extract` build approval is pending.
  - Direct local ESLint completed with no errors; it retains the four pre-existing public `<img>` notices and the existing React Hook Form compiler-skip warning.
  - Direct Prisma validation passed with a non-secret placeholder `DATABASE_URL`.
  - Production build passed and includes `/api/uploadthing/core`.
  - Local smoke checks returned `200` for `/` and the expected `503` configuration guard for `/api/uploadthing/core` without a real upload token.
- Notes:
  - The local `.env.local` does not contain a real UploadThing token, so no external file upload was attempted. Add a dashboard-issued v7 token, restart the dev server, sign in as owner, then upload and save a draft to exercise the hosted storage path.
  - `msgpackr-extract` is an optional UploadThing transitive native optimization. It is intentionally not approved in this phase; project checks can be run directly from local binaries while that approval is pending.
- Next step: Phase 10 draft publish workflow and activity logging.

## Phase 10 - Draft Publish Workflow And Revalidation

- Status: complete.
- Implemented:
  - Added `publishAll()` as an owner-gated transactional Server Action. It copies every draft section to its published pair, logs a single publish activity entry, then revalidates all section tags plus the public, Drawing Room, and Studio layouts.
  - Added `revertDraftsToPublished()` as an owner-gated transactional Server Action. It restores each draft from the published section, logs the rollback, and invalidates caches so Studio immediately reflects the restored data.
  - Added the server-side `hasPendingChanges()` helper and connected the Studio shell publish gate to it. The Publish button now calls the action, refreshes server state, shows success/error toasts, and stays unavailable while a local form has unsaved edits.
  - Every successful `saveDraft()` now creates an `Activity` row in the same transaction as the draft upsert, making the dashboard activity log reliable.
  - Added the Settings danger zone with confirmation before reverting all drafts. It is disabled while the current editor has unsaved changes.
  - Refreshed editor data from the server after save/revert operations so the form state and global shell remain consistent.
- Verification completed:
  - Direct local TypeScript validation passed.
  - Direct local ESLint completed with no errors; the existing public image warnings and React Hook Form compiler-skip warning remain.
  - Direct Prisma validation passed with a non-secret placeholder `DATABASE_URL`.
  - Production build passed and includes the existing dynamic Studio routes.
- Notes:
  - Full publish/revert UI acceptance testing needs an authenticated browser session. The local database is present, but no content was mutated solely for verification.
  - A read-only Docker SQL probe was not completed because the existing container does not use the guessed `madhu` role; no database state was changed.
- Next step: Phase 11 SEO, performance, and accessibility polish.

## Admin/Auth Fixes (2026-08-02)

- Auth.js v5 reads `AUTH_SECRET` / `AUTH_URL`, not the older `NEXTAUTH_*` names. Dev server was throwing `MissingSecret`. Renamed the vars in `.env.local` and `.env.example` and added `AUTH_TRUST_HOST="true"` for local proxying.
- `/admin` was 404ing because the owner workspace lives at `/studio`. Added a `next.config.mjs` redirect: `/admin/:path*` → `/studio/:path*` (temporary redirect) so legacy links / muscle memory land in the right place.
- Restart the dev server after pulling these changes so Next re-reads env and the config.

## Deployment Hardening (2026-08-02, Vercel + Neon)

Shipped the first production deployment to Vercel (region `sin1`) backed by Neon Postgres (region `ap-southeast-1`, Singapore). Fixes applied along the way:

- **`.gitignore` rewrite.** Full ignore list for a Next 16 + Prisma 7 project: `.env*` (no `.env.example` kept — client shouldn't see placeholders either), all build/cache outputs, `src/generated/` (Prisma client), `dev-server*.log`, plus internal-only files: `AGENTS.md`, `MEMORY.md`, `index_6.html`, `admin_1.html`.
- **pnpm build approvals.** `pnpm-workspace.yaml` had a literal placeholder (`msgpackr-extract: set this to true or false`) that pnpm was ignoring silently — Vercel install failed with `ERR_PNPM_IGNORED_BUILDS`. Set it to `true` and added `msgpackr-extract` to `onlyBuiltDependencies`.
- **Prisma client regeneration on Vercel.** `src/generated/prisma` is gitignored, so Vercel never had the client. Added `prisma generate` to both `postinstall` and `build` scripts in `package.json`.
- **Hosted database.** Old `DATABASE_URL` still pointed at `127.0.0.1:5432` (local Docker). Provisioned Neon (Singapore, pooled connection string with `channel_binding=require&sslmode=require`), replaced the value in Vercel env vars and `.env.local`. Ran `prisma migrate deploy` + `pnpm db:seed` + `pnpm admin:create` against Neon from the local shell with `$env:DATABASE_URL` set inline.
- **Server Action illegal exports.** A `"use server"` file can only export async functions. `src/actions/publish.ts` was exporting types (`PublishResult`, `RevertResult`), causing runtime `ReferenceError: PublishResult is not defined` on any `/studio/*` POST. Moved types to new `src/actions/publish-types.ts` and re-imported as `type`. Also de-exported `DraftSaveResult` in `src/actions/save-draft.ts` (unused externally anyway).
- **UploadThing route location.** Route was at `src/app/api/uploadthing/core/route.ts`, but the UploadThing React helper hits `/api/uploadthing`. Moved the file up one level so the endpoint matches the client default.

**Vercel env vars required** (project → settings → env vars):

- `DATABASE_URL` — Neon pooled connection string.
- `AUTH_SECRET`, `AUTH_URL` (production `.vercel.app` URL, not localhost), `AUTH_TRUST_HOST=true`.
- `UPLOADTHING_TOKEN` (real token; without it `/api/uploadthing` returns 503 by design).
- `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `BOOTSTRAP_TOKEN`.

**Admin access after deploy:** `<deployment-url>/login` (or `/admin`, which redirects to `/studio`). Owner credentials seeded via `pnpm admin:create`.

**Outstanding follow-ups:**

- Favicon 404s on `/favicon.ico` and `/favicon.png` — only `public/favicon.svg` exists. Add ICO/PNG or a `<link>` in layout.
- Vercel `AUTH_URL` must be updated to the current production hostname each time the deployment URL changes (or set a custom domain and pin `AUTH_URL` to it).
- pg driver warning about `sslmode=require` being aliased to `verify-full` is informational only; will need `?uselibpqcompat=true` before pg v9 upgrade.

## Phase 11 - SEO, Performance, And Accessibility Polish

- Status: complete.
- Implemented content-backed metadata for the public portfolio and Drawing Room, a `theme-color` viewport value, Person/WebSite JSON-LD, and dynamic `sitemap.xml` / `robots.txt` routes.
- Replaced public portfolio images with `next/image`, including responsive `sizes` values and explicit allowed remote image hosts.
- Added a production CSP plus `Referrer-Policy` and `X-Content-Type-Options`. `script-src` retains `'unsafe-inline'` because current Next App Router output requires inline bootstrap scripts; move to nonce-based CSP only with an end-to-end middleware and production regression pass.
- Verification is recorded with Phase 12 after the clean build.

## Phase 12 - Deployment Hardening And Phase 10 Corrections

- Status: complete.
- Fixed immediate post-save/publish/revert reads by replacing stale-while-revalidate tags with `updateTag` in Server Actions.
- Publish and revert now fail the transaction if any expected draft/published section is absent rather than reporting a partial success.
- Pending draft detection compares section JSON rather than timestamps, so a revert no longer leaves the Studio stuck in a pending state.
- Removed stale `.next/dev/types` from TypeScript includes and added a prebuild clean step to prevent deleted route declarations from breaking future builds.
- Added `DEPLOYMENT.md` with exact Vercel, database, environment, and smoke-check guidance. Only runtime env vars belong in Vercel; owner-bootstrap variables remain local.
- Added the same clean step before `pnpm typecheck`, because Next 16 automatically keeps `.next/dev/types` in `tsconfig.json` and a standalone type check otherwise can retain deleted route declarations from an old dev server.
- Verification completed:
  - Touched files were formatted with Prettier.
  - Direct TypeScript and package-level `pnpm typecheck` passed.
  - ESLint passed with no errors; the existing React Hook Form compiler-skip warning remains.
  - Prisma schema validation passed with a temporary non-secret database URL.
  - A clean production Next build passed after Prisma generation, generating the corrected routes and static `robots.txt` / `sitemap.xml` output.
  - Local dev smoke checks returned `200` for `/`, `/room`, `/robots.txt`, and `/sitemap.xml`; the CSP header was present and generated crawl files used `https://madhu.edit/`.

## Accessibility Follow-up (2026-08-02)

- Added keyboard repositioning for Drawing Room cards on desktop layouts. Focus a card and use the arrow keys; updates are announced through a polite live region.
- Updated the Photobooth lightbox to trap Tab focus, restore focus to the originating photo, and retain Escape-key closing.
- Restored the shared visible focus outline for Studio form fields and added the shared `.sr-only` utility used by the Drawing Room instructions and announcement.
- Corrected layout behavior: navbar/footer keep the full shared window padding, while public main content is centered inside the shared content width; Studio pages and editors are constrained again.

## Placeholder Media Follow-up (2026-08-02)

- Added shared placeholder helpers for missing image and video URLs.
- Added a local SVG placeholder asset for pending media.
- Public work cards now use placeholder video links when CMS links are missing.
- Photobooth and Drawing Room polaroids now render placeholder images when CMS image media is missing.
- Seed content now includes placeholder links for missing work videos, photobooth photos, Drawing Room polaroids, experience logos, YouTube, and SEO OG image fields.

## Public Motion Polish (2026-08-02)

- Added staged hero entrance motion and a slow cinematic background push for motion-capable visitors.
- Added consistent premium hover feedback for primary actions, media, work, testimonial, experience, and Drawing Room cards.
- All new animation is disabled when a visitor requests reduced motion; hover effects only apply to fine-pointer devices.
- Corrected the impact counter's optional regex capture handling so strict TypeScript validation passes.

## About Width Follow-up (2026-08-14)

- Removed the landing page's shared 1280px cap from the About layout only, allowing it to use the full shared page-content width while retaining responsive horizontal padding.

## Impact Width And Visual Follow-up (2026-08-14)

- Expanded the Impact section to the full shared page-content width.
- Strengthened the metric hierarchy and rebuilt the collaborator list as responsive, keyboard-visible editorial cards with clearer interaction cues.
- Added temporary Pexels portrait fallbacks for collaborator detail cards whose CMS images are missing or still use the generic placeholder; real uploaded images continue to take precedence.
- Sized every expanded collaborator image as a capped square Instagram-post crop on desktop, scaling it down proportionally beside the text on tablet and mobile.

## Selected Work Video Cloud (2026-08-14)

- Removed the category rail and literal 3D globe so every project appears together in one floating orbital video-card cloud.
- Visitors can scroll to zoom, drag or use arrow keys to pan, reset the view, and click any card to play its video in an inline preview with a full-video link.
- The cloud and preview resize for mobile, video cards expose visible preview frames, and reduced-motion visitors keep the same layout without floating animation.
- Increased the cloud motion so every card follows a distinct multidirectional drift with varied timing, pausing on hover or keyboard focus for reliable selection.
- Removed the landing page's 1280px cap from Selected Work so the video cloud uses the full shared page-content width while retaining responsive horizontal padding.
- Restored visible card drift by overriding the landing page's generic button reveal animation, and constrained the video preview to a centered 16:9 rectangle with a compact responsive details panel.
- Removed the nested video-cloud container and added the four work-category filters at the top-right; all projects remain the default view, with filtered counts and content when a category is selected.
- Rebalanced the video preview modal so its 16:9 player and wider details column remain legible at desktop widths; titles now use a constrained, balanced scale instead of overflowing the panel.
- Repositioned the Work controls into one header row, removed the scattered skill chips and cloud outline, and elevated the orange Hire me action into a prominent story-led CTA.
- Removed the fixed clipping and bottom fade from the Work video field, expanding its responsive vertical space so lower floating cards can continue freely instead of being cut off.
- Removed zoom controls and wheel zoom from the Work video cloud, enlarged its cards and responsive field, and added a scroll-locked glass-morphism preview overlay with Escape-key closing.
- Removed the remaining Work-card floating motion, strengthened the preview's glass treatment, made every video card directly draggable to a visitor-chosen position, and enabled click-outside closing while preserving the preview's background-scroll lock.
- Removed the Work field's drag-to-pan behavior: only individual video cards can now be dragged and dropped.
- Excluded draggable Work cards from the global scroll-reveal transform, which had prevented their drag position from rendering.
- Removed the remaining drag boundaries, so all Work cards share one freeform canvas and can be dropped anywhere.
- Increased the desktop video-preview panel height, deepened its frosted backdrop and internal glass layers, and retained its click-outside closing behavior.

## Photobooth And Praise Width Follow-up (2026-08-14)

- Removed the landing page's shared 1280px cap from the Photobooth and Praise sections, allowing both to use the same full shared page-content width as the About, Impact, and Work sections while keeping their responsive page padding.

## Experience Story Redesign (2026-08-14)

- Replaced the conventional role list with an interactive career reel: a single cinematic scene frame changes on selection, supported by a film-strip style scene track and previous/next controls. It remains horizontally navigable on mobile instead of becoming a long scrolling timeline.
- Expanded the Experience career reel to the full shared page-content width while retaining its responsive horizontal page padding.

## Drawing Room Invitation Redesign (2026-08-14)

- Rebuilt the Drawing Room teaser as a personal-archive invitation with an intriguing side-door narrative, archive card, invitation stamp, and responsive collage treatment that gives visitors a reason to explore beyond the portfolio reel.
- Made the homepage Drawing Room invitation and every page region on `/room` use the full shared page-content width, retaining only the global responsive side padding.
- Restyled the Drawing Room board as a dark, tactile pinboard with subtle board texture, vignette depth, and visible colored pushpins anchoring every card.
- Drawing Room cards can be dragged beyond the board edge for a natural throw-away interaction; on release, any out-of-range card returns to the safe visible board region. Keyboard movement and shuffle also remain safe.
- Deepened the Drawing Room board into a physical blackboard treatment: slate texture, chalk dust, recessed tray shadow, worn highlights, and a wood frame now sit behind the pinned cards.
- Elevated the Drawing Room entry link into a high-contrast orange pill CTA with stronger type, shadow, and hover response.

## Contact Section Redesign (2026-08-14)

- Expanded Contact to full page width and redesigned it as a project-start panel: a direct email CTA, purpose-led project prompt, availability indicator, ideal project types, location, LinkedIn, and live timecode are now visible in one responsive layout.

## Footer Redesign (2026-08-14)

- Rebuilt the footer as an end-credits-style closing layout with a stronger identity block, clearer explore/contact columns, visual link markers, and a compact visible skills toolkit covering edit, motion, colour, and direction capabilities.
- Refined the footer identity into an editorial closing card, replaced generic skill pills with numbered craft markers, and gave LinkedIn, Instagram, and YouTube distinct, high-visibility social button treatments.
- Reworked the craft markers into a ruled, numbered editing sequence and reshaped social links as angular ticket actions instead of circular or generic square buttons.

## Dynamic Navigation Follow-up (2026-08-14)

- Added hero-aware navigation using direct hero scroll-boundary detection: when the hero leaves view, the full-width bar becomes a centered floating Dynamic-Island-style glass pill with the caption hidden and an elevated contact action, while retaining its normal presentation over the hero.
- Removed the navbar progress bar and increased the top breathing room around the post-hero floating island.

## Studio And Landing Page Section Parity (2026-08-14)

- Matched the Studio page-content navigation to the landing-page order: Hero, About, Impact, Work, Photobooth, Praise, Experience, Drawing Room, and Contact.
- Moved previously fixed landing-page headings, supporting copy, labels, calls to action, and interaction hints into their corresponding Studio section data.
- Connected the homepage Drawing Room invitation to the Drawing Room Studio section and made the Drawing Room page heading, controls, and closing copy editable there as well.
- Added an optional Studio-editable About portrait reel with poster support while retaining the existing fallback reel for older content.
- Added schema defaults for every new field so existing draft and published database records remain valid and gain the new controls without a migration or reseed.
- Verification: focused TypeScript and ESLint checks passed; production build passed. ESLint retains only the existing React Hook Form compiler-skip warning. Browser visual QA was not run because the active Sites workflow disallows browser inspection unless explicitly requested.

## Studio Sign-In Redirect Fix (2026-08-14)

- Confirmed with a read-only database check that the configured admin exists, retains the `OWNER` role, and has the same bcrypt hash as the local admin configuration.
- Replaced the client-side `redirect: false` credentials flow and manual router navigation with Auth.js's redirect/session flow, which reliably persists the session cookie before entering `/studio`.
- Restricted callback navigation to same-origin paths and added distinct invalid-credentials and general sign-in error messages.
- Added Next.js's `data-scroll-behavior="smooth"` marker to the root `<html>` element, removing the route-transition warning for the site's intentional smooth scrolling.
- Verification: formatting, TypeScript, ESLint, diff checks, and the production build passed.

## Studio And Landing Page Redesign (2026-08-14)

- Reframed Studio as a portfolio control room: the dashboard now mirrors the live page sequence, each section has a purpose-led editor card, and editors include a persistent contextual site preview.
- Rebuilt the Studio rail, dashboard cards, forms, previews, and responsive layout into a dark editorial production-desk interface while retaining draft, publishing, media, reorder, and accessibility behavior.
- Made the shared landing chrome Studio-editable through Site & Navigation: brand, menu labels, skip link, footer headlines, footer skill list, explore links, closing text, SEO owner name, appearance toggle, and motion setting all come from content data.
- Moved the remaining visible hard-coded page text into the relevant section data, including Hero letterbox and credit text, Work empty-preview text, Photobooth controls, testimonial sample label, Experience reel controls, and Drawing Room copy.
- Existing draft/published records remain valid without a database migration because all new content fields are schema defaults until the next Studio save.
- Verification: formatted touched files, TypeScript passed, ESLint completed with only the pre-existing React Hook Form compiler-skip warning, and the production build passed. Browser visual QA was not run because it was not explicitly requested.

## Studio Full-Width Compact Editor Follow-up (2026-08-14)

- Removed the Studio's desktop content cap so the dashboard and every editor use the full available workspace beside the rail.
- Reworked the editor into a dense two-column form for short fields; nested settings stay grouped and responsive to one column on smaller screens.
- Replaced permanently expanded repeated records with compact, titled disclosure rows. Only the first item opens initially; any project, photo, quote, role, or board card can be expanded, reordered, or removed without scrolling through all item fields.
- Kept the live contextual preview sticky at desktop widths and moved it naturally below the editor on smaller screens.
- Verification: touched files were formatted, TypeScript and diff checks passed, ESLint retains only the existing React Hook Form compiler-skip warning, and the production build passed.

## Studio Focused Content Manager Follow-up (2026-08-14)

- Replaced the repeated-item “add then expand a long card” workflow with a focused content manager in every Studio collection.
- Projects, photos, quotes, roles, skills, navigation links, and board cards now appear as a compact selectable list beside one dedicated detail editor.
- Adding an item immediately selects and opens it for editing; removing the final item keeps its field structure available so the collection can be rebuilt without leaving the section.
- Retained drag-to-reorder behavior for records with IDs, clear selected-state feedback, and responsive single-column behavior on smaller screens.
- Verification: formatted touched files, TypeScript and diff checks passed, ESLint retains only the existing React Hook Form compiler-skip warning, and the production build passed. Browser visual QA was not run because it was not explicitly requested.

## Studio Editorial Surface Follow-up (2026-08-14)

- Removed the repeated rounded-card treatment from Studio section groups, nested objects, collections, and selected-record details while retaining every editable field and action.
- Reframed the editor with editorial dividers, line-style text controls, and a single accent rail for the selected collection item, making the page easier to scan without losing structure.
- Simplified Add and Remove into quiet text actions and kept responsive behavior intact: item navigation becomes a stacked list above the editing surface on smaller screens.
- Verification: formatted styles, TypeScript and diff checks passed, and the production build passed. Browser visual QA was not run because it was not explicitly requested.

## Studio Navigation, Theme, And Release Flow Follow-up (2026-08-14)

- Redesigned the Suite/Sheet theme control as a clear two-state switch with distinct color treatment, and added light-mode Studio shell, rail, and topbar surfaces so the choice visibly affects the editor as well as the public navigation.
- Rebuilt the Studio rail into a compact numbered page map with readable group counts, a clearer brand block, and an understated active-location rail rather than rounded navigation cards.
- Connected the client release state to actual saves: saving a section now immediately changes the top bar to “Ready to publish,” publishing returns it to “Live site,” and the draft prompt explains the two-step workflow in plain language.
- Verification: formatted touched files, TypeScript and diff checks passed, and the production build passed. Browser visual QA was not run because it was not explicitly requested.

## Studio Light Mode And Preview Save Follow-up (2026-08-14)

- Added an explicit light-mode Studio ink palette so section titles, labels, collection text, and controls use dark readable type instead of the dark-mode preview colors.
- Added matching light-mode rules for editorial dividers, controls, lists, and selected-item feedback to preserve contrast throughout the editor.
- Separated the rail and topbar stacking contexts and restored the rail above the topbar when it opens on smaller screens, preventing their collision.
- Moved the only Save Draft control from the floating shell prompt to directly below the contextual preview in every section editor; it appears only when the current section has unsaved changes.
- Verification: formatted touched files, TypeScript and diff checks passed, ESLint retains only the existing React Hook Form compiler-skip warning, and the production build passed. Browser visual QA was not run because it was not explicitly requested.

## Database SSL Mode Compatibility Fix (2026-08-14)

- Normalized legacy PostgreSQL `sslmode` aliases (`prefer`, `require`, and `verify-ca`) to explicit `verify-full` immediately before constructing the Prisma PostgreSQL adapter connection.
- Preserved the current secure certificate-and-host verification behavior without changing or exposing the database URL stored in local environment configuration.
- Verification: formatting, TypeScript, ESLint, and diff checks passed; production build passed without the prior pg SSL-mode warning. PostgreSQL documents `verify-full` as checking both the trusted certificate authority and requested host name.

## Suite And Sheet Selector Refinement (2026-08-14)

- Replaced the generic pill-and-knob theme switch with a compact editorial Suite—Sheet selector used identically in the public navigation and Studio topbar.
- Both mode names remain visible; a fine index mark moves across a short rule and the active name gains emphasis, avoiding glow, rounded utility controls, and generic app-toggle styling.
- Retained accessible toggle semantics, keyboard focus treatment, persisted theme behavior, and a compact responsive version for narrow public navigation.
- Verification: formatting, TypeScript, ESLint, diff checks, and the production build passed.

## Studio Ping And Icon Theme Control Follow-up (2026-08-14)

- Replaced the Studio's live-state copy with `Ping / network`, retaining the existing draft and publish-ready state feedback.
- Reduced the shared public-nav and Studio theme control to an accessible icon-only button with a refined half-tone disc that changes orientation between modes; text labels remain available through its ARIA label.
- Verification: formatting, TypeScript, ESLint, diff checks, and the production build passed.

## Studio Network Signal And Toggle Sizing Follow-up (2026-08-14)

- Increased the public-nav and Studio theme control to a clear 40px icon-button touch target while retaining the icon-only treatment and accessible mode label.
- Replaced the plain Studio release-state dot with stepped, mobile-network-style signal bars; the bars carry the live, draft, and publish-ready color state and remain visible on compact widths even when the text label is hidden.
- Verification: formatting, TypeScript, ESLint, diff checks, and the production build passed.

## Live Network Ping Follow-up (2026-08-14)

- Added a no-cache dynamic `/api/ping` route and a Studio topbar health check that runs on entry, reconnect events, and a 30-second interval.
- The Ping / Network indicator appears only while the Studio has no unsaved draft or publish-ready changes; it turns red and reads `Ping / offline` if the browser is offline or the same-site ping fails.
- Verification: formatting, TypeScript, ESLint, diff checks, and the production build passed.

## Large Suite And Sheet Switch Follow-up (2026-08-14)

- Replaced the icon-only theme control with a prominent, text-free 66px Suite/Sheet switch used consistently in both the public navbar and Studio topbar.
- The dark Suite and light Sheet states are represented by distinct track colors and a smoothly moving thumb; the target retains an accessible destination label and hover title.
- Added the final style override at the end of the stylesheet to keep the intended switch dimensions from being superseded by earlier legacy toggle rules.
- Verification: formatting, TypeScript, ESLint, diff checks, and the production build passed.

## Legacy Site Settings Compatibility Fix (2026-08-15)

- Added field-level defaults for the site owner, brand, navigation, and footer settings so older or partially saved database records are normalized before public components read them.
- Added read-time fallbacks in the public layout, navigation, page, and footer so stale cached settings cannot expose an undefined navigation or owner value before normalization.
- Verified both an empty legacy `site` object and a partial `navigation` object receive the missing owner and navigation values while preserving existing values.
- Verification: formatting, TypeScript, ESLint, the legacy-data runtime probe, and the production build passed. ESLint retains only the existing React Hook Form compiler-skip warning.

## Public Site Performance Pass (2026-08-18)

- Removed two 24fps `setInterval` loops that drove React state for the hero and contact timecodes; both now write text directly through the shared `useTimecode` hook, which parks itself while the readout is off screen or the tab is hidden.
- Coalesced the nav and scrubber scroll handlers to one read per frame, and moved the nav's past-hero test from a per-event `getBoundingClientRect` to an IntersectionObserver.
- Card dragging in the work cloud and the mood board now writes to the dragged node and commits to state on pointerup instead of re-rendering every card per pointer move. The mood board's window `pointerup` handler also no longer rebuilds the whole position map on unrelated clicks.
- Deferred media: the 14 work-cloud previews use `preload="none"`, and the About portrait video loads and plays only once its section is reached, keeping a 5.25 MB stand-in clip off first paint.
- Dropped the per-card `backdrop-filter` in the work cloud (14 blurred layers) in favour of an opaque panel, and trimmed the sticky nav blur radii.
- Server: `getSection` no longer imports `prisma/seed` on the configured path (now a dynamic import in the no-database branch), and every section getter is wrapped in React `cache()` so settings and contact are resolved once per request rather than three and two times.
- Verification: formatting, TypeScript, ESLint, and the production build passed. ESLint retains only the existing React Hook Form compiler-skip warning. Browser checks confirmed the timecodes tick and park, drag positions commit to state and survive re-render, hover and click previews still load their video on demand, and 12 of 14 cloud videos stay unfetched.
- Known follow-ups: `src/components/public/ScrollScrubber.tsx` is dead code (not mounted anywhere, no matching CSS), and `/` stays dynamic because the root layout reads the theme cookie.

## Developer Handoff Content And Public Studio Page (2026-08-26)

- Applied the August 22 developer handoff to the typed seed content: corrected the Hero copy and owner name treatment, replaced the About biography and grouped skills, updated the four launch statistics, revised work and contact copy, removed Hector Beverages, added Dhrupad Crew, rewrote the five career scenes, and refreshed the Drawing Room cards and handle.
- Split the nine real collaborators from the three Jar sponsorship-show credits. The public component also recognizes and separates the legacy show records at read time so older database content cannot present them as personal collaborators.
- Hid Praise by default and removed all sample testimonial records from the seed. The section returns no markup until it is explicitly enabled with real quotes.
- Added a public `/process` route for the navigation label “Studio,” with the five-step working method, turnaround guidance, and Photobooth. The protected CMS remains at `/studio`; footer and sitemap links now include the public route.
- Moved Photobooth off the homepage to avoid duplication and updated its seed entries to the seven named shoots/groups from the handoff. Missing photos continue to use explicit placeholders rather than invented imagery.
- Added privacy-enhanced `youtube-nocookie.com` embeds inside the existing Work lightbox, kept autoplay disabled for those embeds, and extended the CSP only for that frame origin.
- Added a request-callback mail link alongside the primary Book a call action, corrected visible arrow glyphs, allowed long experience titles to wrap, and clipped scroll-reveal transforms so they cannot create mobile horizontal overflow.
- Preserved the existing uncommitted performance pass throughout the content work.
- Verification: Prettier, TypeScript, Prisma schema validation, diff checks, and the production build pass. ESLint has no errors and retains only the pre-existing React Hook Form compiler-skip warning in `SectionEditor.tsx`. Browser QA at 1440×900 and 390×844 confirmed the homepage and `/process` have no horizontal overflow, no console warnings/errors, and a responsive navigation/layout.
- Remaining launch blockers from the handoff: final About media, on-set and career images, selected video/thumb list, Drawing Room media, testimonials, resume PDF, and final OG/favicon assets. The Word file contains no embedded media. Run `pnpm db:seed` against the intended database, then publish/verify, to replace existing stored draft and published strings with this updated seed content; do not run it against an unknown database because it upserts both states.

## Local Prisma Runtime Access (2026-08-26)

- Traced the homepage `PrismaClientKnownRequestError` to an `EACCES` network denial in the sandboxed development process; the compound `Section.key_status` query and generated Prisma client were valid.
- Restarted the Next.js development server with network access so it can reach the configured remote PostgreSQL database and external font resources.
- Verification: the restarted server is ready at `http://localhost:3000` and the homepage returns HTTP 200.

## Drawing Room Card Theme Fix (2026-08-29)

- Kept the Drawing Room's white and paper cards on a fixed dark-ink palette so their text no longer changes contrast when the global Suite/Sheet color mode switches.
- Gave the dark quote card its own fixed muted attribution color and kept neutral tag chips on the same paper palette.
- Matched card typography to the site system: Bricolage Grotesque for card headlines and quotations, Hanken Grotesk for supporting copy, and JetBrains Mono for labels, metadata, links, and tag chips.
- Typography QA at 1280x720 and 390x844 confirmed the intended font families load, long headlines wrap without clipping, and the mobile board remains free of horizontal overflow. The browser reported only the existing development warning about the placeholder image being the LCP candidate.
- Extended the same hierarchy across the public navigation, footer links, and Studio navigation and utility controls: body type for readable navigation, display type for identity/headings, and mono for compact system labels.
- Verification: targeted Prettier and TypeScript checks pass. ESLint has no errors and retains only the existing React Hook Form compiler-skip warning in `SectionEditor.tsx`; the landing-page browser preview has no console warnings or errors. Studio redirects to its authentication screen without a local owner session, so its shared CSS was validated statically.
- Refined only the public-navbar left cluster: increased the deliberate gap between theme control and wordmark, and applied the display font to that wordmark without changing the footer brand or right-side navigation.
- Added a small, navbar-only inset around the public theme toggle so it no longer sits tight to the page edge while preserving the shared page-content alignment.
- Verification: targeted Prettier and TypeScript checks passed; ESLint passed with only the existing React Hook Form compiler-skip warning. Browser QA at 1280x720 and 390x844 confirmed identical card palettes in both themes, stacked mobile cards without horizontal overflow, and no runtime errors.

## Black And Orange Theme Refresh (2026-08-30)

- Reworked the shared palette into neutral black and charcoal surfaces, vivid orange accents, and white/light-gray dark-mode typography across the public site and Studio.
- Remapped the former cyan signal palette to orange, unified footer social treatments, hero/work gradients, mood-board pins, Studio ambience, previews, and the light-mode theme control so legacy teal accents no longer compete with the new direction.
- Kept the existing warm light “Sheet” mode and semantic success/warning/error colors intact; only the brand and presentation palette changed. Updated the browser theme color to match the near-black background.
- Verification: targeted Prettier and TypeScript checks passed, the production build passed, and ESLint completed with only the pre-existing React Hook Form compiler-skip warning in `SectionEditor.tsx`. The running homepage returned HTTP 200. Browser visual QA was not run because it was not explicitly requested.
- Next phase: review the supplied copy direction if “with the text” was intended to request a wording change rather than light-colored text.

## Full Black And Orange Palette (2026-08-30)

- Converted both Suite and Sheet presentations to the same black-and-orange family so switching modes no longer introduces cream or teal page surfaces.
- Established an impact hierarchy of pure black and near-black canvases, charcoal panels and borders, blaze orange primary accents, amber-orange highlights, white headings, and light-gray supporting text.
- Reworked the remaining light-mode Studio overrides into dark neutral surfaces with orange feedback while preserving semantic green, amber, and red status colors.
- Verification: targeted Prettier and TypeScript checks passed, no legacy cyan palette values remain in the shared styles, and the running homepage returns HTTP 200.
- Next phase: reserve the brightest orange for primary actions and active states; use the lighter orange only for hover, focus, and small highlights to preserve visual impact.

## Responsive Navbar Availability Ticker (2026-08-30)

- Moved the availability caption into its own navbar grid column so it can use the space between the brand and primary navigation without being clipped by the left cluster.
- Replaced the truncating typewriter width animation with a full inline label on desktop and a seamless duplicated ticker below the main navigation row at tablet and mobile widths.
- Set the visible copy to “Available for freelance ·”, including compatibility for legacy published records whose value is only “Available”; updated the schema default and seed value for future content.
- Preserved reduced-motion accessibility by disabling the ticker animation and allowing the full label to wrap instead.
- Browser verification at 1280×720 and 390×844 confirmed the complete desktop label, a running mobile ticker, no navbar overlap, and no horizontal page overflow.

## Navbar Ticker Animation Follow-up (2026-08-30)

- Extended the seamless “Available for freelance ·” marquee animation to desktop as well as tablet and mobile widths.
- Capped the ticker viewport at 24rem so the duplicated label always covers the animation window and loops without a blank or clipped interval.
- Retained the static full-label fallback for people who prefer reduced motion.
- Browser checks at 1280×720 and 390×844 confirmed the animation runs at both widths, visibly advances over time, and creates no horizontal page overflow.

## Cloudflare Worker Hyperdrive Request-Hang Fix (2026-09-01)

- Replaced the global Prisma client with a request-scoped React-cached client and set the PostgreSQL pool to one use per connection. This follows OpenNext's Hyperdrive guidance and prevents a Worker request from reusing a connection pool owned by an earlier request.
- The change specifically addresses production RSC prefetches such as `/process?_rsc=...` that can otherwise hang before producing a response.
- Verification: Prettier and TypeScript checks pass; ESLint has no errors and retains only the pre-existing React Hook Form compiler-skip warning in `SectionEditor.tsx`; Prisma generation and the production build pass. A production-mode local server returned HTTP 200 for both `/process` and its RSC prefetch request. A deployed Worker smoke check remains required after release.

## Studio Editor Responsiveness Pass (2026-09-02)

- Kept the visual editor and inspector work in progress intact, while removing the per-keystroke deep normalization and full form subscription that caused the editor to feel slow on larger sections. The editor now keeps a lightweight local draft state, synchronizes it to React Hook Form for validation/save, and schedules the live canvas update at lower priority.
- Memoized the canvas and keyed the section editor on section changes, so field typing stays responsive and navigation starts each section with its correct data state.
- Improved uploads with immediate client-side media type/size feedback, reusable file selection, accessible status/error announcements, and a guarded delete action that prevents double clicks.
- Verification: targeted Prettier, `pnpm typecheck`, `pnpm lint`, and `git diff --check` pass. Full-repository Prettier still reports pre-existing formatting differences in `pnpm-lock.yaml`, `src/actions/publish-types.ts`, and `src/lib/media-upload.ts`. Local browser visual QA could not connect because the development process did not remain listening on port 3000 in this environment. `pnpm build` reached application compilation but is blocked by this environment's inability to fetch four existing Google Font imports (DM Sans, Instrument Serif, JetBrains Mono, and Space Grotesk).

## Complete Studio Image Upload Coverage (2026-09-05)

- Added dedicated upload support for Work thumbnails, Praise profile images, Experience reel imagery, and Impact collaborator images. Existing About portrait, Photobooth, Experience logo, Drawing Room polaroid, Hero, and site OG upload paths remain available.
- Work cards now display their supplied thumbnail behind the optional hover video. Praise avatars appear when an image is supplied, and an Experience role image creates a restrained background treatment in the career-reel scene.
- Corrected the editor's nested image routing so Photobooth, Drawing Room, Work, Praise, Experience, and Impact each upload to their own media category. Added a first-testimonial template so Praise can now create its first quote and profile image from an empty section.
- Verification: targeted Prettier, `pnpm typecheck`, `pnpm lint`, and `git diff --check` pass.

## Unified Studio Media Tab (2026-09-05)

- Replaced the top-level-only Media tab lookup with a recursive media-field collector. Every image/video nested in a section's cards, projects, roles, testimonials, collaborators, or Drawing Room items is now listed in the section-level Media tab alongside Hero and About media.
- Each upload control keeps a breadcrumb label (for example, `Lanes / Item 1 / Projects / Item 2 / Image`) so the target asset is clear without opening the content inspector.
- Verification: targeted Prettier, `pnpm typecheck`, `pnpm lint`, and `git diff --check` pass.

## Studio Media Preview Error Handling (2026-09-05)

- Kept the existing image/video type and size validation in the Studio uploader and added preview-load handling for both media types.
- An unreadable image or video now becomes a clear in-place fallback panel and an accessible error message explaining whether to choose another file or correct the media URL. A new file or URL automatically receives a fresh preview attempt.
- Verification: Prettier for the changed files, `pnpm typecheck`, `pnpm lint`, and `git diff --check` pass.

## Work And Drawing Room Add Controls (2026-09-05)

- Added dedicated Studio actions to create a blank Work project and a blank Drawing Room picture card, so new content does not need to be copied from an unrelated existing card.
- New Work projects support an uploaded image thumbnail and an optional uploaded preview video (up to 64 MB); Drawing Room picture cards support an image plus descriptive alt text.
- Kept the array action header responsive when both the generic and dedicated add actions are present.
- Verification: Prettier, `pnpm typecheck`, `pnpm lint`, and `git diff --check` pass.

## Studio Editing Panel Redesign And About Section Fixes (2026-09-08)

- Replaced the Studio inspector with a drill-down editing panel (`studio-ins*`). It shows one level of the draft at a time: a back button and a clickable trail, plain-language rows, and an arrow row for anything that opens a list or a group. The horizontally scrolling field strip and the nested list-inside-a-narrow-column layout are gone.
- Lists of entries now have full add, duplicate, reorder and delete controls at every depth, not just at the top level. Adding an entry steps straight into it. Deleting always asks first. An entry opened on its own also carries its own Duplicate and Delete actions.
- A new entry copies the shape of an existing one, falling back to the last saved draft when the list has been emptied, so a list can always be refilled. Projects, Drawing Room cards and testimonials keep their purpose-built blanks. The internal ID field is no longer shown.
- Clicking text in the left preview now opens the group that text belongs to and highlights the field, instead of jumping to the top-level section only.
- New stylesheet `src/styles/studio-inspector.css`, imported after `base.css`. The rules the redesign made unreachable (`.studio-inspector*`, `.studio-array*`, `.studio-add-row`, `.studio-row-remove`, `.studio-editor-card`, `.studio-drag-handle`) were removed from `base.css` — 161 selectors, about 840 lines.
- About section: the uploaded portrait photo was never displayed. It only rendered when no portrait video existed, so with both present it served purely as the video's poster. The photo now fills the frame and the video plays as a clip inset into its corner, so both are used.
- About layout: the two-column grid held down to 560px, which squeezed the portrait to its 260px minimum and left a tall empty column at every laptop and tablet width. It now stacks at 900px, the portrait frame is 3/4 rather than 4/5 so a landscape photograph is not cropped to a sliver, and the text column keeps a 62ch measure.
- Outstanding: the current About portrait upload is a 2560x1706 landscape event photo, so it still crops in a portrait-shaped frame. A portrait-orientation photograph would suit the section better.
- Verification: Prettier, `pnpm typecheck` and `pnpm lint` pass across `src`. The public About section was checked in the browser at 1440, 1280, 1024 and 880 with no horizontal overflow and correct stacking. The Studio panel itself could not be exercised in the browser in this session because signing in requires credentials this agent will not enter; its markup and styles were verified against a static harness of the real stylesheets.

## Selected Work Board — Draggable Dome (2026-09-08)

- Redesigned the Selected Work section around a dome of small draggable cards. `.work__wall*`/`.work__cloud*`/`.work__thumb` are gone; the section now renders `.work__board` → `.work__board-dome` → `.work__board-col` → `.work__card`.
- Cards are draggable again. A pointer drag moves a card anywhere on the board, clamped to the board rect plus 16px of slack; the position is written straight to the card's `--card-x`/`--card-y` during the gesture and committed to state only on drop. A drag past 5px suppresses the click, so a plain click still opens the video preview. Dragging lifts the card above its neighbours and keeps it there.
- Touch drags start from the grip handle only (`touch-action: none` on the grip). The card itself ignores touch pointerdown so a finger anywhere else still scrolls the page.
- Keyboard equivalent: with a card focused, the arrow keys nudge it 18px (54px with Shift), also clamped. A `sr-only` paragraph describes this and is wired to the board with `aria-describedby`.
- A "Reset layout" button in the board bar returns every card to its slot; it is disabled until something has been moved, and switching filters resets the board too (offsets are relative to a card's slot in the flow, which filtering rebuilds).
- The dome arc is unchanged in shape (`lift = u² × 220`, `tilt = -u × 14`), but the tilt now rides on each card instead of on the column wrapper. A rotated ancestor rotates a child's translate with it, which skewed every drag away from the pointer by up to 14°; the lift is a plain `margin-top` for the same reason.
- Card design: framed surface (border, gradient, shadow) instead of a bare thumbnail, gradient scrim, hover play button, lane/title/subtitle block, and a grip affordance top-right. Filter chips became a segmented pill group; the preview dialog is larger (1040×560) with an entrance animation and a close-button hover state.
- `getCardLook` rounds its `Math.sin` output to 2dp. Node and the browser disagree on the last digit, which was failing hydration on every card in the previous build.
- Verification: `pnpm typecheck`, `eslint`, and Prettier pass. In the browser at desktop width: 8 columns with the expected dome lifts (55/28/10/1/1/10/28/55 px), a pointer drag moved a card by the exact pointer delta and did not open the preview, a plain click opened the YouTube preview, Escape closed it and released the scroll lock, Reset restored every card and re-disabled itself, and an arrow key nudged a focused card 18px. The mobile rules under `@media (max-width: 560px)` were confirmed present and correctly targeted via the CSSOM; the preview pane would not hold a mobile viewport emulation for this page, so mobile was not rendered visually.

## Work Board Follow-Up — Drag Fix, Sphere Curve, Smaller Cards (2026-09-08)

- Dragging looked broken to the user because the card thumbnails were natively draggable. Pressing on a photo started the browser's own image drag, which fires `pointercancel` and killed the gesture; only a press that landed on the card's text block worked, which is why the first round of testing passed. Fixed with `onDragStart` → `preventDefault()` on the card plus `-webkit-user-drag: none` on the card and its images. Verified by dispatching a real `dragstart` on a thumbnail (`defaultPrevented === true`) and by driving a full pointer sequence that starts on the image: the card moved by the pointer delta, clamped at the board's top edge, and the preview did not open.
- Cards are smaller: column counts raised to 10/9/7/5/4 (was 8/7/6/5/3), so a card is about 111px wide at 1280 instead of ~140px. Copy, grip (20px) and play button (26px) shrank to match, and the image `sizes` hint dropped to 140px.
- The arc reads as a sphere now, not a shallow dome: lift is `u² × 340` (was 220), tilt `-u × 16`, and each column also scales `1 - u² × 0.42`, so edge columns sit lower, turn further and sit back. At 9 columns the lifts run 85/48/21/5/0/5/21/48/85 px and the scales 0.895→1→0.895. Hover, focus and drag scale relative to the column's own scale (`calc(var(--col-scale) * 1.12)`) rather than overriding it.
- `.work__board-col` gained `max-width: 160px` and the dome centres its columns. Column count is `min(breakpoint columns, project count)`, so filtering to the two-project Campaigns lane used to stretch each card across half the board; it now renders two 161px cards centred on the board.
- Verification: `pnpm typecheck`, `eslint src`, Prettier and `git diff --check` pass. Pointer drags were exercised through synthetic pointer sequences because the Browser pane was hidden for part of the session and would not run real pointer actions while hidden.

## Work Section Photo Background (2026-09-08)

- Updated `index_6.html` so the Selected Work section uses `IMG-20241213-WA0000.jpg` as a responsive full-section cover background with a dark overlay for readable content.
- Verification: inspected the section markup and responsive CSS; the referenced photo file is not currently present in the project folder, so the browser will show the fallback dark background until that upload is restored.

## Desktop-Scale Mobile Portfolio Layout (2026-09-08)

- Kept the public portfolio on a 1280px presentation artboard for phone and tablet browsers so the desktop composition is scaled down as a whole instead of rearranging into a different mobile design. Desktop and laptop browsers continue to use their actual viewport and existing responsive rules.
- Added safe-area fitting and retained user zoom up to 5×. Limited the compact footer rhythm to touch-first devices so hybrid touchscreen laptops keep the normal desktop spacing.
- The fixed presentation viewport is scoped to the public route group; the protected Studio retains its device-width responsive interface.
- Verification: Prettier for the changed TypeScript and memory files, TypeScript, ESLint, `git diff --check`, and the production build pass. The live homepage returns HTTP 200 and emits `width=1280, maximum-scale=5, user-scalable=yes, viewport-fit=cover` in its viewport metadata. The shared stylesheet retains pre-existing formatting differences outside this scoped change.

## About Heading And Metadata Alignment (2026-09-09)

- Removed the wide-screen no-wrap rule that allowed the About heading to run underneath the portrait and disappear at the column boundary. The heading now wraps and balances within a readable measure.
- Normalized the Status value and Tools rows to the same font size and line height, with explicit top and baseline alignment so every label/value row starts consistently.
- Verification: targeted Prettier, TypeScript, ESLint, `git diff --check`, and the production build pass. Browser checks at 1594×986 and 390×844 confirm no horizontal overflow; on desktop the heading ends before the portrait, both metadata headings share the same baseline, and the Status value aligns exactly with the first Tools row.

## Studio Page Single-Line Heading (2026-09-09)

- Kept “The work behind the cut.” on one line across the public Studio page by removing its narrow character measure and scaling the display type fluidly to the available viewport.
- Verification: targeted Prettier, TypeScript, ESLint, `git diff --check`, and the production build pass. Browser checks at 1594×986 and 390×844 confirm the heading occupies exactly one line and creates no horizontal overflow.

## About Metadata Bottom Spacing (2026-09-09)

- Added bottom breathing room beneath the About Tools rows so “Learning / Motion graphics” no longer sits against or appears clipped by the lower boundary.
- Preserved the shared Status/Tools heading and first-row alignment from the preceding fix.
- Verification: targeted Prettier, TypeScript, ESLint, `git diff --check`, and the production build pass. Browser measurement at 1594×986 confirms the Status and first Tools rows remain exactly aligned, the final Tools row has 20px of clear space below it, and the page has no horizontal overflow.

## 2026-09-17 — Work board full-width and card open affordance

- Made the public Work board span the full viewport width while keeping its heading and controls aligned to the shared page container.
- Added a persistent `Click to open` cue to every Work card; the entire card remains the keyboard-accessible preview button.
- Preserved the existing in-progress canvas, globe, rail, mobile-preview, and Studio changes.
- Checks: Prettier passed for the touched files, TypeScript passed, and the production build completed successfully.
- Visual verification: checked the Work section at the default desktop viewport and at 390 × 844; the board reaches the viewport edges, the open cue remains readable, and keyboard activation opens the preview dialog.
- Known unrelated check failure: full-repo lint still stops on the pre-existing `react-hooks/set-state-in-effect` error in `src/components/public/MoodBoard.tsx` (plus two existing `no-img-element` warnings).
- Follow-up from visual review: widened the desktop globe itself—not only its canvas—by limiting it to two card rows. Larger project sets now form a broad sphere that uses the available page width instead of a narrow central tower.
- Globe polish: shortened the cards with a shallower media crop and tighter body spacing, added a subtle alternating card tilt, and slowed one full automatic rotation from 42 to 80 seconds. The shared card face keeps `Click to open` on every card.
- Positioning correction from the hand-drawn reference: removed the alternating row offset, individual card tilt, and overall downward globe tilt. Both rows now share a level, vertically aligned centre; curvature comes only from cards turning around the left and right sides. Increased horizontal card clearance from 16px to 30px to prevent overlap throughout the rotation.
- Follow-up spacing refinement: increased clearance to 36px and moved the globe camera farther back (depth ratio 16) so perspective stays gentle and front cards cannot balloon into adjacent cards.
- Added a 56px vertical gap between the two globe card rows so the card frames and captions stay visually separated.
- Adjusted globe cards to a wider, shorter landscape shape: 150px layout width, 118px layout height, and a 2.4:1 media crop.
- Added a scale buffer to globe card buttons so cards cannot touch at the front of the cylinder, and exposed the `Click to open` cue to assistive technology as well as sighted users.
- Fixed All Work preview activation by stopping card pointer-down events from being interpreted as globe drags; clicking a card now consistently opens the existing preview dialog.
- Globe now pauses its idle rotation while the preview dialog is open; removed the nested per-card scale/compositor layer that was raster-blurring card text and thumbnails during movement.
- Increased the globe chord gap to 80px and row gap to 72px so adjacent cards remain visibly separate throughout the rotation.

## 2026-09-25 — Security, performance and quality audit (60 issues)

- Status: all 60 audit issues worked through one at a time with the owner's approval (#15 won't-fix; #19–#20 skipped by the owner). The full per-issue record, decisions, verification and remaining owner steps are in `AUDIT-HANDOVER.md`; this entry is the summary.
- Main changes: Next 16.3.6; login throttling; hardened thumbnail proxy (limits, redirect allow-list, size caps, embed-page LinkedIn fetch); upload magic-byte checks, idempotent finish, deletion reconciliation, advisory lock; purpose-specific URL schemas driving CSP; duplicate-ID rejection; hero/image loading via Cloudflare Image Transformations (mobile Lighthouse 65 → 82); dialog focus handling and tab keyboard support; iframe sandboxing; pop-ups pinned to the screen (the scroll animation's transform had pinned them to their section); reduced-motion marquees; honest alt text; public `error.tsx`/`not-found.tsx`; live-refresh status and retry; failure logging plus a "Watching for failures" runbook; `/api/health`; per-page canonical, twitter card, sitemap `lastModified`.
- Tooling: `pnpm test` (Node's test runner via the existing `tsx`, 25 tests) is now part of `pnpm check`; `pnpm test:browser [url]` is a dependency-free CDP smoke test of the public site (86 checks) that can run against production. Stale `package-lock.json` removed and ignored; tracked `.env.example` rewritten from the code.
- Decisions: `nmadhukumar.com` is the only site domain; `madhu.edit` is the brand name only (`.edit` is not a real TLD, so there is nothing to redirect). pnpm 11 ignores `.npmrc`'s `node-linker`, so the install is isolated/symlinked (owner to decide whether to move it to `pnpm-workspace.yaml` or delete it).
- Checks at close: lint, typecheck, test 25/25, prisma:validate and build pass; local smoke test passes except the dead hero poster 404 (content).
- Next (owner): set Studio → Site & Navigation → domain to `nmadhukumar.com` and publish; deploy the Worker first, then the Studio (with `PUBLIC_SITE_URL`/`REVALIDATE_SECRET` in Vercel Production); upload the hero poster and a real share image; R2 CORS and the resume-download rule in Cloudflare; then run `pnpm test:browser https://nmadhukumar.com`.

## 2026-09-29 — Timeline section headings

- Status: every homepage section after the Hero (8: About, Impact, Clients, Work, Praise, Experience, Drawing Room, Contact) opens with a full-width edit-timeline strip (design "D1") as its own row at the top of the section container, with the playhead at the section's place on the page. The strip replaces the old `.slate` eyebrow in those sections (one label, not two). The Hero keeps its own eyebrow and has no strip.
- Label text is the section's existing Studio field: `eyebrow` (About, Work, Praise, Experience, Drawing Room teaser, Contact), `heading` for Clients (its old `h2.slate`), and a new `eyebrow` field on Impact (default "Impact"). The number is automatic.
- How: `src/app/(public)/page.tsx` numbers the visible sections with `sectionTimeline()` (`src/lib/section-timeline.ts`) and passes each a `timeline` prop; `SectionTimeline` renders the strip. Studio previews (one section at a time) get the strip with the playhead at the start and no number. Hidden sections drop out and the rest renumber; the page's visibility list mirrors each section's own "render nothing" check (Clients: has clients; Praise: visible and has quotes; Experience: has roles) — keep them in sync.
- Entrance (animation "C", trimmed): the first time a strip scrolls into view (IntersectionObserver in `SectionTimeline`, threshold 0.6, adds `timeline-slate--in`), the orange progress line draws from zero (0.8s), then the playhead and label drop in (0.35s, 0.7s delay). The grey track is static. Skipped under reduced motion. The About grid pins the strip to row 1 (`.about > .timeline-slate`) because its text/portrait are explicitly placed.
- Removed the hard-coded About `01 |` index and the now-dead `.about .slate*` and `.drawing-teaser__copy .slate*` CSS.
- Checks: tests 29/29, lint and typecheck clean except the pre-existing in-progress `MoodBoard.tsx` errors. Measured at 1440px and 360px: no horizontal scroll; the long Clients label ellipsizes at 360px.

## 2026-09-29 — Experience reel as a video player

- Status: the Experience reel now reads as footage playing. A 16:9 screen shows the scene photo at full brightness with cinema letterbox bars; the top bar carries a blinking-dot `Scene NN` slate and the role's real `start — end` dates; the company and role sit in a lower third over a bottom-only fade. Under it, a player bar (play/pause, previous, next, duration, `n / total`), then the role's notes (logo, location, full description, no 3-line clamp). The giant scene number, the sprocket frame edges and the heavy left-to-right scrim are gone.
- Motion: the reel autoplays whenever it has more than one role (it used to wait for six) at 7s per scene, with a slow 1.00 → 1.08 push-in on the photo. Hover no longer pauses it; the play/pause button does. Visitors with reduced motion (OS setting or the site's `.motion-disabled` switch) start paused and can still press play. `aria-live` is off while playing and polite when paused.
- Quality: the main photo requested `sizes="1200px"` inside a full-width frame, so wide screens upscaled a 1280w file; it is now `100vw` (1920/2560w on large and Retina screens). Thumbnails use `(max-width: 560px) 50vw, 20vw` and lose the `grayscale(.85) brightness(.55)` filter. The landing page's scroll-linked `media-in` animation (6px blur) is outranked on the reel photo by the push-in.
- Timeline: the filmstrip is the reel's only timeline (a separate scrubber was tried and removed as a duplicate). Played frames keep a full orange bar; the active frame's bar fills while an orange playhead line sweeps across it. Pausing freezes both in place, and the JS timer keeps the scene's remaining time so resuming continues instead of restarting. Frames share the row (`flex: 1 0 9rem`), so six fit from ~1024px up and the strip scrolls below that.
- Layout: the screen needs an explicit `width: 100%` because a grid item with `aspect-ratio` does not stretch; without it the height cap shrank it to a third of the frame. Every role's notes share one grid cell, so the panel keeps the tallest note's height and the page does not jump as the reel advances. The controls row wraps if a long duration would not fit.
- New Studio fields: `playLabel` ("Play reel") and `pauseLabel` ("Pause reel") on Experience, with labels in `studio-labels.ts`.
- Checks: typecheck clean, tests 35/35, eslint clean on the changed files; measured at 375, 1024, 1280 and 1920px with no overlap or horizontal scroll. Build not run here because a dev server and another session were active on the same tree.

## 2026-09-30 — Hero as a full-bleed viewfinder

- Status: the hero video now fills the whole first screen, running under the nav (`.landing > .hero` pulls up by the nav's 65px and is `100svh`); the nav is see-through over it until `is-past-hero`, via a CSS-only `body:has(.landing > .hero)` rule so `Nav.tsx` is untouched. Four white crop marks (`.hero__frame`) replace the letterbox bars; the frame is keyed on the cut word, so each swap remounts it and replays a short inward snap (`hero-snap`, skipped under reduced motion).
- Arrangement (every existing Hero field still shows; only placement changed): top HUD row - `reelLabel` left, `REC` + running timecode right. Headline block bottom-left - `eyebrow` (now soft white with an orange dot instead of an orange dash), `line1`/`line2` + cut word, then `sub` on the left and both CTAs on the right on one baseline. Bottom info row under a hairline - `footerLeftLabel │ creditLine1 │ creditLine2 │ aspectRatioLabel` left, `footerRightLabel` right; blank fields drop out. The orange aspect-ratio chip, orange `EST.` bar and the floating credit block are gone; orange is kept for the cut word, primary CTA, timecode and the eyebrow dot.
- Alignment: the hero content is uncapped (`#top > .hero > .hero__content`) so the headline, HUD and info row share the nav's left/right gutter at any width.
- Phones held upright: the hero's text layers are zoomed 2.2x (the mood-player pattern) and stack in one column with full-width CTAs; the info row wraps and sits clear of the larger crop marks. Studio hints in `studio-labels.ts` now describe where each frame label appears.
- Checks: typecheck clean, tests 35/35, eslint clean on `src`/`tests` (the only errors are the `.claude/skills/security-audit` scripts), `next build` passes. Verified on the running dev server at 1440x900 and 375x812 (mobile emulation): edges align, no horizontal scroll, no console errors. Studio preview of the Hero not checked in the browser.
- Revision (2026-09-30), approved from a live preview: the reel is now a viewer + inspector. The screen shows the whole photo at 1825 / 862 (every current Studio upload is 1825 x 862; other shapes crop around the focal point) with no letterbox bars, scrim or lower third; only a `Scene NN` slate sits above it. The inspector beside it is exactly the photo's height (`height: 0; min-height: 100%` on a grid item) and holds the company with the logo tile on the right, role, dates (shown once), description (scrolls inside the panel when long) and the player controls. The heading uses `text-box: trim-both cap alphabetic` so its capitals start on the photo's top edge. Push-in is 1.05 and pauses with the reel. Under 1100px it stacks, and the notes (all roles in one grid cell) keep the tallest scene's height so the page never jumps.
- The location line ("Creative room") was removed from the reel at the owner's request, so the Experience `location` / `defaultLocation` Studio fields are no longer shown anywhere. Kept in the schema so saved data still parses; remove them (schema, labels, seed) if the owner confirms they are not coming back.

## 2026-09-30 — Contact as a tabbed card

- Status: the "Let's talk" section is now the heading and intro on the left and one card on the right (approved as "D" from a live preview). The card switches between Email, Callback and Message tabs and ends in a green status strip ("Available for freelance … 2:37 am in Bengaluru"). Below 860px it stacks.
- Tabs: Email shows the address, a one-line note, the `projectCtaLabel` mailto button and a Copy button. Callback shows a heading and note, and its button opens an email pre-filled with "Name / Phone / Best time to call" (`callbackHref`); if `phone` is set, a tel: button sits beside it. Message lists WhatsApp (`socials.whatsapp`) and LinkedIn rows; the tab drops out when both are empty. Keyboard: arrow keys move between tabs (WAI-ARIA tabs pattern).
- Status strip follows the site rule: shown only while `availableForFreelance` is on (same as the nav badge and footer), text is `footerStatus`. The local time is rendered client-side after mount (the page is cached) from the new `timeZone` field and the first part of `location`.
- Schema: added `emailNote`, `callbackHeading`, `callbackNote`, `timeZone` (default `Asia/Kolkata`, must be a real IANA zone). Removed `bestForLabel`, `bestFor`, `availabilityHeading` and `locationLabel`, which the new card does not show; Zod strips them from stored drafts on the next save. The timecode and the old `.contact__panel/details/email/links/callback` CSS are gone.
- Shared helpers in `src/lib/contact-links.ts` (`whatsAppHref` moved there from `Footer.tsx`), tested in `tests/contact-links.test.ts`.
- Owner to-do: `socials.whatsapp` is still the schema's placeholder (+91 98765 43210) until the real number is saved in the Studio, and `projectCtaLabel` is now the Email tab's button, so it should read like "Write an email" (the seed sets "Book a call").
- Checks: typecheck clean, tests 39/39, eslint clean on `src`/`tests` (only the `.claude/skills/security-audit` scripts fail), `prisma validate` and `next build` pass. Verified on the running dev server at 1280px and at 375px (in a 375px frame, since viewport emulation did not apply): no horizontal scroll, tabs, links and arrow keys work. Studio preview of Contact not checked in the browser.

## 2026-09-30 — Narrow windows scale the desktop layout

- Status: below 1280px the public site no longer reflows. An inline script in `src/app/(public)/layout.tsx` (`siteScaleScript`) sets `zoom` on `<html>` to `clientWidth / 1280`, so a narrow desktop window shows the exact 1280 layout, smaller - the same thing phones already get from the pinned `viewport.width`. Studio pages are not zoomed.
- Viewport units: every `Nvw` in `base.css` is now `calc(N * var(--vw))`. `--vw` is `1vw` (tokens.css) and the script pins it to 12.8px while zoomed, since a raw vw would shrink twice under the zoom. Use `var(--vw)` rather than `vw` in new CSS.
- Removed the public `max-width` breakpoints (nav, hero, impact, work, experience, about, contact, mood board, footer at 1100/900/860/820/720/560/480) and unwrapped the `min-width: 901px/1200px` About rules; Studio breakpoints are untouched. The touch-portrait rules (hero 2.2x zoom, mood-player) were left for the separate mobile pass. `MoodBoard` no longer disables dragging under 821px; `WorkConsole` divides pointer deltas by the page zoom.
- Checks: typecheck clean, tests 39/39, eslint clean on `src`/`tests`, `next build` passes. Verified at 800px on the dev server: zoom 0.625, no horizontal scroll, no console errors, work-card drag tracks the pointer.

## 2026-09-30 — Typography system (Newsreader + Hanken Grotesk)

- Status: replaced Space Grotesk / DM Sans / Instrument Serif (the last was loaded but never used) with **Newsreader** (`--f-display`: hero and page titles, section titles, sub-titles, big numbers, testimonial and mood-card quotes) and **Hanken Grotesk** (`--f-body`: body, nav, buttons, labels, captions). **JetBrains Mono** (`--f-mono`) stays, one weight, for machine data only: hero timecode and info row, testimonial slate boards and `DIR.`, the Experience `Scene NN` slate, duration and count, and the nav reel runtime. Chosen as "A" over the Source family after side-by-side screenshots of every section; research notes in `research_notes/Classic portfolio font pairings/`.
- Rules: weights are 400/500/600 only (headings 400, h3/h4 500, `b`/`strong` 600), `font-synthesis: none` on `html` so a missing weight or italic is never faked. Heading accents (hero cut word, section `em`, Room title) are Newsreader italic. Every section title uses the new `--fs-section` token (tokens.css). Labels that used mono are now Hanken caps at 600.
- Studio: `studio-inspector.css` and the Studio rules in `base.css` were not edited, but the Studio still picks up the new families through the same variables, plus the global heading, `b`/`strong` and `font-synthesis` rules. Studio screens were not checked in the browser.
- Checks: tests 39/39; typecheck fails only on `src/components/public/Nav.tsx` (another in-progress change, not this one) and eslint only on the `.claude/skills/security-audit` scripts; `next build` not run for that reason. Verified on the dev server at 1440px (home, `/room`): computed fonts match the roles above, no layout overlap. `/resume` currently redirects to `/`, so it was not checked.

## 2026-10-02 — Studio: one top bar, fit-to-frame preview, Drawing Room split

- Status: the Studio's two header rows are one 48px bar: brand, the section tabs (`Rail`, now rendered inside `Topbar` as its children), the publish status, icon buttons for Settings / View site / Log out (`StudioIcon.tsx`, each with an `aria-label` and `title`) and Publish. The `01`, `02`… tab numbers are gone. Under 1380px the tabs drop to a row of their own; under 1500px the status shows its dot only. All shell CSS is in `studio-shell.css`. The editing panel (`.studio-ins`, `studio-inspector.css`) was deliberately not touched, at the owner's request.
- Preview: `PreviewFit.tsx` wraps the preview. It lays the section out at the pane's width (never under the public layout's 1280 design width), pins `--vw` to 1% of that width, and sets CSS `zoom` so the section sits inside the pane. "Fit" (default) shows the whole section with no scrolling; "Full width" fits the width and scrolls down. The scale maths is `previewScale` in `src/lib/preview-fit.ts` (tested). The phone preview keeps its 390x780 frame and is zoomed the same way. The strip above the preview shows the zoom %, Fit / Full width and Desktop / Mobile.
- Why `zoom` and not a transform or an iframe: a zoomed box takes its scaled size in layout, and the desktop preview stays in the host document, so click-to-edit and the board drags keep working. Pointer drags divide by the zoom through `pageZoom(node)` (`src/lib/page-zoom.ts`, uses `currentCSSZoom`, falling back to the `<html>` zoom). `WorkConsole` already did this for the public zoom; `MoodBoard` now does too, which also fixes its card drag lagging the pointer on the public site under 1280px.
- Drawing Room: one `room` draft, two tabs. "Room entrance" (`/studio/room?open=teaser`, placed after Experience in page order) previews only the home-page teaser and opens the panel on the teaser group; "Drawing Room page" (`/studio/room`) previews only the pinboard. The stacked preview and its divider are gone. On either tab the preview follows the panel: inside the teaser group it shows the teaser, inside any other group the page.
- Checks: tests 43/43 (4 new for `previewScale`), eslint clean on `src`/`tests`, typecheck fails only on the existing `Nav.tsx` error. `next build` not run: its clean step deletes `.next` under the running dev server.
- Verified signed in on the dev server (2026-10-02): all 13 tabs show the right preview with no page or pane scrolling at 1403x1274 and 1440x900 (Work 61%, Drawing Room page 54% at 900px tall); Full width scrolls down only; the bar wraps to two rows at 1280 and holds at 768 and 375 with no sideways page scroll; click-to-edit focuses the matching field; a pinboard card and a work canvas card both track the pointer 1:1 while zoomed. `PreviewFit` measures in a layout effect so a section does not flash at 100% before it is fitted.
- Menu / Navbar / Footer (same day, at the owner's direction): the "Menu" tab is now the Studio's settings page (`/studio`: availability, recent changes, site details, change password, revert, storage) and stays current on the site-detail editors it links to; the gear icon in the bar is gone because it pointed at the same page. "Navbar" (`/studio/settings?open=site.navigation`) previews the menu bar alone, once as on the home page and once as on `/room` (`Nav` takes a Studio-only `previewPath="/room"`), and shows the Resume link only when the draft has a PDF. "Footer" (`?open=site.footer`) previews the footer alone. Any other part of the settings draft keeps the combined preview. The change-password form now stacks inside its grid card; in a row its button ran past the card and under the next one. Tabs wrap to their own row under 1380px. Verified signed in at 1403 and 1366 wide.
- Open: the Studio's Mobile preview lays the Hero out at 390px with desktop rules (sub-headline wraps one word per line); that predates this work and real phones get the 1280 layout scaled instead.

## 2026-10-02 — Studio editing panel: folded rows, one card open at a time

- Status: the editing panel (`.studio-ins`) was rebuilt at the owner's request, from a clickable prototype they approved. Its place in the layout, the "Editing / section" head and the Undo / Save section buttons are unchanged. Nothing is open by default: every field is a row showing its value (small label above, a pencil at the end), an empty field is a dashed row that says **Add**, and clicking a row opens only that field as a card - name, what it does on the page, the control, its limit, Done. Opening another row folds the first. Switches and dropdowns are used right in their row. Clicking anything on the preview opens that field's card directly.
- The separate "Photos & video" tab is gone; a photo or video sits beside the text it belongs to. The trail (back arrow + crumbs) only shows once you are inside a list or group, and names a list entry by its title.
- Limits come from the schemas, not a second table: `maxAtPath(schema, path)` in `src/lib/field-limits.ts` reads a text field's character limit and a list's entry limit out of the Zod schema a save is validated against (tested in `tests/field-limits.test.ts`). Text cards show `18 / 80` and stop at the limit; lists show `4 of 20`, and Add / Duplicate stay in place and explain when the list is full. The schema map moved to `src/lib/section-schemas.ts` (no DB imports, so the browser can load it); `studio-drafts.ts` re-exports it.
- Uploads (`Dropzone.tsx`, rewritten): one state at a time - empty (drop / Choose file), uploading (name, %, Cancel), refused (the file's size beside the limit, Choose another / Keep the current one), or holding a file (preview, **Replace**, **Remove**). The accepted types and size are stated once, under the slot. Remove asks first and offers both **Remove from page** (clears the draft only; Undo brings it back) and **Delete forever**. Alt text, "Use a link instead", crop focus, the video poster and the duotone tint sit under a collapsed "More options"; the separate poster-address box was dropped (the poster is uploaded).
- API change: the server action `deleteMedia(mediaId)` is now `deleteMediaByUrl(url)` (`src/actions/media.ts`), since a draft only holds a file's address. Same rules as before - it refuses while any saved draft or the live site still points at the file - so Delete forever only succeeds for a file not yet saved into a section; otherwise the card shows where it is still used.
- An upload is abandoned if its card unmounts, so while one is running the panel will not fold the card, open another row or move to another level; it says which file it is waiting for.
- Icons: `lucide-react` added (the owner asked for an icon pack) and used for every icon in the panel. The top bar's three hand-drawn icons in `StudioIcon.tsx` were left alone.
- Also: list rows no longer show an entry's raw id when it has no title, a category row is summed up by its project count, and a row lists only the media that is set ("1 photo · video link") instead of every empty slot.
- Checks: tests 47/47 (4 new), eslint clean on `src`/`tests`, prettier clean on the changed files, `prisma validate` passes; typecheck fails only on the existing `Nav.tsx` error. `next build` not run: its clean step deletes `.next` under the running dev server.
- Verified signed in on the dev server at 1389px and 430px (Hero, About, Work down to a single project): rows, cards, counters, list limits, the trail, click-to-edit from the preview, the Remove confirmation and More options; no sideways scroll, no console errors. Not exercised: an actual upload, Replace, and Delete forever - uploads are not configured on this machine, and Delete forever was not pressed against real files.
- Open: `base.css` still carries the old panel's rules (`.studio-dropzone*`, `.studio-media-field*`, `.studio-media-badge*`, `.studio-focal-field*`, `.studio-media-group*`, `.studio-object*`, `.studio-switch-field`), now unused.

## 2026-10-02 — Studio Menu page: status overview

- Status: `/studio` (the "Menu" tab) is rebuilt from a wireframe the owner approved. Title now reads "Menu" to match its tab. The head holds the title beside four equal tiles (the "Available for freelance" switch, how many parts are not live, when the site was last published, storage used); below it are three columns: Sections; Before you publish + Recent changes; Site details (with the share preview) + Account and maintenance. The editing panel was not touched.
- Layout (owner's direction after the first build: "use full layout, don't let it scroll down"): the page is full width and fills the window under the top bar without scrolling. `.studio-settings` is a flex column inside `.studio-main`; the columns share the leftover height, the section rows stretch to fill their card and the last card of each column grows so the columns end level. A column that still cannot fit (a window under about 768px tall, the password form open) scrolls on its own. At 960px and below the columns stack and the page scrolls as usual.
- Sections list: one row per tab in page order with a Live / Edited pill. Tabs that share a draft (Navbar and Footer in `settings`, Room entrance and Drawing Room page in `room`) each carry a `part` in `studioTabs` (`src/lib/studio-nav.ts`), and `partEdited()` (`src/lib/draft-diff.ts`, tested) compares only that slice of the draft with the published row. The three Site details rows cover the rest of the settings draft the same way, so an edit anywhere shows as Edited on exactly one row. A new key added to `SettingsSchema` must be added to one of those parts or it will only show in the top bar's dot.
- "Before you publish": `publishChecks()` (`src/lib/publish-checks.ts`, tested) reads the drafts for a missing resume PDF, empty Google title or description, no share image, projects with no video, the placeholder WhatsApp number (`placeholderWhatsapp` in `src/schemas/contact.ts`) and pictures stored with an empty `alt`, each with a Fix link to its editor. It reports only; publishing is never blocked.
- Share preview: the saved share image, title and description as a link card, inside Site details. `ShareImage.tsx` says so when the image address does not load.
- Account and maintenance: change password (a native `<details>`), unused uploads and revert drafts are one card of three rows instead of three cards; the actions behind them are unchanged.
- Data: `getSectionRows()` in `src/lib/studio.ts` is the one per-request read behind both the top bar's "changes not live" dot and this page; `getStorageUsage()` adds one aggregate over `Media`. "Last published" is the newest `updatedAt` among the published rows.
- Not built: the wireframe's Publish and View site buttons in the page header (the top bar directly above already has both) and a "show all" link for recent changes.
- Checks: tests 51/51 (4 new), eslint clean on `src`/`tests`, prettier clean on the changed files, `prisma validate` passes; typecheck fails only on the existing `Nav.tsx` error. `next build` not run: its clean step deletes `.next` under the running dev server.
- Verified signed in on the dev server: no page or column scrolling at 1366x768, 1440x900, 1920x1080 and 1389x1274; at 768 and 375px wide the columns stack with no sideways scroll; the password row opens. Not exercised: the availability switch, Check / Remove unused uploads, Revert, and a password change (all write to the database).
- Found: the saved share image is `https://madhu.edit/placeholders/photo.svg`, which does not resolve, so links to the live site unfurl with no picture until a real one is uploaded under Google and sharing.

## 2026-10-02 — Studio phone preview matches a real phone

- Status: closes the open item above. The Studio's Mobile preview was a 390px-wide iframe, so it fired the `max-width` breakpoints and showed a reflowed layout no phone ever gets: the public layout pins the viewport to 1280, and a phone lays out that artboard and scales it down. The frame (`.studio-preview-frame` in `base.css`) is now 1280×2560 with CSS `zoom: 390 / 1280`, so it is the same viewport a 390×780 phone has; its bezel sizes are divided by the zoom.
- Touch rules: the public CSS has phone-only rules behind `(hover: none) and (pointer: coarse)` (hero text zoom and stacked buttons, footer rhythm, mood player) and mouse-only ones behind `(hover: hover) and (pointer: fine)`. The frame sits in a desktop browser, so `PreviewFrame.tsx` rewrites the media text of its own cloned stylesheets (`applyPhoneRules`): touch rules always apply, mouse rules never do. The host document's styles are untouched.
- No public code changed.
- Open: `WorkConsole` picks the phone grid from `window.screen.width <= 640`, which the preview cannot fake without a prop on the public component, so a category set to the freeform canvas still shows the canvas in the phone preview ("All work" is the grid either way).
- Checks: tests 51/51, eslint and prettier clean on `PreviewFrame.tsx`; typecheck fails only on the existing `Nav.tsx` error, eslint only on the `.claude/skills/security-audit` scripts, prettier on `base.css` only at an existing line (708). `next build` not run: typecheck already fails on `Nav.tsx`, and another dev server holds `.next`.
- Verified signed in on the dev server: in the Hero and About phone previews the frame reports a 1280-wide portrait viewport, `max-width: 860px` does not match, hero zoom is 2.2 and About's columns are 720px / 405px - the same values the public page reports under 390×780 touch emulation. Fit and Full width both work (Full width shows the phone at 390×780 and scrolls the pane).

## Studio Inspector: boxed rows (2026-10-03)

- The inspector's folded rows are now boxes of their own, like a form: outlined when filled, dashed while empty, with switch and choice rows left unboxed. The 40px icon column is gone - nearly every row showed the same "T", so it took width without saying anything. A photo field still shows its thumbnail in that slot.
- `SectionEditor.tsx`: `FieldRow` lost its `icon` prop and the per-type icon picks; `studio-inspector.css`: `.studio-ins-row*` only. No schema, data or public code changed.
- Checks: eslint and prettier clean on both files; typecheck fails only on the existing `Nav.tsx` error. Not verified signed in - the dev Studio sits behind the login - so the rules were checked by rendering the row markup against the live stylesheet (filled, empty, switch and thumbnail rows, 420px panel, no horizontal overflow).
- Nothing shown twice (same day, owner picked all four): the freelance switch is only on the Menu page now (`availableForFreelance` joined `hiddenKeys`, so the Contact inspector skips it); `contact.availabilityLabel` is gone and the navbar reads `contact.footerStatus`, the one "Status line" for navbar, contact card and footer; `settings.site.footer.drawingRoomLabel` and `footer.contactHeading` are gone and `Footer.tsx` reads `navigation.drawingRoomLabel` / `navigation.contactLabel`. Stored rows still carrying the old keys parse fine - Zod strips them - so no migration.
- Left separate on purpose: About's "Current status" (a different message) and the footer craft list vs About's tools.
- Checks after the merge: eslint, prettier and tests 51/51 clean; typecheck still only the `Nav.tsx` error. Public home page checked on the dev server: navbar caption, contact card and footer all show the status line, footer link and heading read "Drawing Room" / "Get in touch". Studio screens still not checked signed in.
- `Nav.tsx` typecheck error fixed: `downloadResume` now calls `document.body.appendChild(frame)`. The Workers types redeclare `Element.append` for HTMLRewriter, which hid the DOM overload; `appendChild` is untouched by that. `pnpm typecheck` is clean again.

## Production-readiness pass (2026-10-04)

- Branch: the uncommitted work that sat on `main` now lives on `chore/production-readiness` (nothing committed yet).
- Gate: `pnpm check` steps all pass (eslint, typecheck, tests 54/54, `prisma validate`, `next build`), and `prettier --check .` is clean. ESLint ignores `.claude/**` (local skill scripts); `.prettierignore` excludes `pnpm-lock.yaml`.
- `(public)/layout.tsx`: `initialScale: undefined` replaces the `null as unknown as undefined` cast. The prerendered viewport tag is unchanged (`width=1280, maximum-scale=5, user-scalable=yes, viewport-fit=cover`, no `initial-scale`).
- Passwords: a successful sign-in rehashes any hash `needsRehash()` flags (legacy bcrypt, or an older PBKDF2 iteration count) in `auth.ts`. `bcryptjs` can be dropped once no stored hash starts with `$2`. Covered by `tests/password.test.ts`; not exercised against the real database.
- `middleware.ts` stays despite Next 16's deprecation warning: `proxy.ts` is Node.js-runtime only and OpenNext's Cloudflare adapter (1.20.4) calls Node.js middleware experimental and unmaintained. The current file builds as edge middleware, which the Worker supports.
- Not run: `pnpm cf:build` (not on native Windows), a dependency audit, signed-in Studio checks.

## Studio design-review fixes (2026-10-04)

- Status: the nine findings of the owner's Studio design review are built ("fix all"), including the ones inside the editing panel. Nothing is committed.
- Preview size: until Fit or Full width is picked, `PreviewFit` shows the whole section only while that costs under a tenth of its width-fitted size (`wholeIsReadable()` in `src/lib/preview-fit.ts`, tested); taller sections fit the width and scroll. The phone frame is always shown whole. The choice resets per tab.
- Top bar: one row down to 1320px wide. The "Studio" wordmark is now the first tab (it replaced the "Menu" tab and the separate brand link, which went to Hero), and the page it opens is titled "Studio". "Drawing Room page" is "Room page". Tabs with saved edits that are not live carry an amber dot; the status beside Publish always has its label ("2 not live", "Save to publish", "All changes live").
- Shell data: `getStudioShellData()` now also returns `edited` (labels from `editedLabels()` in `studio-nav.ts`, tested) and `flagged` (failing `publishChecks`, via `getPublishChecks()` in `studio.ts`, which the Studio page shares). `siteDetails` moved from the page into `studio-nav.ts`. The layout only re-renders on `router.refresh()`, which every save, publish and the availability switch already call.
- Publish asks first: a dialog lists what goes live and what the checks still flag. It still never blocks.
- One dialog: `StudioDialog.tsx` (a native modal `<dialog>`) carries the publish confirm, the unsaved-changes prompt, Revert and Delete unused uploads; `window.confirm` and the bottom-of-preview prompt are gone. It must not call `close()` on unmount: that fires `close`, and under StrictMode's double effect it dismissed itself.
- Panel: titled by the tab it was opened from (`studioTabFor()`), and a tab that owns part of a shared draft starts its trail there, so Navbar no longer reads "Site & Navigation / Brand, menu & footer / Menu labels". The Room page tab hides the `teaser` group (it has the Room entrance tab). At a section's top level, keys ending in `Label` go last under "Small labels". "Undo" is "Discard". Title is the body font.
- Preview: the element whose field is open keeps a solid outline (`data-studio-selected`, set on click; cleared when the panel is moved from the panel side, where the element is not known).
- Also: toasts sit bottom-centre with an icon close and errors are `role="alert"`; the loading placeholder is preview-plus-panel shaped; "Recent changes" folds back-to-back repeats (`foldRepeats()`, tested); failing checks list first; the login page uses the Studio palette; small grey text is larger and lighter (`--st-muted` `#98989d`).
- Not done: at the root of the settings draft ("Look and domain") the panel still lists the SEO and site groups that have their own entries.
- Checks: eslint, typecheck, tests 57/57 (3 new), `prisma validate` and `next build` pass; prettier clean on the changed files.
- Verified signed in on the dev server at 1366x768: one-row top bar, tab dots, Work at 77% full width and Hero whole at 78%, the outline, Discard, the unsaved prompt (focus inside, Escape stays), the Publish and Revert dialogs (cancelled, nothing published or reverted), Navbar and Room page panels, the Studio page with no scroll; login and Studio page at 375px. Not exercised: a real publish, revert or delete, and the phone preview after these changes.

## 2026-10-05 — Phone layout for the home page

- Status: the home page now has a real phone layout, built from wireframes the owner approved section by section. Nothing is committed (branch `chore/production-readiness`, alongside the uncommitted Studio work). The Drawing Room page was unchanged at the time (it got its own phone layout on 2026-10-22, below).
- How a phone gets it: `src/app/(public)/page.tsx` exports its own `viewport` (`width=device-width`), overriding the layout's pinned 1280. The layout's scale script reads that tag and leaves a window of 640px or less unzoomed on such a page (`siteScale()` in `src/lib/site-scale.ts`, inlined into the script from its own source and tested). 641-1279px still zooms the desktop layout. The script also watches `<head>`, since moving between `/` and `/room` swaps the viewport tag without a resize.
- Styles: everything is in the new `src/styles/mobile.css` under `@media (max-width: 640px)`, imported after `base.css`. The hero's old touch-portrait block (2.2x zoom) is gone from `base.css`; the mood-player and footer touch rules stay for `/room` and are overridden for the phone layout.
- Order on a phone (CSS `order` on `.landing`, markup unchanged): hero, work, impact, companies, praise, about, experience, Drawing Room, contact. The section strips drop their number and playhead there, since both follow the desktop order. `NavReel` now sorts its chapters by where they sit on screen and jumps by the strip's markup slot.
- Sections:
  - Navbar: logo, "Get in touch", and a labelled Menu button that opens a full-screen native `<dialog>` (Work, Drawing Room, Resume when there is a PDF, the status line, Get in touch). Past the hero the island shows the logo, the rolling "now showing" credits and Menu.
  - Hero: the video fills the screen; small headline low on the left, one button, a pause button (WCAG 2.2.2), thin corner marks. The HUD, eyebrow, sub-headline, second button and info row are hidden on phones. New optional field `bgVideoMobile` (a vertical cut, with its own poster); without it phones play the landscape video cropped. The poster is a `<picture>` so a phone only fetches its own still.
  - Work: the lead project large, then one sideways shelf per category, two whole cards at a time with arrows. The filter panel, canvas and rail are hidden on phones but stay in the markup (marked `ponytail:` in `WorkConsole.tsx`).
  - Impact: no box; four plain numbers, then collaborators four whole tiles to a page (two rows, saved order kept by `grid-auto-flow: column dense`), with arrows and page dots. A tap opens the same photo viewer as desktop. The company logos stay a marquee at the owner's direction.
  - Praise: one whole clapper card at a time with dots; moves on every 6s and holds while touched or focused; no auto-advance under reduced motion. The slate line and "Dir." are hidden and the quote is cut to five lines.
  - About: photo, title, the first three lines and "Read more", which unfolds the rest, the status and the tools.
  - Experience: a timeline (company, dates, two lines of the description); a tap opens a bottom-sheet `<dialog>` with the scene photo, role, dates, full description and previous/next. The reel is hidden on phones and holds still while the sheet is open.
  - Drawing Room teaser: photo on top, then the copy and a full-width button.
  - Contact: the tabbed card is replaced by one row per channel (WhatsApp, Email with Copy, callback, Call when a phone number is set, LinkedIn) under the status line.
  - Footer: one column, no craft list, and a "Back to top" link.
- Shared: `useScrollPager` + `pagerState()` (`src/lib/scroll-pager.ts`, tested) drive every sideways pager; `ScrollPager.tsx` draws the arrows and dots.
- Studio: the Hero panel has a "Phone video (optional)" upload. The phone preview frame is now a real 390x780 viewport for home-page sections, so the phone layout shows in it; the Room page keeps the scaled artboard frame (`PreviewFrame`'s `artboard` prop).
- Known limits: in the Studio's phone preview, things decided in script by `matchMedia` read the Studio window, not the frame, so the hero plays the landscape video there (its still is right) and praise does not auto-advance. The Navbar tab's "/room" bar is drawn with phone rules in the phone preview, though a real phone shows that page as the artboard. Short-form shelves use the same 16:9 cards as the rest; there is no per-category vertical thumbnail.
- Research behind the layout: `reports/Mobile portfolio design patterns.md`.
- Checks: eslint clean on `src`/`tests`, typecheck clean, tests 65/65 (8 new in `tests/mobile-layout.test.ts`), prettier clean on the changed files. `next build` not run: the owner's dev server is running on the same tree and the build's clean step deletes `.next` under it. `scripts/browser-smoke.mjs` now skips hidden openers (each layout keeps the other's cards in the markup); not re-run for the same reason.
- Verified on the dev server at 375x812 with touch emulation: no sideways scroll, section order, the menu (opens, focus on Close, Escape closes, page scroll locked), Read more, collaborator pages and viewer, work shelves and video pop-up, the experience sheet and its previous/next, contact rows, footer. At 1280 the desktop order and layout are unchanged and every phone-only piece is hidden; at 800 the page still zooms; `/room` on a phone still reports a 1280 viewport. Not verified: a real phone (autoplay in iOS Low Power Mode, `svh` against Safari's toolbar), the vertical video (none uploaded), and the Studio screens (not signed in).

## 2026-10-05 — Room entrance photo on phones

- Status: built, not committed. On a phone the Drawing Room teaser's photo was cropped to a 4:3 box; the frame now takes the photo's own shape, so the whole picture shows whatever its proportions (`src/styles/mobile.css`; the two `!important`s there override the position and height next/image writes inline on a `fill` image). Desktop keeps its 3:4 card.
- New optional field `room.teaser.imageMobile` ("Phone photo (optional)" on the Studio's Room entrance tab, same upload endpoint as the invitation photo). With one set, phones show it and wider screens keep the invitation photo; both are lazy `<img>`s switched by CSS, so each screen fetches only its own. Stored content without the field parses to `null` (tested).
- The hero's phone video needed nothing new: it is the Hero panel's "Phone video (optional)" (`bgVideoMobile`), added with the phone layout.
- Checks: eslint, typecheck and tests (38/38, 1 new) pass; prettier clean on the changed files. `next build` not run: the owner's dev server is running on the same tree.
- Verified on that dev server: at 375x812 the teaser photo shows whole (3:4 photo in a 3:4 frame, no sideways scroll); at desktop width the card is unchanged. Not verified: the new upload in the Studio (not signed in) and the swap with a real phone photo (none uploaded).

## 2026-10-22 — Drawing Room phone layout: the sketchbook

- Status: built from the owner's chosen wireframe ("G, sketchbook", picked over a phone-sized pinboard, a stack, a card deck, a contact sheet, a clothesline and desk drawers). Uncommitted on `chore/production-readiness`.
- How a phone gets it: `src/app/(public)/room/page.tsx` now exports a `device-width` viewport like the home page, so the layout's scale script leaves 640px and below unzoomed. 641px and up is unchanged (the draggable board, zoomed below 1280).
- Markup: `Sketchbook` in `MoodBoard.tsx` renders the same cards as spiral-notebook pages, with the same card faces (`cardContent`) and the same `MediaViewer` on tap. It is hidden at every width and switched on in `mobile.css`, which hides the board (`.room-board`) and Shuffle/Reset there. Pages turn by swiping (CSS scroll snap) or the arrows, with page dots and a "p. 1 / 6" folio.
- Pages: `sketchbookPages()` (`src/lib/sketchbook-pages.ts`, tested) keeps board order and puts at most two picture cards (photo, reel, Instagram) and three cards on a page, so a page fits a phone screen whole. Pages share the tallest page's height, so a card is never cut off. The live board (mostly reels) makes 6 pages.
- Heading: the schema default for the room `title` is now "Mood board". The live heading comes from the database, so it still says "The Drawing Room" until it is changed in the Studio (Drawing Room → title) and published. The intro still says "Grab anything and move it around", which doesn't match the phone, where nothing drags.
- Checks: `pnpm check` passed (lint, typecheck, tests, prisma validate, build). Verified on the dev server at 375x812 and 513 wide: pages turn, arrows disable at the ends, a reel opens the viewer, no sideways scroll. At 1280 the board, Shuffle and Reset show and the sketchbook is hidden. Not verified: a real phone, and the Studio's phone preview of the Room (it still uses the artboard frame, `PreviewFrame`'s `artboard` prop).

## 2026-11-04 — Studio sign-in hardening (from the security audit)

- Status: built, not committed, on `chore/production-readiness`. Fixes four leads from the source-only security audit (run-2 reports in `~/security-audit-skill/MadhuPortfolio/run-2/`). Nothing there was confirmed, because no sandbox could run code; these are fixes for leads that hold up in source.
- Throttle (`src/lib/login-throttle.ts`): every attempt is now counted _before_ the password check, with one `INSERT … ON CONFLICT … WHERE lockedUntil <= now RETURNING` per key that checks, increments and sets the lock together. Parallel attempts can no longer all pass the check before any is counted. Same schedule: locks at the 5th attempt, 1 min doubling to 1 h. A key idle for a day resets to zero.
- Owner lockout: an email lock no longer blocks an address the owner has signed in from before (`trusted:<email>|<ip>` rows in `LoginAttempt`, written on success). The IP lock still applies to those addresses. The `ip:unknown` bucket is never trusted.
- Sessions: the JWT carries `passwordStamp` (SHA-256 of the stored hash, cut to 22 characters; the token is encrypted). The `jwt` callback in `src/auth.ts` drops any token whose stamp no longer matches, so a password change revokes every session. Tokens from before this change have no stamp and are signed out once. Middleware still checks only the signature, so the Studio layout now uses `getOwner()` and redirects to `/login` instead of throwing.
- `changePassword` uses the same throttle and counters, signs out after success, and the form then goes to `/login`.
- Not fixed: logout still only clears this browser's cookie (no log-out-everywhere). `LoginAttempt` rows are still never pruned. Each `requireOwner` now does two small owner reads (`jwt` callback + `getOwner`).
- Checks: eslint clean, typecheck clean, tests 47/47 (4 new: `tests/login-throttle.test.ts`, stamp test in `tests/password.test.ts`), prisma validate, `prisma generate && next build` pass. `pnpm` is not on this shell's PATH, so the `pnpm check` steps were run one by one from `node_modules/.bin`. Not run: the new SQL against a real Postgres (no local DB running), and sign-in / change-password in a browser.

## 2026-11-04 — Security audit follow-up: remaining leads and hardening

- Status: built, not committed, on `chore/production-readiness` (together with the sign-in phase above).
- Remaining leads fixed: the thumbnail routes on Vercel now serve only the signed-in owner (no rate limiter there; `withinRateLimit` in `src/lib/thumb-proxy.ts`). `LoginAttempt` rows are pruned on every attempt (idle counters after a day, trusted addresses after 90 days), and emails over 254 characters never reach the DB. The media zone `/cdn-cgi` quota lead needs a WAF rule, now written out in DEPLOYMENT.md under "Security settings outside the repository".
- Media purge bug: usage now matches any `<letters>/<uuid>` key, so files under retired slot names (e.g. `boothImage`) are no longer swept while still in use.
- Hardening: a dummy PBKDF2 run for unknown emails (timing no longer reveals the owner email); password bounds 8-256 in `src/lib/credential-limits.ts`, shared by sign-in, change-password and `create-admin`; each Studio page checks the owner itself (`requireOwnerOrSignIn`, cached per request); publish and revert take the shared media-reference lock; `discard` never deletes an object a row records; signed upload URLs include the Content-Type; ISO-BMFF box size must fit the file (stops `<!--free` passing as MOV); thumb proxies pass only raster types, refuse non-default ports, use bounded regexes and read the Instagram `src` attribute-aware; YouTube ids must be 11 characters; hidden praise quotes are not sent to the page; `/api/health` shows per-check detail only with the revalidate bearer and caches results for 10 s; no `Bearer undefined` calls; production builds require `REVALIDATE_SECRET` ≥ 32 characters and an https `NEXT_PUBLIC_MEDIA_URL`; HSTS (no includeSubDomains); `connect-src` narrowed to the account's R2 endpoint when `R2_ACCOUNT_ID` is set at build; `images.maximumRedirects: 0`; `workers_dev`/`preview_urls` false; dev Postgres bound to 127.0.0.1; key/credential patterns in `.gitignore`; stale `next@16.2.12` release-age exclusions removed; `rewrite-media-urls` only rewrites this site's own host.
- Deliberately not changed: `madhu.edit` stays in `media-hosts.json`. The live DB's `settings.seo.ogImage.url` (draft and published) points at `https://madhu.edit/...`, a host that does not resolve; removing the host made the build fail on that row and would have broken the live site. Replace the share image in the Studio, publish, then remove the host. Also not changed: CSP `'unsafe-inline'` (moving to nonces is a larger refactor of every inline script), defaulting `sslmode` in `db.ts` (could break the Hyperdrive connection), re-validating drafts on publish (the public read path already `safeParse`s; a later-tightened schema would block every publish), the OpenNext memory-queue binding and regional-cache lazy update (performance, not security), and canonical thumb cache keys.
- Checks: eslint, typecheck, tests 52/52 (new: `tests/file-signature.test.ts`, `tests/youtube.test.ts`), prisma validate, `prisma generate && next build` pass. Read-only checks against the live DB: all 45 stored YouTube links still parse. Not verified live: a signed-Content-Type upload to R2, sign-in/change-password in a browser, the new throttle SQL against Postgres, the Worker deploy with workers.dev off.

## 2026-11-05 — Security audit follow-up, part 2 (owner chose "all")

- Status: built, not committed. Supersedes the "deliberately not changed" notes above for `madhu.edit` and the CSP.
- Live DB change (approved by the owner): `settings.seo.ogImage` was `{"url":"https://madhu.edit/placeholders/photo.svg"}` in both DRAFT and PUBLISHED, a seed placeholder that never loaded. Both were set to `null`, an Activity row was logged, and the Worker cache was cleared (`/api/revalidate` 200). To undo, put that object back. The Studio's publish checklist now shows "No share image for link previews" until a real one is uploaded. `madhu.edit` is out of `media-hosts.json`; no stored section references it.
- Before deploying this code: click Publish once in the Studio. Vercel's data cache may still hold the old settings row, and the build's sitemap prerender fails on it (as the local build did until `.next/cache/fetch-cache` was cleared).
- Studio CSP: on Vercel, `src/middleware.ts` sends a per-request nonce policy built by `src/lib/studio-csp.ts` (`'nonce-…' 'strict-dynamic'`, no `'unsafe-inline'` scripts, `object-src 'none'`). `next.config.mjs` sends the public `'unsafe-inline'` policy only off Vercel: public pages are cached ahead of time and cannot carry a nonce. `/login` now renders per request (`connection()`). Checked with `VERCEL=1 next dev`: all 9 inline scripts on /login carry the nonce, the form hydrates and takes input, no console errors, and `/` redirects to sign-in. Not checked: signed-in Studio pages under the new policy.
- Leftovers: the Worker build stops without `STUDIO_URL` (detected through OpenNext's `NEXT_PRIVATE_STANDALONE`); `WORKER_SELF_REFERENCE` service binding added for memoryQueue; regional cache `shouldLazilyUpdateOnCacheHit: false`; thumbnail URLs are canonical (one per post).
- Checks: tsc, eslint, tests 56/56 (new: middleware CSP tests, `tests/thumb-links.test.ts`), prettier, prisma validate, `next build` pass.

## 2026-11-06 — Studio logout ends the session server-side

- Status: built, not committed, on `chore/production-readiness`. Closes the last half of the audit lead "sessions survive password change and logout": a cookie copied before logout used to keep working for 30 days.
- How: each sign-in writes a row to the existing `Session` table (no migration; it was in the init migration but unused) and the JWT carries its `sessionToken`. The `jwt` callback in `src/auth.ts` honours a token only while `isLiveSession` (`src/lib/studio-sessions.ts`) holds: row exists, not expired, user still OWNER with the same email. `events.signOut` deletes the row; `changePassword` and `scripts/create-admin.ts` delete every row for the owner. Expired rows are deleted at each sign-in. This replaces `passwordStamp`, which is gone from `src/lib/password.ts`.
- Lifetime: `session.maxAge` is now 7 days (was the Auth.js default of 30), and the row's expiry is fixed at sign-in, so the Studio asks for a sign-in at least weekly.
- First deploy signs out every existing session (old tokens have no `sessionToken`).
- Checks: tsc, eslint, prettier, prisma validate, tests 59/59 (new `tests/studio-sessions.test.ts`; the stamp test was removed). `prisma generate && next build` pass. Not run: sign-in / logout / cookie replay in a browser against a real database.

## 2026-11-10 — Sign-in can no longer outlive a password change (audit run 3, lead 1)

- Status: built, not committed, on `chore/production-readiness`. Fixes the race audit run 3 found: a sign-in that verified the old password before `changePassword` committed could still create a `Session` row afterwards, and a rehash write in the same sign-in could put the old password back.
- `authorize` (`src/auth.ts`) now returns `verifiedPasswordHash` (the hash it checked, or the upgraded one it just wrote) on the `User` object, for the jwt callback only; it is never put in the token. The rehash is an `updateMany` conditioned on the stored hash still being the one verified.
- `startSession` (`src/auth.ts`) creates the `Session` row inside one transaction that first runs `SELECT … FROM "User" WHERE id AND password = verifiedHash FOR SHARE`. If the password changed, no row matches and the sign-in returns null. `FOR SHARE` waits for a change that is mid-commit and then sees its new hash, so there is no gap between the check and the insert.
- Checks: eslint, tsc, prettier, prisma validate, tests 59/59, `next build` pass. The `FOR SHARE` statement was planned (`EXPLAIN`, rolled back) against the Neon database. No automated test: the race needs a real Postgres with two connections. Not run: the concurrent sign-in plus password change itself.

## 2026-11-24 — Handover preparation

- Status: on `chore/handover-prep`. Repo made safe to hand over as-is.
- `.gitignore` had hidden `*.md`, `tests/` and `scripts/browser-smoke.mjs`, so the docs and tests were never in the repo. Removed those lines; `reports/`, `research_notes/` and `.agents/` stay local and ignored (`.agents/` untracked with `git rm --cached`, files kept). Prettier honours `.gitignore`, so the newly visible docs and tests were formatted once.
- `scripts/browser-smoke.mjs` had been deleted by accident in `495b146`; restored from the last committed version, dropped the removed `/resume` page and re-applied the "skip hidden openers" fix. Passes against `https://nmadhukumar.com`.
- Added `README.md`, `src/app/global-error.tsx` and `.github/workflows/ci.yml` (`pnpm check` and `pnpm cf:build` on Linux against a throwaway Postgres; the build needs a reachable database, which corrects the old DEPLOYMENT.md claim).
- Dependency upgrades committed after `pnpm check` passed. `effect` pinned to `>=3.22.1 <4` in `pnpm-workspace.yaml` (GHSA-7589-6fvf-x4pw); `>=3.22.1` alone resolved to 4.x and broke `prisma generate`.
- Git history scan: only `.env.example` was ever committed.
- Not done: Worker build locally (Windows; WSL has no Node), live upload test, real-phone check.
