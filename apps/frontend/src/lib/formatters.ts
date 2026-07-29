// apps/frontend/src/lib/formatters.ts
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export interface FormatPriceOptions {
  locale?: string;
  currency?: string;
  showCurrency?: boolean;
}

/**
 * تنسيق السعر بالعملة المحلية مع مراعاة خيارات التنسيق واللغة
 * @example formatPrice(1500) → "1٬500 ج.م"
 * @example formatPrice(1500, "en") → "1,500 EGP"
 * @example formatPrice(1500, { currency: "EGP", locale: "en-US" }) → "1,500 EGP"
 */
export function formatPrice(
  price: number | null | undefined,
  optionsOrLocale?: string | FormatPriceOptions
): string {
  if (price === null || price === undefined || isNaN(price)) return "0 ج.م";

  let locale = "ar-EG";
  let currency = "ج.م";
  let showCurrency = true;

  if (typeof optionsOrLocale === "string") {
    if (optionsOrLocale.startsWith("en")) {
      locale = "en-US";
      currency = "EGP";
    }
  } else if (typeof optionsOrLocale === "object" && optionsOrLocale !== null) {
    if (optionsOrLocale.locale) locale = optionsOrLocale.locale;
    if (optionsOrLocale.currency) currency = optionsOrLocale.currency;
    if (optionsOrLocale.showCurrency !== undefined) showCurrency = optionsOrLocale.showCurrency;
  }

  const formattedNum = new Intl.NumberFormat(locale).format(price);
  return showCurrency ? `${formattedNum} ${currency}` : formattedNum;
}

export interface FormatDateOptions {
  locale?: string;
  format?: "short" | "long" | "datetime" | "monthYear";
  customOptions?: Intl.DateTimeFormatOptions;
}

/**
 * تنسيق التاريخ المرن لدعم كافة حالات العرض (طويل، قصير، مع الوقت، شهر وسنة)
 * @example formatDate("2026-07-23") → "23 يوليو 2026"
 * @example formatDate("2026-07-23", { format: "short" }) → "23/07/2026"
 * @example formatDate("2026-07-23T10:30:00Z", { format: "datetime" }) → "23/07/2026، 10:30 م"
 */
export function formatDate(
  dateInput: string | Date | null | undefined,
  optionsOrLocale?: string | FormatDateOptions
): string {
  if (!dateInput) return "";

  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";

  let locale = "ar-EG";
  let formatStyle: "short" | "long" | "datetime" | "monthYear" = "long";
  let customOptions: Intl.DateTimeFormatOptions | undefined;

  if (typeof optionsOrLocale === "string") {
    if (optionsOrLocale.startsWith("en")) locale = "en-US";
  } else if (typeof optionsOrLocale === "object" && optionsOrLocale !== null) {
    if (optionsOrLocale.locale) {
      locale = optionsOrLocale.locale.startsWith("en") ? "en-US" : "ar-EG";
    }
    if (optionsOrLocale.format) formatStyle = optionsOrLocale.format;
    if (optionsOrLocale.customOptions) customOptions = optionsOrLocale.customOptions;
  }

  if (customOptions) {
    return new Intl.DateTimeFormat(locale, customOptions).format(d);
  }

  switch (formatStyle) {
    case "short":
      return new Intl.DateTimeFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
    case "datetime":
      return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    case "monthYear":
      return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long" }).format(d);
    case "long":
    default:
      return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(d);
  }
}

/**
 * الوقت النسبي الموحد المعتمِد على date-fns مع دعم المناطق الزمنية واللغتين
 * @example formatRelativeTime("2026-07-25T10:00:00Z", "ar") → "منذ 3 ساعات"
 */
export function formatRelativeTime(
  dateInput: string | Date | null | undefined,
  localeStr = "ar"
): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";

  const isEn = localeStr.startsWith("en");
  const dateLocale = isEn ? enUS : ar;

  return formatDistanceToNow(d, {
    addSuffix: true,
    locale: dateLocale,
  });
}

/**
 * تنسيق رقم الهاتف للعرض
 * @example formatPhoneDisplay("01012345678") → "0101 234 5678"
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone) return "";
  return phone.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3");
}

/**
 * إخفاء جزء من رقم الهاتف للأمان
 * @example maskPhone("01012345678") → "010****678"
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return phone ?? "";
  return phone.slice(0, 3) + "****" + phone.slice(-3);
}

/**
 * إخفاء الرقم القومي للأمان
 * @example maskNationalId("12345678901234") → "123**********4"
 */
export function maskNationalId(id: string): string {
  if (!id || id.length < 4) return id ?? "";
  return id.slice(0, 3) + "**********" + id.slice(-1);
}

/**
 * عرض عدد الأسرة المتاحة من الإجمالي
 * @example formatBedCount(2, 4) → "2 / 4 متاح"
 */
export function formatBedCount(available: number, total: number, locale = "ar"): string {
  if (locale.startsWith("en")) {
    return `${available} / ${total} available`;
  }
  return `${available} / ${total} متاح`;
}

/**
 * تنسيق شهر وسنة فقط (للتواريخ المختصرة)
 * @example formatMonthYear("2026-07-25") → "يوليو 2026"
 */
export function formatMonthYear(dateInput: string | Date, localeStr = "ar-EG"): string {
  return formatDate(dateInput, { locale: localeStr, format: "monthYear" });
}
