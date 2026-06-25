// apps/frontend/src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * دمج Tailwind classes مع معالجة التعارضات
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * تنسيق السعر بالجنيه المصري
 */
export function formatPrice(price: number, currency = "ج.م"): string {
  return `${price.toLocaleString("ar-EG")} ${currency}`;
}

/**
 * تنسيق التاريخ بالعربية
 */
export function formatDate(
  date: string | Date,
  locale: "ar" | "en" = "ar"
): string {
  return new Date(date).toLocaleDateString(
    locale === "ar" ? "ar-EG" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );
}
