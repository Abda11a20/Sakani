// apps/frontend/src/types/index.ts
/**
 * Global Types Kernel — Barrel Re-exporter from Domain Feature Packages (Clean Architecture)
 */

export * from "@/features/auth/domain/types/auth.types";
export * from "@/features/listings/domain/types/listings.types";
export * from "@/features/beds/domain/types/beds.types";

import type { UnitType, GenderTarget, Listing } from "@/features/listings";
import type { User, UserRole } from "@/features/auth";

export type ViewingRequestStatus = "pending" | "accepted" | "approved" | "rejected" | "completed";

export interface ViewingRequest {
  id: string;
  listingId: string;
  listing?: Pick<Listing, "id" | "title" | "address" | "images" | "unitType" | "type">;
  tenantId: string;
  tenant?: Pick<User, "id" | "name" | "phone">;
  preferredDate: string;
  status: ViewingRequestStatus;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  listingId: string;
  tenantId: string;
  tenant?: Pick<User, "id" | "name">;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  tenantId: string;
  governorate?: string;
  district?: string;
  maxPrice?: number;
  unitType?: UnitType;
  genderTarget?: GenderTarget;
  specialty?: string;
  isActive: boolean;
  createdAt: string;
}

export type NotificationType =
  | "SYSTEM"
  | "REQUEST"
  | "REVIEW"
  | "PAYMENT"
  | "CHAT"
  | "ALERT";

export type NotificationEventKey =
  | "CONTRACT_EXPIRED"
  | "CONTRACT_RENEWED"
  | "CONTRACT_TERMINATED"
  | "UNIT_RENTAL_COMPLETED"
  | "BED_RENTAL_COMPLETED"
  | "LISTING_APPROVED"
  | "LISTING_REJECTED"
  | "LISTING_PAUSED"
  | "LISTING_REPUBLISHED"
  | "REQUEST_CREATED"
  | "REQUEST_ACCEPTED"
  | "REQUEST_REJECTED"
  | "REQUEST_CANCELED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "SUBSCRIPTION_RENEWED"
  | "COMMUNITY_POST_REPLY"
  | "COMMUNITY_ALERT_MATCH";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface NotificationPayload {
  version?: number;
  listingId?: string;
  listingTitle?: string;
  tenantId?: string;
  tenantName?: string;
  contractId?: string;
  contractNumber?: string;
  oldContractNumber?: string;
  newContractNumber?: string;
  newEndDate?: string;
  amount?: number;
  rejectionReason?: string | null;
  [key: string]: any;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  eventKey?: NotificationEventKey | null;
  priority?: NotificationPriority;
  payload?: NotificationPayload | null;
  title?: string | null;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface District {
  name: string;
  governorate: string;
  count: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface SearchFilters {
  query?: string;
  unitType?: UnitType;
  governorate?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  genderTarget?: GenderTarget;
  verifiedOnly?: boolean;
  isFurnished?: boolean;
  sortBy?: "newest" | "oldest" | "cheapest" | "expensive" | "popular";
  page?: number;
  limit?: number;
  amenities?: string[];
}

export interface DashboardStats {
  totalUsers: number;
  totalListings: number;
  pendingListings: number;
  activeListings: number;
  totalRequests: number;
  pendingRequests: number;
  bannedUsers: number;
  archivedListings: number;
}

export interface ListingAuditLog {
  id: string;
  listingId: string;
  listingTitleSnapshot: string;
  actorId: string;
  actorRole: string;
  actorName: string;
  action: "soft_delete" | "restore" | "delete_images" | "permanent_delete";
  detail?: string | null;
  createdAt: string;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: UserRole | "all";
  search?: string;
  isActive?: "true" | "false" | "all";
  isVerified?: "true" | "false" | "all";
}

export interface AdminRequestFilters {
  page?: number;
  limit?: number;
  status?: ViewingRequestStatus | "all";
  search?: string;
}

export interface BannedUser {
  id: string;
  nationalIdHash?: string | null;
  phone?: string | null;
  reason: string;
  bannedBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ContractStatus = "active" | "expired" | "terminated" | "renewed";
export type PaymentCycle = "monthly" | "quarterly" | "yearly";
export type TerminationReason = "tenant_request" | "landlord_request" | "violation" | "mutual_agreement" | "other";
export type ContractCreatedBy = "VIEWING_REQUEST" | "MANUAL" | "AUTO_RENEW" | "MIGRATION";

export interface RentalHistoryListing {
  id: string;
  title: string;
  unitType: UnitType;
  price: number;
  governorate: string;
  district: string;
  images: { url: string }[];
  landlord?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    phone?: string | null;
  };
}

export interface RentalHistoryItem {
  id: string;
  contractNumber?: string;
  status: ContractStatus;
  createdByType?: ContractCreatedBy;
  monthlyRent?: number;
  securityDeposit?: number;
  paymentCycle?: PaymentCycle;
  currency?: string;
  startDate?: string;
  endDate?: string;
  actualCheckout?: string | null;
  isAutoRenew?: boolean;
  terminationReason?: TerminationReason | null;
  terminationNotes?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  listing: RentalHistoryListing;
  tenant?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    phone?: string | null;
  };
}

export interface RentalHistoryMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

export interface RentalHistoryResponse {
  data: RentalHistoryItem[];
  meta: RentalHistoryMeta;
}

export interface RentalHistoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  from?: string;
  to?: string;
  sort?: "asc" | "desc";
  status?: string;
}
