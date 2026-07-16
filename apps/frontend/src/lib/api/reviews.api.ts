// Infrastructure layer
// Not used yet.
// Will be migrated gradually.

// apps/frontend/src/lib/api/reviews.api.ts
import apiClient from "@/lib/api";

export const reviewsApi = {
  create: (data: { listingId: string; rating: number; comment?: string }) =>
    apiClient.post("/reviews", data),

  getByListing: (listingId: string, page = 1) =>
    apiClient.get(`/reviews/listing/${listingId}`, { params: { page } }),

  getByLandlord: (landlordId: string, page = 1) =>
    apiClient.get(`/reviews/landlord/${landlordId}`, { params: { page } }),

  getLandlordRating: (landlordId: string) =>
    apiClient.get(`/reviews/landlord/${landlordId}/rating`),

  delete: (id: string) =>
    apiClient.delete(`/reviews/${id}`),
};
