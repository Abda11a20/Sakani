// apps/frontend/src/lib/api/beds.api.ts
import { api } from "@/lib/api";

export const bedsApi = {
  getByListing: (listingId: string) =>
    api.get(`/listings/${listingId}/beds`),

  getAllByListing: (listingId: string) =>
    api.get(`/listings/${listingId}/beds/all`),

  getStats: (listingId: string) =>
    api.get(`/listings/${listingId}/beds/stats`),

  getOne: (bedId: string) =>
    api.get(`/beds/${bedId}`),

  rent: (bedId: string, data: {
    tenantId: string;
    rentedSince: string;
    rentedUntil: string;
  }) => api.patch(`/beds/${bedId}/rent`, data),

  vacate: (bedId: string) =>
    api.patch(`/beds/${bedId}/vacate`),

  updateType: (bedId: string, bedType: string) =>
    api.patch(`/beds/${bedId}/type`, { bedType }),
};
