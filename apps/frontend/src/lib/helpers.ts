// Infrastructure layer
// Not used yet.
// Will be migrated gradually.

// apps/frontend/src/lib/helpers.ts
import type { User, Listing, Alert } from "@/types";
import {
  UNIT_TYPE_CONFIG,
  GENDER_TARGET_CONFIG,
  USER_ROLE_CONFIG,
  type UserRoleKey,
} from "./constants";
import { formatPrice } from "./formatters";

// ── Avatar ────────────────────────────────────────────────────────────────────

/**
 * نوع بيانات الأفاتار — صورة أو حروف أولى
 * يُفيد في تجنب شرط null في كل مكان
 */
export type AvatarData =
  | { type: "image";    url: string }
  | { type: "initials"; initials: string };

/**
 * احسب بيانات الأفاتار بناءً على URL والاسم
 * - إذا كان URL موجوداً → يرجع { type: "image", url }
 * - إذا لم يكن → يرجع { type: "initials", initials } (أول حرفين من الاسم)
 */
export const getAvatarData = (
  avatarUrl?: string | null,
  name?: string | null
): AvatarData => {
  if (avatarUrl?.trim()) return { type: "image", url: avatarUrl };

  const initials = (name ?? "؟")
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return { type: "initials", initials: initials || "؟" };
};

// ── Listing Helpers ───────────────────────────────────────────────────────────

/**
 * استخرج صورة غلاف الإعلان الأولى أو fallback
 */
export const getListingCoverImage = (
  listing: Pick<Listing, "images">,
  fallback = "/images/listing-placeholder.jpg"
): string => {
  const img = listing.images?.[0];
  if (!img) return fallback;
  // يدعم string URL أو كائن { url: string } (للتوافق مع بعض الـ APIs)
  if (typeof img === "object" && (img as unknown as { url: string }).url) {
    return (img as unknown as { url: string }).url;
  }
  return typeof img === "string" ? img : fallback;
};

/**
 * استخرج عنوان الإعلان أو اصنع عنواناً تلقائياً من نوع الوحدة والموقع
 */
export const getListingTitle = (
  listing: Pick<Listing, "title" | "unitType" | "district" | "governorate">
): string => {
  if (listing.title) return listing.title;
  const unitLabel =
    listing.unitType && listing.unitType in UNIT_TYPE_CONFIG
      ? UNIT_TYPE_CONFIG[listing.unitType as keyof typeof UNIT_TYPE_CONFIG].labelAr
      : "وحدة";
  return `${unitLabel} في ${listing.district}، ${listing.governorate}`;
};

// ── Navigation ────────────────────────────────────────────────────────────────

/**
 * احصل على مسار داشبورد المستخدم بناءً على دوره
 * @example getDashboardPath("tenant", "ar") → "/ar/dashboard/tenant"
 */
export const getDashboardPath = (
  role: UserRoleKey,
  locale: string
): string => {
  const config = USER_ROLE_CONFIG[role];
  return `/${locale}${config.dashboard}`;
};

// ── Alert Summary ─────────────────────────────────────────────────────────────

/**
 * اصنع ملخصاً قصيراً لتنبيه البحث الذكي
 * @example generateAlertSummary(alert) → "شقة كاملة في المعادي، أقل من 2٬000 ج.م"
 */
export const generateAlertSummary = (alert: Alert): string => {
  const parts: string[] = [];

  if (alert.unitType && alert.unitType in UNIT_TYPE_CONFIG) {
    parts.push(UNIT_TYPE_CONFIG[alert.unitType].labelAr);
  }

  if (
    alert.genderTarget &&
    alert.genderTarget !== "mixed" &&
    alert.genderTarget in GENDER_TARGET_CONFIG
  ) {
    parts.push(
      GENDER_TARGET_CONFIG[alert.genderTarget as keyof typeof GENDER_TARGET_CONFIG].labelAr
    );
  }

  if (alert.district) {
    parts.push(`في ${alert.district}`);
  } else if (alert.governorate) {
    parts.push(`في ${alert.governorate}`);
  }

  if (alert.maxPrice) {
    parts.push(`أقل من ${formatPrice(alert.maxPrice)}`);
  }

  return parts.length ? parts.join(" ") : "تنبيه عام";
};

// ── Verification ──────────────────────────────────────────────────────────────

/**
 * تحقق هل المستخدم موثّق البريد الإلكتروني
 * (مختلف عن isUserVerified في @/types التي تتحقق من الهوية الوطنية)
 */
export const isEmailVerified = (
  user: Pick<User, "emailVerifiedAt">
): boolean => user.emailVerifiedAt !== null;

// ── Review Eligibility ────────────────────────────────────────────────────────

/**
 * تحقق هل يحق للمستأجر كتابة تقييم لإعلان معين
 * (يحتاج طلب معاينة مكتمل)
 */
export const canWriteReview = (
  requests: Array<{ listingId: string; status: string }>,
  listingId: string
): boolean =>
  requests.some((r) => r.listingId === listingId && r.status === "completed");

// ── Price Display ─────────────────────────────────────────────────────────────

/**
 * عرض السعر مع الفترة والفواتير
 * @example getPriceDisplay(1500, true) → "1٬500 ج.م/شهر (شامل الفواتير)"
 */
export const getPriceDisplay = (
  price: number,
  includesBills: boolean
): string =>
  formatPrice(price) + "/شهر" + (includesBills ? " (شامل الفواتير)" : "");
