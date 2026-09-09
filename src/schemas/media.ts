import { z } from "zod";

import { uploadEndpointNames } from "@/lib/upload-endpoints";

const uploadedMediaPath = new RegExp(
  `^/api/media/(?:${uploadEndpointNames.join("|")})/[0-9a-f-]{36}$`,
  "i",
);

/* `z.url()` on its own accepts any parseable URL, `javascript:` and
   `data:text/html,...` included, so a hand-entered address was only kept out of
   an attribute by the page's CSP rather than by validation. Media is fetched, so
   the only schemes that make sense here are the two that fetch. */
const externalMediaUrl = z.url({ protocol: /^https?$/ });

// Studio uploads are served from this application's same-origin media route;
// hand-entered external media must remain a complete URL.
export const MediaUrlSchema = z.union([externalMediaUrl, z.string().regex(uploadedMediaPath)]);
