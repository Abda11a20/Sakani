// apps/frontend/next.config.mjs
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Helper to extract clean origin (scheme + host) for CSP connect-src
const getOrigin = (urlStr) => {
  if (!urlStr) return "";
  try {
    return new URL(urlStr).origin;
  } catch {
    return urlStr;
  }
};

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const apiOrigin = getOrigin(rawApiUrl);

// في dev محتاجين 'unsafe-eval' عشان Next.js HMR / React Fast Refresh
// في production لا نسمح بيها أبداً لأنها تُضعف الحماية من XSS
const isDev = process.env.NODE_ENV === "development";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://apis.google.com https://accept.paymob.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob: https: https://res.cloudinary.com https://images.unsplash.com https://api.dicebear.com https://accept.paymob.com https://*.tile.openstreetmap.org https://unpkg.com;
  media-src 'self' data: blob: https:;
  connect-src 'self' ${apiOrigin} https://accept.paymob.com https://*.pusher.com wss://*.pusher.com https://res.cloudinary.com https://nominatim.openstreetmap.org;
  frame-src 'self' https://accept.paymob.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://accept.paymob.com;
  frame-ancestors 'self';
`.replace(/\s{2,}/g, " ").trim();

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: cspHeader,
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(self https://accept.paymob.com), fullscreen=(self)",
  },
  {
    key: "X-Permitted-Cross-Domain-Policies",
    value: "none",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // PWA manifest يُضاف عبر <link> في الـ layout — لا نحتاج مكتبة خارجية
  transpilePackages: ["leaflet", "react-leaflet"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      // Security headers على كل الصفحات
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // Cache-Control للـ static assets (JS, CSS, fonts)
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache الصور
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=3600",
          },
        ],
      },
    ];
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default withNextIntl(nextConfig);
