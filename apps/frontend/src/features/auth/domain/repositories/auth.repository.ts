// apps/frontend/src/features/auth/domain/repositories/auth.repository.ts
import { UserEntity } from "../entities/user.entity";

export interface LoginCredentials {
  identifier: string; // phone or email
  password?: string;
  otp?: string;
  otpChannel?: "EMAIL" | "TELEGRAM";
}

export interface AuthDomainResult {
  user: UserEntity;
  token: string;
  refreshToken?: string;
}

export interface RegisterPayload {
  role: "tenant" | "landlord";
  name: string;
  phone: string;
  email?: string;
  nationalId: string;
  password: string;
  otpChannel?: "EMAIL" | "TELEGRAM";
  linkCode?: string;
}

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<AuthDomainResult>;
  register(payload: RegisterPayload): Promise<any>;
  me(): Promise<UserEntity>;
  logout(refreshToken?: string): Promise<void>;
  verifyEmail(payload: { email?: string; phone?: string; otp: string }): Promise<any>;
  resendVerification(payload: { email?: string; phone?: string }): Promise<any>;
  forgotPassword(payload: { email?: string; phone?: string; channel?: "EMAIL" | "TELEGRAM" }): Promise<any>;
  verifyOtp(payload: { email: string; otp: string }): Promise<any>;
  resetPassword(payload: { email: string; otp: string; newPassword: string; confirmPassword?: string }): Promise<any>;
  changePassword(payload: { currentPassword: string; newPassword: string; confirmPassword?: string }): Promise<any>;
  refreshToken(token: string): Promise<{ accessToken: string; refreshToken?: string }>;
  generateTelegramLinkCode(identifier?: string): Promise<any>;
  checkTelegramLinkStatus(code: string): Promise<any>;
  unlinkTelegram(): Promise<any>;
  updateOtpChannel(channel: string): Promise<any>;
}
