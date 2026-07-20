// apps/frontend/src/hooks/useRequests.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { requestsApi } from "@/lib/api/requests.api";
import { useAuthStore } from "@/store/auth.store";
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
  const token = useAuthStore((s) => s.token);

  return useQuery<RequestsData>({
    queryKey: ["requests", "landlord", page],
    queryFn: async () => {
      const response = await requestsApi.getMyAsLandlord(page);
      return normalizeRequestsData(response.data as RequestsData | BackendRequestsData | ViewingRequest[]);
    },
    enabled: !!token,
  });
};

export const useLandlordRequestStats = () => {
  return useQuery<RequestStats>({
    queryKey: ["requests", "landlord", "stats"],
    queryFn: async (): Promise<RequestStats> => {
      const response = await requestsApi.getLandlordStats();
      return response.data as RequestStats;
    },
  });
};

export const useRequestDetails = (requestId: string | null | undefined) => {
  return useQuery<ViewingRequest>({
    queryKey: ["requests", requestId],
    queryFn: async (): Promise<ViewingRequest> => {
      const response = await requestsApi.getOne(requestId!);
      return response.data as ViewingRequest;
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
      const response = await requestsApi.updateStatus(requestId, { status: backendStatus });
      return response.data as ViewingRequest;
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

// Response types derived from actual endpoint usage in onSuccess handlers
interface FinalizeBedRentalResponse {
  bed?: { listingId?: string; id?: string };
  listing?: Listing;
  message?: string;
}

interface FinalizeUnitRentalResponse {
  listing?: Listing;
  message?: string;
}

interface QuickRentResponse {
  request?: ViewingRequest;
  message?: string;
}

// Special endpoints — kept with api directly
export const useFinalizeBedRental = () => {
  const queryClient = useQueryClient();

  return useMutation<FinalizeBedRentalResponse, Error, FinalizeBedRentalPayload>({
    mutationFn: async ({ requestId, bedId, startDate, endDate }): Promise<FinalizeBedRentalResponse> => {
      const response = await api.patch<FinalizeBedRentalResponse>(`/requests/${requestId}/finalize-bed-rental`, {
        bedId,
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
      // Access listingId directly via data.bed — avoids ambiguous union with data itself
      const bedListingId = data?.bed?.listingId;
      if (bedListingId) {
        queryClient.invalidateQueries({ queryKey: ["listings", bedListingId] });
        queryClient.invalidateQueries({ queryKey: ["listings", bedListingId, "beds"] });
        queryClient.refetchQueries({ queryKey: ["listings", bedListingId, "beds"], type: "active" });
      }
    },
  });
};

export const useFinalizeUnitRental = () => {
  const queryClient = useQueryClient();

  return useMutation<FinalizeUnitRentalResponse, Error, FinalizeUnitRentalPayload>({
    mutationFn: async ({ requestId, startDate, endDate }): Promise<FinalizeUnitRentalResponse> => {
      const response = await api.patch<FinalizeUnitRentalResponse>(`/requests/${requestId}/finalize-unit-rental`, {
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
  const token = useAuthStore((s) => s.token);

  return useQuery<RequestsData>({
    queryKey: ["requests", "tenant", page],
    queryFn: async () => {
      const response = await requestsApi.getMyAsTenant(page);
      return normalizeRequestsData(response.data as RequestsData | BackendRequestsData | ViewingRequest[]);
    },
    enabled: !!token,
  });
};

export const useCancelRequest = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (requestId): Promise<void> => {
      await requestsApi.cancel(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
};

// Special quick-rent endpoint — kept with api directly
export const useQuickRent = () => {
  const queryClient = useQueryClient();

  return useMutation<
    QuickRentResponse,
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

// Special contact-access endpoint — kept with api directly
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
    staleTime: 5 * 60 * 1000,
  });
};
