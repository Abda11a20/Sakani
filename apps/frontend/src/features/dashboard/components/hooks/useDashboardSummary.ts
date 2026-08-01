// apps/frontend/src/features/dashboard/components/hooks/useDashboardSummary.ts
import { useQuery } from "@tanstack/react-query";
import { getDashboardSummaryUseCase } from "../../domain/usecases/get-dashboard-summary.usecase";
import { useAuthStore } from "@/features/auth/store/auth.store";
import type { DashboardSummaryResponse } from "../types/dashboard.types";

export const useDashboardSummary = (role: string) => {
  const token = useAuthStore((state) => state.token);

  return useQuery<DashboardSummaryResponse>({
    queryKey: ["dashboard", role, "summary"],
    queryFn: () => getDashboardSummaryUseCase.execute(),
    enabled: !!token && !!role,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};
