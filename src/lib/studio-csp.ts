import mediaHosts from "@/lib/media-hosts.json";

/* The Studio's Content-Security-Policy, sent by the middleware on the Vercel deployment.
   Unlike the public site's policy (next.config.mjs), it allows no inline script without
   this request's nonce: the Studio renders per request anyway, and it is the origin that
   holds the owner's session cookie. Next.js reads the nonce back out of this header and
   puts it on its own scripts. Image, media and frame sources match the public policy so
   the Studio preview shows everything the live page can. */
export function studioContentSecurityPolicy(nonce: string, isDev: boolean) {
  const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL ?? "";
  const imageHosts = mediaHosts.image.map((host) => `https://${host}`).join(" ");
  const videoHosts = mediaHosts.video.map((host) => `https://${host}`).join(" ");
  const r2Endpoint = process.env.R2_ACCOUNT_ID
    ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : "https://*.r2.cloudflarestorage.com";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    // 'strict-dynamic' lets the nonce'd Next.js runtime load its own chunks.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // React sets style attributes on elements, which only 'unsafe-inline' allows.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${imageHosts} ${mediaUrl}`,
    `media-src 'self' blob: ${videoHosts} ${mediaUrl}`,
    `frame-src 'self' https://www.youtube-nocookie.com https://www.linkedin.com https://www.instagram.com ${mediaUrl}`,
    `connect-src 'self' ${r2Endpoint}`,
  ].join("; ");
}
