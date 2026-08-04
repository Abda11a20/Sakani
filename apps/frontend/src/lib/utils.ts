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
 * استخراج رابط الصورة بشكل آمن يدعم كلاً من السلسلة النصية وكائنات صور العقار (ListingImage)
 */
export function getImageUrl(img: string | { url: string } | null | undefined): string {
  if (!img) return '';
  if (typeof img === 'object' && img.url) return img.url;
  return String(img);
}

/**
 * يُنشئ رابط Cloudinary محسَّن مع Transformations تلقائية (WebP/AVIF + ضغط + تغيير حجم).
 * - إذا لم يكن الرابط من Cloudinary، يُعيده كما هو.
 * - إذا كان الرابط يحتوي مسبقاً على transformations، لا يُعيد إضافتها.
 *
 * @param img  - رابط الصورة (string أو { url: string } أو null)
 * @param opts - خيارات التحويل: width, height, quality, crop
 */
export function getCloudinaryUrl(
  img: string | { url: string } | null | undefined,
  opts: {
    width?: number;
    height?: number;
    quality?: number | 'auto';
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
    format?: 'auto' | 'webp' | 'avif';
  } = {}
): string {
  const rawUrl = getImageUrl(img);
  if (!rawUrl) return '';

  // فقط روابط Cloudinary يمكن تحويلها
  if (!rawUrl.includes('res.cloudinary.com')) return rawUrl;

  // إذا كان الرابط يحتوي على transformations مسبقة، أعده كما هو
  const uploadMarker = '/image/upload/';
  const uploadIdx = rawUrl.indexOf(uploadMarker);
  if (uploadIdx === -1) return rawUrl;

  const afterUpload = rawUrl.slice(uploadIdx + uploadMarker.length);
  // الـ transformations تبدأ بـ "v" أو بحرف أو رقم غير slash
  // إذا كان هناك فاصلة في الجزء الأول، فالتحويلات موجودة بالفعل
  const firstSegment = afterUpload.split('/')[0];
  if (firstSegment.includes(',') || firstSegment.startsWith('f_') || firstSegment.startsWith('q_') || firstSegment.startsWith('w_')) {
    return rawUrl;
  }

  const { width, height, quality = 'auto', crop = 'fill', format = 'auto' } = opts;

  const transforms: string[] = [`f_${format}`, `q_${quality}`];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (width && height) transforms.push(`c_${crop}`);

  const transformStr = transforms.join(',');
  const baseUrl = rawUrl.slice(0, uploadIdx + uploadMarker.length);
  const rest = rawUrl.slice(uploadIdx + uploadMarker.length);

  return `${baseUrl}${transformStr}/${rest}`;
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

  // إذا كان رابط Cloudinary، طبق الـ Transformations لتصغير الحجم والضغط
  if (avatarUrl.includes("res.cloudinary.com")) {
    return getCloudinaryUrl(avatarUrl, { width: 96, height: 96, crop: 'fill' });
  }

  // إذا كان رابط كاملاً آخر أو بيانات (data:)، أعده كما هو
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
