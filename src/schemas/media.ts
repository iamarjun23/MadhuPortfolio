import { z } from "zod";

import { uploadEndpointNames } from "@/lib/upload-endpoints";

/* `z.url()` on its own accepts any parseable URL, `javascript:` and
   `data:text/html,...` included, so a hand-entered address was only kept out of
   an attribute by the page's CSP rather than by validation. Media is fetched, so
   the only schemes that make sense here are the two that fetch. Studio uploads
   are stored as their complete media-domain address, so they pass this too. */
const externalMediaUrl = z.url({ protocol: /^https?$/ });

// ponytail: uploads made before R2's custom domain were stored as `/api/media/<key>`, and every
// public read parses stored content through this schema - rejecting them would 500 the site until
// `pnpm media:rewrite-urls` runs. Drop this branch once that has run in production.
const legacyUploadPath = new RegExp(
  `^/api/media/(?:${uploadEndpointNames.join("|")})/[0-9a-f-]{36}$`,
  "i",
);

export const MediaUrlSchema = z.union([externalMediaUrl, z.string().regex(legacyUploadPath)]);
