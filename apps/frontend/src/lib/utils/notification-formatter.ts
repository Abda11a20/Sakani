// apps/frontend/src/lib/utils/notification-formatter.ts

import type { Notification, NotificationEventKey, NotificationPriority } from "@/types";
import { resolveNotificationRoute } from "./notification-router";

export interface FormattedNotification {
  title: string;
  body: string;
  category: "listing" | "rental" | "request" | "payment" | "community" | "alert" | "system";
  iconName: "Home" | "FileText" | "UserCheck" | "CreditCard" | "Star" | "MessageSquare" | "AlertTriangle" | "Clock" | "CheckCircle2" | "XCircle" | "Bell";
  priority: NotificationPriority;
  route: string | null;
  isLegacy: boolean;
}

/**
 * Translates legacy database text strings stored in English into Arabic when in Arabic mode.
 */
function translateLegacyText(title: string = "", body: string = "", isAr: boolean) {
  if (!isAr) return { title, body };

  let translatedTitle = title;
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("bed rental completed")) {
    translatedTitle = "تم تأجير السرير بنجاح";
  } else if (lowerTitle.includes("rental completed")) {
    translatedTitle = "تم تأجير الوحدة بنجاح";
  } else if (lowerTitle.includes("new viewing request")) {
    translatedTitle = "طلب معاينة جديد";
  } else if (lowerTitle.includes("viewing request accepted")) {
    translatedTitle = "تم قبول طلب المعاينة";
  } else if (lowerTitle.includes("viewing request rejected")) {
    translatedTitle = "تم رفض طلب المعاينة";
  } else if (lowerTitle.includes("listing approved")) {
    translatedTitle = "تمت الموافقة على الإعلان";
  } else if (lowerTitle.includes("listing rejected")) {
    translatedTitle = "تم رفض الإعلان";
  } else if (lowerTitle.includes("new review")) {
    translatedTitle = "تقييم جديد";
  } else if (lowerTitle.includes("new message")) {
    translatedTitle = "رسالة جديدة";
  }

  let translatedBody = body;
  const quoteMatch = body.match(/"([^"]+)"/);
  const propertyName = quoteMatch ? quoteMatch[1] : "";
  const lowerBody = body.toLowerCase();

  if (lowerBody.includes("bed rental for") && lowerBody.includes("completed")) {
    translatedBody = propertyName
      ? `تم إتمام عملية تأجير سرير بنجاح في العقار "${propertyName}".`
      : "تم إتمام عملية تأجير سرير بنجاح.";
  } else if (lowerBody.includes("your bed rental for") && lowerBody.includes("completed")) {
    translatedBody = propertyName
      ? `تم إتمام عملية تأجير سرير لك بنجاح في العقار "${propertyName}".`
      : "تم إتمام عملية تأجير السرير لك بنجاح.";
  } else if (lowerBody.includes("rental for") && lowerBody.includes("completed")) {
    translatedBody = propertyName
      ? `تم إتمام تأجير العقار "${propertyName}" بنجاح.`
      : "تم إتمام تأجير العقار بنجاح.";
  } else if (lowerBody.includes("you received a new review on")) {
    translatedBody = propertyName
      ? `تلقيت تقييماً جديداً على عقارك "${propertyName}".`
      : "تلقيت تقييماً جديداً على عقارك.";
  } else if (lowerBody.includes("requested to view")) {
    translatedBody = propertyName
      ? `قدم مستأجر طلب معاينة للعقار "${propertyName}".`
      : "قدم مستأجر طلب معاينة جديد لعقارك.";
  }

  return { title: translatedTitle, body: translatedBody };
}

/**
 * Formats a Notification object into localized warm human language,
 * category icons, priorities, and target route.
 * Handles fallback gracefully for legacy notifications created before eventKey was introduced.
 */
