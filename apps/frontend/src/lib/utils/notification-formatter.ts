// apps/frontend/src/lib/utils/notification-formatter.ts

import type { Notification, NotificationEventKey, NotificationPriority } from "@/types";
import { resolveNotificationRoute } from "./notification-router";

export interface FormattedNotification {
  title: string;
  body: string;
  category: "listing" | "rental" | "request" | "payment" | "community" | "alert" | "system" | "security";
  iconName: "Home" | "FileText" | "UserCheck" | "CreditCard" | "Star" | "MessageSquare" | "AlertTriangle" | "Clock" | "CheckCircle2" | "XCircle" | "Bell" | "ShieldCheck" | "Lock" | "KeyRound";
  priority: NotificationPriority;
  route: string | null;
  isLegacy: boolean;
}

/**
 * Translates legacy database text strings dynamically between English and Arabic.
 */
function translateLegacyText(title: string = "", body: string = "", isAr: boolean) {
  let translatedTitle = title;
  let translatedBody = body;
  const lowerTitle = title.toLowerCase();
  const lowerBody = body.toLowerCase();

  const quoteMatch = body.match(/"([^"]+)"/);
  const propertyName = quoteMatch ? quoteMatch[1] : "";

  if (isAr) {
    if (lowerTitle.includes("bed rental completed")) translatedTitle = "تم تأجير السرير بنجاح";
    // Arabic Translation for English Notification Strings
    if (lowerTitle.includes("password changed") || lowerTitle.includes("password reset")) {
      translatedTitle = "تغيير كلمة المرور";
    } else if (lowerTitle.includes("lease expired") || lowerTitle.includes("contract expired")) {
      translatedTitle = "انتهاء عقد الإيجار";
    } else if (lowerTitle.includes("bed rental")) {
      translatedTitle = "تأجير السرير";
    } else if (lowerTitle.includes("unit rental") || lowerTitle.includes("rental completed")) {
      translatedTitle = "تأجير الوحدة";
    } else if (lowerTitle.includes("viewing request")) {
      translatedTitle = "طلب معاينة جديد";
    } else if (lowerTitle.includes("listing approved")) translatedTitle = "تمت الموافقة على الإعلان";
    else if (lowerTitle.includes("listing rejected")) translatedTitle = "تم رفض الإعلان";
    else if (lowerTitle.includes("new review")) translatedTitle = "تقييم جديد";
    else if (lowerTitle.includes("new message")) translatedTitle = "رسالة جديدة";

    if (lowerBody.includes("password was changed") || lowerBody.includes("password was reset")) {
      translatedBody = "تم تغيير كلمة المرور الخاصة بحسابك بنجاح. إذا لم تقم بهذا التغيير، يرجى التواصل مع الدعم الفني فوراً.";
    } else if (lowerBody.includes("bed rental completed")) {
      translatedBody = propertyName
        ? `تم إتمام عملية تأجير سرير بنجاح في العقار "${propertyName}".`
        : "تم إتمام عملية تأجير سرير بنجاح.";
    } else if (lowerBody.includes("requested to view")) {
      translatedBody = propertyName
        ? `قدم مستأجر طلب معاينة للعقار "${propertyName}".`
        : "قدم مستأجر طلب معاينة جديد لعقارك.";
    }
  } else {
    // English Translation for Legacy Arabic DB Notification Strings
    if (title.includes("Password changed") || title.includes("تغيير كلمة المرور")) {
      translatedTitle = "Password Changed";
    } else if (title.includes("انتهاء عقد الإيجار") || lowerTitle.includes("انتهاء عقد")) {
      translatedTitle = "Lease Expired";
    } else if (title.includes("تم تأجير السرير") || lowerTitle.includes("تأجير السرير")) {
      translatedTitle = "Bed Rental Completed";
    } else if (title.includes("تم تأجير الوحدة") || lowerTitle.includes("تأجير الوحدة")) {
      translatedTitle = "Unit Rental Completed";
    } else if (title.includes("طلب معاينة جديد") || title.includes("طلب معاينة")) {
      translatedTitle = "New Viewing Request";
    } else if (title.includes("تم قبول طلب المعاينة")) {
      translatedTitle = "Viewing Request Accepted";
    } else if (title.includes("تم رفض طلب المعاينة")) {
      translatedTitle = "Viewing Request Rejected";
    } else if (title.includes("الموافقة على الإعلان") || title.includes("تمت الموافقة")) {
      translatedTitle = "Listing Approved";
    } else if (title.includes("تقييم جديد")) {
      translatedTitle = "New Review Received";
    } else if (title.includes("رسالة جديدة")) {
      translatedTitle = "New Message";
    }

    if (body.includes("كلمة المرور") || lowerBody.includes("password was changed")) {
      translatedBody = "Your account password was updated successfully.";
    } else if (body.includes("طلب معاينة")) {
      translatedBody = propertyName
        ? `A tenant submitted a viewing request for your property "${propertyName}".`
        : "A tenant submitted a new viewing request.";
    } else if (body.includes("تأجير سرير") || body.includes("تأجير السرير")) {
      translatedBody = propertyName
        ? `Bed rental for "${propertyName}" has been completed.`
        : "Bed rental completed successfully.";
    } else if (body.includes("تأجير العقار") || body.includes("تأجير الوحدة")) {
      translatedBody = propertyName
        ? `Rental for property "${propertyName}" has been completed.`
        : "Property rental completed successfully.";
    } else if (body.includes("تقييم")) {
      translatedBody = propertyName
        ? `You received a new review on "${propertyName}".`
        : "You received a new review on your listing.";
    } else if (body.includes("انتهت مدة عقد")) {
      translatedBody = propertyName
        ? `The lease agreement for "${propertyName}" has expired.`
        : "The lease agreement has expired.";
    }
  }

  return { title: translatedTitle, body: translatedBody };
}

