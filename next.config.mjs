/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "madhu.edit" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "**.ufs.sh" },
      { protocol: "https", hostname: "**.uploadthing.com" },
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
      "img-src 'self' data: blob: https://madhu.edit https://placehold.co https://images.pexels.com https://*.ufs.sh https://*.uploadthing.com",
      "media-src 'self' blob: https://videos.pexels.com https://*.ufs.sh https://*.uploadthing.com",
      "frame-src 'self' https://www.youtube-nocookie.com",
      "connect-src 'self' https://api.uploadthing.com https://*.ufs.sh https://*.uploadthing.com",
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
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
await initOpenNextCloudflareForDev();
