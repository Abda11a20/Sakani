// apps/frontend/src/features/auth/infrastructure/repositories/axios-auth.repository.ts
import { api } from "@/lib/api";
import {
  IAuthRepository,
  LoginCredentials,
  AuthDomainResult,
  RegisterPayload,
} from "../../domain/repositories/auth.repository";
import { UserEntity } from "../../domain/entities/user.entity";

export class AxiosAuthRepository implements IAuthRepository {
  async login(credentials: LoginCredentials): Promise<AuthDomainResult> {
    const res = await api.post("/auth/login", credentials);
    const data = res.data;
    return {
      user: new UserEntity(data.user),
      token: data.accessToken || data.token,
      refreshToken: data.refreshToken,
    };
  }

  async register(payload: RegisterPayload): Promise<any> {
    const res = await api.post("/auth/register", payload);
    return res.data;
  }

  async me(): Promise<UserEntity> {
    const res = await api.get("/auth/me");
    const user = (res.data as { user: any }).user;
    return new UserEntity(user);
  }

  async logout(refreshToken?: string): Promise<void> {
    await api.post("/auth/logout", { refreshToken }).catch(() => {});
  }

  async verifyEmail(payload: { email?: string; phone?: string; otp: string }): Promise<any> {
    const res = await api.post("/auth/verify-email", payload);
    return res.data;
  }

  async resendVerification(payload: { email?: string; phone?: string }): Promise<any> {
    const res = await api.post("/auth/resend-verification", payload);
    return res.data;
  }

  async forgotPassword(payload: { email?: string; phone?: string; channel?: "EMAIL" | "TELEGRAM" }): Promise<any> {
    const res = await api.post("/auth/forgot-password", payload);
    return res.data;
  }

  async verifyOtp(payload: { email?: string; phone?: string; otp: string }): Promise<any> {
    const res = await api.post("/auth/verify-reset-otp", payload);
    return res.data;
  }

  async resetPassword(payload: { email?: string; phone?: string; otp: string; newPassword: string; confirmPassword?: string }): Promise<any> {
    const res = await api.post("/auth/reset-password", payload);
    return res.data;
  }

  async changePassword(payload: { currentPassword: string; newPassword: string; confirmPassword?: string }): Promise<any> {
    const res = await api.patch("/auth/change-password", payload);
    return res.data;
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const res = await api.post("/auth/refresh", { refreshToken });
    return res.data;
  }

  async generateTelegramLinkCode(
    identifier?: string,
  ): Promise<{ linkCode: string; expiresAt: string }> {
    const res = await api.post(
      "/auth/telegram/generate-link-code",
      identifier ? { identifier } : {},
    );
    return res.data?.data ?? res.data;
  }

  async checkTelegramLinkStatus(code: string): Promise<any> {
    const res = await api.get(`/auth/telegram/link-status/${code}`);
    return res.data;
  }

  async unlinkTelegram(): Promise<any> {
    const res = await api.delete("/auth/telegram/link");
    return res.data;
  }

  async updateOtpChannel(channel: string): Promise<any> {
    const res = await api.patch("/users/me/otp-channel", { channel });
    return res.data;
  }
}

export const authRepository = new AxiosAuthRepository();
