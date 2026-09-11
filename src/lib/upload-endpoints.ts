/* The slots an upload can land in. The name is part of the object key
   (`<endpoint>/<id>`), so this list is what both the upload actions and the
   media-usage sweep that finds those keys read from - a slot added in one place
   and forgotten in the other would mean a file the sweep deletes while it is
   still in use. Kept free of Prisma imports so a client bundle can name a slot
   without dragging the database client along. */
export const uploadEndpointNames = [
  "heroVideo",
  "portrait",
  "boothImage",
  "experienceImage",
  "roomImage",
  "collaboratorImage",
  "reelVideo",
  "reelCover",
  "ogImage",
  "fallbackImage",
] as const;

export type UploadEndpoint = (typeof uploadEndpointNames)[number];

export type MediaAccept = "image/" | "video/";

/* A `startsWith("image/")` check let `image/svg+xml` through, and an SVG served
   back from our own origin is a same-origin document rather than a picture - it
   runs inline script under this app's CSP, on the origin holding the studio
   session cookie. Only the owner can upload, so this was never open to a
   stranger, but naming the formats we actually render costs nothing and closes
   it. These are also the types the public site's <img>/<video> tags can display,
   so anything outside the list would have been a broken card anyway. */
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

/* The browser sends the type alongside the bytes and may add parameters to it
   ("video/mp4; codecs=..."), so compare on the type itself. The value is still
   only the client's word - it decides how the file is served back, not what it
   contains - which is why the media route is served with `nosniff`. */
export function normalizeMimeType(contentType: string) {
  return contentType.split(";")[0]?.trim().toLowerCase() ?? "";
}

export function isAllowedMimeType(contentType: string, accept: MediaAccept) {
  const mime = normalizeMimeType(contentType);
  return mime.startsWith(accept) && allowedMimeTypes.has(mime);
}

/* What the file picker offers, derived from the allowlist so the dialog can never
   drift out of step with what the route will actually accept. */
export const acceptAttribute: Readonly<Record<MediaAccept, string>> = {
  "image/": [...allowedMimeTypes].filter((mime) => mime.startsWith("image/")).join(","),
  "video/": [...allowedMimeTypes].filter((mime) => mime.startsWith("video/")).join(","),
};

const MB = 1024 * 1024;

/* What each slot accepts and how large it may be. This lives here rather than
   beside the Prisma-typed `uploadEndpoints` map so the dropzone can read it
   without pulling the generated database client into the client bundle - and so
   there is one answer to "is this slot a video?". The dropzone used to decide
   that with `endpoint === "heroVideo"`, which quietly made every `reelVideo`
   field an image field: it offered image types in the picker, held them to the
   4MB image limit and refused the video the field exists for. */
export const endpointLimits: Record<UploadEndpoint, { accept: MediaAccept; maxBytes: number }> = {
  heroVideo: { accept: "video/", maxBytes: 64 * MB },
  portrait: { accept: "image/", maxBytes: 4 * MB },
  boothImage: { accept: "image/", maxBytes: 4 * MB },
  experienceImage: { accept: "image/", maxBytes: 4 * MB },
  roomImage: { accept: "image/", maxBytes: 4 * MB },
  collaboratorImage: { accept: "image/", maxBytes: 4 * MB },
  reelVideo: { accept: "video/", maxBytes: 64 * MB },
  reelCover: { accept: "image/", maxBytes: 4 * MB },
  ogImage: { accept: "image/", maxBytes: 4 * MB },
  fallbackImage: { accept: "image/", maxBytes: 4 * MB },
};
