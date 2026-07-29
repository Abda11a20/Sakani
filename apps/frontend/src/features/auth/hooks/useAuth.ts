// apps/frontend/src/features/auth/hooks/useAuth.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useRouter } from "next/navigation";
import type { User } from "@/types";
import { loginUseCase, registerUseCase, logoutUseCase } from "../domain/usecases";
import { authRepository } from "../infrastructure/repositories/axios-auth.repository";
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
  refreshToken?: string;
  user: User;
}

export const useLogin = () => {
  const { setToken, setUser } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: LoginPayload): Promise<LoginResult> => {
      const res = await loginUseCase.execute(data);
      return {
        accessToken: res.token,
        refreshToken: res.refreshToken,
        user: res.user.toJSON() as User,
      };
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
      return await registerUseCase.execute(data);
    },
  });
};

export const useMe = () => {
  const { token, setUser } = useAuthStore();

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async (): Promise<User> => {
      const userEntity = await authRepository.me();
      const user = userEntity.toJSON() as User;
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
      return await authRepository.verifyEmail(data);
    },
  });
};

export const useResendVerification = () => {
  return useMutation({
    mutationFn: async (data: { email?: string; phone?: string }) => {
      return await authRepository.resendVerification(data);
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (data: { email?: string; phone?: string; channel?: "EMAIL" | "TELEGRAM" }) => {
      return await authRepository.forgotPassword(data);
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
      return await authRepository.verifyOtp(data);
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
      return await authRepository.resetPassword(data);
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
      return await authRepository.changePassword(data);
    },
  });
};

export const useRefreshToken = () => {
  const { setToken } = useAuthStore();

  return useMutation({
    mutationFn: async (data: { refreshToken: string }) => {
      return await authRepository.refreshToken(data.refreshToken);
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
      await logoutUseCase.execute();
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
