# Google Fonts candidates for a classic, professional portfolio type system

Method note: specs (weights, styles, variable axes, subsets) come straight from the font catalogue that ships inside the installed Next.js (`next@16.3.6`, file `node_modules/next/dist/compiled/@next/font/dist/google/font-data.json`) — this is the exact data `next/font/google` validates against, so it is the authoritative answer for "is it loadable via next/font in this repo". x-height / cap-height ratios come from `node_modules/next/dist/server/capsize-font-metrics.json` (the Capsize metrics Next.js uses to build fallback-font overrides; figures are the default/Regular master). Popularity rank comes from the live Google Fonts metadata endpoint (`https://fonts.google.com/metadata/fonts`, 1,946 families, fetched 2026-09-27; rank 1 = most used). Descriptive/character claims come from web sources cited inline.

Local source shorthands used below:
- [next font-data.json] = `node_modules/next/dist/compiled/@next/font/dist/google/font-data.json` (next 16.3.6)
- [capsize metrics] = `node_modules/next/dist/server/capsize-font-metrics.json` (next 16.3.6)
- [GF metadata] = https://fonts.google.com/metadata/fonts
- [next/font docs] = `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md`

Current site setup (for context): `src/app/layout.tsx` loads `Space_Grotesk` → `--f-display`, `DM_Sans` → `--f-body`, `JetBrains_Mono` → `--f-mono`, and `Instrument_Serif` (weight "400", normal + italic) → `--f-serif`; `src/styles/base.css` references `--f-display` and `--f-mono` many times but no `--f-serif` usage surfaced in the grep, consistent with the brief's "loaded but unused".

## Display serif candidates: specs, character, readability, overuse

### Takeaway
Six of the eleven serifs are variable fonts with a real weight range on Google Fonts (Fraunces, Newsreader, Source Serif 4, EB Garamond, Cormorant/Cormorant Garamond, Playfair Display); three of them (Fraunces, Newsreader, Source Serif 4) also expose an optical-size axis, which is the single most useful feature for a serif that must work both as a big headline and as small text. Instrument Serif, DM Serif Display, Young Serif, Gloock and Libre Caslon Display are single-weight display faces — fine for headlines, useless for a full hierarchy. Playfair Display is the most-used and most-cliched option; Newsreader and Source Serif 4 are the most "classic-professional + readable" picks, Fraunces the most characterful.

### Cited Findings

Spec table (weights/styles/axes from [next font-data.json]; x-height = xHeight/UPM and x/cap = xHeight/capHeight from [capsize metrics]; rank from [GF metadata]):

| Family | Weights on GF | Italic | Variable axes (next/font) | Optical size | x-height/UPM | x/cap | GF popularity rank | Added |
|---|---|---|---|---|---|---|---|---|
| Instrument Serif | 400 only | yes | none (static) | no | 0.510 | 0.708 | 70 | 2023-03 |
| Fraunces | 100–900 | yes | `wght` 100–900, `opsz` 9–144, `SOFT` 0–100, `WONK` 0–1 | yes | 0.482 | 0.689 | 88 | 2020-07 |
| Playfair Display | 400–900 | yes | `wght` 400–900 | no | 0.514 | 0.726 | 22 | 2011-11 |
| Playfair (2.0, separate family) | 300–900 | yes | `wght` 300–900, `opsz` 5–1200, `wdth` 87.5–112.5 | yes | 0.415 | 0.726 | 223 | 2023-04 |
| Cormorant | 300–700 | yes | `wght` 300–700 | no | 0.386 | 0.618 | 175 | 2016-06 |
| Cormorant Garamond | 300–700 | yes | `wght` 300–700 | no | 0.386 | 0.618 | 60 | 2016-06 |
| EB Garamond | 400–800 | yes | `wght` 400–800 | no | 0.400 | 0.615 | 78 | 2011-03 |
| Newsreader | 200–800 | yes | `wght` 200–800, `opsz` 6–72 | yes | 0.426 | 0.636 | 119 | 2020-07 |
| Libre Caslon Display | 400 only | no | none (static) | no | 0.424 | 0.614 | 600 | 2017-11 |
| Libre Caslon Text | 400, 700 | yes | none (static) | no | 0.530 | 0.688 | 268 | 2013-03 |
| Source Serif 4 | 200–900 | yes | `wght` 200–900, `opsz` 8–60 | yes | 0.475 | 0.709 | 123 | 2021-11 |
| DM Serif Display | 400 only | yes | none (static) | no | 0.481 | 0.729 | 107 | 2019-06 |
| Young Serif | 400 only | no | none (static) | no | 0.500 | 0.667 | 654 | 2023-09 |
| Gloock | 400 only | no | none (static) | no | 0.508 | 0.677 | 511 | 2023-01 |
| IBM Plex Serif (superfamily ref.) | 100–700 | yes | none (static on GF) | no | 0.516 | 0.739 | 184 | 2018-03 |

