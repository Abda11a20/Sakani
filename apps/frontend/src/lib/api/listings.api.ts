// Infrastructure layer
// Not used yet.
// Will be migrated gradually.

// apps/frontend/src/lib/api/listings.api.ts
import apiClient from "@/lib/api";
import type { SearchFilters } from "@/types";

export const listingsApi = {
  search: (params: SearchFilters) =>
    apiClient.get("/search", { params }),

  getAll: (params?: Record<string, unknown>) =>
    apiClient.get("/listings", { params }),

  getMy: () =>
    apiClient.get("/listings/my"),

  getOne: (id: string) =>
    apiClient.get(`/listings/${id}`),

  create: (data: Record<string, unknown>) =>
    apiClient.post("/listings", data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/listings/${id}`, data),

  remove: (id: string) =>
    apiClient.delete(`/listings/${id}`),

  getSuggested: (id: string) =>
    apiClient.get(`/search/suggested/${id}`),

  getPopularDistricts: () =>
    apiClient.get("/search/popular-districts"),

  getPriceStats: (params?: { governorate?: string; district?: string }) =>
    apiClient.get("/search/price-stats", { params }),
};
