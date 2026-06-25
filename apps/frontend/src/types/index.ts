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
  // emailVerifiedAt replaces the old boolean "verified"
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Helper to check if user is verified
export const isUserVerified = (user: User): boolean =>
  user.emailVerifiedAt !== null;

export type ListingType = "apartment" | "room" | "bed";
export type ListingStatus = "draft" | "pending_review" | "active" | "rented" | "paused" | "rejected";
export type UnitType = "apartment" | "room" | "bed";
export type GenderTarget = "male" | "female" | "mixed" | "family" | "any";

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
  landlord?: Pick<User, "id" | "name" | "phone" | "emailVerifiedAt">;
  beds?: Bed[];
  totalBeds?: number;
  availableBeds?: number;
  views: number;
  rules?: string;
  includesBills?: boolean;
  securityDeposit?: number;
  meterType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bed {
  id: string;
  listingId: string;
  bedNumber: number;
  isAvailable: boolean;
  tenantId?: string;
  tenant?: Pick<User, "id" | "name">;
}

export type ViewingRequestStatus = "pending" | "accepted" | "approved" | "rejected" | "completed";

export interface ViewingRequest {
  id: string;
  listingId: string;
  listing?: Pick<Listing, "id" | "title" | "address" | "images">;
  tenantId: string;
  tenant?: Pick<User, "id" | "name" | "phone">;
  requestedDate: string;
  status: ViewingRequestStatus;
  notes?: string;
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
