// apps/frontend/src/hooks/useAlerts.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { alertsApi } from "@/lib/api/alerts.api";
import type { Alert } from "@/types";
import { useAuthStore } from "@/store/auth.store";

/**
 * جلب تنبيهات المستخدم الحالي — يعمل فقط عند وجود توكن صالح
 * (يتجنب إطلاق 401 للزوار غير المسجّلين)
 */
export const useMyAlerts = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery<Alert[]>({
    queryKey: ["alerts", "my"],
    queryFn: async (): Promise<Alert[]> => {
      const response = await alertsApi.getMy();
      return response.data as Alert[];
    },
    // لا تُشغّل الـ query إلا عند وجود توكن مصادقة
    enabled: !!token,
  });
};

export const useCreateAlert = () => {
  const queryClient = useQueryClient();

  return useMutation<Alert, Error, Partial<Alert>>({
    mutationFn: async (data): Promise<Alert> => {
      const response = await alertsApi.create(data as Record<string, unknown>);
      return response.data as Alert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
};

export const useUpdateAlert = () => {
  const queryClient = useQueryClient();

  return useMutation<Alert, Error, { id: string; data: Partial<Alert> }>({
    mutationFn: async ({ id, data }): Promise<Alert> => {
      const response = await alertsApi.update(id, data as Record<string, unknown>);
      return response.data as Alert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
};

export const useToggleAlert = () => {
  const queryClient = useQueryClient();

  return useMutation<Alert, Error, string>({
    mutationFn: async (id): Promise<Alert> => {
      const response = await alertsApi.toggle(id);
      return response.data as Alert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
};

export const useDeleteAlert = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id): Promise<void> => {
      await alertsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
};
