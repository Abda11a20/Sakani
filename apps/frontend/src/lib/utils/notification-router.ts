// apps/frontend/src/lib/utils/notification-router.ts

export interface NotificationLike {
  type: string;
  entityType?: string | null;
  entityId?: string | null;
}

const DASHBOARD_ROUTES = {
  SUPPORT: "/dashboard/support",
  LANDLORD_REQUESTS: "/dashboard/landlord/requests",
  TENANT_REQUESTS: "/dashboard/tenant/viewing-requests",
  LANDLORD_RENTAL_HISTORY: "/dashboard/landlord/rental-history",
  TENANT_RENTAL_HISTORY: "/dashboard/tenant/rental-history",
  LANDLORD_DASHBOARD: "/dashboard/landlord",
  TENANT_DASHBOARD: "/dashboard/tenant",
};

/**
 * Resolves a notification object to the corresponding application URL path.
 * Covers both new eventKey notifications and legacy database notifications.
 */
export function resolveNotificationRoute(
  notification: NotificationLike,
  userRole?: string
): string | null {
  const { type, entityType, entityId } = notification;
  const isLandlord = userRole === "landlord";

  // 1. Support chat messages
  if (type === "CHAT" || entityType === "chat" || entityType === "CHAT") {
    return DASHBOARD_ROUTES.SUPPORT;
  }

  // 2. Rental Contracts & Rental Completions
  if (
    (entityType && entityType.startsWith("contract")) ||
    entityType === "rental_contract" ||
    entityType === "bed_rental" ||
    entityType === "unit_rental"
  ) {
    return isLandlord
      ? DASHBOARD_ROUTES.LANDLORD_RENTAL_HISTORY
      : DASHBOARD_ROUTES.TENANT_RENTAL_HISTORY;
  }

  // 3. Community notifications
  if (
    entityType === "community_post" ||
    entityType === "viewing_request.community" ||
    entityType === "viewing_request.community_response"
  ) {
    return entityId ? `/community/${entityId}` : null;
  }

  // 4. Viewing requests
  if (entityType && entityType.startsWith("viewing_request")) {
    return isLandlord
      ? DASHBOARD_ROUTES.LANDLORD_REQUESTS
      : DASHBOARD_ROUTES.TENANT_REQUESTS;
  }

  // 5. Properties and Listings
  if (
    entityType === "listing" ||
    entityType === "listing.approved" ||
    entityType === "listing.rejected" ||
    entityType === "listing.paused"
  ) {
    return entityId
      ? isLandlord
        ? `/dashboard/landlord/advertisements/${entityId}`
        : `/listings/${entityId}`
      : isLandlord
      ? "/dashboard/landlord/advertisements"
      : "/listings";
  }

  // 6. Reviews
  if (type === "REVIEW" || (entityType && entityType.startsWith("review"))) {
    return entityId
      ? isLandlord
        ? `/dashboard/landlord/advertisements/${entityId}`
        : `/listings/${entityId}`
      : isLandlord
      ? DASHBOARD_ROUTES.LANDLORD_DASHBOARD
      : DASHBOARD_ROUTES.TENANT_DASHBOARD;
  }

  // 7. Fallback based on type or role
  if (type === "REQUEST") {
    return isLandlord
      ? DASHBOARD_ROUTES.LANDLORD_REQUESTS
      : DASHBOARD_ROUTES.TENANT_REQUESTS;
  }

  if (type === "ALERT") {
    return isLandlord
      ? DASHBOARD_ROUTES.LANDLORD_RENTAL_HISTORY
      : DASHBOARD_ROUTES.TENANT_RENTAL_HISTORY;
  }

  return isLandlord ? DASHBOARD_ROUTES.LANDLORD_DASHBOARD : DASHBOARD_ROUTES.TENANT_DASHBOARD;
}
