// apps/frontend/src/hooks/useRequests.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Listing, ViewingRequest, ViewingRequestStatus } from "@/types";

export interface RequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
}

type RequestsData = { items: ViewingRequest[]; total: number; pages: number };
type BackendRequestsData = {
  requests: ViewingRequest[];
  meta?: {
    total?: number;
    page?: number;
    lastPage?: number;
  };
};

const normalizeRequestsData = (data: RequestsData | BackendRequestsData | ViewingRequest[]): RequestsData => {
  if (data && !Array.isArray(data) && Array.isArray((data as RequestsData).items)) {
    return data as RequestsData;
  }
  if (data && !Array.isArray(data) && Array.isArray((data as BackendRequestsData).requests)) {
    const backendData = data as BackendRequestsData;
    return {
      items: backendData.requests,
      total: backendData.meta?.total ?? backendData.requests.length,
      pages: backendData.meta?.lastPage ?? 1,
    };
  }
  if (Array.isArray(data)) {
    return { items: data, total: data.length, pages: 1 };
  }
  return { items: [], total: 0, pages: 1 };
};

export const useLandlordRequests = (page = 1) => {
  return useQuery<RequestsData>({
    queryKey: ["requests", "landlord", page],
    queryFn: async () => {
      const response = await api.get<RequestsData | BackendRequestsData | ViewingRequest[]>(
        `/requests/my/landlord?page=${page}&limit=10`
      );
      return normalizeRequestsData(response.data);
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

export const useRequestDetails = (requestId: string | null | undefined) => {
  return useQuery<ViewingRequest>({
    queryKey: ["requests", requestId],
    queryFn: async (): Promise<ViewingRequest> => {
      const response = await api.get<ViewingRequest>(`/requests/${requestId}`);
      return response.data;
    },
    enabled: !!requestId,
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

export interface FinalizeBedRentalPayload {
  requestId: string;
  bedId: string;
  startDate: string;
  endDate: string;
}

export interface FinalizeUnitRentalPayload {
  requestId: string;
  startDate: string;
  endDate: string;
}

export const useFinalizeBedRental = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, FinalizeBedRentalPayload>({
    mutationFn: async ({ requestId, bedId, startDate, endDate }): Promise<any> => {
      const response = await api.patch<any>(`/requests/${requestId}/finalize-bed-rental`, {
        bedId,
        rentedSince: startDate,
        rentedUntil: endDate,
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const bed = data?.bed || data;
      const listing = data?.listing;
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["requests", variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ["listings", "my"] });
      queryClient.refetchQueries({ queryKey: ["requests"], type: "active" });
      queryClient.refetchQueries({ queryKey: ["listings", "my"], type: "active" });
      if (listing?.id) {
        queryClient.setQueryData(["listings", listing.id], listing);
        queryClient.setQueryData<Listing[]>(["listings", "my"], (current) =>
          current?.map((item) => (item.id === listing.id ? { ...item, ...listing } : item))
        );
      }
      if (bed?.listingId) {
        queryClient.invalidateQueries({ queryKey: ["listings", bed.listingId] });
        queryClient.invalidateQueries({ queryKey: ["listings", bed.listingId, "beds"] });
        queryClient.refetchQueries({ queryKey: ["listings", bed.listingId, "beds"], type: "active" });
      }
    },
  });
};

export const useFinalizeUnitRental = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, FinalizeUnitRentalPayload>({
    mutationFn: async ({ requestId, startDate, endDate }): Promise<any> => {
      const response = await api.patch<any>(`/requests/${requestId}/finalize-unit-rental`, {
        rentedSince: startDate,
        rentedUntil: endDate,
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const listing = data?.listing;
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["requests", variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ["listings", "my"] });
      queryClient.refetchQueries({ queryKey: ["requests"], type: "active" });
      queryClient.refetchQueries({ queryKey: ["listings", "my"], type: "active" });
      if (listing?.id) {
        queryClient.setQueryData(["listings", listing.id], listing);
        queryClient.setQueryData<Listing[]>(["listings", "my"], (current) =>
          current?.map((item) => (item.id === listing.id ? { ...item, ...listing } : item))
        );
      }
    },
  });
};

export const useTenantRequests = (page = 1) => {
  return useQuery<RequestsData>({
    queryKey: ["requests", "tenant", page],
    queryFn: async () => {
      const response = await api.get<RequestsData | BackendRequestsData | ViewingRequest[]>(
        `/requests/my/tenant?page=${page}&limit=10`
      );
      return normalizeRequestsData(response.data);
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

export const useQuickRent = () => {
  const queryClient = useQueryClient();

  return useMutation<
    any,
    Error,
    { listingId: string; phone: string; startDate: string; endDate: string; bedId?: string }
  >({
    mutationFn: async ({ listingId, phone, startDate, endDate, bedId }) => {
      const response = await api.post("/requests/quick-rent", {
        listingId,
        phone,
        rentedSince: startDate,
        rentedUntil: endDate,
        bedId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings", "my"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["rental-history"] });
      queryClient.invalidateQueries({ queryKey: ["beds"] });
      queryClient.invalidateQueries({ queryKey: ["listing-beds"] });
    },
  });
};

export const useListingContactAccess = (listingId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["contact-access", listingId],
    queryFn: async () => {
      const response = await api.get<{ canViewPhone: boolean; phone: string | null }>(
        `/requests/listing/${listingId}/contact-access`
      );
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

