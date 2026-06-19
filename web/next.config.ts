import type { NextConfig } from "next";

const apiTarget = process.env.API_PROXY_TARGET ?? "http://localhost:3100";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiTarget}/api/v1/:path*`,
      },
      {
        source: "/api/ota/:path*",
        destination: `${apiTarget}/api/ota/:path*`,
      },
      {
        source: "/api/admin/ota/:path*",
        destination: `${apiTarget}/api/admin/ota/:path*`,
      },
    ];
  },
};

export default nextConfig;
