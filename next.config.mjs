/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [{ source: "/admin/:path*", destination: "/studio/:path*", permanent: false }];
  },
};

export default nextConfig;
