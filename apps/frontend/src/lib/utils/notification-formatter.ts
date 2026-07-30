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
    else if (lowerTitle.includes("rental completed")) translatedTitle = "تم تأجير الوحدة بنجاح";
    else if (lowerTitle.includes("new viewing request")) translatedTitle = "طلب معاينة جديد";
    else if (lowerTitle.includes("viewing request accepted")) translatedTitle = "تم قبول طلب المعاينة";
    else if (lowerTitle.includes("viewing request rejected")) translatedTitle = "تم رفض طلب المعاينة";
    else if (lowerTitle.includes("listing approved")) translatedTitle = "تمت الموافقة على الإعلان";
    else if (lowerTitle.includes("listing rejected")) translatedTitle = "تم رفض الإعلان";
    else if (lowerTitle.includes("new review")) translatedTitle = "تقييم جديد";
    else if (lowerTitle.includes("new message")) translatedTitle = "رسالة جديدة";

    if (lowerBody.includes("bed rental for") && lowerBody.includes("completed")) {
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
    if (title.includes("انتهاء عقد الإيجار") || lowerTitle.includes("انتهاء عقد")) {
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

    if (body.includes("طلب معاينة")) {
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
      category: mapTypeToCategory(type),
      iconName: mapTypeToIcon(type),
      priority: notification.priority || "NORMAL",
      route: defaultRoute,
      isLegacy: true,
    };
  }

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

function mapTypeToCategory(type: string): FormattedNotification["category"] {
  switch (type) {
    case "viewing_request": return "request";
    case "rental_completed": return "rental";
    case "listing_approved":
    case "listing_rejected": return "listing";
    case "payment": return "payment";
    case "community": return "community";
    case "system": return "system";
    default: return "alert";
  }
}

function mapTypeToIcon(type: string): FormattedNotification["iconName"] {
  switch (type) {
    case "viewing_request": return "Clock";
    case "rental_completed": return "CheckCircle2";
    case "listing_approved": return "Home";
    case "listing_rejected": return "XCircle";
    case "payment": return "CreditCard";
    case "community": return "MessageSquare";
    default: return "Bell";
  }
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
