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
  TENANT_DASHBOARD: "/dashboard/tenant",
};

/**
 * Resolves a notification object to the corresponding application URL path.
 *
 * @param notification - The notification object containing type, entityType, and entityId.
 * @param userRole - The role of the logged-in user (e.g. "tenant", "landlord").
 * @returns The destination string path or null if no route matches.
 */
export function resolveNotificationRoute(
  notification: NotificationLike,
  userRole?: string
): string | null {
  const { type, entityType, entityId } = notification;
  if (!entityType && type !== "CHAT") return null;

  const isLandlord = userRole === "landlord";

  // 1. Support chat messages
  if (type === "CHAT" || entityType === "chat" || entityType === "CHAT") {
    return DASHBOARD_ROUTES.SUPPORT;
  }

  // 1.5. Community notifications
  if (
    entityType === "community_post" ||
    entityType === "viewing_request.community" ||
    entityType === "viewing_request.community_response"
  ) {
    return entityId ? `/community/${entityId}` : null;
  }

  // 2. Viewing requests
  if (entityType && entityType.startsWith("viewing_request")) {
    return isLandlord
      ? DASHBOARD_ROUTES.LANDLORD_REQUESTS
      : DASHBOARD_ROUTES.TENANT_REQUESTS;
  }

  // 3. Properties and Listings
  if (
    entityType === "listing" ||
    entityType === "listing.approved" ||
    entityType === "listing.rejected"
  ) {
    return entityId
      ? isLandlord
        ? `/dashboard/landlord/advertisements/${entityId}`
        : `/listings/${entityId}`
      : null;
  }

  return null;
}
