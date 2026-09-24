import { z } from "zod";

import mediaHosts from "@/lib/media-hosts.json";
import { uploadEndpointNames } from "@/lib/upload-endpoints";

/* Every stored media address must be one the page is actually allowed to load. The
   hosts come from `media-hosts.json`, the same list next.config.mjs builds the CSP
   and next/image patterns from, plus the R2 media domain - so the studio can no
   longer save an address the live page would then refuse to show. */
const uploadHost = process.env.NEXT_PUBLIC_MEDIA_URL
  ? new URL(process.env.NEXT_PUBLIC_MEDIA_URL).hostname
  : null;

function hostedOn(hosts: readonly string[], kind: string) {
  // Without the media domain configured (a local run with uploads off) there is no complete
  // list to check against; the CSP, built from the same values, still blocks strays.
  const allowed = uploadHost ? new Set([...hosts, uploadHost]) : null;
  return (
    z
      .url({ protocol: /^https$/ })
      // An unparseable value is already reported by the url check, so only judge hosts of real URLs.
      .refine((value) => !allowed || !URL.canParse(value) || allowed.has(new URL(value).hostname), {
        message: hosts.length
          ? `${kind} must be uploaded here or come from ${hosts.join(", ")}.`
          : `${kind} must be uploaded here.`,
      })
  );
}

// ponytail: uploads made before R2's custom domain were stored as `/api/media/<key>`, and every
// public read parses stored content through this schema - rejecting them would 500 the site until
// `pnpm media:rewrite-urls` runs. Drop this branch once that has run in production.
const legacyUploadPath = z
  .string()
  .regex(new RegExp(`^/api/media/(?:${uploadEndpointNames.join("|")})/[0-9a-f-]{36}$`, "i"));

/** An image or video poster: an upload, or one of the allowed image hosts. */
export const ImageUrlSchema = z.union([hostedOn(mediaHosts.image, "Images"), legacyUploadPath]);
/** A video file: an upload, or one of the allowed video hosts. */
export const VideoUrlSchema = z.union([hostedOn(mediaHosts.video, "Videos"), legacyUploadPath]);
/** A document (the resume PDF): only ever an upload. */
export const DocumentUrlSchema = z.union([hostedOn([], "Documents"), legacyUploadPath]);
