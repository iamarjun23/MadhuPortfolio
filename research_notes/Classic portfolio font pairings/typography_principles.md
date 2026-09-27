# Typography principles for a uniform, classic, professional portfolio type system

Context: notes support a recommendation for madhu.edit (nmadhukumar.com), a video editor's portfolio. Fonts must be free on Google Fonts and loaded via `next/font/google`. Currently the site uses its mono face about 99 times and its body face about 17 times (figure from the brief, not re-measured here).

Source caveat: Google Fonts Knowledge and Material Design 3 pages render client-side, so direct fetches returned only page titles. Findings attributed to them below come from search-result excerpts of those pages. Treat them as lower-confidence paraphrases, not verified quotes.

## 1. How many type families should a professional site use?

### Takeaway
Respected sources converge on one or two families, with a third only for a narrow, consistent job such as code or data. Butterick's line is the one most quoted: "Most documents can tolerate a second font. Few can tolerate a third." Mixing is optional, and each font should have one fixed role.

### Cited Findings
- Butterick: "Most documents can tolerate a second font. Few can tolerate a third. Almost none can tolerate four or more." — [Practical Typography: Mixing fonts](https://practicaltypography.com/mixing-fonts.html)
- Butterick: "Mixing fonts is never a requirement—it's an option." Size, weight and style within one family can supply the variety instead. — [Practical Typography: Mixing fonts](https://practicaltypography.com/mixing-fonts.html)
- Butterick: "Font mixing is most successful when each font has a consistent role in the document." Change fonts only at paragraph breaks, never mid-paragraph. — [Practical Typography: Mixing fonts](https://practicaltypography.com/mixing-fonts.html)
- Butterick says body text largely determines typographic quality: "the typographic quality of your document is determined largely by how the body text looks." — [Practical Typography: Typography in ten minutes](https://practicaltypography.com/typography-in-ten-minutes.html)
- Google Fonts Knowledge (search excerpt): a family, and even more a superfamily, offers "enough contrast available without requiring a pairing from another typeface," and staying in one family gives "shared consistency across every variation." — [Google Fonts Knowledge: Pairing within a family & superfamily](https://fonts.google.com/knowledge/choosing_type/pairing_typefaces_within_a_family_superfamily)
- Practice on real designer portfolios: in Typewolf's "Top 40 Favorite Designer Portfolio Sites in 2026", counting the fonts listed per site gives 12 sites with 1 family, 21 with 2, 6 with 3 and 1 with 4. None of the 3-family sites adds a third family except as a mono or a single accent display face. — [Typewolf: Top 40 portfolio sites 2026](https://www.typewolf.com/portfolio-sites) (counts made by me from the listing)
- Typewolf notes that many of these portfolios use fonts "readily available on services like Adobe Fonts and Google Fonts." — [Typewolf: Top 40 portfolio sites 2026](https://www.typewolf.com/portfolio-sites)

### Inferences
- For madhu.edit the defensible ceiling is two families (display + text). A mono is acceptable only as a third role limited to small technical metadata such as timecodes and version strings. It should not be a general label or UI face.
- One family doing about 99 of roughly 116 type assignments means the site's "voice" is effectively the mono. That breaks Butterick's rule that each font has a consistent, limited role.

### Gaps
- I found no quantitative study linking family count to perceived professionalism. The guidance is expert consensus, not experimental.

## 2. Rules for pairing a serif display face with a sans body face; when a superfamily is better

### Takeaway
Pair on structure, not only on category. Match x-height and proportions and share an era or construction logic, and let contrast come from role, size and weight. Butterick rejects the idea that you "must" pair a serif with a sans. A superfamily (IBM Plex, Source) gives the most uniformity because the metrics, spacing and motifs were drawn together, at the cost of less personality.

### Cited Findings
- Butterick calls the serif-with-sans rule a myth: "lower contrast between fonts can be more effective than higher contrast," as in newspapers that use serif for both headline and body. — [Practical Typography: Mixing fonts](https://practicaltypography.com/mixing-fonts.html)
- Butterick's reliable shortcut is typefaces "by the same font designer," for example Atlas + Lyon (both by Kai Bernau). — [Practical Typography: Mixing fonts](https://practicaltypography.com/mixing-fonts.html)
- Google Fonts Knowledge (search excerpt): in a family, the "skeletal structure is almost identical" across sans and slab styles, the fonts share "spacing settings, proportions, and motifs," and "a shared x-height is likely." — [Google Fonts Knowledge: Pairing within a family & superfamily](https://fonts.google.com/knowledge/choosing_type/pairing_typefaces_within_a_family_superfamily)
- Google Fonts Knowledge (search excerpt): a "sibling" pairing "might have a similar x-height, similar contrast, similar width" and a shared mood. When combining, "similar x-height" and "similar or different width" become deciding factors. — [Google Fonts Knowledge: Pairing typefaces](https://fonts.google.com/knowledge/choosing_type/pairing_typefaces); Google also publishes a construction-based "font matrix" method — [Google Fonts Knowledge: font matrix](https://fonts.google.com/knowledge/choosing_type/pairing_typefaces_based_on_their_construction_using_the_font_matrix)
- IBM Plex is an open-source superfamily (Sans, Sans Condensed, Mono, Serif) created together under Mike Abbink with Bold Monday as IBM's unified corporate typeface, replacing Helvetica Neue in 2018. — [Wikipedia: IBM Plex](https://en.wikipedia.org/wiki/IBM_Plex); [Bold Monday: IBM Plex](https://boldmonday.com/custom/ibm/)
- IBM Plex Sans, Serif and Mono are all on Google Fonts. — [Google Fonts: IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono); [Google Fonts: IBM Plex Sans](https://fonts.google.com/specimen/IBM%2BPlex%2BSans)
- Portfolio practice shows the editorial-serif + grotesque pattern clearly. Examples: Roslindale + Graphik, Schnyder + Founders Grotesk, Canela + Vaud, GT Super + Aktiv Grotesk, Ogg + Untitled Sans, Lyon Text + Apercu. One uses a matched serif/sans pair from a single designer: Bianco Serif + Bianco Sans. — [Typewolf: Top 40 portfolio sites 2026](https://www.typewolf.com/portfolio-sites)
- Trend writers cite Playfair Display + Inter and DM Serif Display + Lato as free editorial pairings. — [search excerpt, 2026 trend roundups](https://www.andacademy.com/resources/blog/graphic-design/typography-trends/) (aggregator-grade source; which roundup named which pair was not verified)

### Inferences
- A serif display + sans body pair looks most cohesive when the serif's x-height and width sit close to the sans. A tall-x-height grotesque next to a small-x-height, high-contrast Didone looks mismatched at small sizes. Keep the display serif at large sizes only.
- A superfamily is the better choice when uniformity outranks expressiveness. It also fits when a mono is needed, because a matched mono (Plex Mono, Source Code Pro) sits on the same metrics as the text face and does not read as an outsider. The cost: Plex has a corporate and technical tone, which can undercut "classic editorial."
- A middle path is a Google display serif with a real weight range plus a neutral grotesque, with no mono or a mono used only for timecodes. For a video editor this reads as film-credit and editorial, not developer-tool.

### Gaps
- Google Fonts Knowledge's full text could not be fetched (client-rendered). Its examples and exact wording are unverified beyond search excerpts.
- I found no authoritative source giving a numeric x-height tolerance for pairing (for example "within 5%"). It is a visual judgment.

## 3. Role of a monospace face on a creative site; risks of overuse

### Takeaway
Authorities limit mono to code, tabular or aligned figures, and at most small metadata. Butterick is blunt: "In standard body text, there are no good reasons to use monospaced fonts." On a creative portfolio, mono as the dominant UI/label face signals "developer tool" or "tech startup" rather than classic. It also costs width and readability.

### Cited Findings
- Butterick: monospaced fonts are "harder to read" and use more horizontal space. They were made for typewriter mechanics: "They were not invented to win beauty contests." Legitimate uses: code, and tabular figures (which most proportional fonts already provide). — [Practical Typography: Monospaced fonts](https://practicaltypography.com/monospaced-fonts.html)
- Butterick: "In standard body text, there are no good reasons to use monospaced fonts. So don't." — [Practical Typography: Monospaced fonts](https://practicaltypography.com/monospaced-fonts.html)
- Mono suits code and terminals where "there is a greater need for an overall grid-like structure." — [csarven: Web typography guide](https://csarven.ca/web-typography)
- A developer-portfolio redesign issue documents this exact problem: long-form text in a mono (Google Sans Code) hurt readability. The fix kept mono only for code and small metadata such as dates and moved body text to a proportional sans. — [GitHub issue: DeveloperRyou/portfolio #26](https://github.com/DeveloperRyou/portfolio/issues/26) (single anecdotal example)
- Designer-portfolio practice: only 6 of Typewolf's 40 favorite 2026 portfolios use a mono (Cindie Mono, Roboto Mono, Basis Grotesque Mono, Apercu Mono, Space Mono twice), always next to a proportional face. — [Typewolf: Top 40 portfolio sites 2026](https://www.typewolf.com/portfolio-sites) (count made by me from the listing)
- Fontfabric files pixel and retro-computer styles under a "Digital Narrative" trend that "blends early computer aesthetics with modern storytelling." That makes the tech-mono look a trend, not a classic. — [Fontfabric: Top typography trends 2026](https://www.fontfabric.com/blog/top-typography-trends-for-2026/)
- Tabular alignment does not need a mono. Butterick says most proportional fonts include tabular figures. In CSS these are `font-variant-numeric: tabular-nums`. — [Practical Typography: Monospaced fonts](https://practicaltypography.com/monospaced-fonts.html)

### Inferences
- For a video editor, mono has one honest, on-brand use: timecode-style data (00:01:24:12), durations, frame rates and version or date stamps, in short strings at small sizes. Section labels, navigation, buttons, eyebrows, captions and client names should move to the text sans, set as small caps or uppercase with tracking.
- A usage ratio of about 99 mono to 17 body is inverted. A classic system would run roughly the other way round, with mono under about 10% of type assignments. This ratio is a judgment call; no source gives a numeric threshold.
- If the timecode look is kept, a proportional sans with `tabular-nums` handles alignment in many places where mono is currently used for that reason.

### Gaps
- I found no readability study that measures mono specifically for short UI labels, as opposed to body text. The case against mono-for-labels rests on tone and consistency, not measured legibility.
- I found no reliable source that explicitly calls monospace "overused" in 2025–2026 portfolio design. Typewolf's listing shows it is a minority choice but does not comment on it.

## 4. Type scale, weights, line-height, measure, letter-spacing; avoiding faux bold

### Takeaway
Body text: 16–20px, line-height 1.4–1.6, measure about 45–75 characters (hard cap 80), no tracking on lowercase. Display: tighter line-height (about 1.0–1.2) and zero or slightly negative tracking at large sizes. Uppercase labels get +5–12% tracking. Use a modular or fluid (clamp) scale with 2–3 heading levels and 2–3 weights total. For a display face that ships only one weight, never ask for bold: load only that weight, set headings to that weight, and add `font-synthesis: none` (or `font-synthesis-weight: none`).

### Cited Findings
**Size, leading, measure**
- Butterick: web body text 15–25px; line length 45–90 characters ("2–3 lowercase alphabets"); line spacing 120–145% of point size. — [Practical Typography: Typography in ten minutes](https://practicaltypography.com/typography-in-ten-minutes.html)
- WCAG 2.2 SC 1.4.8 (AAA): line width at most 80 characters, line spacing at least 1.5 within paragraphs, paragraph spacing at least 1.5 times line spacing, no full justification. — [W3C: Understanding SC 1.4.8](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html)
- WCAG 2.2 SC 1.4.12 (AA): layouts must survive user overrides of line-height 1.5, paragraph spacing 2x, letter spacing 0.12em and word spacing 0.16em without losing content. Fixed-height containers and clipped text fail this. — [W3C: Understanding SC 1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html)
- Line length of 50–70 or 50–75 characters, and line-height of 1.4–1.6 for longer lines, are commonly attributed to Nielsen Norman Group research. I could reach these attributions only through secondary aggregators, not NN/g directly. — [Medium: optimal line length](https://medium.com/@wblekhoa/talk-aboutthe-optimal-length-of-text-in-ux-ui-525e689f0b71); [Smashing: Balancing line length and font size](https://www.smashingmagazine.com/2014/09/balancing-line-length-font-size-responsive-web-design/)
- Material Design 3 (search excerpts): Body Large is 16px/24px line-height (1.5) with 0.5px tracking, Regular weight. Display Large is 57px, Regular. The scale has 5 roles (display, headline, title, body, label) × 3 sizes. — [Material Web: Typography](https://material-web.dev/theming/typography/); [M3 Typography](https://m3.material.io/styles/typography/applying-type)

**Scale**
- A modular scale multiplies a base size by a fixed ratio for each step up and divides for each step down. — [Smashing: Modern fluid typography using CSS clamp](https://www.smashingmagazine.com/2022/01/modern-fluid-typography-css-clamp/) (via search excerpt)
- Utopia method: pick a base size and ratio for the smallest viewport and another for the largest, then interpolate with clamp() so the scale "is always in tune with itself." The authors decline to prescribe ratios: "The exact sizes depend on a product's fonts, visual style, content, layout, and audience." — [Smashing: Meet Utopia (Gilyead & Mudford, 2021)](https://www.smashingmagazine.com/2021/04/designing-developing-fluid-type-space-scales/)

**Headings and weights**
- Butterick: "Limit yourself to three levels of headings. Two is better." Emphasize with space above and below first. Prefer bold over italic, grow size only modestly, and avoid all-caps full-sentence headings. — [Practical Typography: Headings](https://practicaltypography.com/headings.html)

**Letter-spacing**
- Butterick: caps and small caps get 5–12% extra letterspacing. Avoid letterspacing lowercase, except to add a little at very small sizes or remove a little from large headlines. Warning: "If the spaces between letters are large enough to fit more letters, you've gone overboard." — [Practical Typography: Letterspacing](https://practicaltypography.com/letterspacing.html)

**Faux bold**
- When a family lacks a bold, browsers synthesize one by smearing glyphs. Stearns calls the result "an awkward mimicry of real type design." Fixes: declare the single face for both normal and bold weights, and verify the font service actually ships the weights you use. — [A List Apart: Say No to Faux Bold (Alan Stearns, 2012)](https://alistapart.com/article/say-no-to-faux-bold/)
- `font-synthesis` (CSS Fonts Level 4) and the longhand `font-synthesis-weight` let authors forbid synthesized bold, italic and small caps. `font-synthesis: none` disables all of them. Several references note it suits single-weight display fonts and has good browser support. — [MDN: font-synthesis-weight](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-synthesis-weight); [CSS-Tricks: font-synthesis](https://css-tricks.com/almanac/properties/f/font-synthesis/); [Anders Norén: disabling faux weights](https://andersnoren.se/how-to-disable-faux-weights-with-css/)
- Stearns's 2012 article said font-synthesis had no implementations yet. That is outdated; later sources (above) describe it as supported. — [A List Apart](https://alistapart.com/article/say-no-to-faux-bold/) vs [CSS-Tricks](https://css-tricks.com/almanac/properties/f/font-synthesis/)

### Inferences
Concrete starting values synthesized from the sources above:
- **Body:** 17–18px (clamp from about 16px on mobile), line-height 1.5–1.6, max-width about 65ch, tracking 0.
- **Display (h1/h2):** fluid clamp, ratio about 1.2 on mobile rising to about 1.25–1.333 on desktop, line-height 1.05–1.15, tracking 0 to -0.01em at the largest sizes.
- **Labels/eyebrows:** text sans at 12–13px, uppercase, tracking +0.06 to +0.1em (the 5–12% band), weight 500–600.
- **Weights:** 2–3 total, for example text 400 plus 500 or 600, and display at its native weight only. Request only these weights from `next/font/google` so there is nothing to synthesize from.
- **Single-weight display face:** load `weight: '400'` only, set `font-weight: 400` explicitly on every heading (browser h1–h6 default to bold, which triggers faux bold), and add `font-synthesis: none` on the display class as a backstop. For stronger hierarchy, pick a Google display serif with a real weight axis instead.
- Avoid fixed heights on text containers so SC 1.4.12 overrides don't clip text.

### Gaps
- I could not fetch NN/g primary articles on line length or size (404 or not found). The 50–75 character figure is sourced only via aggregators.
- I found no authoritative source prescribing one "correct" scale ratio. Ratio choice is a judgment call.
- `font-synthesis` per-browser version support was not verified in a primary compat table in this pass.

## 5. What reads as "classic and professional" vs "trendy/techy" in 2025–2026

### Takeaway
The durable pattern is a restrained text face (neutral grotesque or humanist sans, or a book serif) doing most of the work, with an editorial serif limited to headlines. It dominates curated designer portfolios and matches centuries-old newspaper and book practice. The faddish signals are ultra-display distortion, reversed contrast, pixel and retro-computer ("digital narrative") styles, and heavy mono UI. Sans remains the default base; serifs are having a revival.

### Cited Findings
- Fontfabric's 2026 trends: ultra-display "type as image," dynamic width proportions, italics, reversed contrast, modern antiquas, historical references, bulky handwritten, digital narrative (pixel/retro-tech), expressive ligatures, flared serifs. Bonus note: "Sans-serif type is still the reigning champion." — [Fontfabric: Top typography trends 2026](https://www.fontfabric.com/blog/top-typography-trends-for-2026/)
- Fontfabric on modern antiquas (old-style serifs refreshed): they "give brands warmth and seriousness at the same time." — [Fontfabric](https://www.fontfabric.com/blog/top-typography-trends-for-2026/)
- 2026 roundups describe a serif revival after years of minimal sans identities, especially in editorial settings. The pattern described is serif headlines over clean supporting sans text. — [AND Academy: typography trends 2026](https://www.andacademy.com/resources/blog/graphic-design/typography-trends/); [Creative Bloq: top typography trends 2026](https://www.creativebloq.com/design/fonts-typography/breaking-rules-and-bringing-joy-top-typography-trends-for-2026) (Creative Bloq's article body could not be fetched; characterization from search excerpt)
- In Typewolf's 2026 designer-portfolio list, grotesque/neo-grotesque sans is the most common body face (Graphik, Founders Grotesk, Neue Haas Grotesk, GT America, Basis Grotesque, Helvetica, Univers and others). Contemporary display serifs (Canela, Schnyder, Editorial New, Ogg, GT Super, Roslindale) are the common headline partner. — [Typewolf: Top 40 portfolio sites 2026](https://www.typewolf.com/portfolio-sites)
- Butterick notes newspapers have long used serif headline over serif body. Low-contrast pairings are an established classic, not just high-contrast serif/sans. — [Practical Typography: Mixing fonts](https://practicaltypography.com/mixing-fonts.html)

### Inferences
- Durable: an editorial serif headline, a neutral sans body, tight font count, restrained weights, generous whitespace and measure control. These rest on long-standing book and newspaper conventions and recur across years of Typewolf portfolio lists.
- Faddish or riskier: ultra-high-contrast "maximalist" serifs (such as the Denton-style display serifs cited in trend roundups) used everywhere, extreme widths, pixel fonts, and mono-as-brand-voice. These date quickly and read as "techy" or "startup" rather than classic.
- For a video editor, "classic" likely means a film-titles and editorial register: a refined display serif for name and section heads, and a quiet sans for everything readable. A mono could appear only for timecode-like metadata, which is a genuine domain signal, not decoration.
- Free Google options that fit this register (to check against the other research threads): display serifs with real weight ranges such as Fraunces, Newsreader, Instrument Serif (single weight, so the faux-bold rules above apply), Playfair Display, Cormorant; and neutral sans such as Inter, Instrument Sans, IBM Plex Sans, Source Sans 3. This list is my own suggestion, not taken from a cited source, and each face's availability and weights should be confirmed on Google Fonts.

### Gaps
- Trend articles (Fontfabric, AND Academy, Creative Bloq, Envato and others) are vendor or marketing-adjacent and speculative by nature. None offers evidence about durability. The durable/faddish split above is inference.
- I found no Fonts In Use or Typewolf data giving usage share by year for "serif headline + grotesque body" that would quantify durability.
