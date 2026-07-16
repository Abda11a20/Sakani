// apps/frontend/src/types/index.ts

export type UserRole = "tenant" | "landlord" | "admin" | "super_admin";

export interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  nationalId?: string;
  role: UserRole;
  avatarUrl?: string | null;
  avatarPublicId?: string | null;
  idCardPublicId?: string | null;
  nationalIdEnc?: string | null;
  nationalIdVerified?: boolean;
  identityStatus?: "NONE" | "PENDING" | "VERIFIED" | "REJECTED" | null;
  // emailVerifiedAt replaces the old boolean "verified"
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  isActive?: boolean;
  otpChannel?: "EMAIL" | "TELEGRAM";
  telegramChatId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type IdentityVerificationStatus = 'verified' | 'pending' | 'rejected' | 'unverified';

export const getIdentityVerificationStatus = (user?: {
  identityStatus?: "NONE" | "PENDING" | "VERIFIED" | "REJECTED" | null;
  idCardPublicId?: string | null;
  nationalIdEnc?: string | null;
  nationalIdVerified?: boolean | null;
} | null): IdentityVerificationStatus => {
  if (!user) return 'unverified';
  if (user.identityStatus === 'VERIFIED' || user.nationalIdVerified) return 'verified';
  if (user.identityStatus === 'PENDING') return 'pending';
  if (user.identityStatus === 'REJECTED') return 'rejected';
  
  // Fallbacks for compatibility
  if (user.identityStatus === 'NONE') return 'unverified';
  if (user.idCardPublicId || user.nationalIdEnc) {
    if (user.idCardPublicId === 'REJECTED') return 'rejected';
    return 'pending';
  }
  return 'unverified';
};

// Helper to check if user is verified
export const isUserVerified = (user?: {
  identityStatus?: "NONE" | "PENDING" | "VERIFIED" | "REJECTED" | null;
  nationalIdVerified?: boolean | null;
} | null): boolean =>
  getIdentityVerificationStatus(user) === 'verified';

export type ListingType = "apartment" | "bed";
export type ListingStatus = "draft" | "pending_review" | "active" | "rented" | "paused" | "rejected";
export type UnitType = "apartment" | "bed";
export type GenderTarget = "male" | "female" | "mixed" | "family" | "any";

export interface LandlordPublicInfo {
  id: string;
  name: string;
  avatarUrl?: string | null;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  nationalIdVerified?: boolean | null;
  identityStatus?: "NONE" | "PENDING" | "VERIFIED" | "REJECTED" | null;
  createdAt: string;
  phone?: string;
  idCardPublicId?: string | null;
  ratingAvg?: number;
  _count?: {
    listings: number;
  };
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  type: ListingType;
  unitType?: UnitType;
  status: ListingStatus;
  price: number;
  address: string;
  city: string;
  district: string;
  governorate?: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  amenities: string[];
  genderTarget?: GenderTarget;
  isVerified: boolean;
  isFeatured: boolean;
  landlordId: string;
  landlord?: LandlordPublicInfo;
  currentTenantId?: string | null;
  currentTenant?: Pick<User, "id" | "name" | "phone"> | null;
  beds?: Bed[];
  totalBeds?: number;
  availableBeds?: number;
  viewCount: number;
  views?: number;
  rentedSince?: string | null;
  rentedUntil?: string | null;
  rules?: string;
  includesBills?: boolean;
  securityDeposit?: number;
  electricityType?: string;
  createdAt: string;
  updatedAt: string;
  // ── Soft Delete ───────────────────────────────────────────────────────────
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedById?: string | null;
  deletedByRole?: string | null;
  deletedReason?: string | null;
  statusBeforeDelete?: string | null;
}

export interface Bed {
  id: string;
  listingId: string;
  bedNumber: number;
  isAvailable: boolean;
  currentTenantId?: string | null;
  currentTenant?: Pick<User, "id" | "name"> | null;
  tenantId?: string;
  tenant?: Pick<User, "id" | "name"> | null;
}

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

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
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

// API Response wrappers
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

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface OtpResponse {
  message: string;
  expiresIn: number;
}

// Search filters type
export interface SearchFilters {
  query?: string;
  unitType?: UnitType;
  governorate?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  genderTarget?: GenderTarget;
  verifiedOnly?: boolean;
  sortBy?: "newest" | "oldest" | "cheapest" | "expensive" | "popular";
  page?: number;
  limit?: number;
  amenities?: string[];
}

// Admin-specific Types
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

// ── Rental History ────────────────────────────────────────────────────────────
// Source: ViewingRequest WHERE status = 'completed'
// NOTE: ViewingRequest is the primary source for the current implementation.
// As the system evolves (contract termination, renewal, multiple tenants over
// time), a dedicated RentalContract model should be introduced.
// NOTE: updatedAt is used as a `completedAt` proxy until a dedicated field exists.

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

export type ContractStatus = "active" | "expired" | "terminated" | "renewed";
export type PaymentCycle = "monthly" | "quarterly" | "yearly";
export type TerminationReason = "tenant_request" | "landlord_request" | "violation" | "mutual_agreement" | "other";
export type ContractCreatedBy = "VIEWING_REQUEST" | "MANUAL" | "AUTO_RENEW" | "MIGRATION";

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
  status?: string; // Add filter by status
}
