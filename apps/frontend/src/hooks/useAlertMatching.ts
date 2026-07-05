// apps/frontend/src/hooks/useAlertMatching.ts
// ── Single source of truth for alert matching on the frontend ────────────────
// This utility MIRRORS the backend alert filter criteria exactly.
// If backend matching info becomes available in API responses, replace this utility immediately.

import { useMyAlerts } from "@/hooks/useAlerts";
import type { Alert, Listing } from "@/types";

/**
 * Checks whether a listing matches an alert's criteria.
 * Mirrors backend AlertsService matching logic:
 *   - unitType     (if set on alert)
 *   - price ≤ maxPrice (if set on alert)
 *   - genderTarget (if set on alert)
 *   - governorate  (if set on alert, case-insensitive)
 *   - district     (if set on alert, case-insensitive)
 */
export function matchesAlert(listing: Listing, alert: Alert): boolean {
  if (!alert.isActive) return false;

  if (alert.unitType && listing.type !== alert.unitType) return false;

  if (alert.maxPrice !== undefined && alert.maxPrice !== null) {
    if (listing.price > alert.maxPrice) return false;
  }

  if (alert.genderTarget && listing.genderTarget !== alert.genderTarget) return false;

  if (alert.governorate) {
    const listingGov = (listing.governorate ?? "").toLowerCase();
    const alertGov = alert.governorate.toLowerCase();
    if (!listingGov.includes(alertGov) && !alertGov.includes(listingGov)) return false;
  }

  if (alert.district) {
    const listingDist = (listing.district ?? "").toLowerCase();
    const alertDist = alert.district.toLowerCase();
    if (!listingDist.includes(alertDist) && !alertDist.includes(listingDist)) return false;
  }

  return true;
}

/**
 * Returns the first active alert that matches the given listing,
 * or null if no match or user is not logged in / has no alerts.
 */
export function useMatchingAlert(listing: Listing): Alert | null {
  const { data: alerts } = useMyAlerts();

  if (!alerts || alerts.length === 0) return null;

  return alerts.find((alert) => matchesAlert(listing, alert)) ?? null;
}
