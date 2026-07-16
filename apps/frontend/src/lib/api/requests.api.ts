// Infrastructure layer
// Not used yet.
// Will be migrated gradually.

// apps/frontend/src/lib/api/requests.api.ts
import apiClient from "@/lib/api";

export const requestsApi = {
  create: (data: {
    listingId: string;
    preferredDate: string;
    message?: string;
    specialty?: string;
  }) => apiClient.post("/requests", data),

  getMyAsTenant: (page = 1) =>
    apiClient.get("/requests/my/tenant", { params: { page } }),

  getMyAsLandlord: (page = 1) =>
    apiClient.get("/requests/my/landlord", { params: { page } }),

  getLandlordStats: () =>
    apiClient.get("/requests/my/landlord/stats"),

  getOne: (id: string) =>
    apiClient.get(`/requests/${id}`),

  updateStatus: (id: string, data: { status: string }) =>
    apiClient.patch(`/requests/${id}/status`, data),

  cancel: (id: string) =>
    apiClient.delete(`/requests/${id}`),
};
