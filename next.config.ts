import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: { serverFunctions: false, incomingRequests: false },
  experimental: { serverActions: { bodySizeLimit: "16mb" } },
  reactCompiler: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }, { protocol: "http", hostname: "**" }],
  },
  // The service worker must never be served from cache, or a fix to it can
  // take days to reach customers whose browsers hold the old copy.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  async rewrites() {
    // Fallback rewrites run after Next's static and dynamic routes. Using the
    // default array form would proxy `/api/*` before dynamic route handlers
    // such as `/api/admin/backup/[id]/download`, stripping the cookie-based
    // Authorization header those handlers add server-side.
    return {
      fallback: [
        {
          source: "/api/:path*",
          destination: "http://localhost:4000/api/:path*",
        },
        {
          source: "/uploads/:path*",
          destination: "http://localhost:4000/uploads/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
