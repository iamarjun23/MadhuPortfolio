import { z } from "zod";

const uploadedMediaPath =
  /^\/api\/media\/(?:heroVideo|portrait|boothImage|logoImage|praiseImage|experienceImage|impactImage|roomImage|ogImage)\/[0-9a-f-]{36}$/i;

// Studio uploads are served from this application's same-origin media route;
// hand-entered external media must remain a complete URL.
export const MediaUrlSchema = z.union([z.url(), z.string().regex(uploadedMediaPath)]);
