import mediaHosts from "./src/lib/media-hosts.json" with { type: "json" };

// Uploads are served from R2's custom domain (e.g. https://media.nmadhukumar.com), no trailing slash.
const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL ?? "";

// On Vercel this deployment serves only the studio (see DEPLOYMENT.md): studio.<domain> has no
// /studio segment, so every studio link and the middleware rewrite that backs it need to agree
// on the same base path. Exposed to the browser bundle too, since Rail/LoginForm build hrefs client-side.
const studioBase = process.env.VERCEL ? "" : "/studio";

// The Vercel build serves the studio's sign-in. A missing secret would otherwise only surface as a
// runtime error on the first login, and a missing AUTH_URL would leave sign-in URLs to be built
// from request headers, so both stop the deploy instead. The Worker build never runs auth.
if (process.env.VERCEL) {
  if ((process.env.AUTH_SECRET ?? "").length < 32) {
    throw new Error("AUTH_SECRET must be set to at least 32 characters (openssl rand -base64 32).");
  }
  if (process.env.VERCEL_ENV === "production" && !process.env.AUTH_URL?.startsWith("https://")) {
    throw new Error("AUTH_URL must be set to the studio's https:// origin for production builds.");
  }
  // Without these a publish updates the database but never clears the Worker's cache.
  if (process.env.VERCEL_ENV === "production") {
    if (!process.env.PUBLIC_SITE_URL?.startsWith("https://")) {
      throw new Error(
        "PUBLIC_SITE_URL must be set to the live site's https:// origin for production builds.",
      );
    }
    if ((process.env.REVALIDATE_SECRET ?? "").length < 32) {
      throw new Error(
        "REVALIDATE_SECRET must be at least 32 characters (openssl rand -base64 32), the same value as the Worker secret, for production builds.",
      );
    }
    // Without it the media schema has no upload host to check stored addresses against.
    if (!process.env.NEXT_PUBLIC_MEDIA_URL?.startsWith("https://")) {
      throw new Error(
        "NEXT_PUBLIC_MEDIA_URL must be set to the media https:// origin for production builds.",
      );
    }
  }
}

/* The Worker build (OpenNext sets NEXT_PRIVATE_STANDALONE before it runs `next build`) needs
   STUDIO_URL baked in: without it the Worker gets no /studio, /login or /api/auth redirects and
   would serve the Studio sign-in itself. For a local `pnpm preview`, use http://localhost:3000. */
if (
  !process.env.VERCEL &&
  process.env.NEXT_PRIVATE_STANDALONE === "true" &&
  !process.env.STUDIO_URL
) {
  throw new Error("STUDIO_URL must be set for the Worker build (see DEPLOYMENT.md).");
}

// The studio PUTs uploads to this account's R2 endpoint only; any other account's is refused.
const r2Endpoint = process.env.R2_ACCOUNT_ID
  ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  : "https://*.r2.cloudflarestorage.com";

