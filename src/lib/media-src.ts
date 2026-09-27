/* Which image addresses are our own uploads. Kept apart from the `"use client"` image
   loader so server components can call it too. */

const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL;
const legacyPrefix = "/api/media/";

/** The R2 object key behind an upload's address, or null for any other source. A
    not-yet-rewritten `/api/media/<key>` address names the same object. */
export function uploadKey(src: string) {
  if (mediaUrl && src.startsWith(`${mediaUrl}/`)) return src.slice(mediaUrl.length + 1);
  if (src.startsWith(legacyPrefix)) return src.slice(legacyPrefix.length);
  return null;
}

export function isUploadedMediaSrc(src: string) {
  return uploadKey(src) !== null;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const thumbRoutes = ["/api/linkedin-thumb?", "/api/instagram-thumb?"];

/** What the Cloudflare image loader resizes `src` from - an upload's R2 key, or the live
    site's full address for one of our thumbnail routes - or null when it cannot resize it.
    The routes answer ~1s later on every request, as the Worker's responses are not cached
    at the edge; a transformation is. Without NEXT_PUBLIC_SITE_URL they are served as-is. */
export function loaderSourceUrl(src: string) {
  if (siteUrl && thumbRoutes.some((route) => src.startsWith(route))) return `${siteUrl}${src}`;
  return uploadKey(src);
}

/** An uploaded video run through Cloudflare Media Transformations - a still frame
    (`mode=frame,...`) or a smaller re-encode (`mode=video,...`), each cached at the edge -
    or null for any other source. */
export function transformedVideoSrc(src: string, options: string) {
  const key = uploadKey(src);
  return mediaUrl && key ? `${mediaUrl}/cdn-cgi/media/${options}/${key}` : null;
}