Sources for the table: [next font-data.json], [capsize metrics], [GF metadata]. (Note: x-height figures for opsz fonts are the default master only; Newsreader's x-height grows at display optical sizes — see below.)

Character / intended use:
- Instrument Serif: "a condensed, display serif" by Rodrigo Fuenzalida, "designed for the Instrument brand"; single weight (400 + italic); its condensed display nature implies limits for body text — [Beautiful Web Type](https://www.beautifulwebtype.com/instrument-serif/). Designers Rodrigo Fuenzalida / Jordan Egstad — [GF metadata]. Commonly shown paired with Instrument Sans, Inter and IBM Plex Mono — [MaxiBestOf](https://maxibestof.one/typefaces/instrument-serif); [TypePairs](https://typepairs.com/pairs/instrument-serif-instrument-sans). Typewolf's 2026 Google Fonts list says newer releases like it "haven't had a chance to feature in-use examples" yet — [Typewolf](https://www.typewolf.com/google-fonts).
- Fraunces: a "display, 'Old Style' soft-serif typeface" inspired by early-20th-century faces (Windsor, Souvenir, Cooper); `opsz` 9–144 adjusts contrast, x-height, spacing, width; `WONK` toggles quirky alternates and auto-disables below 18px optical size; smaller optical sizes use normalized forms for continuous reading — [Fraunces GitHub](https://github.com/undercasetype/Fraunces). Typewolf ranks it #16 of its 40 best Google Fonts and flags it as body-text friendly, "nine weights with matching italics" — [Typewolf](https://www.typewolf.com/google-fonts).
- Playfair Display: Transitional/Modern high-contrast serif by Claus Eggers Sørensen, influenced by Baskerville; "delicate, high-contrast strokes" that "might hinder readability" at small sizes; recommended for "titles and headlines (especially the beautiful italic)" — [Typewolf](https://www.typewolf.com/playfair-display). Described as "the most-used free display serif on the web — and arguably becoming overused", a default of wedding sites, lifestyle blogs and boutique hotels by the mid-2010s — [Made Good Designs](https://madegooddesigns.com/playfair-display-font/) (secondary/blog source). GF popularity rank 22, the highest of all serif candidates — [GF metadata].
- Cormorant: a display family by Christian Thalmann, Garamond-inspired but drawn "most glyphs from scratch"; "explicitly designed as a display font"; 9 styles incl. Garamond, Infant, Upright, SC, Unicase variants (not all are on GF as separate families here) — [Cormorant GitHub](https://github.com/CatharsisFonts/Cormorant). Typewolf ranks Cormorant #8 — [Typewolf](https://www.typewolf.com/google-fonts). Lowest x-height of all candidates (0.386) — [capsize metrics].
- EB Garamond: open-source revival of Claude Garamont's 16th-century roman (with Granjon italic) based on the 1592 Egenolff-Berner specimen; Georg Duffner (Regular/Italic) and Octavio Pardo (bolds); covers Latin, Greek, Cyrillic — [Wikipedia](https://en.wikipedia.org/wiki/EB_Garamond). Subsets on next/font include greek/greek-ext/cyrillic/vietnamese — [next font-data.json].
- Newsreader: commissioned by Google Fonts from Production Type for on-screen long-form reading; optical sizes change the design — at display sizes "more elegant with delicate and contrasting strokes, and a larger x-height", at text sizes lower x-height and less contrast, at the smallest sizes wider with looser spacing — [Production Type](https://productiontype.com/font/newsreader); [Google Fonts](https://fonts.google.com/specimen/Newsreader).
- Libre Caslon Text / Display: by Impallari Type (Pablo Impallari and Rodrigo Fuenzalida — the same designer as Instrument Serif); Text "optimized for web body text typically set at 16px", Display optimized for headlines; based on 1960s hand-lettered Caslon interpretations — [Libre Caslon Text GitHub](https://github.com/impallari/Libre-Caslon-Text). On GF, Display is 400 roman only (no italic) — [next font-data.json].
- Source Serif 4: Frank Grießhammer (Adobe), inspired by Fournier; designed as "a complementary design to the Source Sans family" with matched proportions and colour; Caption/Small Text optical sizes are wide and loosely spaced, Subhead/Display "condensed, tightly-set" for headlines — [Wikipedia: Source Serif](https://en.wikipedia.org/wiki/Source_Serif). Typewolf ranks Source Serif Pro #14, body-text friendly — [Typewolf](https://www.typewolf.com/google-fonts).
- DM Serif Display: commissioned by Google from Colophon Foundry (direction MultiAdaptor / DeepMind), derived from Source Serif; a high-contrast transitional display serif intended for large sizes; the DM Serif families derive from Source Serif while DM Sans derives from Poppins — [googlefonts/dm-fonts](https://github.com/googlefonts/dm-fonts) (via search summary); DM Serif Text is also on GF (400 + italic, static) — [next font-data.json].
- Gloock: contemporary high-contrast display serif inspired by newspaper headlines, "great performance anywhere in big sizes" — [Google Fonts](https://fonts.google.com/specimen/Gloock).
- Young Serif: "heavy weight old style serif", inspired by Plantin Infant / ITC Italian Old Style — [Google Fonts](https://fonts.google.com/specimen/Young%2BSerif).

Loading caveat (applies to all opsz fonts): next/font includes only the `wght` axis by default; extra axes such as `opsz`, `SOFT`, `WONK`, `wdth` must be requested via the `axes` option — [next/font docs].

### Inferences
- For a *classic, professional* feel with a real hierarchy, the strongest serif candidates are **Newsreader** (editorial, screen-first, opsz 6–72) and **Source Serif 4** (neutral transitional, opsz 8–60, purpose-built sibling of Source Sans). **Fraunces** is the best if some warmth/personality is wanted, but its 1970s soft-serif flavour reads more "trendy/editorial" than "classic".
- **Instrument Serif** (already loaded) is a stylish condensed headline face but locked to one weight; it cannot carry subheads, pull quotes at other weights, or body text. Good only as an accent/hero display face. It is also heavily associated with 2023–2025 startup/"Framer template" landing pages (rank 70 despite being only three years old per [GF metadata]) — this "trendy" association is my inference from the rank trajectory, not a cited claim.
- **Playfair Display** is the most cliched option (rank 22, explicit overuse commentary); avoid if the goal is to not look like a template. The newer **Playfair** (2.0) with opsz 5–1200 is far less used (rank 223) but has an unusually small x-height at its default master (0.415).
- **Cormorant / EB Garamond** have the smallest x-heights (0.386 / 0.400) — beautiful at 48px+, but they will look tiny next to a large-x-height sans at the same font-size and are poor below ~18px on screen. They require `font-size-adjust` or a size bump when mixed with sans.
- Static single-weight faces (Instrument Serif, DM Serif Display, Gloock, Young Serif, Libre Caslon Display) need an explicit `weight` in next/font; they are headline-only.

### Gaps
- No authoritative, quantified "overuse" metric exists beyond GF popularity rank; the overuse framing for Playfair comes from blog sources (Made Good Designs), not a type authority.
- x-heights at non-default optical sizes (e.g., Newsreader at opsz 72, Fraunces at opsz 144) were not measured — capsize only provides the default master.
- Could not fetch the Google Fonts "About" text for Instrument Serif directly (page is JS-rendered); relied on Beautiful Web Type.

## Body sans candidates: specs, screen readability, neutrality

### Takeaway
All ten sans candidates are variable on Google Fonts, so no weight array is needed. Inter, Manrope, Plus Jakarta Sans, Geist and IBM Plex Sans have the largest x-heights (≥0.516) and read best at small UI sizes; Source Sans 3 and Hanken Grotesk are the most neutral-humanist and the most "classic" partners for a serif. DM Sans (current) is fine technically and has its own opsz axis, but it is geometric (Poppins-derived) and very common (GF rank 18). Manrope has no italic.

### Cited Findings

| Family | Weights | Italic | Variable axes (next/font) | x-height/UPM | x/cap | GF rank | Added | Designer |
|---|---|---|---|---|---|---|---|---|
| DM Sans (current) | 100–1000 | yes | `wght` 100–1000, `opsz` 9–40 | 0.504 | 0.720 | 18 | 2019-06 | Colophon |
| Inter | 100–900 | yes | `wght` 100–900, `opsz` 14–32 | 0.546 | 0.750 | 4 | 2020-01 | Rasmus Andersson |
| Manrope | 200–800 | **no** | `wght` 200–800 | 0.540 | 0.750 | 27 | 2019-10 | Mikhail Sharanda |
| Geist | 100–900 | yes | `wght` 100–900 | 0.530 | 0.746 | 105 | 2024-10 | Vercel team |
| Figtree | 300–900 | yes | `wght` 300–900 | 0.500 | 0.714 | 39 | 2022-07 | Erik Kennedy |
| Plus Jakarta Sans | 200–800 | yes | `wght` 200–800 | 0.536 | 0.719 | 38 | 2022-03 | Tokotype |
| Source Sans 3 | 200–900 | yes | `wght` 200–900 | 0.486 | 0.736 | 47 | 2021-09 | Paul D. Hunt |
| IBM Plex Sans | 100–700 | yes | `wght` 100–700, `wdth` 75–100 | 0.516 | 0.739 | 40 | 2018-03 | Mike Abbink / Bold Monday |
| Work Sans | 100–900 | yes | `wght` 100–900 | 0.500 | 0.758 | 36 | 2015-07 | Wei Huang |
| Hanken Grotesk | 100–900 | yes | `wght` 100–900 | 0.493 | 0.707 | 142 | 2022-11 | Hanken Design Co. |
| Space Grotesk (current headings) | 300–700 | **no** | `wght` 300–700 | 0.486 | 0.694 | 56 | 2020-10 | Florian Karsten |
| Instrument Sans (Instrument Serif sibling) | 400–700 | yes | `wght` 400–700, `wdth` 75–100 | n/a | n/a | n/a | n/a | — |

Sources: [next font-data.json], [capsize metrics], [GF metadata]. (Instrument Sans metrics/rank were not extracted.)

- Typewolf's 2026 list ranks DM Sans #1, Inter #2, Space Grotesk #4, Work Sans #5, Source Sans Pro #13, IBM Plex Sans #27, Manrope #28; notes Manrope is "available in seven weights without italics" and Space Grotesk "five weights without italics"; Geist, Figtree, Plus Jakarta Sans, Hanken Grotesk are not featured (too new for in-use examples) — [Typewolf](https://www.typewolf.com/google-fonts).
- Geist: created by Vercel for developers/designers, inspired by the Swiss design movement ("simplicity, minimalism, and speed"); mono was built first, then Sans and Pixel; available through Google Fonts and `next/font/google`, but the Google Fonts build lacks the full glyph set and `font-feature-settings` support (the npm `geist` package is Vercel's recommended full-featured route) — [Vercel](https://vercel.com/font).
- DM Sans derives from Poppins (geometric), while DM Serif derives from Source Serif — [googlefonts/dm-fonts](https://github.com/googlefonts/dm-fonts) (via search summary).
- Source Sans (Paul Hunt) and Source Serif (Frank Grießhammer) were developed as companions with Robert Slimbach consulting on both "to maintain the overall family harmony" — [Wikipedia: Source Serif](https://en.wikipedia.org/wiki/Source_Serif).

### Inferences
- **Neutral/classic body**: Source Sans 3 (humanist, lower x-height 0.486 — matches serif colour well), IBM Plex Sans (neutral grotesque with engineered quirks), Hanken Grotesk (quiet grotesk, underused at rank 142), Inter (maximal screen legibility at small sizes but the most ubiquitous sans on GF, rank 4).
- **Less classic / more "product/startup"**: Geist (strongly tied to Vercel/Next.js aesthetics), Plus Jakarta Sans, Manrope, Figtree (friendly geometric).
- x-height mismatch matters: pairing a small-x-height serif (EB Garamond 0.400, Cormorant 0.386) with Inter (0.546) produces a visible size discrepancy at the same font-size; Newsreader (0.426) and Source Serif 4 (0.475) sit closer to Source Sans 3 / Hanken / DM Sans.
- Replacing Space Grotesk with a serif removes the only non-italic family from the current stack; switching body from DM Sans is optional (it is technically sound), mainly a stylistic call.

### Gaps
- No independent legibility study comparing these specific sans faces was found; readability conclusions are inferred from x-height/apertures and designer intent.
- Instrument Sans x-height and GF rank were not extracted.

## Mono candidates and which pair best

### Takeaway
JetBrains Mono (current), Geist Mono and Source Code Pro are variable with wide weight ranges; IBM Plex Mono, DM Mono and Space Mono are static (weights array required). For a classic serif-led system the best monos are the ones with a sibling in the chosen sans family (Source Code Pro with Source Sans/Serif, IBM Plex Mono with Plex, Geist Mono with Geist, DM Mono with DM Sans).

### Cited Findings

| Family | Weights | Italic | Variable (next/font) | x-height/UPM | GF rank | Sibling sans |
|---|---|---|---|---|---|---|
| JetBrains Mono (current) | 100–800 | yes | `wght` 100–800 | 0.550 | 44 | none |
| IBM Plex Mono | 100–700 | yes | **static** | 0.516 | 87 | IBM Plex Sans / Serif |
| Geist Mono | 100–900 | yes | `wght` 100–900 | 0.530 | 78 | Geist |
| DM Mono | 300, 400, 500 | yes | **static** | 0.496 | 151 | DM Sans |
| Space Mono | 400, 700 | yes | **static** | 0.496 | 146 | Space Grotesk |
| Source Code Pro | 200–900 | yes | `wght` 200–900 | 0.478 | 81 | Source Sans 3 / Source Serif 4 |

Sources: [next font-data.json], [capsize metrics], [GF metadata]. All monos share 0.600 avg-width/UPM (true monospace) except Space Mono (0.612) — [capsize metrics].

- Typewolf ranks Space Mono #3 in its 2026 Google list (but notes only "two weights") — [Typewolf](https://www.typewolf.com/google-fonts).
- Instrument Serif is commonly shown with IBM Plex Mono as the mono accent — [MaxiBestOf](https://maxibestof.one/typefaces/instrument-serif).
- Geist Mono was Vercel's first Geist design, "focusing on readability in coding environments" — [Vercel](https://vercel.com/font).

### Inferences
- JetBrains Mono has the largest x-height of all candidates (0.550) and a distinctly "IDE/code" look; for small uppercase labels next to a classic serif it can feel technical. IBM Plex Mono (slab-ish, typewriter-adjacent) and DM Mono (soft, low-contrast) sit more comfortably next to a serif. Source Code Pro is the most neutral.
- Space Mono is quirky/retro and pairs with Space Grotesk; if Space Grotesk is dropped there's no reason to keep it.

### Gaps
- No reputable source directly ranks mono + serif pairings for label use; the above is inferred from family relationships and metrics.

## Recommended pairings from reputable sources and superfamilies

### Takeaway
Reputable, source-backed pairings are mostly *designed* relationships: Source Serif + Source Sans (+ Source Code Pro), IBM Plex Serif + Sans + Mono, DM Serif + DM Sans + DM Mono, Instrument Serif + Instrument Sans, Geist + Geist Mono (no serif). Of these, only Source (all three variable, opsz on the serif) gives full uniformity *and* variable fonts across all roles on Google Fonts; Plex Serif and Plex Mono are static on GF.

### Cited Findings
- Source Serif is "a complementary design to the Source Sans family", matched in proportions and typographic colour — [Wikipedia: Source Serif](https://en.wikipedia.org/wiki/Source_Serif). Source Code Pro is by the same designer as Source Sans (Paul D. Hunt) — [GF metadata].
- IBM Plex superfamily = Plex Sans, Plex Serif, Plex Mono, Plex Sans Condensed, each with italics — [IBM Plex](https://www.ibm.com/plex/). On GF, Plex Sans is variable (`wght`, `wdth`) but Plex Serif and Plex Mono are static (weights 100–700) — [next font-data.json]. All three share identical x-height/cap metrics (0.516 / 0.698) — [capsize metrics].
- DM type system: DM Sans, DM Serif Display/Text, DM Mono all by Colophon; DM Serif is Source Serif-derived, DM Sans Poppins-derived — [googlefonts/dm-fonts](https://github.com/googlefonts/dm-fonts); [GF metadata].
- Instrument Serif + Instrument Sans is a "matched pair" ("italic energy meets Instrument Sans's Swiss calm") — [TypePairs](https://typepairs.com/pairs/instrument-serif-instrument-sans).
- Geist family = Sans, Mono, Pixel; no serif — [Vercel](https://vercel.com/font). Geist Pixel is present in next 16.3.6's catalogue (`ELSH` axis) — [next font-data.json].
- Typewolf's Playfair page suggests Playfair Display + FF Super Grotesk (commercial) and shows it with Karla, Montserrat, Roboto, PT Sans in the wild — [Typewolf](https://www.typewolf.com/playfair-display).
- Fontpair lists Libre Baskerville + DM Sans, Work Sans + Bitter among curated pairings — [Fontpair via search summary](https://fontpair.co/all) (aggregator; weaker).
- Libre Caslon Text and Instrument Serif share a designer (Rodrigo Fuenzalida) — [Libre Caslon GitHub](https://github.com/impallari/Libre-Caslon-Text); [GF metadata].

### Inferences
Shortlist for a classic, professional portfolio (my synthesis):
1. **Newsreader (display+text, opsz) + Source Sans 3 or Hanken Grotesk + IBM Plex Mono or JetBrains Mono** — most "editorial classic"; Newsreader alone can carry headings, quotes and even long-form text.
2. **Source Serif 4 + Source Sans 3 + Source Code Pro** — the only fully variable, designed-together superfamily on GF; most uniform, most neutral, least trendy; optical sizes make the serif work for heroes and captions.
3. **Fraunces (opsz, SOFT 0, WONK 0) + DM Sans (keep current) + DM Mono or JetBrains Mono** — least disruptive change (keeps body), adds a warm classic serif with a full weight range.
4. Keep-it-cheap option: **Instrument Serif (hero/accents only) + DM Sans + JetBrains Mono** — simply drop Space Grotesk and actually use the already-loaded serif; limited to one weight, so section headings would need to be the sans.
- Avoid for "classic but not template-y": Playfair Display (overused), Cormorant/EB Garamond as the *only* heading face (tiny x-height, fragile at mid sizes), Gloock/Young Serif (strong period flavour).

### Gaps
- Google Fonts' own "Pairings" tab on specimen pages is JS-rendered and could not be fetched; no Google-official pairing list is cited.
- Typewolf does not cover Newsreader, Instrument Serif, Geist, Hanken Grotesk etc. (too new), so no Typewolf pairing exists for them.

## next/font/google availability and variable-font loading in Next.js 16

### Takeaway
Every candidate named in the brief exists in the `next/font/google` catalogue shipped with the repo's installed `next@16.3.6`. Variable fonts need no `weight` option (the full `wght` range loads); static ones (Instrument Serif, DM Serif Display, Young Serif, Gloock, Libre Caslon Display/Text, IBM Plex Serif, IBM Plex Mono, DM Mono, Space Mono) require `weight`. Optical size and other non-`wght` axes are *not* loaded unless requested via `axes`.

### Cited Findings
- All 34 families checked (every name in the brief plus Playfair 2.0, DM Serif Text, IBM Plex Serif, Space Grotesk, Instrument Sans, Geist Pixel) are present, none missing — [next font-data.json].
- Import names follow underscore convention, e.g. current code imports `DM_Sans, Instrument_Serif, JetBrains_Mono, Space_Grotesk` from `next/font/google` — `src/app/layout.tsx`.
- `weight` is "Required if the font being used is **not** variable"; for a variable font, `weight: '100 900'` range string is allowed but optional; arrays are for static fonts — [next/font docs].
- "Some variable fonts have extra `axes` that can be included. By default, only the font weight is included to keep the file size down." — [next/font docs]. So e.g. `Newsreader({ subsets: ['latin'], axes: ['opsz'] })`, `Fraunces({ axes: ['opsz','SOFT','WONK'] })`, `Source_Serif_4({ axes: ['opsz'] })`, and even the current `DM_Sans` needs `axes: ['opsz']` to get its 9–40 optical sizing.
- Next docs recommend variable fonts "for the best performance and flexibility" — `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`.
- Geist on Google Fonts / next/font/google lacks the full glyph set and `font-feature-settings` support vs the npm package — [Vercel](https://vercel.com/font) (the npm route would add a dependency, which the project forbids without asking).
- Subset coverage: Instrument Serif, DM Serif Display, Young Serif, Libre Caslon, DM Sans, Figtree, DM Mono, Space Mono are latin/latin-ext only; Source Serif 4, Source Sans 3, EB Garamond, Inter include greek/cyrillic — [next font-data.json]. (Only matters if non-Latin content is expected.)

### Inferences
- Swapping fonts is a `src/app/layout.tsx` + CSS-variable change only; no new npm dependency is needed for any candidate.
- If an opsz font is chosen, add `axes: ['opsz']` and rely on `font-optical-sizing: auto` (browser default) — otherwise the opsz benefit is silently lost.
- Each extra axis enlarges the font file; loading 4 families today (one unused) is already heavier than a 2–3 family system — dropping unused Instrument Serif or Space Grotesk is a net payload win.

### Gaps
- Actual woff2 byte sizes per family/axis configuration were not measured (would require downloading font files).
