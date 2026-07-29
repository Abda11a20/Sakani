// apps/frontend/src/lib/api/requests.api.ts
import { api } from "@/lib/api";

export const requestsApi = {
  create: (data: {
    listingId: string;
    preferredDate?: string;
    moveInDate?: string;
    message?: string;
    specialty?: string;
  }) => api.post("/requests", data),

  getMyAsTenant: (page = 1) =>
    api.get("/requests/my/tenant", { params: { page } }),

  getMyAsLandlord: (page = 1) =>
    api.get("/requests/my/landlord", { params: { page } }),

  getLandlordStats: () =>
    api.get("/requests/my/landlord/stats"),

  getOne: (id: string) =>
    api.get(`/requests/${id}`),

  updateStatus: (id: string, data: { status: string }) =>
    api.patch(`/requests/${id}/status`, data),

  cancel: (id: string) =>
    api.delete(`/requests/${id}`),

  finalizeBedRental: (requestId: string, payload: any) =>
    api.patch(`/requests/${requestId}/finalize-bed-rental`, payload),

  finalizeUnitRental: (requestId: string, payload: any) =>
    api.patch(`/requests/${requestId}/finalize-unit-rental`, payload),

  quickRent: (payload: any) =>
    api.post("/requests/quick-rent", payload),

  viewPhone: async (requestId: string) => {
    const res = await api.get<{ canViewPhone: boolean; phone: string | null }>(`/requests/listing/${requestId}/contact-access`);
    return res.data;
  },
};
