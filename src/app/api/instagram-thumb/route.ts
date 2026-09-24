import { fetchAllowed, readCappedBody, readHtmlPrefix, withThumbLimits } from "@/lib/thumb-proxy";
import { getInstagramShortcode } from "@/lib/instagram";

/* The same arrangement as `/api/linkedin-thumb`, for the same reason: an
   Instagram reel's still lives only inside the post's own page markup. Unlike
   LinkedIn, Instagram's embed page carries no `og:image` at all - the still is
   the `<img class="EmbeddedMediaImage">` the embed renders - so that is what
   this route lifts, falling back to an `og:image` for anything that does serve
   one. The image is then streamed back through our own origin, so the browser
   never talks to Instagram directly and neither next/image nor the CSP needs
   Instagram's media hosts allow-listed. Anything that goes wrong resolves to a
   404, which callers treat exactly like a reel with no thumbnail at all - the
   card falls back to its cover photo, or to its gradient. */

export const dynamic = "force-dynamic";

const OG_IMAGE_PATTERN =
  /<meta[^>]+(?:property|name)=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image(?::secure_url)?["']/i;

/* The embed's own poster. Matched as "any img tag, then check it" rather than as
   one expression, because the class and src attributes do not appear in a fixed
   order and an expression pinning that order silently stops matching the day
   Instagram reshuffles them. */
const IMG_TAG_PATTERN = /<img\s[^>]*>/gi;
const SRC_PATTERN = /\ssrc=["']([^"']+)["']/i;

function findEmbeddedMediaImage(html: string) {
  for (const [tag] of html.matchAll(IMG_TAG_PATTERN)) {
    if (!tag.includes("EmbeddedMediaImage")) continue;
    const src = SRC_PATTERN.exec(tag)?.[1];
    if (src) return src;
  }
  return undefined;
}

const PAGE_FETCH_TIMEOUT_MS = 6000;
const IMAGE_FETCH_TIMEOUT_MS = 6000;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

/* The second fetch has to land on Instagram's own media hosts. An `og:image` tag
   is normally trustworthy, but nothing stops a malformed or tampered response
   from pointing this request somewhere we would rather our server not reach on a
   stranger's behalf. */
function isInstagramMediaHost({ hostname }: URL) {
  return (
    hostname === "cdninstagram.com" ||
    hostname.endsWith(".cdninstagram.com") ||
    hostname === "fbcdn.net" ||
    hostname.endsWith(".fbcdn.net")
  );
}

function isInstagramPageHost({ hostname }: URL) {
  return hostname === "instagram.com" || hostname.endsWith(".instagram.com");
}

// Instagram's signed media URLs carry their query params HTML-escaped in the
// markup, so `&` arrives as `&amp;`. Passed straight to fetch that breaks the
// signature and the image 404s upstream.
function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/* Every failure is logged: the card quietly falls back to its cover, so the log (Workers Logs)
   is the only place a change on Instagram's side that breaks every thumbnail shows up. */
function unavailable(shortcode: string, message: string, cause?: unknown) {
  console.warn(`Instagram thumbnail for ${shortcode}: ${message}`, cause ?? "");
  return new Response(message, {
    status: 404,
    headers: { "cache-control": "public, max-age=300" },
  });
}

async function lookupThumbnail(request: Request) {
  const target = new URL(request.url).searchParams.get("url");
  const shortcode = target ? getInstagramShortcode(target) : null;
  if (!target || !shortcode) {
    return new Response("Not an Instagram post or reel link.", { status: 400 });
  }

  /* Asked for through the embed page rather than the post itself: it carries the
     same `og:image` but is the page Instagram intends to be fetched by other
     sites, so it answers without a logged-in session far more often. */
  const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/`;
  const page = withTimeout(PAGE_FETCH_TIMEOUT_MS);
  let html: string;
  try {
    const pageResponse = await fetchAllowed(new URL(embedUrl), isInstagramPageHost, {
      signal: page.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; MadhuEditLinkPreview/1.0; +https://nmadhukumar.com)",
        accept: "text/html",
      },
    });
    if (!pageResponse?.ok) {
      const cause = pageResponse
        ? `HTTP ${pageResponse.status}`
        : "redirect refused or too many hops";
      return unavailable(shortcode, "Reel page unavailable.", cause);
    }
    html = await readHtmlPrefix(pageResponse);
  } catch (error) {
    return unavailable(shortcode, "Reel page unavailable.", error);
  } finally {
    page.cancel();
  }

  const ogMatch = OG_IMAGE_PATTERN.exec(html);
  const rawImageUrl = findEmbeddedMediaImage(html) ?? ogMatch?.[1] ?? ogMatch?.[2];
  if (!rawImageUrl) return unavailable(shortcode, "No preview image found.");

  let parsedImageUrl: URL;
  try {
    parsedImageUrl = new URL(decodeHtmlEntities(rawImageUrl));
  } catch (error) {
    return unavailable(shortcode, "No preview image found.", error);
  }
  const image = withTimeout(IMAGE_FETCH_TIMEOUT_MS);
  let contentType: string;
  let imageBody: Uint8Array<ArrayBuffer> | null;
  try {
    const imageResponse = await fetchAllowed(parsedImageUrl, isInstagramMediaHost, {
      signal: image.signal,
    });
    if (!imageResponse?.ok) {
      const cause = imageResponse
        ? `HTTP ${imageResponse.status}`
        : "redirect refused or too many hops";
      return unavailable(shortcode, "Preview image unavailable.", cause);
    }
    contentType = imageResponse.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      await imageResponse.body?.cancel();
      return unavailable(shortcode, "Preview image unavailable.");
    }
    imageBody = await readCappedBody(imageResponse, MAX_IMAGE_BYTES);
  } catch (error) {
    return unavailable(shortcode, "Preview image unavailable.", error);
  } finally {
    image.cancel();
  }
  if (!imageBody) return unavailable(shortcode, "Preview image too large.");

  return new Response(imageBody, {
    status: 200,
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
    },
  });
}

export function GET(request: Request) {
  return withThumbLimits(request, () => lookupThumbnail(request));
}
