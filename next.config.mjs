/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `pg`'s Cloudflare Workers support (`pg-cloudflare`) uses a "workerd"-conditional export that
  // Next's file tracer resolves differently than OpenNext's later esbuild bundle pass, so the
  // tracer's default build only copies part of the package — leaving `dist/index.js` missing when
  // OpenNext re-bundles for Workers. Marking these external makes Next copy the packages' full,
  // untraced directories into the standalone output instead, carrying the whole file through.
  serverExternalPackages: ["pg", "pg-cloudflare"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "madhu.edit" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
  async headers() {
    const isDev = process.env.NODE_ENV === "development";
    const scriptSrc = `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`;
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://madhu.edit https://placehold.co https://images.pexels.com",
      "media-src 'self' blob: https://videos.pexels.com",
      "frame-src 'self' https://www.youtube-nocookie.com",
      "connect-src 'self'",
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
    return [{ source: "/admin/:path*", destination: "/studio/:path*", permanent: false }];
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
