// Infrastructure layer
// Not used yet.
// Will be migrated gradually.

// apps/frontend/src/lib/api/beds.api.ts
import apiClient from "@/lib/api";

export const bedsApi = {
  getByListing: (listingId: string) =>
    apiClient.get(`/listings/${listingId}/beds`),

  getStats: (listingId: string) =>
    apiClient.get(`/listings/${listingId}/beds/stats`),

  getOne: (bedId: string) =>
    apiClient.get(`/beds/${bedId}`),

  rent: (bedId: string, data: {
    tenantId: string;
    rentedSince: string;
    rentedUntil: string;
  }) => apiClient.patch(`/beds/${bedId}/rent`, data),

  vacate: (bedId: string) =>
    apiClient.patch(`/beds/${bedId}/vacate`),

  updateType: (bedId: string, bedType: string) =>
    apiClient.patch(`/beds/${bedId}/type`, { bedType }),
};
