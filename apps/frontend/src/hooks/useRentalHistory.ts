// apps/frontend/src/hooks/useRentalHistory.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contractsApi } from "@/features/contracts";
import type { RentalHistoryResponse, RentalHistoryQuery } from "@/types";

// ── Landlord Rental History ───────────────────────────────────────────────────
export const useLandlordRentalHistory = (query: RentalHistoryQuery = {}) => {
  return useQuery<RentalHistoryResponse>({
    queryKey: ["rental-history", "landlord", query],
    queryFn: () => contractsApi.getLandlordHistory(query),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
};

// ── Tenant Rental History ─────────────────────────────────────────────────────
export const useTenantRentalHistory = (query: RentalHistoryQuery = {}) => {
  return useQuery<RentalHistoryResponse>({
    queryKey: ["rental-history", "tenant", query],
    queryFn: () => contractsApi.getTenantHistory(query),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
};

// ── Terminate Contract Mutation ───────────────────────────────────────────────
export const useTerminateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { reason: string; notes?: string; checkoutDate?: string } }) =>
      contractsApi.terminate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental-history"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

// ── Renew Contract Mutation ───────────────────────────────────────────────────
export const useRenewContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { newEndDate: string; newMonthlyRent?: number; isAutoRenew?: boolean; notes?: string } }) =>
      contractsApi.renew(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental-history"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
