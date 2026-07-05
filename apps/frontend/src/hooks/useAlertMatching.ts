// apps/frontend/src/hooks/useAlertMatching.ts
import { useMyAlerts } from "./useAlerts";
import type { Listing } from "@/types";

export const useMatchingAlert = (listing: Listing) => {
  const { data: alerts } = useMyAlerts();

  if (!alerts || alerts.length === 0) return null;

  const matchedAlert = alerts.find((alert) => {
    // 1. Check unitType (must match if specified)
    if (alert.unitType && alert.unitType !== listing.unitType) {
      return false;
    }

    // 2. Check governorate (must match if specified)
    if (alert.governorate && alert.governorate !== listing.governorate) {
      return false;
    }

    // 3. Check district (must match if specified)
    if (alert.district && alert.district !== listing.district) {
      return false;
    }

    // 4. Check price constraint (must be within max price if specified)
    if (alert.maxPrice && listing.price > alert.maxPrice) {
      return false;
    }

    // 5. Check genderTarget (must match if specified)
    if (alert.genderTarget && listing.genderTarget && alert.genderTarget !== listing.genderTarget) {
      return false;
    }

    return true;
  });

  return matchedAlert || null;
};
