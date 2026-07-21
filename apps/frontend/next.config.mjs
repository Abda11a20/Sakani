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

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://apis.google.com https://accept.paymob.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://api.dicebear.com https://accept.paymob.com;
  connect-src 'self' ${apiOrigin} https://accept.paymob.com https://*.pusher.com wss://*.pusher.com https://res.cloudinary.com;
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
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "Content-Security-Policy",
    value: cspHeader,
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // PWA manifest يُضاف عبر <link> في الـ layout — لا نحتاج مكتبة خارجية
  experimental: {
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  images: {
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
