// apps/frontend/src/components/ui/language-switcher.tsx
"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { useLocale } from "next-intl";

export const LanguageSwitcher: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const toggleLocale = () => {
    const nextLocale = locale === "ar" ? "en" : "ar";

    // Replace locale segment in pathname
    const segments = pathname.split("/");
    segments[1] = nextLocale;
    const newPath = segments.join("/") || "/";

    // Save in cookie
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;

    router.replace(newPath);
  };

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
      aria-label="Switch language"
    >
      <span style={{ direction: "ltr" }}>
        <Globe size={16} className="shrink-0" />
      </span>
      <span className="font-semibold tracking-wide">
        {locale === "ar" ? "EN" : "AR"}
      </span>
    </button>
  );
};
