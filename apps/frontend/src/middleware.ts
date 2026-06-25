// apps/frontend/src/middleware.ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // تطبيق على كل المسارات عدا api و _next و _vercel والملفات الثابتة
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
