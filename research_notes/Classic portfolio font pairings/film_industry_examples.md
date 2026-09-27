# Typography in the Film, Editorial and Post-Production World (real-world examples)

Method note: most studio findings below come from direct inspection of live site HTML/CSS (curl of the homepage plus linked stylesheets and Typekit kits, grepping `font-family`, `@font-face`, CSS custom properties and Google Fonts URLs) on 2026-09-27. Declaration counts measure how often a family appears in CSS, not how prominent it looks on screen, and a stylesheet can declare a font the page barely uses. Sites that returned a bot wall or nothing usable are listed under Gaps. Where a "Source" link is the studio homepage, the evidence is that site's own CSS on that date.

## 1. What fonts do notable post houses, editorial companies, production companies and film brands use on their sites?

### Takeaway
Commercial editorial and post houses almost all use one proprietary grotesque sans (often in two weights), sometimes paired with a second "character" face. Serifs are rare there. Film distributors and curators (Mubi, Focus, Janus, Searchlight, Criterion packaging) use a serif far more often, usually as a restrained editorial pairing with a neutral sans. Most of these sites use 1–2 families; 3 happens only when a mono or a display accent is added.

### Cited Findings

**Editorial / post-production houses (direct CSS inspection, 2026-09-27)**
- Final Cut: primary `"Maax"` (geometric grotesque sans), secondary `"Optician Sans"` (eye-chart-style caps face). The CSS variables are `--font-primary: "Maax", sans-serif; --font-secondary: "Optician Sans", serif`. — [finalcut-edit.com](https://www.finalcut-edit.com)
- Cut+Run: Roobert (Regular/Medium/SemiBold/Bold) as the primary family, plus Sharp Grotesk Bold as the display font (`--font-family-display`), with Calibre also declared. — [cutandrun.tv](https://www.cutandrun.tv)
- Rock Paper Scissors: a single family, `forma-djr-deck` (Forma DJR, a Helvetica-era neo-grotesque revival) via Adobe Fonts. — [rockpaperscissors.com](https://www.rockpaperscissors.com)
- Whitehouse Post: primary `"TT Hoves"` (grotesque), secondary `"degular"`, plus an `Inkina` declaration. — [whitehousepost.com](https://www.whitehousepost.com)
- Arcade Edit: only `aktiv-grotesk-extended` (a wide grotesque) is declared in its Typekit kit. — [arcadeedit.com](https://www.arcadeedit.com)
- Exile: a single family, `"Lota Grotesque Alt 1"`, in 400/600/700 plus italics. — [exileedit.com](https://www.exileedit.com)
- Lost Planet (Hank Corwin's editorial company): `MonumentGrotesk` as the main UI face, `MonumentGroteskMono` (one declaration), `NeueHaasGrotesk` (NHaasGroteskTXPro-65Md), and a custom/display `Garyward`. — [lostplanet.com](https://www.lostplanet.com)
- Spot Welders: a fully serif Squarespace setup, with heading font `"orpheus-pro"` and body and meta font `"adobe-garamond-pro"`. — [spotwelders.com](https://www.spotwelders.com)
- Mackenzie Cutler: `"Libre Franklin"` for heading, body and meta, with `'Inter Tight'` also declared. Both are free Google Fonts. — [mackcut.com](https://www.mackcut.com)
- Cosmo Street Editorial: `Larsseit` (sans) for UI and `Freightdispprobook` (Freight Display Pro Book, serif) as an accent. — [cosmostreet.com](https://www.cosmostreet.com)
- Union Editorial: Poppins, plus Abril Fatface loaded from Google Fonts, with Playfair Display, Open Sans and Roboto also in its font URL. — [unioneditorial.com](https://www.unioneditorial.com)
- The Visual Unit: futura-pt is dominant (86 declarations), followed by proxima-nova and europa. — [thevisualunit.com](https://www.thevisualunit.com)
- The Quarry: Roboto and Montserrat (generic template stack). — [thequarry.com](https://www.thequarry.com)
- Trim Editing: no named webfont was detectable in static HTML/CSS. The stylesheet declares `Courier New` and `monospace,monospace` (context unclear). — [trimediting.com](https://trimediting.com)
- PS260: the only family detectable statically was `ui-monospace`. — [ps260.com](https://www.ps260.com)

**Commercial production companies (same method)**
- RSA Films: `NeuzeitGro-Reg` (Neuzeit Grotesk), `LL Circular Bold Sub`, and `Bureau Grot Lt`, with `SFMono-Regular` present in a fallback stack. — [rsafilms.com](https://www.rsafilms.com)
- Smuggler: a single family, `--font-primary: "ABC Diatype"`, with `--font-secondary: serif`. — [smugglersite.com](https://www.smugglersite.com)
- Biscuit Filmworks: `HelveticaNowDisplay` only. — [biscuitfilmworks.com](https://www.biscuitfilmworks.com)
- Park Pictures: `--font-primary: 'UntitledSans-Regular'` and `--font-secondary: serif`. — [parkpictures.com](https://www.parkpictures.com)
- Nexus Studios: Nunito from Google Fonts, falling back to Helvetica/Calibri/Arial. — [nexusstudios.com](https://nexusstudios.com)

**Distributors, curators and film institutions**
- A24 website: NB International (primary, 52 declarations in its CSS) plus NB International Mono (4 declarations), with akzidenz-grotesk and akzidenz-grotesk-extended in its Typekit kit. — [a24films.com](https://a24films.com); Fonts In Use independently documents NB International + NB International Mono on the A24 site (May 2023) — [Fonts In Use: A24 website](https://fontsinuse.com/uses/53928/a24-website)
- A24's logo is a custom wordmark drawn by Grand Army (~2016), meant to feel modern while nodding to mid-century Hollywood deco forms. It is not an installable font. — [MadeGoodDesigns: What Font Does A24 Use?](https://madegooddesigns.com/a24-font/); [GrandArmy A24 project](https://www.grandarmy.com/projects/a24)
- MUBI: the site loads `Riforma` (RiformaLLWeb Regular/Medium) as the primary sans, `Tiempos Headline` (Light) and `Tiempos Text` as serifs, and `KCompress` (a compressed display face). — [mubi.com](https://mubi.com)
- MUBI's identity by Spin chose LL Riforma (Norm, 2018) for its "elegance, sophistication and sharpness". — [Fonts In Use: MUBI identity](https://fontsinuse.com/uses/51030/mubi-identity); [Spin: MUBI](https://spin.co.uk/projects/mubi). Note that the identity write-ups only mention Riforma, while the live site also uses Tiempos. The Tiempos evidence comes from the site CSS only.
- NEON: `Girott` (primary, 14 variable uses) and `Focal` (7), with Geist Sans and ui-monospace also declared. — [neonrated.com](https://www.neonrated.com)
- Focus Features: `palatino` (50 declarations), `Work Sans` (49) and `Oswald` (31), which is a classic serif + neutral sans + condensed sans. — [focusfeatures.com](https://www.focusfeatures.com)
- Janus Films (Criterion's sister company): Freight Neo Pro (Med/Semi/Bold) and Freight Text Pro (Book/Semibold), a same-superfamily serif + sans pairing. — [janusfilms.com](https://www.janusfilms.com)
- Searchlight Pictures: `Outfit` (86 declarations, loaded from Google Fonts), `Playfair` (34), and `adrianna` / `adrianna-condensed`. — [searchlightpictures.com](https://www.searchlightpictures.com)
- Magnolia Pictures: Helvetica Neue (dominant), proxima-nova, futura-pt, freight-sans-pro and Oswald. — [magnoliapictures.com](https://www.magnoliapictures.com)
- Film at Lincoln Center: `elza` and `Trade Gothic Extended`. — [filmlinc.org](https://www.filmlinc.org)
- BFI: `HelveticaNeueLTPro-Bd` plus Open Sans. — [bfi.org.uk](https://www.bfi.org.uk)
- Blackmagic Design (maker of DaVinci Resolve): Oswald (condensed) plus Source Han Sans for CJK. — [blackmagicdesign.com](https://www.blackmagicdesign.com)
- Criterion packaging and channel collections use a different typeface for each release rather than one house face. Examples: Flyer + Red Top for the John Waters collection, and Piccadilly + Agneya + ITC Kabel for Miami Neo-Noir. — [Fonts In Use: John Waters Collection](https://fontsinuse.com/uses/65390/john-waters-collection-on-criterion-channel); [Fonts In Use: Criterion Collection tag](https://fontsinuse.com/tags/417/criterion-collection)

**Individual editor portfolios (same method; mostly Squarespace/Wix templates)**
- Tim Beeston (editor): Chivo throughout. — [tim-beeston.com](https://www.tim-beeston.com)
- Gal Anafi (editor): alegreya (serif), futura-pt and Roboto Mono (38 mono declarations). — [gal-anafi.com](https://www.gal-anafi.com)
- Oliver Simons (editor): roc-grotesk plus Clarkson. — [oliverjsimons.com](https://www.oliverjsimons.com)
- Natasha Coulter (editor): Helvetica Neue W01, Proxima Nova and Avenir (Wix). — [natashacoulter.com](https://www.natashacoulter.com)
- Katia Vannoy (editor): Inter. — [katiavannoy.com](https://www.katiavannoy.com)
- Michael Guarente (editor): Madefor / Madefor Display (Wix system fonts) and Archivo. — [mguarente.com](https://www.mguarente.com)
- These editors come from a published roundup of 21 video-editor portfolios. The roundup gives no typeface names and describes them only by mood, for example "dark theme… cinematic". — [Squarestash: 21 Video Editor Portfolio Websites](https://squarestash.com/inspiration/video-editor-portfolio-websites/)

### Inferences
- **Sans-first among editorial houses.** Of roughly 14 editorial/post houses with readable CSS, about 11 lead with a grotesque or geometric sans (Maax, Roobert, Forma DJR, TT Hoves, Aktiv Grotesk Extended, Lota Grotesque, Monument Grotesk, Libre Franklin, Larsseit, Futura PT, Poppins/Roboto). Only Spot Welders is fully serif. Cosmo Street (Freight Display) and Union (Abril Fatface) use a serif as an accent.
- **Serifs cluster at the "cinephile/curator" end.** Mubi (Tiempos), Focus Features (Palatino), Janus (Freight Text), Searchlight (Playfair), and Spot Welders (Garamond/Orpheus) use a serif. That is the register a "classic" editor brand would borrow from. The pattern is almost always a **serif for headlines or editorial copy plus a neutral sans for UI/navigation**, not serif everywhere.
- **Family count.** The top-tier houses mostly use 1 family (RPS, Exile, Arcade, Smuggler, Biscuit) or 2 (Final Cut, Whitehouse, Cosmo Street, Janus, Mubi's sans + serif). Sites with 4–5 declared families (Magnolia, The Quarry, Union) look more like template or legacy sites than deliberate systems.
- **Premium houses pay for type; template sites use Google Fonts.** The editors' personal portfolios mostly run platform defaults (Wix Helvetica/Madefor, Squarespace Chivo/Inter). A deliberate 2-family system alone would set madhu.edit apart from peer editor portfolios.
- **Wide/extended grotesques are a current post-house signature.** Examples are Arcade (Aktiv Grotesk Extended), A24 (Akzidenz-Grotesk Extended), Film at Lincoln Center (Trade Gothic Extended) and Cut+Run (Sharp Grotesk). They read as confident and contemporary but lean "fashion/agency" rather than "classic".

### Gaps
- Work Editorial, Marshall Street Editors, Stitch, Rooster Post, Homestead, Mirek Sasek and Will Gorman returned nothing or a stub (bot wall/JS-only), so their fonts are unverified.
- Criterion.com returned a bot-challenge page (system-ui only). I found no reliable source for the typeface of Criterion's current website, as opposed to its packaging.
- Trim Editing's primary display face could not be identified statically (possibly JS-injected).
- NEON's `Girott` and `Focal` could not be matched to a published foundry release; they may be custom or renamed.
- No published design case study naming fonts for any editorial house site was found.

## 2. Which typefaces are tied to cinema credits and posters, and which free Google Fonts approximate them?

### Takeaway
Film type falls into three classic groups:
- **Roman capitals** (Trajan) for "epic/prestige" posters.
- **Neutral or geometric sans** (Helvetica, Futura, Univers) for credits.
- **Ultra-condensed grotesques** (Univers 39, Trade Gothic Condensed) for billing blocks.

Each has a solid Google Fonts stand-in.

### Cited Findings
- Trajan (Carol Twombly, 1989, after the inscription on Trajan's Column) became the go-to poster face from 1992 onward, used for an "epic feel". — [Mental Floss: Why so many movie posters use Trajan](https://www.mentalfloss.com/article/549785/why-so-many-movie-posters-use-trajan-typeface-font)
- Futura appears on posters for Life of Pi, The Help and Gravity. The usual shorthand is Trajan for historical/political films, Helvetica for realist/minimal films, and Futura for sci-fi. — [Platt College: Top 10 film fonts](https://platt.edu/blog/our-top-10-favorite-film-fonts/); [Solopress: popular movie poster fonts](https://www.solopress.com/blog/copywriting-typography/popular-fonts-used-movie-posters/)
- Bebas Neue, Anton and Oswald are named as the tall, condensed impact faces for modern/action posters. — [MadeGoodDesigns: Best fonts for movie titles (2026)](https://madegooddesigns.com/best-fonts-for-movie-titles/)
- For rolling credits, Helvetica Neue, Futura and Univers are the standard, followed by Frutiger, DIN, Avenir, Gotham, Proxima Nova and Inter. Period dramas sometimes use serifs (Georgia, Plantin, Mercury) whose strokes "survive motion". — [endcredits.pro: Best fonts for film credits](https://endcredits.pro/blog/best-fonts-for-film-credits/)
- For billing blocks, Univers 39 Thin Ultra Condensed is "the classic… used on thousands of posters since the 1970s", with Trade Gothic Condensed, Franklin Gothic Condensed, Bee Two and Steel Tongs also used. The same page names Inter, Work Sans, Source Sans, Barlow Condensed and Open Sans as free options. — [endcredits.pro](https://endcredits.pro/blog/best-fonts-for-film-credits/)
- Published Google Fonts substitutes: Oswald for Futura Condensed, Roboto for Trade Gothic, Open Sans / Nunito Sans for Univers, Source Sans for Helvetica. — [Yext Design: Google Font alternatives](https://medium.com/yext-design/google-font-alternatives-to-fonts-you-cant-get-your-hands-on-6413948495a8); [PlethoraThemes Google-Font-Alternatives](https://github.com/PlethoraThemes/Google-Font-Alternatives)
- The Criterion typeface itself (Phil Martin, Alphabet Innovations/URW) is a commercial display family and is not the Collection's modern web face. — [Fonts In Use: Criterion typeface](https://fontsinuse.com/typefaces/17085/criterion)

### Inferences — paid font → closest free Google Fonts alternative
These are the researcher's typographic judgment unless a source is cited above. All named alternatives are on Google Fonts and can be loaded with `next/font/google`.

| Paid font (where seen) | Style | Closest Google Fonts alternative(s) |
|---|---|---|
| Tiempos Headline / Text (MUBI) | contemporary text serif | **Newsreader**, Source Serif 4, Libre Caslon Text |
| Palatino (Focus Features) | classic humanist serif | **Crimson Pro**, EB Garamond, Spectral |
| Adobe Garamond Pro (Spot Welders) | old-style serif | **EB Garamond**, Cormorant Garamond |
| Orpheus Pro (Spot Welders) | elegant display serif | Cormorant, Cormorant Garamond |
| Freight Display / Freight Text (Cosmo Street, Janus) | high-contrast editorial serif | **Libre Caslon Display/Text**, Newsreader, Playfair Display (higher contrast) |
| Trajan (posters) | Roman inscriptional caps | **Cinzel** |
| Riforma (MUBI) | refined grotesque | **Inter Tight**, Hanken Grotesk |
| NB International (A24) | soft geometric grotesque | Inter, Manrope, Space Grotesk |
| NB International Mono / Monument Grotesk Mono (A24, Lost Planet) | grotesque mono | **JetBrains Mono**, IBM Plex Mono, DM Mono |
| Akzidenz-Grotesk (A24) | classic grotesque | **Inter Tight**, Archivo |
| Akzidenz Extended / Aktiv Grotesk Extended / Trade Gothic Extended (A24, Arcade, FLC) | wide grotesque | **Archivo** (variable width axis, expanded), Syne (more stylised) |
| Helvetica Neue / Helvetica Now / Neue Haas (BFI, Magnolia, Biscuit, Lost Planet) | neo-grotesque | **Inter** / Inter Tight, Source Sans 3 (cited above) |
| Univers (credits) | neo-grotesque | Figtree, Nunito Sans / Open Sans (cited above) |
| Univers 39 Ultra Condensed / Trade Gothic Condensed (billing blocks) | ultra-condensed | **Antonio**, Oswald (Light), Barlow Condensed (cited), Pathway Gothic One |
| Futura / Futura PT (posters, credits, Visual Unit, Magnolia) | geometric sans | **Jost**, Outfit |
| Maax (Final Cut) | geometric grotesque | DM Sans, Manrope |
| Roobert / Sharp Grotesk (Cut+Run) | quirky grotesque | Space Grotesk, Schibsted Grotesk, Archivo |
| Forma DJR (Rock Paper Scissors) | Italian neo-grotesque | Inter, Inter Tight |
| TT Hoves / Degular (Whitehouse Post) | grotesque / friendly sans | Albert Sans, Figtree |
| Lota Grotesque (Exile) | grotesque | Plus Jakarta Sans, Manrope |
| Larsseit (Cosmo Street) | geometric grotesque | Manrope, Urbanist |
| ABC Diatype / Untitled Sans (Smuggler, Park) | neutral grotesque | Inter, Geist |
| Circular (RSA) | geometric | DM Sans, Figtree |
| Proxima Nova (Magnolia, Visual Unit) | geometric-humanist | Montserrat, Figtree |

- A "classic cinema" feel on the web comes most reliably from pairing a Trajan/Garamond/Caslon-lineage serif with a Helvetica/Univers-lineage sans. Both groups have mature Google equivalents (EB Garamond, Libre Caslon, Newsreader, Cormorant / Inter, Inter Tight, Figtree).
- A condensed face such as Antonio or Oswald is best kept for small caps-style labels (billing-block feel), not as a headline font. On the web, Oswald/Bebas-heavy headlines drift toward "action trailer / YouTube thumbnail".

### Gaps
- No authoritative, sourced table of Google Fonts equivalents for these specific commercial faces was found, so the table above is expert judgment and should be eyeball-tested.
- Final Cut's `Optician Sans` is, to the researcher's knowledge, a free (non-Google) font. This was not verified in this session, and it has no close Google Fonts equivalent.

## 3. How common is a monospace "timecode" accent on film/editor sites, and how is it kept restrained?

### Takeaway
A monospace accent is present but minor. In this sample, only A24 (NB International Mono), Lost Planet (Monument Grotesk Mono), PS260 (ui-monospace), Trim (Courier New declaration) and one editor portfolio (Gal Anafi, Roboto Mono) declare a mono face. Where it appears it is a companion mono of the main grotesque, used sparingly for metadata, never for headlines or body.

### Cited Findings
- A24 declares NB International Mono only 4 times, against 52 for NB International, which suggests metadata-only use. — [a24films.com](https://a24films.com); [Fonts In Use: A24 website](https://fontsinuse.com/uses/53928/a24-website)
- Lost Planet has one `MonumentGroteskMono` declaration against 19 for MonumentGrotesk. — [lostplanet.com](https://www.lostplanet.com)
- NEON only has `ui-monospace` in a generic utility stack (Tailwind default), not as a brand face. — [neonrated.com](https://www.neonrated.com)
- Gal Anafi's editor portfolio uses Roboto Mono heavily (38 declarations) next to Alegreya serif and Futura PT, a 3-family system. — [gal-anafi.com](https://www.gal-anafi.com)
- Portfolio guidance recommends a mono (e.g. JetBrains Mono / Fira Code) only for project metadata such as dates, roles, tools, tags and section labels, and caps the system at 2–3 families (display, body, optional mono accent). — [The Crit: Typography for portfolios](https://thecrit.co/resources/typography-for-portfolios); [Creative Bloq: 8 great fonts for your portfolio](https://www.creativebloq.com/features/8-great-fonts-to-use-for-your-portfolio)
- Timecode itself (SMPTE HH:MM:SS:FF) is a fixed-width numeric display, which is the functional reason a mono or tabular-figure face suits it. This is inferred from the format. No citable source on "timecode fonts in web design" was found (see Gaps).

### Inferences
- Restraint patterns seen:
  1. Use the **companion mono of the main family** (NB International → NB International Mono; Monument Grotesk → Monument Grotesk Mono), so the mono feels like part of the same system rather than a third personality. Google analogues: **IBM Plex Sans + IBM Plex Mono**, **DM Sans + DM Mono**, **Geist + Geist Mono**, **Inter + JetBrains Mono** (close in proportions).
  2. Keep it to small sizes, uppercase or tracked, for runtime/year/role/client labels.
  3. Use it at roughly 5–10% of type declarations (A24 ~7%, Lost Planet ~5%).
- An alternative to a separate mono is `font-variant-numeric: tabular-nums` on the main sans (Inter supports it), which gives timecode alignment without adding a family. This is technical judgment, not sourced.
- When mono becomes the dominant voice, the site reads "developer/tech". Gal Anafi's heavy Roboto Mono use is the outlier in the sample; top houses avoid it.

### Gaps
- No survey or article quantifying mono/timecode usage across film sites was found. The counts above come only from this session's ~45-site CSS sample.
- Whether Trim's `Courier New` and PS260's `ui-monospace` appear visibly on screen could not be confirmed without rendering.

## 4. Which patterns read as "classic and professional" versus "tech startup"?

### Takeaway
"Classic/prestige" film sites pair a literary serif (Garamond, Caslon, Tiempos, Palatino, Freight) with a quiet neo-grotesque, use 2 families, and keep mono out of headlines. "Tech startup" signals are a single geometric or rounded sans everywhere (Poppins, Montserrat, Nunito, Outfit), heavy monospace, or loud condensed headlines.

### Cited Findings
- The prestige/curator set uses a serif + sans pairing: Mubi (Tiempos + Riforma), Janus (Freight Text + Freight Neo), Focus Features (Palatino + Work Sans), Searchlight (Playfair + Outfit), Cosmo Street (Freight Display + Larsseit). — [mubi.com](https://mubi.com); [janusfilms.com](https://www.janusfilms.com); [focusfeatures.com](https://www.focusfeatures.com); [searchlightpictures.com](https://www.searchlightpictures.com); [cosmostreet.com](https://www.cosmostreet.com)
- Spin's rationale for Mubi's type was "elegance, sophistication and sharpness", and its update was guided by "no value in change for change's sake". — [Fonts In Use: MUBI identity](https://fontsinuse.com/uses/51030/mubi-identity); [It's Nice That: Spin x Mubi](https://www.itsnicethat.com/articles/spin-tony-brook-efe-cakarel-graphic-design-180219)
- A24's system aims to feel "modern and progressive" while nodding to mid-century Hollywood, and to stay clean and let the content breathe. — [MadeGoodDesigns: A24 font](https://madegooddesigns.com/a24-font/)
- Sites on generic Google geometric sans (Poppins, Montserrat, Nunito, Roboto) in this sample are Union Editorial, The Quarry and Nexus Studios, which are the less design-forward or older builds. — [unioneditorial.com](https://www.unioneditorial.com); [thequarry.com](https://www.thequarry.com); [nexusstudios.com](https://nexusstudios.com)
- One published editor-portfolio example pairs a modern grotesk (Syne/Inter) + a literary serif (Cormorant Garamond) + SMPTE-style mono (JetBrains Mono). — [Creative Bloq](https://www.creativebloq.com/features/8-great-fonts-to-use-for-your-portfolio) / [The Crit](https://thecrit.co/resources/typography-for-portfolios) (search-result summary; the exact example source was not fetched in full)

### Inferences
- **Reads classic/professional:**
  - A serif headline or display (Garamond, Caslon, Tiempos or Freight-like: EB Garamond, Libre Caslon, Newsreader, Cormorant) with a neutral grotesque for nav, body and labels (Inter / Inter Tight / Figtree).
  - Generous tracking on small caps labels.
  - Restrained weights (regular/medium; light for large serif display).
  - At most one mono accent, tied to the sans family.
  - Muted palette with the work carrying the colour.
- **Reads premium-contemporary (post-house) rather than classic:** a single proprietary grotesque, often extended/wide (Archivo expanded as the free proxy), heavy all-caps, no serif. This is the dominant commercial-editorial look (Arcade, Exile, RPS, Cut+Run).
- **Reads tech startup / template:**
  - Poppins, Montserrat, Nunito or Outfit as the only family.
  - Rounded geometric sans at bold weights.
  - Monospace for body or headings.
  - Space Grotesk + JetBrains Mono "dev" pairings.
  - Gradient or bright accent colours with a geometric sans.
- **Suggested direction for madhu.edit (for the report writer to weigh):** serif display + neutral grotesque + optional restrained mono, 2 families (3 at most). Example Google Fonts systems grounded in the observed patterns:
  - **Newsreader or EB Garamond (display) + Inter / Inter Tight (UI/body) + JetBrains Mono or `tabular-nums` (timecode)**. This is the Mubi/Janus pattern plus the A24-style mono.
  - **Libre Caslon Display + Figtree + DM Mono**. This follows the Freight/Cosmo Street pattern.
  - **Cormorant Garamond + IBM Plex Sans + IBM Plex Mono**. This gives a single sans/mono superfamily, like A24's NB International + Mono.

### Gaps
- There is no quantitative source on audience perception of "classic vs tech" typography for film sites. The classification above is inferred from which kinds of organisations use which faces in this sample.
- The Awwwards, Siteinspire and Typewolf portfolio collections were not systematically mined for film-specific examples in this session, because the tool budget went to direct CSS inspection.
