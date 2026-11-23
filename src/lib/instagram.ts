/* A reel card can point at Instagram as well as YouTube or LinkedIn. Instagram
   gives every public post, reel and IGTV item an embed page of its own, so the
   pop-up can play it in place; the still, like LinkedIn's, lives only inside the
   post's own markup, so it comes back through our own `/api/instagram-thumb`
   route rather than a predictable CDN address. */

/* Instagram hands out two shapes of the same link and the app itself copies
   either one: the bare `/reel/<code>/`, and the `/<username>/reel/<code>/` form
   you get from a profile. The username segment is optional here so both work. */
const SHORTCODE_PATTERN = /^(?:\/[A-Za-z0-9._]+)?\/(?:reels?|p|tv)\/([A-Za-z0-9_-]+)/;

export function getInstagramShortcode(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "instagram.com" && !host.endsWith(".instagram.com")) return null;

    return SHORTCODE_PATTERN.exec(url.pathname)?.[1] ?? null;
  } catch {
    return null;
  }
}

/* Instagram serves the same embed page for a reel and a feed post, so one
   address covers both. `captioned` keeps the caption out of the frame - the card
   already carries its own words. */
export function getInstagramEmbed(value: string | null) {
  const shortcode = getInstagramShortcode(value);
  return shortcode ? `https://www.instagram.com/p/${shortcode}/embed/` : null;
}

/* A reel is shot vertically and a feed post is usually square, so the pop-up has
   to know which shape to open at rather than forcing everything into 16:9. */
export function isInstagramReel(value: string | null) {
  if (!getInstagramShortcode(value)) return null;

  try {
    return /^(?:\/[A-Za-z0-9._]+)?\/reels?\//.test(new URL(value!).pathname);
  } catch {
    return false;
  }
}

export function getInstagramThumbnail(value: string | null) {
  const shortcode = getInstagramShortcode(value);
  // One address per post however it was linked (reel, profile path, query string), so they
  // share one cached image. The route serves the same embed for /p/, /reel/ and /tv/.
  const canonical = shortcode ? `https://www.instagram.com/p/${shortcode}/` : null;
  return canonical ? `/api/instagram-thumb?url=${encodeURIComponent(canonical)}` : null;
}

/* The embed page's own poster, the `<img class="EmbeddedMediaImage">` it renders.
   Matched as "any img tag, then check it" rather than as one expression, because the
   class and src attributes do not appear in a fixed order and an expression pinning
   that order silently stops matching the day Instagram reshuffles them. Attributes
   are read whole and in order, each up to its own closing quote, so a caption's `alt`
   text containing `src='...'` cannot stand in for the real `src`. The tag bound is
   generous because the poster's `srcset` alone runs ~9KB. */
const IMG_TAG_PATTERN = /<img\s[^>]{0,32000}>/gi;
const ATTRIBUTE_PATTERN = /\s([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

export function findEmbeddedMediaImage(html: string) {
  for (const [tag] of html.matchAll(IMG_TAG_PATTERN)) {
    if (!tag.includes("EmbeddedMediaImage")) continue;
    for (const [, name, doubleQuoted, singleQuoted] of tag.matchAll(ATTRIBUTE_PATTERN)) {
      const value = doubleQuoted ?? singleQuoted;
      if (name?.toLowerCase() === "src" && value) return value;
    }
  }
  return undefined;
}
