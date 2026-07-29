// apps/frontend/src/features/auth/domain/types/auth.types.ts

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
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  isActive?: boolean;
  otpChannel?: "EMAIL" | "TELEGRAM";
  telegramChatId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type IdentityVerificationStatus = "verified" | "pending" | "rejected" | "unverified";

export const getIdentityVerificationStatus = (user?: {
  identityStatus?: "NONE" | "PENDING" | "VERIFIED" | "REJECTED" | null;
  idCardPublicId?: string | null;
  nationalIdEnc?: string | null;
  nationalIdVerified?: boolean | null;
} | null): IdentityVerificationStatus => {
  if (!user) return "unverified";
  if (user.identityStatus === "VERIFIED" || user.nationalIdVerified) return "verified";
  if (user.identityStatus === "PENDING") return "pending";
  if (user.identityStatus === "REJECTED") return "rejected";
  if (user.identityStatus === "NONE") return "unverified";
  if (user.idCardPublicId || user.nationalIdEnc) {
    if (user.idCardPublicId === "REJECTED") return "rejected";
    return "pending";
  }
  return "unverified";
};

export const isUserVerified = (user?: {
  identityStatus?: "NONE" | "PENDING" | "VERIFIED" | "REJECTED" | null;
  nationalIdVerified?: boolean | null;
} | null): boolean =>
  getIdentityVerificationStatus(user) === "verified";

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface OtpResponse {
  message: string;
  expiresIn: number;
}