export function formatNotification(
  notification: Notification,
  locale: string = "ar",
  userRole?: string
): FormattedNotification {
  const isAr = locale === "ar";
  const { eventKey, payload, type, title: legacyTitle, body: legacyBody } = notification;

  // ── 1. Legacy Fallback with Translation Helper ────────────────────────────
  if (!eventKey) {
    const defaultRoute = resolveNotificationRoute(notification, userRole);
    const translated = translateLegacyText(legacyTitle || "", legacyBody || "", isAr);

    return {
      title: translated.title || (isAr ? "إشعار جديد" : "New Notification"),
      body: translated.body || "",
      category: mapTypeToCategory(type),
      iconName: mapTypeToIcon(type),
      priority: notification.priority || "NORMAL",
      route: defaultRoute,
      isLegacy: true,
    };
  }

  // ── 2. Scalable EventKey Formatter ──────────────────────────────────────────
  const p = payload || {};
  const route = resolveNotificationRoute(notification, userRole);
  const priority = notification.priority || getEventDefaultPriority(eventKey);
  const category = getEventCategory(eventKey);
  const iconName = getEventIcon(eventKey);

  let title = "";
  let body = "";

  switch (eventKey) {
    case "CONTRACT_EXPIRED":
      title = isAr ? "انتهاء عقد الإيجار" : "Lease Expired";
      body = isAr
        ? `انتهت مدة عقد الإيجار للوحدة "${p.listingTitle || p.contractNumber || "السكنية"}". يمكنك الآن تجديد العقد أو إعادة نشر الإعلان.`
        : `The lease agreement for "${p.listingTitle || p.contractNumber || "property"}" has expired. You can now renew or republish.`;
      break;

    case "CONTRACT_RENEWED":
      title = isAr ? "🎉 تم تجديد العقد بنجاح" : "🎉 Lease Renewed";
      body = isAr
        ? `تم تجديد عقد الإيجار للوحدة "${p.listingTitle || "السكنية"}" بعقد جديد رقم ${p.newContractNumber || ""} حتى ${p.newEndDate || ""}.`
        : `The lease for "${p.listingTitle || "property"}" has been renewed until ${p.newEndDate || ""}.`;
      break;

    case "CONTRACT_TERMINATED":
      title = isAr ? "إنهاء عقد الإيجار" : "Lease Terminated";
      body = isAr
        ? `تم تسجيل إنهاء عقد الإيجار رقم ${p.contractNumber || ""} مبكراً للوحدة "${p.listingTitle || ""}".`
        : `Early termination recorded for contract ${p.contractNumber || ""} on "${p.listingTitle || ""}".`;
      break;

    case "LISTING_APPROVED":
      title = isAr ? "🎉 مبروك! تمت الموافقة على إعلانك" : "🎉 Listing Approved!";
      body = isAr
        ? `تمت مراجعة وإقرار إعلانك "${p.listingTitle || ""}" وأصبح متاحاً الآن لجميع الباحثين عن سكن.`
        : `Your listing "${p.listingTitle || ""}" has been approved and is now live for all prospective tenants.`;
      break;

    case "LISTING_REJECTED":
      title = isAr ? "تحديث بشأن إعلانك" : "Listing Review Update";
      body = isAr
        ? `لم يتم إقرار إعلانك "${p.listingTitle || ""}". ${p.rejectionReason ? `السبب: ${p.rejectionReason}` : "يرجى مراجعة تفاصيل الإعلان والتعديل عليه."}`
        : `Your listing "${p.listingTitle || ""}" was not approved. ${p.rejectionReason ? `Reason: ${p.rejectionReason}` : "Please review and edit details."}`;
      break;

    case "LISTING_PAUSED":
      title = isAr ? "إعلانك متوقف مؤقتاً" : "Listing Paused";
      body = isAr
        ? `تم إيقاف إعلانك "${p.listingTitle || ""}" مؤقتاً بعد انتهاء العقد. اضغط لإعادة النشر.`
        : `Your listing "${p.listingTitle || ""}" is paused after lease expiration. Tap to republish.`;
      break;

    case "LISTING_REPUBLISHED":
      title = isAr ? "تم إعادة نشر إعلانك" : "Listing Republished";
      body = isAr
        ? `عاد إعلانك "${p.listingTitle || ""}" ليصبح نشطاً ومتاحاً للجمهور.`
        : `Your listing "${p.listingTitle || ""}" is active and published again.`;
      break;

    case "REQUEST_CREATED":
      title = isAr ? "📩 طلب معاينة جديد" : "📩 New Viewing Request";
      body = isAr
        ? `قدم ${p.tenantName || "مستأجر"} طلب معاينة على عقارك "${p.listingTitle || ""}". اضغط للاطلاع والرد.`
        : `${p.tenantName || "A prospective tenant"} submitted a viewing request for "${p.listingTitle || ""}".`;
      break;

    case "REQUEST_ACCEPTED":
      title = isAr ? "✅ تم قبول طلب المعاينة" : "✅ Request Accepted";
      body = isAr
        ? `وافق المالك على طلب المعاينة لعقار "${p.listingTitle || ""}". يمكنك الآن التواصل وتحديد الموعد.`
        : `The landlord accepted your viewing request for "${p.listingTitle || ""}".`;
      break;

    case "REQUEST_REJECTED":
      title = isAr ? "تحديث طلب المعاينة" : "Viewing Request Update";
      body = isAr
        ? `اعتذر المالك عن طلب المعاينة الخاص بعقار "${p.listingTitle || ""}".`
        : `The landlord was unable to accept your request for "${p.listingTitle || ""}".`;
      break;

    case "PAYMENT_SUCCESS":
    case "SUBSCRIPTION_RENEWED":
      title = isAr ? "💳 تم تأكيد الاشتراك بنجاح" : "💳 Payment Confirmed";
      body = isAr
        ? `تم استلام دفعة الاشتراك بنجاح وتفعيل مزايا خطتك.`
        : `Your subscription payment was processed successfully.`;
      break;

    case "COMMUNITY_POST_REPLY":
      title = isAr ? "💬 رد جديد في المجتمع" : "💬 New Community Reply";
      body = isAr
        ? `تم إضافة رد جديد على منشورك في مجتمع سكني.`
        : `Someone replied to your community post.`;
      break;

    default:
      title = legacyTitle || (isAr ? "إشعار جديد" : "New Notification");
      body = legacyBody || "";
      break;
  }

  return {
    title,
    body,
    category,
    iconName,
    priority,
    route,
    isLegacy: false,
  };
}