export function formatNotification(
  notification: Notification,
  locale: string = "ar",
  userRole?: string
): FormattedNotification {
  const isAr = locale === "ar";
  const { eventKey, payload, type, title: legacyTitle, body: legacyBody } = notification;

  if (!eventKey) {
    const defaultRoute = resolveNotificationRoute(notification, userRole);
    const translated = translateLegacyText(legacyTitle || "", legacyBody || "", isAr);

    return {
      title: translated.title || (isAr ? "إشعار جديد" : "New Notification"),
      body: translated.body || "",
      category: mapTypeToCategory(type, notification.entityType, legacyTitle),
      iconName: mapTypeToIcon(type, notification.entityType, legacyTitle),
      priority: notification.priority || "NORMAL",
      route: defaultRoute,
      isLegacy: true,
    };
  }

  const p = payload || {};
  const route = resolveNotificationRoute(notification, userRole);
  const priority = notification.priority || getEventDefaultPriority(eventKey);
  const category = mapTypeToCategory(type, notification.entityType, legacyTitle) || getEventCategory(eventKey);
  const iconName = mapTypeToIcon(type, notification.entityType, legacyTitle) || getEventIcon(eventKey);

  let title = "";
  let body = "";

  switch (eventKey) {
    case "CONTRACT_EXPIRED":
      title = isAr ? "انتهاء عقد الإيجار" : "Lease Expired";
      body = isAr
        ? `انتهت مدة عقد الإيجار للوحدة "${p.listingTitle || p.contractNumber || "السكنية"}".`
        : `The lease agreement for "${p.listingTitle || p.contractNumber || "property"}" has expired.`;
      break;

    case "CONTRACT_RENEWED":
      title = isAr ? "🎉 تم تجديد العقد بنجاح" : "🎉 Lease Renewed";
      body = isAr
        ? `تم تجديد عقد الإيجار للوحدة "${p.listingTitle || "السكنية"}" حتى ${p.newEndDate || ""}.`
        : `The lease for "${p.listingTitle || "property"}" has been renewed until ${p.newEndDate || ""}.`;
      break;

    case "CONTRACT_TERMINATED":
      title = isAr ? "إنهاء عقد الإيجار" : "Lease Terminated";
      body = isAr
        ? `تم تسجيل إنهاء عقد الإيجار للوحدة "${p.listingTitle || ""}".`
        : `Early termination recorded for "${p.listingTitle || ""}".`;
      break;

    case "LISTING_APPROVED":
      title = isAr ? "🎉 مبروك! تمت الموافقة على إعلانك" : "🎉 Listing Approved!";
      body = isAr
        ? `تمت مراجعة وإقرار إعلانك "${p.listingTitle || ""}".`
        : `Your listing "${p.listingTitle || ""}" has been approved.`;
      break;

    case "LISTING_REJECTED":
      title = isAr ? "تنبيه حول حالة إعلانك" : "Listing Status Update";
      body = isAr
        ? `لم تتم الموافقة على إعلانك "${p.listingTitle || ""}".`
        : `Your listing "${p.listingTitle || ""}" was not approved.`;
      break;

    case "REQUEST_CREATED":
      title = isAr ? "طلب معاينة جديد 🏠" : "New Viewing Request 🏠";
      body = isAr
        ? `قدم المستأجر ${p.tenantName || ""} طلب معاينة جديد لعقارك "${p.listingTitle || ""}".`
        : `Tenant ${p.tenantName || ""} submitted a viewing request for "${p.listingTitle || ""}".`;
      break;

    case "REQUEST_ACCEPTED":
      title = isAr ? "🎉 تم قبول طلب المعاينة!" : "🎉 Viewing Request Accepted!";
      body = isAr
        ? `قام المالك ${p.landlordName || ""} بقبول طلب المعاينة لعقار "${p.listingTitle || ""}".`
        : `Landlord ${p.landlordName || ""} accepted your viewing request for "${p.listingTitle || ""}".`;
      break;

    case "REQUEST_REJECTED":
      title = isAr ? "تحديث بخصوص طلب المعاينة" : "Viewing Request Update";
      body = isAr
        ? `اعتذر المالك عن قبول طلب المعاينة لعقار "${p.listingTitle || ""}".`
        : `Landlord declined the viewing request for "${p.listingTitle || ""}".`;
      break;

    case "BED_RENTAL_COMPLETED":
      title = isAr ? "🎉 تم إتمام تأجير السرير بنجاح" : "🎉 Bed Rental Completed";
      body = isAr
        ? `تم تأكيد حجز السرير للمستأجر ${p.tenantName || ""} في العقار "${p.listingTitle || ""}".`
        : `Bed rental confirmed for ${p.tenantName || ""} on listing "${p.listingTitle || ""}".`;
      break;

    case "UNIT_RENTAL_COMPLETED":
      title = isAr ? "🎉 تم تأجير الوحدة بنجاح" : "🎉 Rental Completed";
      body = isAr
        ? `تم إتمام عقد إيجار الوحدة "${p.listingTitle || ""}" للمستأجر ${p.tenantName || ""}.`
        : `Rental agreement completed for "${p.listingTitle || ""}" with tenant ${p.tenantName || ""}.`;
      break;

    default:
      const legacyTranslated = translateLegacyText(legacyTitle || "", legacyBody || "", isAr);
      title = legacyTranslated.title || (isAr ? "إشعار جديد" : "New Notification");
      body = legacyTranslated.body || "";
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

function mapTypeToCategory(type: string, entityType?: string | null, title?: string | null): FormattedNotification["category"] {
  const t = (type || "").toLowerCase();
  const et = (entityType || "").toLowerCase();
  const titleText = (title || "").toLowerCase();

  if (et.startsWith("security.") || titleText.includes("password") || titleText.includes("كلمة المرور")) {
    return "security";
  }
  if (et.includes("contract") || et.includes("rental") || titleText.includes("عقد") || titleText.includes("تأجير") || titleText.includes("lease") || t === "rental_completed") {
    return "rental";
  }
  if (et.includes("viewing_request") || titleText.includes("معاينة") || titleText.includes("viewing") || t === "viewing_request") {
    return "request";
  }
  if (et.includes("listing") || titleText.includes("إعلان") || titleText.includes("listing")) {
    return "listing";
  }
  if (t === "payment" || et.includes("payment") || titleText.includes("دفع") || titleText.includes("payment")) {
    return "payment";
  }
  if (t === "community" || et.includes("review") || titleText.includes("تقييم") || titleText.includes("رسالة")) {
    return "community";
  }
  return "alert";
}

function mapTypeToIcon(type: string, entityType?: string | null, title?: string | null): FormattedNotification["iconName"] {
  const t = (type || "").toLowerCase();
  const et = (entityType || "").toLowerCase();
  const titleText = (title || "").toLowerCase();

  if (et.startsWith("security.") || titleText.includes("password") || titleText.includes("كلمة المرور")) {
    return "ShieldCheck";
  }
  if (et.includes("contract") || titleText.includes("عقد") || titleText.includes("lease") || titleText.includes("contract")) {
    return "FileText";
  }
  if (et.includes("rental") || titleText.includes("تأجير") || titleText.includes("rental") || t === "rental_completed") {
    return "KeyRound";
  }
  if (et.includes("viewing_request") || titleText.includes("معاينة") || titleText.includes("viewing") || t === "viewing_request") {
    return "Clock";
  }
  if (et.includes("review") || titleText.includes("تقييم") || titleText.includes("review")) {
    return "Star";
  }
  if (et.includes("listing") || titleText.includes("إعلان") || titleText.includes("listing")) {
    return "Home";
  }
  if (t === "payment" || et.includes("payment") || titleText.includes("دفع")) {
    return "CreditCard";
  }
  if (t === "community" || titleText.includes("رسالة")) {
    return "MessageSquare";
  }
  return "Bell";
}

function getEventCategory(eventKey: NotificationEventKey): FormattedNotification["category"] {
  if (eventKey.startsWith("CONTRACT_") || eventKey.endsWith("_RENTAL_COMPLETED") || eventKey === "UNIT_RENTAL_COMPLETED") {
    return "rental";
  }
  if (eventKey.startsWith("REQUEST_")) return "request";
  if (eventKey.startsWith("LISTING_")) return "listing";
  return "system";
}

function getEventIcon(eventKey: NotificationEventKey): FormattedNotification["iconName"] {
  switch (eventKey) {
    case "CONTRACT_EXPIRED":
    case "CONTRACT_TERMINATED": return "FileText";
    case "CONTRACT_RENEWED": return "CheckCircle2";
    case "LISTING_APPROVED": return "Home";
    case "LISTING_REJECTED": return "XCircle";
    case "REQUEST_CREATED": return "Clock";
    case "REQUEST_ACCEPTED": return "UserCheck";
    case "REQUEST_REJECTED": return "XCircle";
    case "BED_RENTAL_COMPLETED":
    case "UNIT_RENTAL_COMPLETED": return "CheckCircle2";
    default: return "Bell";
  }
}

function getEventDefaultPriority(eventKey: NotificationEventKey): NotificationPriority {
  switch (eventKey) {
    case "REQUEST_CREATED":
    case "REQUEST_ACCEPTED":
    case "CONTRACT_EXPIRED":
      return "HIGH";
    case "LISTING_APPROVED":
    case "UNIT_RENTAL_COMPLETED":
    case "BED_RENTAL_COMPLETED":
      return "NORMAL";
    default:
      return "NORMAL";
  }
}
