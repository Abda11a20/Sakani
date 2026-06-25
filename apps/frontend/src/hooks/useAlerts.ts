// apps/frontend/src/hooks/useAlerts.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Alert } from "@/types";

export const useMyAlerts = () => {
  return useQuery<Alert[]>({
    queryKey: ["alerts", "my"],
    queryFn: async (): Promise<Alert[]> => {
      const response = await api.get<Alert[]>("/alerts/my");
      return response.data;
    },
  });
};

export const useCreateAlert = () => {
  const queryClient = useQueryClient();

  return useMutation<Alert, Error, Partial<Alert>>({
    mutationFn: async (data): Promise<Alert> => {
      const response = await api.post<Alert>("/alerts", data);
      return response.data;
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
      const response = await api.patch<Alert>(`/alerts/${id}`, data);
      return response.data;
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
      const response = await api.patch<Alert>(`/alerts/${id}/toggle`);
      return response.data;
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
      await api.delete(`/alerts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
};
