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

/**
 * استخراج رابط الصورة بشكل آمن يدعم كلاً من السلسلة النصية وكائنات صور العقار (ListingImage)
 */
export function getImageUrl(img: string | { url: string } | null | undefined): string {
  if (!img) return '';
  if (typeof img === 'object' && img.url) return img.url;
  return String(img);
}

/**
 * جلب رابط صورة الأفاتار بشكل موحّد — يعالج جميع الحالات:
 * - رابط كامل (https://...) → يعود كما هو
 * - مسار نسبي (/uploads/...) → يضيف الـ API_BASE
 * - null | undefined → يعود null (يعرض الآفاتار الافتراضي بالحروف الأولى)
 *
 * استخدم هذه الدالة في جميع مكانات عرض صور المستخدمين (بروفايل، كارد الإعلان، نافبار اللوحة)
 */
export function getAvatarUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;

  // إذا كان رابط كاملاً أو بيانات (data:)، أعده كما هو
  if (avatarUrl.startsWith("http") || avatarUrl.startsWith("data:")) {
    return avatarUrl;
  }

  // إذا كان مساراً نسبياً، أضف الـ API base URL
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  // أزل /api/v1 من النهاية للحصول على origin الخادم فقط
  const origin = base.replace(/\/api\/v\d+\/?$/, "");
  const path = avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`;
  return `${origin}${path}`;
}
