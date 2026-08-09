// apps/frontend/src/middleware.ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest } from "next/server";

const handleNextIntlRouting = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const response = handleNextIntlRouting(request);
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