// The same host lists src/schemas/media.ts validates stored media addresses against, so the
// studio can only save an image or video the CSP below will let the page load.
const imageHosts = mediaHosts.image.map((host) => `https://${host}`).join(" ");
const videoHosts = mediaHosts.video.map((host) => `https://${host}`).join(" ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: { NEXT_PUBLIC_STUDIO_BASE: studioBase },
  // `pg`'s Cloudflare Workers support (`pg-cloudflare`) uses a "workerd"-conditional export that
  // Next's file tracer resolves differently than OpenNext's later esbuild bundle pass, so the
  // tracer's default build only copies part of the package — leaving `dist/index.js` missing when
  // OpenNext re-bundles for Workers. Marking these external makes Next copy the packages' full,
  // untraced directories into the standalone output instead, carrying the whole file through.
  serverExternalPackages: ["pg", "pg-cloudflare", "@prisma/client"],
  images: {
    // Uploads are resized by Cloudflare Image Transformations (see the loader); every width
    // below is a separate transformation against the free plan's 5,000 a month, so keep it short.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    // 2560 covers a full-width image on a 2x (Retina) desktop at full sharpness.
    deviceSizes: [640, 960, 1280, 1920, 2560],
    imageSizes: [128, 256, 384],
    // 90 is visually indistinguishable from the originals, even zoomed in, and still ~95%
    // smaller than them; Next 16 requires the allowed qualities to be listed.
    qualities: [90],
    // Includes i.ytimg.com: work project cards fall back to their YouTube video's thumbnail.
    remotePatterns: mediaHosts.image.map((hostname) => ({ protocol: "https", hostname })),
    /* The loader is custom, so the app never requests /_next/image, but OpenNext's Worker still
       answers it. Its redirect hops are not re-checked against remotePatterns, so follow none. */
    maximumRedirects: 0,
  },
  async headers() {
    const isDev = process.env.NODE_ENV === "development";
    // Cloudflare injects the Web Analytics beacon into every proxied HTML response, so the
    // script and the endpoint it reports to have to be allowed here or the browser blocks it.
    const scriptSrc = `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com${isDev ? " 'unsafe-eval'" : ""}`;
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: ${imageHosts} ${mediaUrl}`,
      `media-src 'self' blob: ${videoHosts} ${mediaUrl}`,
      // A reel card plays a YouTube video, an Instagram reel or a LinkedIn post
      // in place, on both the work board and the Drawing Room pinboard. The menu's Resume link
      // fetches the PDF's download copy from R2 in a hidden frame.
      `frame-src 'self' https://www.youtube-nocookie.com https://www.linkedin.com https://www.instagram.com ${mediaUrl}`,
      // The studio PUTs uploads straight to R2 through a signed URL (actions/media.ts).
      `connect-src 'self' https://cloudflareinsights.com ${r2Endpoint}`,
    ].join("; ");

    /* This policy, with 'unsafe-inline' scripts, is the public site's: its pages are cached
       ahead of time, so they cannot carry a per-request nonce. The Studio deployment (Vercel)
       renders per request and gets a nonce-only policy from src/middleware.ts instead, so this
       one is not sent there. Local dev serves both with this one. */
    const policyHeader = process.env.VERCEL
      ? []
      : [{ key: "Content-Security-Policy", value: contentSecurityPolicy }];

    return [
      {
        source: "/:path*",
        headers: [
          ...policyHeader,
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Both sites are https-only; a dev server on http://localhost is left alone. Not
          // includeSubDomains: that would also bind every other name in the zone to https.
          ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]),
        ],
      },
    ];
  },
  async redirects() {
    const redirects = [
      { source: "/admin/:path*", destination: "/studio/:path*", permanent: false },
      // The resume page is gone; the menu's Resume link opens the PDF itself.
      { source: "/resume", destination: "/", permanent: true },
    ];

    // Old `/api/media/<key>` links (share previews scrapers cached, pages not yet revalidated) now
    // live on R2's custom domain.
    if (mediaUrl) {
      redirects.push({
        source: "/api/media/:key*",
        destination: `${mediaUrl}/:key*`,
        permanent: true,
      });
    }

    // The Worker serves only the public site; the studio and its sign-in run on Vercel, which
    // sets VERCEL during its own build - so the studio deployment can never redirect to itself.
    // OpenNext answers these from its routing layer, without booting the Next server.
    const studioUrl = process.env.VERCEL ? undefined : process.env.STUDIO_URL;
    if (studioUrl) {
      // The studio host serves its own routes at the bare path (no /studio segment), so drop it here.
      redirects.push({
        source: "/studio/:path*",
        destination: `${studioUrl}/:path*`,
        permanent: false,
      });
      for (const source of ["/login", "/api/auth/:path*"]) {
        redirects.push({ source, destination: `${studioUrl}${source}`, permanent: false });
      }
    }

    return redirects;
  },
};

export default nextConfig;

// Mirrors Cloudflare Workers bindings (Hyperdrive, etc.) into `process.env` for `next dev`,
// so local dev matches the Workers runtime without touching the config above.
// Guarded to dev only: `next build` (both locally and in Cloudflare Workers Builds) always sets
// NODE_ENV=production, and calling this during a build requires a local binding emulation setup
// that CI has no reason to have — the real bindings come from the deployed Worker at runtime.
if (process.env.NODE_ENV === "development") {
  const { initOpenNextCloudflareForDev } = await import("@opennextjs/cloudflare");
  await initOpenNextCloudflareForDev();
}
