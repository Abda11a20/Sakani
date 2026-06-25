// apps/frontend/src/hooks/useAdmin.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { 
  Listing, 
  User, 
  ViewingRequest, 
  PaginationMeta, 
  DashboardStats,
  BannedUser
} from "@/types";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PendingListingsResponse {
  listings: (Listing & {
    landlord?: Pick<User, "id" | "name" | "phone" | "avatarUrl" | "emailVerifiedAt">;
    images?: Array<{ id: string; url: string; order: number }>;
  })[];
  meta: PaginationMeta;
}

export interface AllUsersResponse {
  users: Omit<User, "nationalIdEnc">[];
  meta: PaginationMeta;
}

export interface BannedUsersResponse {
  banned: BannedUser[];
  meta: PaginationMeta;
}

export interface AllRequestsResponse {
  requests: (ViewingRequest & {
    tenant?: Pick<User, "id" | "name" | "phone">;
    listing?: Pick<Listing, "id" | "title"> & { landlordId: string };
  })[];
  meta: PaginationMeta;
}

export interface ReviewListingPayload {
  status: "active" | "rejected";
  rejectionReason?: string;
}

export interface BanUserPayload {
  nationalIdHash?: string;
  phone?: string;
  reason: string;
}

export interface UpdateRolePayload {
  role: "tenant" | "landlord" | "admin";
}

// ── Dashboard Stats & Health ──────────────────────────────────────────────────

export const useAdminStats = () => {
  return useQuery<DashboardStats>({
    queryKey: ["admin", "stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const res = await api.get<DashboardStats>("/admin/dashboard/stats");
      return res.data;
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
};

export const useHealthCheck = () => {
  return useQuery<{ status: string; latency: number; uptime: number }>({
    queryKey: ["admin", "health"],
    queryFn: async () => {
      const res = await api.get("/health");
      return res.data;
    },
    staleTime: 0,
    refetchInterval: 30_000, // Every 30 seconds
  });
};

// ── Listings ─────────────────────────────────────────────────────────────

export const useAdminListings = (page = 1, limit = 10, status?: string) => {
  return useQuery<PendingListingsResponse>({
    queryKey: ["admin", "listings", page, limit, status],
    queryFn: async (): Promise<PendingListingsResponse> => {
      const res = await api.get<PendingListingsResponse>(
        "/admin/listings",
        { params: { page, limit, ...(status && status !== "all" ? { status } : {}) } }
      );
      return res.data;
    },
    staleTime: 30_000,
  });
};

export const useReviewListing = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { id: string; payload: ReviewListingPayload }>({
    mutationFn: async ({ id, payload }) => {
      const res = await api.patch(`/admin/listings/${id}/review`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

export const useAdminDeleteListing = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, string>({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/admin/listings/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

// ── Users ────────────────────────────────────────────────────────────────────

export const useAdminUsers = (
  page = 1,
  limit = 10,
  role?: string,
  search?: string,
  isActive?: string,
  isVerified?: string
) => {
  return useQuery<AllUsersResponse>({
    queryKey: ["admin", "users", page, limit, role, search, isActive, isVerified],
    queryFn: async (): Promise<AllUsersResponse> => {
      const params: Record<string, any> = { page, limit };
      if (role && role !== "all") params.role = role;
      if (search) params.search = search;
      if (isActive && isActive !== "all") params.isActive = isActive;
      if (isVerified && isVerified !== "all") params.isVerified = isVerified;

      const res = await api.get<AllUsersResponse>("/admin/users", { params });
      return res.data;
    },
    staleTime: 30_000,
  });
};

export const useVerifyUser = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, string>({
    mutationFn: async (userId: string) => {
      const res = await api.patch(`/admin/users/${userId}/verify`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, string>({
    mutationFn: async (userId: string) => {
      const res = await api.patch(`/admin/users/${userId}/toggle-status`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { userId: string; payload: UpdateRolePayload }>({
    mutationFn: async ({ userId, payload }) => {
      const res = await api.patch(`/admin/users/${userId}/role`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
};

export const useAdminDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, string>({
    mutationFn: async (userId: string) => {
      const res = await api.delete(`/admin/users/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

export const useIdCardUrl = (userId: string, enabled = false) => {
  return useQuery<{ url: string }>({
    queryKey: ["admin", "idCard", userId],
    queryFn: async () => {
      const res = await api.get(`/uploads/id-card/${userId}`);
      return res.data;
    },
    enabled: !!userId && enabled,
    staleTime: 9 * 60 * 1000, // 9 minutes (presigned URLs usually expire in 10-15 mins)
  });
};

// ── Blacklist / Banned ────────────────────────────────────────────────────────

export const useBannedUsers = (page = 1, limit = 10) => {
  return useQuery<BannedUsersResponse>({
    queryKey: ["admin", "banned", page, limit],
    queryFn: async (): Promise<BannedUsersResponse> => {
      const res = await api.get<BannedUsersResponse>("/admin/banned", {
        params: { page, limit },
      });
      return res.data;
    },
    staleTime: 30_000,
  });
};

export const useBanUser = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, BanUserPayload>({
    mutationFn: async (payload: BanUserPayload) => {
      const res = await api.post("/admin/ban", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "banned"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

export const useUnbanUser = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, string>({
    mutationFn: async (blacklistId: string) => {
      const res = await api.delete(`/admin/banned/${blacklistId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "banned"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

// ── Viewing Requests ──────────────────────────────────────────────────────────

export const useAdminRequests = (page = 1, limit = 10, status?: string, search?: string) => {
  return useQuery<AllRequestsResponse>({
    queryKey: ["admin", "requests", page, limit, status, search],
    queryFn: async (): Promise<AllRequestsResponse> => {
      const params: Record<string, any> = { page, limit };
      if (status && status !== "all") params.status = status;
      if (search) params.search = search;

      const res = await api.get<AllRequestsResponse>("/admin/requests", { params });
      return res.data;
    },
    staleTime: 30_000,
  });
};

// ── Support Chat ──────────────────────────────────────────────────────────────

export interface SupportInboxResponse {
  messages: any[];
  meta: PaginationMeta;
}

export const useAdminSupport = (page = 1, limit = 30) => {
  return useQuery<SupportInboxResponse>({
    queryKey: ["admin", "support", page, limit],
    queryFn: async (): Promise<SupportInboxResponse> => {
      const res = await api.get<SupportInboxResponse>("/chat/support", {
        params: { page, limit },
      });
      return res.data;
    },
    staleTime: 10_000,
  });
};

