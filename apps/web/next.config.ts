import type { NextConfig } from "next";

const apiOrigin = process.env.API_PROXY_TARGET ?? "http://127.0.0.1:3001";

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${apiOrigin}/:path*`,
      },
      // En producción nginx sirve /storage; en local lo atiende la API.
      {
        source: "/storage/:path*",
        destination: `${apiOrigin}/storage/:path*`,
      },
    ];
  },
};

export default nextConfig;
