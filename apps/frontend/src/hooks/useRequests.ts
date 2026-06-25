// apps/frontend/src/hooks/useRequests.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ViewingRequest, ViewingRequestStatus } from "@/types";

export interface RequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
}

export const useLandlordRequests = (page = 1) => {
  return useQuery<{ items: ViewingRequest[]; total: number; pages: number }>({
    queryKey: ["requests", "landlord", page],
    queryFn: async () => {
      const response = await api.get<{ items: ViewingRequest[]; total: number; pages: number }>(
        `/requests/my/landlord?page=${page}&limit=10`
      );
      // If the response interceptor returned response.data as the raw array or paginated structure:
      // Let's make sure it handles both.
      const data = response.data;
      if (Array.isArray(data)) {
        return { items: data, total: data.length, pages: 1 };
      }
      return data || { items: [], total: 0, pages: 1 };
    },
  });
};

export const useLandlordRequestStats = () => {
  return useQuery<RequestStats>({
    queryKey: ["requests", "landlord", "stats"],
    queryFn: async (): Promise<RequestStats> => {
      const response = await api.get<RequestStats>("/requests/my/landlord/stats");
      return response.data;
    },
  });
};

export const useUpdateRequestStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ViewingRequest,
    Error,
    { requestId: string; status: ViewingRequestStatus | "accepted" }
  >({
    mutationFn: async ({ requestId, status }): Promise<ViewingRequest> => {
      // The backend expects 'accepted' instead of 'approved'
      const backendStatus = status === "approved" ? "accepted" : status;
      const response = await api.patch<ViewingRequest>(
        `/requests/${requestId}/status`,
        { status: backendStatus }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
};

export const useTenantRequests = (page = 1) => {
  return useQuery<{ items: ViewingRequest[]; total: number; pages: number }>({
    queryKey: ["requests", "tenant", page],
    queryFn: async () => {
      const response = await api.get<{ items: ViewingRequest[]; total: number; pages: number }>(
        `/requests/my?page=${page}&limit=10`
      );
      const data = response.data;
      if (Array.isArray(data)) {
        return { items: data, total: data.length, pages: 1 };
      }
      return data || { items: [], total: 0, pages: 1 };
    },
  });
};

export const useCancelRequest = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (requestId): Promise<void> => {
      await api.delete(`/requests/${requestId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
};
