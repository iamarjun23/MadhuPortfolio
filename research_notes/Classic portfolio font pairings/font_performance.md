# Web performance and technical implications of font choices (Next.js 16 + next/font/google, Cloudflare Workers via OpenNext)

Context verified locally (2026-09-27): the repo runs `next@16.3.6`. `src/app/layout.tsx` loads four families from `next/font/google` in the **root layout**: Space Grotesk (`--f-display`), DM Sans (`--f-body`), JetBrains Mono (`--f-mono`), and Instrument Serif (`--f-serif`, weight 400, styles normal + italic). All use `subsets: ["latin"]` and otherwise default options. The official Next.js docs bundled with the installed package are at `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md` (mirrors https://nextjs.org/docs/app/api-reference/components/font). Items marked "local code" come from reading the installed `next` package source, which is the primary source for how this exact version behaves.

## Q1. Payload per Google font family/weight, variable vs static, and savings from going from 4 families to 2–3

### Takeaway
Measured latin-subset WOFF2 files: the current 4-family setup costs about **143 KB** of font bytes, all preloaded on every route. Instrument Serif (about 43 KB for two files) is loaded and preloaded but `--f-serif` is referenced nowhere in `src/`, so it is pure waste today. Two families with variable weights come to about 59 KB (−58%). Three families with the mono cut to one static weight come to about 80 KB (−44%). A variable file costs roughly 1.6–2.6× one static weight, so it only pays off when 2–3 or more weights of that family are actually used.

### Cited Findings
- HTTP Archive Web Almanac 2025 fonts chapter: the median (p50) font file is "around 35 to 36 kilobytes". 39.4% of desktop and 41.3% of mobile sites use at least one variable font, up about 6–7 points year over year. Google Fonts appears on about 54% of desktop and 47% of mobile sites. About 72% of sites self-host at least one font file — [Web Almanac 2025: Fonts](https://almanac.httparchive.org/en/2025/fonts)
- Web Almanac 2024: median WOFF2 file is 39 KB desktop / 37 KB mobile. Google-served WOFF2 median is 16 KB vs 39 KB self-hosted, which reflects Google's aggressive per-script subsetting. WOFF2 is used on 81% desktop / 78% mobile — [Web Almanac 2024: Fonts](https://almanac.httparchive.org/en/2024/fonts)
- web.dev: "Use only WOFF2". WOFF2 compresses about 30% better than WOFF (Brotli). Keep the number of web fonts low, and consider variable fonts when multiple weights/styles are needed — [web.dev: Best practices for fonts](https://web.dev/articles/font-best-practices)
- Next.js docs: "We recommend using variable fonts for the best performance and flexibility". For variable fonts, "By default, only the font weight is included to keep the file size down", and extra axes (e.g. `opsz`) must be opted into via `axes` — [Next.js Font API reference](https://nextjs.org/docs/app/api-reference/components/font)
- **First-hand measurement** (2026-09-27, `curl` against the Google Fonts CSS2 API with a desktop Chrome UA, **latin subset only**, WOFF2 bytes) — [Google Fonts CSS2 API](https://fonts.googleapis.com/css2):

  | File | Bytes |
  |---|---|
  | Space Grotesk variable, wght 300–700 | 22,288 |
  | Space Grotesk static 500 | 13,312 |
  | DM Sans variable, wght 100–1000 (next/font default: wght axis only) | 36,932 |
  | DM Sans variable, opsz + wght (if `axes: ['opsz']` were added) | 62,724 |
  | DM Sans variable italic, wght | 39,712 |
  | DM Sans static 400 | 14,200 |
  | JetBrains Mono variable, wght 100–800 | 40,404 |
  | JetBrains Mono static 400 | 21,168 |
  | Instrument Serif 400 normal (static only; no other weights exist) | 21,032 |
  | Instrument Serif 400 italic | 22,128 |

- Family metadata from next/font's bundled `font-data.json` (local code, `node_modules/next/dist/compiled/@next/font/dist/google/font-data.json`): Space Grotesk is variable wght 300–700, **normal style only** (no italic). DM Sans is variable wght 100–1000 plus an opsz axis, normal + italic. JetBrains Mono is variable wght 100–800, normal + italic. **Instrument Serif has weight 400 only**, normal + italic, and is not variable. Geist, Geist Mono, Inter, Newsreader and Fraunces are variable. IBM Plex Mono is static-only (100–700) — [next/font source bundled with next@16.3.6](https://github.com/vercel/next.js/tree/canary/packages/font)
- Local repo check: `grep` finds `--f-serif` only in `layout.tsx`, the declaration itself. No CSS or TSX in `src/` uses it. The only serif usage in `base.css` is a hard-coded `Georgia, "Times New Roman", serif` stack at line ~2256 (local code, `src/styles/base.css`).

### Inferences
- Current payload, as configured: 22,288 + 36,932 + 40,404 + 21,032 + 22,128 = **142,784 bytes (~143 KB)** across 5 files. That is roughly 4× the Almanac median per-file size, and all five are preloaded on every route (see Q2).
- Scenario math, latin only, from the table above:
  - Drop Instrument Serif only (it is unused anyway): ~99.6 KB, **−30%**, 3 files.
  - 3 families with JetBrains Mono cut to a single static 400: 22.3 + 36.9 + 21.2 = ~80.4 KB, **−44%**.
  - 2 families (display sans + body sans variable): ~59.2 KB, **−58%**, 2 files.
  - 2 families (DM Sans variable + JetBrains Mono static 400): ~58.1 KB.
  - If a serif such as Instrument Serif is kept as a display face, it costs about 21 KB per style. Keeping both normal and italic doubles that, so load italic only if the design uses it.
- Variable vs static rule of thumb from these numbers: a variable file is about 1.7× (Space Grotesk), 2.6× (DM Sans) or 1.9× (JetBrains Mono) one static weight. Two static weights of DM Sans (~28 KB) beat the variable file (~37 KB). Three or more used weights favour variable. The CSS currently asks for weights 400, 500, 600, 620, 650, 700, 750 and 800 (grep of `src/styles/*.css`), so variable is justified for whichever family carries those weights. A single-weight mono (labels, code) is a good candidate for a static cut.
- Dropping a family also removes one HTTP request and one preload. On HTTP/2 or HTTP/3 the request cost is small, but each preload competes for early bandwidth with the CSS and LCP image.

### Gaps
- My measurements used a Windows Chrome UA. next/font fetches with a macOS Chrome UA (local code: `fetch-resource.js`). The WOFF2 served should be the same or nearly so, but I did not verify the exact bytes next/font emits. To verify, run `pnpm build`, then `ls -l .next/static/media/*.woff2`.
- The Web Almanac 2025 excerpt I retrieved did not give a median number of font files or families per page, so I cannot place "4 families" against a population median.
- The payload of candidate replacement families (e.g., a classic serif such as Newsreader or Fraunces) was not measured. It can be measured with the same method.

## Q2. How next/font/google works and which options matter (subsets, weight, style, preload, adjustFontFallback, display)

### Takeaway
next/font/google downloads the CSS and WOFF2 at **build time** and self-hosts them under `/_next/static/media`, so the browser never contacts Google. Defaults are `display: 'swap'`, `preload: true` and `adjustFontFallback: true`. The last one generates a `"<Family> Fallback"` `@font-face` over a local Arial or Times New Roman with `size-adjust` and ascent/descent/line-gap overrides to minimise CLS. Preload applies only to the listed `subsets`, and a font called in the root layout is preloaded on **every route**.

### Cited Findings
- "CSS and font files are downloaded at build time and self-hosted with the rest of your static assets. **No requests are sent to Google by the browser.**" Also: "you can optimally load web fonts with no layout shift." — [Next.js Font API reference](https://nextjs.org/docs/app/api-reference/components/font); identical text in installed docs `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md`
- Option semantics from the official docs, same source:
  - `weight`: required only for non-variable fonts. For variable fonts it defaults to `'variable'` and accepts a range string such as `'100 900'`.
  - `style`: `'normal'` (default) or `'italic'`, or an array for google fonts.
  - `subsets`: the subsets get "a link preload tag injected into the head when the preload option is true, which is the default".
  - `axes`: extra variable axes. Only wght is included by default.
  - `display`: `'auto' | 'block' | 'swap' | 'fallback' | 'optional'`, default `'swap'`.
  - `preload`: boolean, default `true`.
  - `fallback`: array of fallback families, no default.
  - `adjustFontFallback`: for google, a boolean with default `true` that "sets whether an automatic fallback font should be used to reduce Cumulative Layout Shift".
  - `variable`: the CSS custom property name.
- Preload scope: "If it's a unique page, it is preloaded on the unique route for that page. If it's a layout, it is preloaded on all the routes wrapped by the layout. If it's the root layout, it is preloaded on all routes." — [Next.js Font API reference, Preloading](https://nextjs.org/docs/app/api-reference/components/font)
- Local code, `validate-google-font-function-call.js`: defaults are literally `preload = true, display = 'swap', adjustFontFallback = true`. It throws "Preload is enabled but no subsets were specified" if `subsets` is missing while preload is on, and rejects unknown subsets — [next.js repo, packages/font](https://github.com/vercel/next.js/tree/canary/packages/font)
- Local code, `loader.js`: `findFontFilesInCss(fontFaceDeclarations, preload ? subsets : undefined)` downloads every file referenced in the Google CSS and marks only the requested-subset files for preload. Other subsets (e.g., latin-ext) are still self-hosted behind `unicode-range`, so the browser fetches them only if such characters appear on the page — [next.js repo, packages/font](https://github.com/vercel/next.js/tree/canary/packages/font)
- Local code, `server/font-utils.js` `calculateSizeAdjustValues`: fallback metrics come from a precalculated capsize metrics table. The fallback face is **Times New Roman if the family's category is `serif`, otherwise Arial**, and that includes `monospace`. Instrument Serif is category `serif`, so its fallback is Times New Roman. JetBrains Mono is category `monospace`, so its fallback is Arial. `size-adjust` = the font's average character width divided by the fallback's, and ascent/descent/line-gap overrides are scaled by that factor — [next.js repo, font-utils](https://github.com/vercel/next.js/blob/canary/packages/next/src/server/font-utils.ts)
- Local code, `loader.js`: if the Google download fails, **dev** logs an error and falls back to the adjusted local font. Outside dev the error is rethrown, so the **production build fails** without network access to Google Fonts — [next.js repo, packages/font](https://github.com/vercel/next.js/tree/canary/packages/font)
- `size-adjust`, `ascent-override`, `descent-override` and `line-gap-override` let a fallback font match a web font's box metrics so the swap does not reflow the page. Support: `size-adjust` in Chrome/Edge 92+, Firefox 92+, Safari 17+ — [web.dev: CSS size-adjust for @font-face](https://web.dev/articles/css-size-adjust)
- font-display timelines: `swap` has a 0 ms block period and an infinite swap period. `optional` has a ~100 ms block period and no swap period. `fallback` has a 100 ms block and a ~3 s swap. `block` has a 2–3 s block. "All strategies except optional can trigger CLS when fonts swap." — [web.dev: Best practices for fonts](https://web.dev/articles/font-best-practices)
- LCP: text in its font block period is not an LCP candidate. When the web font renders, "another PerformanceEntry is created". A good LCP is ≤ 2.5 s — [web.dev: Largest Contentful Paint](https://web.dev/articles/lcp)
- "If a web font is required to render text then this will slow down your Largest Contentful Paint score". Remedies are `font-display: swap` and preload — [DebugBear: LCP for text elements](https://www.debugbear.com/docs/largest-contentful-paint-text-h1)
- Preload + `font-display: optional`: rendering waits for the font or a 100 ms timeout, removing the second render and layout shift. The tradeoff is that the custom font may not show on first view — [web.dev: Prevent layout shifting and flashes of invisible text by preloading optional fonts](https://web.dev/articles/preload-optional-fonts)
- Adoption context: `font-display: swap` is on ~49.6% of desktop and 50.1% of mobile pages. Font preload is used on only ~12.0% desktop / 11.7% mobile — [Web Almanac 2025: Fonts](https://almanac.httparchive.org/en/2025/fonts)

### Inferences
- With the defaults (swap + adjusted fallback + preload), text paints immediately in a metric-matched Arial or Times, so LCP is not blocked by font download. CLS from the swap is reduced but not guaranteed zero: `size-adjust` matches average width, not every glyph, and weight changes alter widths. That residual risk is larger for display headings set at weights 650–800, since the fallback is Arial Regular/Bold with synthesized weights.
- **Monospace caveat:** because next/font adjusts JetBrains Mono against Arial, a proportional font, mono text renders in scaled Arial until the swap. For tabular or aligned mono UI, pass `fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace']`. Note that `adjustFontFallback` still targets Arial, so either accept that or set `adjustFontFallback: false` for the mono face and rely on the monospace system stack, which is metrically closer by nature. This is my inference from the code path, not a documented recommendation.
- `display: 'optional'` + preload is the zero-CLS option for a single above-the-fold display face. The cost is that slow first visits see the fallback for the whole page view. For a portfolio whose brand identity rests on the display face, `swap` with an adjusted fallback is the usual choice. `optional` is reasonable for body text if the brand can tolerate it.
- Minimal-change config consistent with these docs: keep `subsets: ['latin']`, keep default `display: 'swap'` and `adjustFontFallback: true`, specify only the `weight`/`style` actually used for static fonts, avoid extra `axes`, and set `preload: false` on anything not needed for the first viewport (see Q3).

### Gaps
- I did not find an official Next.js statement quantifying the residual CLS after `adjustFontFallback`. Lab verification is needed (Lighthouse or a DevTools Performance trace on `/` at mobile width).
- The docs do not describe how next/font handles `adjustFontFallback` for monospace fonts. The Arial fallback is inferred from source code only.

## Q3. Best practice for fonts used only below the fold or rarely (preload: false?)

### Takeaway
Preload only the fonts needed to render the first viewport, typically the display face and the body face. Set `preload: false` for fonts used only below the fold, on one route, or rarely. Better still, call the font function in the page or segment layout that uses it, so it is not in the root layout and is not preloaded site-wide. A font that is not used should not be loaded at all, which applies to Instrument Serif today.

### Cited Findings
- Preload is scoped by where the font function is called: page → that route only, layout → wrapped routes, root layout → all routes — [Next.js Font API reference, Preloading](https://nextjs.org/docs/app/api-reference/components/font)
- `preload: false` is a documented option. Preload link tags are injected only for `subsets` when `preload` is true — [Next.js Font API reference](https://nextjs.org/docs/app/api-reference/components/font)
- web.dev frames preload as appropriate for resources with a high probability of being needed, and warns that preload "bypasses some of the browser's built-in content negotiation strategies" and should be "used carefully" — [web.dev: Optimize WebFont loading and rendering](https://web.dev/articles/optimize-webfont-loading); [web.dev: Best practices for fonts](https://web.dev/articles/font-best-practices)
- Fonts are static and rarely updated, so they should get a long-lived `max-age` — [web.dev: Optimize WebFont loading and rendering](https://web.dev/articles/optimize-webfont-loading)

### Inferences
- Without preload, a browser only requests a font file when rendered text actually matches that `@font-face`. So `preload: false` turns a font into "download only if used on this page", and the `@font-face` and fallback CSS are still emitted. This is standard browser font-loading behavior. I did not retrieve a primary spec citation for it.
- Applied to this repo:
  1. Remove Instrument Serif, or wire it up. Right now it preloads 2 files (~43 KB) on every route for zero rendered text. Chrome typically logs a "preloaded but not used" console warning in this situation, which I have not verified on this site.
  2. JetBrains Mono is used widely in `base.css` (~30 rules), including likely above-the-fold labels. Keep it, but consider a single static weight. If it only appears below the fold on `/`, set `preload: false`.
  3. Fonts specific to `/room` (Drawing Room) or `/studio` should be declared in that route's `layout.tsx`/`page.tsx`, not the root layout, so the public home page does not preload them.
- A target of at most 2 preloaded files for the first viewport (display + body) is a common practitioner heuristic, not a documented rule.

### Gaps
- I found no official numeric guidance, from Google or Next.js, on the maximum number of preloaded fonts.
- I did not audit which mono or display elements sit above the fold at mobile and desktop widths. That needs a rendered check of `/`.

## Q4. Faux bold / faux italic when CSS requests a weight or style the font does not ship, and how to prevent it

### Takeaway
If CSS asks for a weight or style the loaded family lacks, for example `font-weight: 700` on Instrument Serif (400 only) or `font-style: italic` on Space Grotesk (no italic), the browser **synthesizes** it by default: it thickens or smears glyphs for bold and slants them for italic. Prevent it by loading only faces you actually style, setting weights within the font's range, and adding `font-synthesis: none` (or `font-synthesis-weight: none`) on elements using single-weight faces. `font-synthesis` has been Baseline widely available since January 2022.

### Cited Findings
- `font-synthesis` controls whether the browser may synthesize bold, italic, small-caps and sub/superscript faces when missing. The **default is `weight style small-caps position`**, meaning all synthesis is on. Values include `none`, `weight` and `style`, with longhands `font-synthesis-weight`, `font-synthesis-style`, `font-synthesis-small-caps` and `font-synthesis-position`. It is inherited and Baseline widely available since Jan 2022 — [MDN: font-synthesis](https://developer.mozilla.org/en-US/docs/Web/CSS/font-synthesis)
- Browsers fake bold by smearing glyphs and fake italic by slanting them. Firefox smears heavily and Chrome changes little, so faux bold can be almost indistinguishable from regular in Chrome. The fix is to include the real faces, or map extra `font-weight` values to the single face with extra `@font-face` rules — [A List Apart: Say No to Faux Bold](https://alistapart.com/article/say-no-to-faux-bold/)
- Practitioner references on disabling faux weights via `font-synthesis` — [Anders Norén: How to disable faux weights](https://andersnoren.se/how-to-disable-faux-weights-with-css/); [CSS-Tricks: font-synthesis](https://css-tricks.com/almanac/properties/f/font-synthesis/)
- Instrument Serif ships only weight 400 (normal + italic). Space Grotesk ships only normal style, weights 300–700 — next/font `font-data.json` (local code), [Google Fonts: Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif)

### Inferences
- Concrete risks in this repo's CSS, which uses weights up to 800:
  - Any heading in a 400-only serif (e.g., Instrument Serif) with `font-weight` ≥ 600 gets faux bold.
  - `<em>`/`<i>` inside Space Grotesk text gets faux oblique because the family has no italic.
  - Weights 750/800 on Space Grotesk (max 700) cannot go beyond 700. Whether the browser also synthesizes extra boldness there depends on the engine's matching rules, which I did not verify.
- Recommended CSS pattern (no dependency):
  - Put `font-synthesis: none;` on the rule that applies a single-weight display serif, or globally on `:root` if every used weight and style is actually loaded.
  - Set explicit `font-weight: 400` on those elements.
  - Load `style: ['normal', 'italic']` only for families where italic is designed in.
  - Global `font-synthesis: none` also stops synthesis for the **fallback** font during the swap period. That is harmless but visually slightly different.
- In next/font, requesting an unsupported weight (e.g., `weight: '700'` for Instrument Serif) is rejected at build time by the validator, which lists the available weights. The build therefore guards the loader side, and the CSS side is what needs `font-synthesis`. This comes from the validator behavior seen for subsets and weights, but I did not test it specifically for weights.

### Gaps
- I did not retrieve authoritative per-engine documentation of the exact weight threshold at which Chrome, Firefox or Safari apply synthetic bold, for example whether requesting 800 from a variable face capped at 700 triggers synthesis.

## Q5. Considerations for Cloudflare Workers via OpenNext (fonts self-hosted as static assets)

### Takeaway
next/font output lives in `/_next/static/media/*.woff2` with content-hashed names. On OpenNext Cloudflare these are served by **Workers Static Assets**, so the Worker does not run and there is no CPU cost or 1102 risk. By default, however, Cloudflare serves static assets with `max-age=0, must-revalidate`. The OpenNext docs recommend a `public/_headers` rule giving `/_next/static/*` `Cache-Control: public,max-age=31536000,immutable`, and this repo currently has no `public/_headers`. The build also needs network access to Google Fonts.

### Cited Findings
- "The worker doesn't run in front of static assets, so the `headers` option of `next.config.ts` doesn't apply to public files (`public`) and immutable build files (like `_next/static`)." Default static-asset caching is "max-age=0 with must-revalidate". To match Next.js immutable caching, add to `public/_headers`: `/_next/static/* Cache-Control: public,max-age=31536000,immutable` — [OpenNext Cloudflare: Caching](https://opennext.js.org/cloudflare/caching)
- next/font self-hosts Google fonts "with the rest of your static assets", with no browser requests to Google — [Next.js Font API reference](https://nextjs.org/docs/app/api-reference/components/font)
- Fonts should carry a long-lived `max-age` because they are static and rarely change — [web.dev: Optimize WebFont loading and rendering](https://web.dev/articles/optimize-webfont-loading)
- Local repo check: `public/_headers` does not exist (checked 2026-09-27).
- Local code: a production build rethrows Google Fonts download errors — [next.js repo, packages/font](https://github.com/vercel/next.js/tree/canary/packages/font)

### Inferences
- Without the `_headers` rule, repeat visits revalidate each font file with a conditional request (304). The round trips are cheap but not free, and on mobile they add latency before the swap. Adding the single `_headers` line is a no-dependency, no-Worker-CPU fix. It sits within the "keep `(public)` cheap" rule in AGENTS.md. The same applies to JS and CSS chunks under `/_next/static/*`.
- Self-hosting on the same origin avoids the extra DNS/TLS connection that `fonts.gstatic.com` would need, and it avoids any cross-site cache benefit, which browsers have partitioned anyway. Combined with preload, fonts start downloading as soon as the HTML `<head>` is parsed.
- Because fonts are hashed and immutable, changing the font pairing produces new filenames, so there is no stale-cache risk when switching families.
- Build environment: `pnpm cf:build` runs in WSL, macOS, Linux or CI (per AGENTS.md) and needs outbound access to `fonts.googleapis.com` and `fonts.gstatic.com` at build time. A sandboxed or offline CI will fail the build rather than silently falling back.
- The Vercel Studio deployment uses the same root layout, so the same fonts are preloaded there. The Studio is owner-only, so its performance impact is minor.

### Gaps
- I did not verify whether the current Cloudflare deployment already sets cache rules for `/_next/static/*` at the zone level (dashboard Cache Rules), which would make `_headers` redundant. To check, run `curl -sI https://nmadhukumar.com/_next/static/media/<file>.woff2 | grep -i cache-control`.
- I did not measure real-world LCP or CLS for nmadhukumar.com (CrUX or PageSpeed Insights). Before and after numbers would need a PSI run on `/` for mobile and desktop.
