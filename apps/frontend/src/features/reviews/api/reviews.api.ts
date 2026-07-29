// apps/frontend/src/lib/api/reviews.api.ts
import { api } from "@/lib/api";

export const reviewsApi = {
  create: (data: { listingId: string; rating: number; comment?: string }) =>
    api.post("/reviews", data),

  getByListing: (listingId: string, page = 1) =>
    api.get(`/reviews/listing/${listingId}`, { params: { page } }),

  getByLandlord: (landlordId: string, page = 1) =>
    api.get(`/reviews/landlord/${landlordId}`, { params: { page } }),

  getLandlordRating: (landlordId: string) =>
    api.get(`/reviews/landlord/${landlordId}/rating`),

  delete: (id: string) =>
    api.delete(`/reviews/${id}`),
};
