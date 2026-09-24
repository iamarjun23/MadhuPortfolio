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
