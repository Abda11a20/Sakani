// apps/frontend/src/i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // هذا يُستدعى من next-intl/plugin عبر next.config.mjs
  let locale = await requestLocale;

  // تأكد أن الـ locale ضمن القائمة المدعومة
  if (!locale || !routing.locales.includes(locale as "ar" | "en")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (
      await import(`../../messages/${locale}.json`)
    ).default,
  };
});
