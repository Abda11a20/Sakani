// apps/frontend/src/hooks/useAdmin.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { adminRepository } from "@/features/admin";
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
    listing?: Pick<Listing, "id" | "title" | "governorate" | "district" | "price"> & {
      landlordId: string;
      landlord?: Pick<User, "id" | "name" | "phone">;
    };
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

export interface RegisterAdminPayload {
  name: string;
  phone: string;
  email: string;
  password: string;
}

// ── Dashboard Stats & Health ──────────────────────────────────────────────────

export const useAdminStats = () => {
  return useQuery<DashboardStats>({
    queryKey: ["admin", "stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const res = await adminRepository.getStats();
      return res.data as DashboardStats;
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
      const res = await adminRepository.reviewListing(id, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

export const useAdminPermanentDeleteListing = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, string>({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/admin/listings/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "deleted-listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

// ── Soft Delete Hooks ─────────────────────────────────────────────────────────

export interface DeletedListingsFilters {
  page?: number;
  limit?: number;
  deletedByRole?: string;
  search?: string;
  from?: string;
  to?: string;
}

export interface DeletedListingsResponse {
  listings: (Listing & {
    landlord?: Pick<User, "id" | "name" | "phone" | "avatarUrl" | "emailVerifiedAt">;
    images?: Array<{ id: string; url: string; order: number }>;
    _count?: { images: number };
  })[];
  meta: PaginationMeta;
}

export const useDeletedAdminListings = (filters: DeletedListingsFilters = {}) => {
  const { page = 1, limit = 10, deletedByRole, search, from, to } = filters;

  return useQuery<DeletedListingsResponse>({
    queryKey: ["admin", "deleted-listings", page, limit, deletedByRole, search, from, to],
    queryFn: async (): Promise<DeletedListingsResponse> => {
      const params: Record<string, string | number | undefined> = { page, limit };
      if (deletedByRole && deletedByRole !== "all") params.deletedByRole = deletedByRole;
      if (search) params.search = search;
      if (from) params.from = from;
      if (to) params.to = to;

      const res = await api.get<DeletedListingsResponse>("/admin/deleted-listings", { params });
      return res.data;
    },
    staleTime: 30_000,
  });
};

export const useSoftDeleteListing = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { id: string; reason?: string }>({
    mutationFn: async ({ id, reason }) => {
      const res = await api.patch(`/admin/listings/${id}/soft-delete`, { reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "deleted-listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

export const useRestoreListing = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, string>({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/admin/listings/${id}/restore`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "deleted-listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

export const useDeleteListingImages = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, string>({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/admin/listings/${id}/images`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "deleted-listings"] });
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
      const params: Record<string, string | number | undefined> = { page, limit };
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
      const res = await adminRepository.verifyUser(userId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
};

export const useRejectUser = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, string>({
    mutationFn: async (userId: string) => {
      const res = await api.patch(`/admin/users/${userId}/reject`);
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
      const res = await adminRepository.toggleUserStatus(userId);
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
      const res = await adminRepository.getIdCardUrl(userId);
      return res.data as { url: string };
    },
    enabled: !!userId && enabled,
    staleTime: 9 * 60 * 1000, // 9 minutes (presigned URLs usually expire in 10-15 mins)
  });
};

// ── Blacklist / Banned ────────────────────────────────────────────────────────

export const useBannedUsers = (page = 1, limit = 10, search?: string) => {
  return useQuery<BannedUsersResponse>({
    queryKey: ["admin", "banned", page, limit, search],
    queryFn: async (): Promise<BannedUsersResponse> => {
      const res = await adminRepository.getBanned(page, search);
      const payload = (res as any)?.data ?? res;
      return (payload ?? { banned: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } }) as BannedUsersResponse;
    },
    staleTime: 30_000,
  });
};

export const useBanUser = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, BanUserPayload>({
    mutationFn: async (payload: BanUserPayload) => {
      const res = await adminRepository.banUser(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "banned"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

export const useRegisterAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, RegisterAdminPayload>({
    mutationFn: async (payload: RegisterAdminPayload) => {
      const res = await api.post("/admin/register-admin", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

export const useUnbanUser = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, string>({
    mutationFn: async (blacklistId: string) => {
      const res = await adminRepository.unban(blacklistId);
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
      const params: Record<string, string | number | undefined> = { page, limit };
      if (status && status !== "all") params.status = status;
      if (search) params.search = search;

      const res = await api.get<AllRequestsResponse>("/admin/requests", { params });
      return res.data;
    },
    staleTime: 30_000,
  });
};

// ── Support Chat ──────────────────────────────────────────────────────────────

export interface SupportConversation {
  id: string;
  status?: string;
  blockedAt?: string | null;
  blockedBy?: string | null;
  blockedByUser?: { id: string; name: string; role?: string } | null;
  blockReason?: string | null;
  blockCount?: number;
  createdAt?: string;
  updatedAt?: string;
  unreadCount?: number;
  clientUser?: {
    id: string;
    name: string;
    phone?: string;
    email?: string | null;
    role?: string;
    avatarUrl?: string | null;
  } | null;
  participants?: Array<{ id: string; name: string; phone?: string; avatarUrl?: string | null }>;
  lastMessage?: {
    content: string;
    createdAt: string;
    type?: string;
    sender: { id: string; name: string };
  } | null;
}

export interface SupportConversationsResponse {
  conversations: SupportConversation[];
  meta: PaginationMeta;
}

export const useAdminSupport = (status?: string, reason?: string, search?: string, page = 1, limit = 30) => {
  return useQuery<SupportConversationsResponse>({
    queryKey: ["admin", "support", status, reason, search, page, limit],
    queryFn: async (): Promise<SupportConversationsResponse> => {
      const pageNum = typeof page === "number" ? page : 1;
      const limitNum = typeof limit === "number" ? limit : 30;
      const params: Record<string, string | number | undefined> = { page: pageNum, limit: limitNum };
      if (status) params.status = status;
      if (reason) params.reason = reason;
      if (search) params.search = search;

      const res = await api.get<SupportConversationsResponse>("/admin/chat/conversations", {
        params,
      });
      return res.data;
    },
    staleTime: 10_000,
  });
};

export const useBlockConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, reason, note }: { conversationId: string; reason?: string; note?: string }) => {
      const res = await api.post(`/admin/chat/conversations/${conversationId}/block`, { reason, note });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support"] });
    },
  });
};

export const useUnblockConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const res = await api.post(`/admin/chat/conversations/${conversationId}/unblock`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support"] });
    },
  });
};

// ── Account Lifecycle Hooks ──────────────────────────────────────────────────

export const useAdminAccountLifecycle = (status?: string, search?: string, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ["admin", "account-lifecycle", status, search, page, limit],
    queryFn: async () => {
      const params: Record<string, string | number | undefined> = { page, limit };
      if (status) params.status = status;
      if (search) params.search = search;
      const res = await api.get("/admin/account-lifecycle", { params });
      return res.data;
    },
    staleTime: 10_000,
  });
};

export const useRestoreAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      const res = await api.post(`/admin/account-lifecycle/${userId}/restore`, { reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "account-lifecycle"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

export const usePurgeAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.post(`/admin/account-lifecycle/${userId}/purge`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "account-lifecycle"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

// ── Admin Rentals Hook ───────────────────────────────────────────────────────

export interface AdminRentalsResponse {
  data: Array<{
    id: string;
    contractNumber?: string;
    status: string;
    createdByType?: string;
    monthlyRent?: number;
    securityDeposit?: number;
    paymentCycle?: string;
    currency?: string;
    startDate?: string;
    endDate?: string;
    actualCheckout?: string | null;
    isAutoRenew?: boolean;
    terminationReason?: string | null;
    terminationNotes?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
    listing: {
      id: string;
      title: string;
      unitType: string;
      price: number;
      governorate: string;
      district: string;
      images: Array<{ url: string }>;
      landlord: {
        id: string;
        name: string;
        phone: string;
        avatarUrl: string | null;
        email: string;
      };
    };
    tenant: {
      id: string;
      name: string;
      phone: string;
      avatarUrl: string | null;
      email: string;
    };
  }>;
  meta: PaginationMeta;
}

export const useAdminRentals = (page = 1, limit = 10, search?: string, from?: string, to?: string) => {
  return useQuery<AdminRentalsResponse>({
    queryKey: ["admin", "rentals", page, limit, search, from, to],
    queryFn: async (): Promise<AdminRentalsResponse> => {
      const params: Record<string, string | number | undefined> = { page, limit };
      if (search) params.search = search;
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await api.get<AdminRentalsResponse>("/rental-history/admin", { params });
      return res.data;
    },
    staleTime: 30_000,
  });
};

// ── Community Reports ──────────────────────────────────────────────────────────

export interface CommunityReportItem {
  id: string;
  reason: "SPAM" | "HARASSMENT" | "INAPPROPRIATE" | "FAKE" | "OTHER";
  details?: string | null;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  createdAt: string;
  reporter?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  post?: {
    id: string;
    title: string;
    description: string;
    user?: {
      id: string;
      name: string;
      role?: string;
    };
  };
}

export interface AdminReportsResponse {
  reports: CommunityReportItem[];
  total: number;
}

export const useAdminReports = (page = 1, limit = 10) => {
  return useQuery<AdminReportsResponse>({
    queryKey: ["admin", "reports", page, limit],
    queryFn: async (): Promise<AdminReportsResponse> => {
      const res = await api.get<AdminReportsResponse>("/admin/community/reports", {
        params: { page, limit },
      });
      return res.data;
    },
    staleTime: 15_000,
  });
};

export const useResolveReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "RESOLVED" | "DISMISSED" }) => {
      const res = await api.patch(`/admin/community/reports/${id}/resolve`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
    },
  });
};


