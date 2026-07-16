// Infrastructure layer
// Not used yet.
// Will be migrated gradually.

// apps/frontend/src/lib/api/admin.api.ts
import apiClient from "@/lib/api";

export const adminApi = {
  getStats: () =>
    apiClient.get("/admin/dashboard/stats"),

  getPendingListings: (page = 1) =>
    apiClient.get("/admin/listings/pending", { params: { page } }),

  reviewListing: (id: string, data: { status: string; rejectionReason?: string }) =>
    apiClient.patch(`/admin/listings/${id}/review`, data),

  deleteListing: (id: string) =>
    apiClient.delete(`/admin/listings/${id}`),

  getUsers: (page = 1, role?: string) =>
    apiClient.get("/admin/users", { params: { page, role } }),

  verifyUser: (id: string) =>
    apiClient.patch(`/admin/users/${id}/verify`),

  toggleUserStatus: (id: string) =>
    apiClient.patch(`/admin/users/${id}/toggle-status`),

  updateUserRole: (id: string, role: string) =>
    apiClient.patch(`/admin/users/${id}/role`, { role }),

  deleteUser: (id: string) =>
    apiClient.delete(`/admin/users/${id}`),

  banUser: (data: {
    reason: string;
    nationalIdHash?: string;
    phone?: string;
  }) => apiClient.post("/admin/ban", data),

  getBanned: (page = 1, search?: string) =>
    apiClient.get("/admin/banned", { params: { page, search } }),

  unban: (id: string) =>
    apiClient.delete(`/admin/banned/${id}`),

  getRequests: (page = 1) =>
    apiClient.get("/admin/requests", { params: { page } }),

  getIdCardUrl: (userId: string) =>
    apiClient.get(`/uploads/id-card/${userId}`),
};
