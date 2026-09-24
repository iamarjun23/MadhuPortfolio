import { fetchAllowed, readCappedBody, readHtmlPrefix, withThumbLimits } from "@/lib/thumb-proxy";
import { getLinkedInUrn } from "@/lib/linkedin";

/* A LinkedIn post carries no thumbnail at a predictable URL the way a YouTube
   video does - the still lives only inside the post's own page markup, as the
   `og:image` tag LinkedIn already serves to Slack, iMessage and every other
   site that unfurls a LinkedIn link into a preview card. This route does the
   same: fetch the post's embed page, lift that one tag, then stream the image
   it points to back through our own origin so the browser never talks to
   LinkedIn directly. Anything that goes wrong along the way - the page fails
   to load, carries no usable tag, or points somewhere we do not expect -
   resolves to a 404, which callers treat exactly like a project with no
   thumbnail at all. */

export const dynamic = "force-dynamic";

const OG_IMAGE_PATTERN =
  /<meta[^>]+(?:property|name)=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image(?::secure_url)?["']/i;

const PAGE_FETCH_TIMEOUT_MS = 6000;
const IMAGE_FETCH_TIMEOUT_MS = 6000;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timer),
  };
}

/* The image itself has to come from LinkedIn's own media host - an `og:image`
   tag is normally trustworthy, but nothing stops a compromised or malformed
   response from pointing this second fetch somewhere we would rather not ask
   our server to reach on a stranger's behalf. */
function isLinkedInMediaHost({ hostname }: URL) {
  return hostname === "licdn.com" || hostname.endsWith(".licdn.com");
}

function isLinkedInPageHost({ hostname }: URL) {
  return hostname === "linkedin.com" || hostname.endsWith(".linkedin.com");
}

// The `content` attribute we lift the image address out of is HTML-escaped
// like any other markup, so a signed LinkedIn media URL comes out with its
// `&` between query params written as `&amp;` - passed straight to `fetch`,
// that breaks the signature check and the image 404s upstream.
function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/* Every failure is logged: the card quietly falls back to its cover, so the log (Workers Logs)
   is the only place a change on LinkedIn's side that breaks every thumbnail shows up. */
function unavailable(urn: string, message: string, cause?: unknown) {
  console.warn(`LinkedIn thumbnail for ${urn}: ${message}`, cause ?? "");
  return new Response(message, {
    status: 404,
    headers: { "cache-control": "public, max-age=300" },
  });
}

async function lookupThumbnail(request: Request) {
  const target = new URL(request.url).searchParams.get("url");
  const urn = target ? getLinkedInUrn(target) : null;
  if (!target || !urn) {
    return new Response("Not a LinkedIn post link.", { status: 400 });
  }

  const page = withTimeout(PAGE_FETCH_TIMEOUT_MS);
  let html: string;
  try {
    /* The embed page, not the post itself: LinkedIn answers the public post page with a 404
       for this client, but the embed page is meant to be fetched by other sites and carries
       the same `og:image`. Built from the urn, so any accepted link shape works. */
    const pageUrl = new URL(`https://www.linkedin.com/embed/feed/update/${urn}`);
    const pageResponse = await fetchAllowed(pageUrl, isLinkedInPageHost, {
      signal: page.signal,
      headers: {
        // Identifies the fetch as what it is - a preview lookup for a link
        // pasted into the site's own studio - the same way a chat app's link
        // unfurler introduces itself before it asks for a page's OG tags.
        "user-agent":
          "Mozilla/5.0 (compatible; MadhuEditLinkPreview/1.0; +https://nmadhukumar.com)",
        accept: "text/html",
      },
    });
    if (!pageResponse?.ok) {
      const cause = pageResponse
        ? `HTTP ${pageResponse.status}`
        : "redirect refused or too many hops";
      return unavailable(urn, "Post page unavailable.", cause);
    }
    html = await readHtmlPrefix(pageResponse);
  } catch (error) {
    return unavailable(urn, "Post page unavailable.", error);
  } finally {
    page.cancel();
  }

  const match = OG_IMAGE_PATTERN.exec(html);
  const rawImageUrl = match?.[1] ?? match?.[2];
  if (!rawImageUrl) return unavailable(urn, "No preview image found.");
  const imageUrl = decodeHtmlEntities(rawImageUrl);

  let parsedImageUrl: URL;
  try {
    parsedImageUrl = new URL(imageUrl);
  } catch (error) {
    return unavailable(urn, "No preview image found.", error);
  }
  const image = withTimeout(IMAGE_FETCH_TIMEOUT_MS);
  let contentType: string;
  let imageBody: Uint8Array<ArrayBuffer> | null;
  try {
    const imageResponse = await fetchAllowed(parsedImageUrl, isLinkedInMediaHost, {
      signal: image.signal,
    });
    if (!imageResponse?.ok) {
      const cause = imageResponse
        ? `HTTP ${imageResponse.status}`
        : "redirect refused or too many hops";
      return unavailable(urn, "Preview image unavailable.", cause);
    }
    contentType = imageResponse.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      await imageResponse.body?.cancel();
      return unavailable(urn, "Preview image unavailable.");
    }
    imageBody = await readCappedBody(imageResponse, MAX_IMAGE_BYTES);
  } catch (error) {
    return unavailable(urn, "Preview image unavailable.", error);
  } finally {
    image.cancel();
  }
  if (!imageBody) return unavailable(urn, "Preview image too large.");

  return new Response(imageBody, {
    status: 200,
    headers: {
      "content-type": contentType,
      // A post's preview image never changes once published, so this is safe
      // to hold onto for a long while at both the browser and any edge cache
      // in front of this route.
      "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
    },
  });
}

export function GET(request: Request) {
  return withThumbLimits(request, () => lookupThumbnail(request));
}
