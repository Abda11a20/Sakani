// Infrastructure layer
// Not used yet.
// Will be migrated gradually.

// apps/frontend/src/lib/api/auth.api.ts
import apiClient from "@/lib/api";

export const authApi = {
  login: (data: { identifier: string; password: string }) =>
    apiClient.post("/auth/login", data),

  register: (data: {
    name: string;
    phone: string;
    email?: string;
    nationalId: string;
    password: string;
    confirmPassword: string;
    role: string;
    otpChannel?: string;
    linkCode?: string;
  }) => apiClient.post("/auth/register", data),

  generateTelegramLinkCode: (identifier: string) =>
    apiClient.post("/auth/telegram/generate-link-code", { identifier }),

  checkTelegramLinkStatus: (code: string) =>
    apiClient.get(`/auth/telegram/link-status/${code}`),

  updateOtpChannel: (channel: string) =>
    apiClient.patch("/users/me/otp-channel", { channel }),

  me: () => apiClient.get("/auth/me"),

  logout: (refreshToken?: string) =>
    apiClient.post("/auth/logout", refreshToken ? { refreshToken } : {}),

  refreshToken: (token: string) =>
    apiClient.post("/auth/refresh", { refreshToken: token }),

  forgotPassword: (data: { email?: string; phone?: string; channel?: "EMAIL" | "TELEGRAM" }) =>
    apiClient.post("/auth/forgot-password", data),

  verifyOtp: (data: { email: string; otp: string }) =>
    apiClient.post("/auth/verify-reset-otp", data),

  resetPassword: (data: {
    email: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
  }) => apiClient.post("/auth/reset-password", data),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => apiClient.patch("/auth/change-password", data),

  verifyEmail: (data: { email?: string; phone?: string; otp: string }) =>
    apiClient.post("/auth/verify-email", data),

  resendVerification: (data: { email?: string; phone?: string }) =>
    apiClient.post("/auth/resend-verification", data),
};
