"use client";

import type { ImageLoaderProps } from "next/image";
import { loaderSourceUrl } from "@/lib/media-src";

/* Uploads live on R2's custom domain, which sits in the Cloudflare zone with Image
   Transformations switched on, so any width of any upload is one URL away:
   `<media>/cdn-cgi/image/width=640,.../<key>`. Cloudflare resizes, re-encodes to AVIF or
   WebP for the browser asking, and caches the result at the edge - nothing runs on the
   Worker and nothing extra is stored in R2. The same goes for our LinkedIn/Instagram
   thumbnail routes, fetched from the live site by their full address. The free plan counts
   each new (image, options) pair against 5,000 transformations a month, which is why
   next.config.mjs keeps the list of widths short. MediaImage marks every other source
   `unoptimized`, so only these ever reach this loader. */
export default function cloudflareImageLoader({ src, width, quality }: ImageLoaderProps) {
  const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL;
  const source = loaderSourceUrl(src);
  if (!mediaUrl || !source) return src;
  return `${mediaUrl}/cdn-cgi/image/width=${width},quality=${quality ?? 90},format=auto/${source}`;
}
