// apps/frontend/src/features/listings/domain/types/listings.types.ts
import type { User } from "@/features/auth";
import type { Bed } from "@/features/beds/domain/types/beds.types";

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
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  hasExactLocation?: boolean;
  isFurnished?: boolean;
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
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedById?: string | null;
  deletedByRole?: string | null;
  deletedReason?: string | null;
  statusBeforeDelete?: string | null;
  rejectionReason?: string | null;
}
