// apps/frontend/src/features/dashboard/components/hooks/useDashboardSummary.ts
import { useQuery } from "@tanstack/react-query";
import { getDashboardSummaryUseCase } from "../../domain/usecases/get-dashboard-summary.usecase";
import type { DashboardSummaryResponse } from "../types/dashboard.types";

export const useDashboardSummary = (role: string) => {
  return useQuery<DashboardSummaryResponse>({
    queryKey: ["dashboard", role, "summary"],
    queryFn: () => getDashboardSummaryUseCase.execute(),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};
