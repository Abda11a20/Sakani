// apps/frontend/src/hooks/useDashboard.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

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
  return useQuery<LandlordDashboardStats>({
    queryKey: ["dashboard", "landlord", "stats"],
    queryFn: async (): Promise<LandlordDashboardStats> => {
      const response = await api.get<LandlordDashboardStats>("/dashboard/landlord/stats");
      return response.data;
    },
    staleTime: 10_000,
  });
};

export const useTenantDashboardStats = () => {
  return useQuery<TenantDashboardStats>({
    queryKey: ["dashboard", "tenant", "stats"],
    queryFn: async (): Promise<TenantDashboardStats> => {
      const response = await api.get<TenantDashboardStats>("/dashboard/tenant/stats");
      return response.data;
    },
    staleTime: 10_000,
  });
};