function mapTypeToCategory(type: string): FormattedNotification["category"] {
  switch (type) {
    case "REQUEST": return "request";
    case "PAYMENT": return "payment";
    case "CHAT": return "community";
    case "REVIEW": return "system";
    case "ALERT": return "alert";
    default: return "system";
  }
}

function mapTypeToIcon(type: string): FormattedNotification["iconName"] {
  switch (type) {
    case "REQUEST": return "UserCheck";
    case "PAYMENT": return "CreditCard";
    case "CHAT": return "MessageSquare";
    case "REVIEW": return "Star";
    case "ALERT": return "AlertTriangle";
    default: return "Bell";
  }
}

function getEventCategory(eventKey: NotificationEventKey): FormattedNotification["category"] {
  if (eventKey.startsWith("CONTRACT_") || eventKey.endsWith("_RENTAL_COMPLETED")) return "rental";
  if (eventKey.startsWith("LISTING_")) return "listing";
  if (eventKey.startsWith("REQUEST_")) return "request";
  if (eventKey.startsWith("PAYMENT_") || eventKey.startsWith("SUBSCRIPTION_")) return "payment";
  if (eventKey.startsWith("COMMUNITY_")) return "community";
  return "system";
}

function getEventIcon(eventKey: NotificationEventKey): FormattedNotification["iconName"] {
  switch (eventKey) {
    case "CONTRACT_EXPIRED":
    case "CONTRACT_TERMINATED":
      return "Clock";
    case "CONTRACT_RENEWED":
    case "UNIT_RENTAL_COMPLETED":
    case "BED_RENTAL_COMPLETED":
      return "FileText";
    case "LISTING_APPROVED":
    case "LISTING_REPUBLISHED":
      return "Home";
    case "LISTING_REJECTED":
    case "LISTING_PAUSED":
      return "AlertTriangle";
    case "REQUEST_CREATED":
    case "REQUEST_ACCEPTED":
      return "UserCheck";
    case "REQUEST_REJECTED":
    case "REQUEST_CANCELED":
      return "XCircle";
    case "PAYMENT_SUCCESS":
    case "SUBSCRIPTION_RENEWED":
      return "CreditCard";
    case "COMMUNITY_POST_REPLY":
    case "COMMUNITY_ALERT_MATCH":
      return "MessageSquare";
    default:
      return "Bell";
  }
}

function getEventDefaultPriority(eventKey: NotificationEventKey): NotificationPriority {
  if (eventKey === "CONTRACT_EXPIRED" || eventKey === "PAYMENT_FAILED") return "HIGH";
  if (eventKey === "CONTRACT_TERMINATED") return "HIGH";
  if (eventKey === "LISTING_REJECTED") return "HIGH";
  return "NORMAL";
}
