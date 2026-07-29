// apps/frontend/src/features/auth/domain/entities/user.entity.ts

import type { UserRole, IdentityVerificationStatus } from "../types/auth.types";

export interface UserProps {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  nationalId?: string;
  role: UserRole;
  avatarUrl?: string | null;
  idCardPublicId?: string | null;
  nationalIdEnc?: string | null;
  nationalIdVerified?: boolean | null;
  identityStatus?: "NONE" | "PENDING" | "VERIFIED" | "REJECTED" | null;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  isActive?: boolean;
  otpChannel?: "EMAIL" | "TELEGRAM";
  telegramChatId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export class UserEntity {
  private props: UserProps;

  constructor(props: UserProps) {
    this.props = { ...props };
  }

  public get id(): string { return this.props.id; }
  public get name(): string { return this.props.name; }
  public get phone(): string | undefined { return this.props.phone; }
  public get email(): string | undefined { return this.props.email; }
  public get role(): UserRole { return this.props.role; }
  public get avatarUrl(): string | null | undefined { return this.props.avatarUrl; }
  public get isActive(): boolean { return this.props.isActive ?? true; }
  public get otpChannel(): "EMAIL" | "TELEGRAM" { return this.props.otpChannel || "EMAIL"; }

  /**
   * Domain Business Rule: Check identity verification status
   */
  public getIdentityStatus(): IdentityVerificationStatus {
    if (this.props.identityStatus === 'VERIFIED' || this.props.nationalIdVerified) return 'verified';
    if (this.props.identityStatus === 'PENDING') return 'pending';
    if (this.props.identityStatus === 'REJECTED') return 'rejected';
    if (this.props.idCardPublicId || this.props.nationalIdEnc) {
      if (this.props.idCardPublicId === 'REJECTED') return 'rejected';
      return 'pending';
    }
    return 'unverified';
  }

  /**
   * Domain Business Rule: Can publish property listings
   */
  public canPublishListings(): boolean {
    return (this.role === "landlord" || this.role === "admin" || this.role === "super_admin") && this.isActive;
  }

  /**
   * Domain Business Rule: Is verified user
   */
  public isVerified(): boolean {
    return this.getIdentityStatus() === 'verified';
  }

  /**
   * Domain Business Rule: Has Telegram linked for OTP / Alerts
   */
  public hasTelegramLinked(): boolean {
    return !!this.props.telegramChatId && this.props.otpChannel === "TELEGRAM";
  }

  /**
   * Business State Transition: Admin Identity Verification Approval
   */
  public verifyIdentity(): void {
    this.props.identityStatus = "VERIFIED";
    this.props.nationalIdVerified = true;
    this.props.updatedAt = new Date().toISOString();
  }

  public toJSON(): UserProps {
    return { ...this.props };
  }
}
