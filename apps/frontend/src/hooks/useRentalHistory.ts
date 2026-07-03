// apps/frontend/src/hooks/useRentalHistory.ts

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { RentalHistoryResponse, RentalHistoryQuery } from "@/types";

// ── Build query string ────────────────────────────────────────────────────────
function buildParams(query: RentalHistoryQuery): string {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.sort) params.set("sort", query.sort);
  return params.toString();
}

// ── Landlord Rental History ───────────────────────────────────────────────────
export const useLandlordRentalHistory = (query: RentalHistoryQuery = {}) => {
  const qs = buildParams(query);

  return useQuery<RentalHistoryResponse>({
    queryKey: ["rental-history", "landlord", query],
    queryFn: async (): Promise<RentalHistoryResponse> => {
      const response = await api.get<RentalHistoryResponse>(
        `/rental-history/landlord${qs ? `?${qs}` : ""}`
      );
      return response.data;
    },
    // Keep previous data while new page loads (seamless pagination)
    placeholderData: (prev) => prev,
    staleTime: 30_000, // 30 s — rental history doesn't change often
  });
};

// ── Tenant Rental History ─────────────────────────────────────────────────────
export const useTenantRentalHistory = (query: RentalHistoryQuery = {}) => {
  const qs = buildParams(query);

  return useQuery<RentalHistoryResponse>({
    queryKey: ["rental-history", "tenant", query],
    queryFn: async (): Promise<RentalHistoryResponse> => {
      const response = await api.get<RentalHistoryResponse>(
        `/rental-history/tenant${qs ? `?${qs}` : ""}`
      );
      return response.data;
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
};
