// apps/frontend/src/middleware.ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest } from "next/server";

const handleNextIntlRouting = createMiddleware(routing);

// Helper to extract clean origin for CSP
const getOrigin = (urlStr: string | undefined) => {
  if (!urlStr) return "";
  try {
    return new URL(urlStr).origin;
  } catch {
    return urlStr;
  }
};

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const apiOrigin = getOrigin(rawApiUrl);
const isDev = process.env.NODE_ENV === "development";

export default function middleware(request: NextRequest) {
  // Generate cryptographically secure random base64 nonce per request
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' ${isDev ? "'unsafe-eval'" : ""} https://apis.google.com https://accept.paymob.com https://www.googletagmanager.com https://*.googletagmanager.com https://*.clarity.ms;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com;
    font-src 'self' https://fonts.gstatic.com data:;
    img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://api.dicebear.com https://accept.paymob.com https://*.tile.openstreetmap.org https://unpkg.com https://*.clarity.ms https://c.bing.com https://*.bing.com https://*.google-analytics.com https://*.googletagmanager.com https://www.google.com https://www.google.com.eg;
    media-src 'self' data: blob: https://res.cloudinary.com;
    connect-src 'self' ${apiOrigin} https://accept.paymob.com https://*.pusher.com wss://*.pusher.com https://res.cloudinary.com https://nominatim.openstreetmap.org https://analytics.google.com https://www.google.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.clarity.ms https://*.sentry.io https://stats.g.doubleclick.net;
    frame-src 'self' https://accept.paymob.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self' https://accept.paymob.com;
    frame-ancestors 'self';
  `.replace(/\s{2,}/g, " ").trim();

  // Pass x-nonce header to request headers for Next.js App Router headers()
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = handleNextIntlRouting(request);

  // Set dynamic Enforcement CSP header with per-request nonce
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("x-nonce", nonce);

  const localeCookie = response.cookies.get("NEXT_LOCALE");
  if (localeCookie) {
    response.cookies.set("NEXT_LOCALE", localeCookie.value, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" || request.nextUrl.protocol === "https:",
    });
  }
  return response;
}

export const config = {
  matcher: [
    // تطبيق على كل المسارات عدا api و _next و _vercel والملفات الثابتة
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
