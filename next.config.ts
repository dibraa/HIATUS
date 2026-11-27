import type { NextConfig } from "next";

const apiOrigin = (
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000/api"
).replace(/\/api\/?$/, "");

const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://accounts.google.com https://www.google.com https://www.gstatic.com https://www.recaptcha.net`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://accounts.google.com https://us.i.posthog.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io",
      "frame-src https://accounts.google.com https://www.google.com https://www.recaptcha.net",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  logging: { serverFunctions: false, incomingRequests: false },
  experimental: { serverActions: { bodySizeLimit: "16mb" } },
  reactCompiler: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  // The service worker must never be served from cache, or a fix to it can
  // take days to reach customers whose browsers hold the old copy.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
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
          destination: `${apiOrigin}/api/:path*`,
        },
        {
          source: "/uploads/:path*",
          destination: `${apiOrigin}/uploads/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
