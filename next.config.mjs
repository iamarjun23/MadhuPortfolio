// Uploads are served from R2's custom domain (e.g. https://media.nmadhukumar.com), no trailing slash.
const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `pg`'s Cloudflare Workers support (`pg-cloudflare`) uses a "workerd"-conditional export that
  // Next's file tracer resolves differently than OpenNext's later esbuild bundle pass, so the
  // tracer's default build only copies part of the package — leaving `dist/index.js` missing when
  // OpenNext re-bundles for Workers. Marking these external makes Next copy the packages' full,
  // untraced directories into the standalone output instead, carrying the whole file through.
  serverExternalPackages: ["pg", "pg-cloudflare", "@prisma/client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "madhu.edit" },
      { protocol: "https", hostname: "images.pexels.com" },
      // Work project cards fall back to the thumbnail of the project's YouTube video.
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
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
      `img-src 'self' data: blob: https://madhu.edit https://images.pexels.com https://i.ytimg.com ${mediaUrl}`,
      `media-src 'self' blob: https://videos.pexels.com ${mediaUrl}`,
      // A reel card plays a YouTube video, an Instagram reel or a LinkedIn post
      // in place, on both the work board and the Drawing Room pinboard.
      "frame-src 'self' https://www.youtube-nocookie.com https://www.linkedin.com https://www.instagram.com",
      // The studio PUTs uploads straight to R2 through a signed URL (actions/media.ts).
      "connect-src 'self' https://cloudflareinsights.com https://*.r2.cloudflarestorage.com",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
  async redirects() {
    const redirects = [{ source: "/admin/:path*", destination: "/studio/:path*", permanent: false }];

    // Old `/api/media/<key>` links (share previews scrapers cached, pages not yet revalidated) now
    // live on R2's custom domain.
    if (mediaUrl) {
      redirects.push({ source: "/api/media/:key*", destination: `${mediaUrl}/:key*`, permanent: true });
    }

    // The Worker serves only the public site; the studio and its sign-in run on Vercel, which
    // sets VERCEL during its own build - so the studio deployment can never redirect to itself.
    // OpenNext answers these from its routing layer, without booting the Next server.
    const studioUrl = process.env.VERCEL ? undefined : process.env.STUDIO_URL;
    if (studioUrl) {
      for (const source of ["/studio/:path*", "/login", "/api/auth/:path*"]) {
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
