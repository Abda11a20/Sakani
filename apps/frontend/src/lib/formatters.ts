// Infrastructure layer
// Not used yet.
// Will be migrated gradually.

// apps/frontend/src/lib/formatters.ts

/**
 * تنسيق السعر بالجنيه المصري
 * @example formatPrice(1500) → "1٬500 ج.م"
 */
export const formatPrice = (
  price: number,
  locale: string = "ar-EG"
): string => new Intl.NumberFormat(locale).format(price) + " ج.م";

/**
 * تنسيق التاريخ بشكل كامل
 * @example formatDate("2024-01-15") → "١٥ يناير ٢٠٢٤"
 */
export const formatDate = (
  date: string | Date,
  locale: string = "ar-EG"
): string =>
  new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));

/**
 * وقت نسبي من الآن
 * @example formatRelativeTime("2024-01-15T10:00:00Z") → "منذ 3 أيام"
 */
export const formatRelativeTime = (date: string | Date): string => {
  const diff    = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours   = Math.floor(diff / 3_600_000);
  const days    = Math.floor(diff / 86_400_000);

  if (minutes < 1)  return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24)   return `منذ ${hours} ساعة`;
  if (days === 1)   return "أمس";
  if (days < 7)     return `منذ ${days} أيام`;
  return formatDate(date);
};

/**
 * تنسيق رقم الهاتف للعرض
 * @example formatPhoneDisplay("01012345678") → "0101 234 5678"
 */
export const formatPhoneDisplay = (phone: string): string =>
  phone.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3");

/**
 * إخفاء جزء من رقم الهاتف
 * @example maskPhone("01012345678") → "010****678"
 */
export const maskPhone = (phone: string): string =>
  phone.slice(0, 3) + "****" + phone.slice(-3);

/**
 * إخفاء الرقم القومي
 * @example maskNationalId("12345678901234") → "123**********4"
 */
export const maskNationalId = (id: string): string =>
  id.slice(0, 3) + "**********" + id.slice(-1);

/**
 * عرض عدد الأسرة المتاحة من الإجمالي
 * @example formatBedCount(2, 4) → "2 / 4 متاح"
 */
export const formatBedCount = (available: number, total: number): string =>
  `${available} / ${total} متاح`;

/**
 * تنسيق شهر وسنة فقط (للتواريخ المختصرة)
 * @example formatMonthYear("2024-01-15") → "يناير ٢٠٢٤"
 */
export const formatMonthYear = (
  date: string | Date,
  locale: string = "ar-EG"
): string =>
  new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
  }).format(new Date(date));
