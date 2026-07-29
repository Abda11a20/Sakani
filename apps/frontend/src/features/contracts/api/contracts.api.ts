// apps/frontend/src/lib/api/contracts.api.ts
import { api } from "@/lib/api";
import type { RentalHistoryResponse, RentalHistoryQuery } from "@/types";

function buildParams(query: RentalHistoryQuery): string {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.sort) params.set("sort", query.sort);
  if (query.status) params.set("status", query.status);
  return params.toString();
}

export const contractsApi = {
  getLandlordHistory: async (query: RentalHistoryQuery = {}) => {
    const qs = buildParams(query);
    const res = await api.get<RentalHistoryResponse>(`/rental-history/landlord${qs ? `?${qs}` : ""}`);
    return res.data;
  },

  getTenantHistory: async (query: RentalHistoryQuery = {}) => {
    const qs = buildParams(query);
    const res = await api.get<RentalHistoryResponse>(`/rental-history/tenant${qs ? `?${qs}` : ""}`);
    return res.data;
  },

  terminate: async (id: string, data: { reason: string; notes?: string; checkoutDate?: string }) => {
    const res = await api.patch(`/rental-contracts/${id}/terminate`, data);
    return res.data;
  },

  renew: async (id: string, data: { newEndDate: string; newMonthlyRent?: number; isAutoRenew?: boolean; notes?: string }) => {
    const res = await api.patch(`/rental-contracts/${id}/renew`, data);
    return res.data;
  },
};
