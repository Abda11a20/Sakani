// apps/frontend/src/hooks/useDashboard.ts
import { useQuery } from "@tanstack/react-query";
import { dashboardRepository } from "@/features/dashboard";
import { useAuthStore } from "@/features/auth";

export interface LandlordDashboardStats {
  activeListings: number;
  occupiedUnits: number;
  pendingRequests: number;
  monthlyRevenue: number;
  totalViews: number;
}

export interface TenantDashboardStats {
  activeRequests: number;
  activeAlerts: number;
  rentedUnits: number;
  monthlyRent: number;
}

export const useLandlordDashboardStats = () => {
  const { token, user } = useAuthStore();

  return useQuery<LandlordDashboardStats>({
    queryKey: ["dashboard", "landlord", "stats"],
    queryFn: () => dashboardRepository.getLandlordStats(),
    enabled: !!token && (user?.role === "landlord" || user?.role === "admin" || user?.role === "super_admin"),
    staleTime: 60_000,
  });
};

export const useTenantDashboardStats = () => {
  const { token, user } = useAuthStore();

  return useQuery<TenantDashboardStats>({
    queryKey: ["dashboard", "tenant", "stats"],
    queryFn: () => dashboardRepository.getTenantStats(),
    enabled: !!token && user?.role === "tenant",
    staleTime: 60_000,
  });
};
