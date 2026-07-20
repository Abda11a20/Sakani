// apps/frontend/src/hooks/useAuth.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import type { User } from "@/types";
import { authApi } from "@/lib/api/auth.api";
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/lib/constants";
import { getDashboardPath } from "@/lib/helpers";
import type { UserRoleKey } from "@/lib/constants";

interface LoginPayload {
  identifier: string; // email or phone
  password: string;
}

interface RegisterPayload {
  name: string;
  phone: string;
  email?: string;
  nationalId: string;
  password: string;
  confirmPassword: string;
  role: "tenant" | "landlord";
  otpChannel?: "EMAIL" | "TELEGRAM";
  linkCode?: string;
}

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const useLogin = () => {
  const { setToken, setUser } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: LoginPayload): Promise<LoginResult> => {
      const response = await authApi.login(data);
      return response.data as LoginResult;
    },
    onSuccess: (data: LoginResult) => {
      setToken(data.accessToken);
      setUser(data.user);

      if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        }
      }

      const role = data.user.role;
      const locale =
        typeof window !== "undefined"
          ? window.location.pathname.split("/")[1] || "ar"
          : "ar";

      let returnUrl = "";
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        returnUrl = urlParams.get("returnUrl") || "";
      }

      if (returnUrl) {
        router.push(returnUrl);
      } else {
        router.push(getDashboardPath(role as UserRoleKey, locale));
      }
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: RegisterPayload) => {
      const response = await authApi.register(data);
      return response.data;
    },
  });
};

export const useMe = () => {
  const { token, setUser } = useAuthStore();

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async (): Promise<User> => {
      const response = await authApi.me();
      // الـ interceptor يرجع { user: ... } بعد unwrap الـ envelope
      const user = (response.data as { user: User }).user;
      setUser(user);
      return user;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
};

export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: async (data: { email?: string; phone?: string; otp: string }) => {
      const response = await authApi.verifyEmail(data);
      return response.data;
    },
  });
};

export const useResendVerification = () => {
  return useMutation({
    mutationFn: async (data: { email?: string; phone?: string }) => {
      const response = await authApi.resendVerification(data);
      return response.data;
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (data: { email?: string; phone?: string; channel?: "EMAIL" | "TELEGRAM" }) => {
      const response = await authApi.forgotPassword(data);
      return response.data;
    },
    onSuccess: (res: { email?: string; message?: string }, variables) => {
      if (typeof window !== 'undefined') {
        const resolvedEmail = res?.email || variables.email || '';
        sessionStorage.setItem('reset_email', resolvedEmail);
      }
    },
  });
};

export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: async (data: { email: string; otp: string }) => {
      const response = await authApi.verifyOtp(data);
      return response.data;
    },
  });
};

export const useResetPassword = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      otp: string;
      newPassword: string;
      confirmPassword: string;
    }) => {
      const response = await authApi.resetPassword(data);
      return response.data;
    },
    onSuccess: () => {
      const locale =
        typeof window !== "undefined"
          ? window.location.pathname.split("/")[1] || "ar"
          : "ar";
      router.push(`/${locale}/login`);
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) => {
      const response = await authApi.changePassword(data);
      return response.data;
    },
  });
};

export const useRefreshToken = () => {
  const { setToken } = useAuthStore();

  return useMutation({
    mutationFn: async (data: { refreshToken: string }) => {
      const response = await authApi.refreshToken(data.refreshToken);
      return response.data as { accessToken: string; refreshToken?: string };
    },
    onSuccess: (data) => {
      setToken(data.accessToken);
      if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        }
      }
    },
  });
};

export const useLogout = () => {
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const refreshToken =
        typeof window !== "undefined"
          ? localStorage.getItem(REFRESH_TOKEN_KEY)
          : null;
      if (refreshToken) {
        await authApi.logout(refreshToken).catch(() => {
          // تجاهل أخطاء الـ logout من السيرفر
        });
      }
    },
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      if (typeof window !== "undefined") {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem("sakani_user");
      }
      const locale =
        typeof window !== "undefined"
          ? window.location.pathname.split("/")[1] || "ar"
          : "ar";
      router.push(`/${locale}/login`);
    },
  });
};
