// apps/frontend/src/hooks/useDashboard.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

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
    queryFn: async (): Promise<LandlordDashboardStats> => {
      const response = await api.get<LandlordDashboardStats>("/dashboard/landlord/stats");
      return response.data;
    },
    // تشغيل فقط إذا كان المستخدم مؤجراً أو أدمن
    enabled: !!token && (user?.role === "landlord" || user?.role === "admin" || user?.role === "super_admin"),
    staleTime: 10_000,
  });
};

export const useTenantDashboardStats = () => {
  const { token, user } = useAuthStore();

  return useQuery<TenantDashboardStats>({
    queryKey: ["dashboard", "tenant", "stats"],
    queryFn: async (): Promise<TenantDashboardStats> => {
      const response = await api.get<TenantDashboardStats>("/dashboard/tenant/stats");
      return response.data;
    },
    // تشغيل فقط إذا كان المستخدم مستأجراً
    enabled: !!token && user?.role === "tenant",
    staleTime: 10_000,
  });
};
