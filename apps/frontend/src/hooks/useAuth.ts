// apps/frontend/src/hooks/useAuth.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import type { User } from "@/types";

interface LoginPayload {
  identifier: string; // email or phone
  password: string;
}

interface RegisterPayload {
  name: string;
  phone: string;
  email: string;
  nationalId: string;
  password: string;
  confirmPassword: string;
  role: "tenant" | "landlord";
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
      const response = await api.post<LoginResult>("/auth/login", data);
      return response.data;
    },
    onSuccess: (data: LoginResult) => {
      // حفظ الـ token والـ user في الـ store
      setToken(data.accessToken);
      setUser(data.user);

      if (typeof window !== "undefined") {
        localStorage.setItem("sakani_token", data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem("sakani_refresh_token", data.refreshToken);
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
      } else if (role === "tenant") {
        router.push(`/${locale}/dashboard/tenant`);
      } else if (role === "landlord") {
        router.push(`/${locale}/dashboard/landlord`);
      } else {
        router.push(`/${locale}/admin`);
      }
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: RegisterPayload) => {
      const response = await api.post("/auth/register", data);
      return response.data;
    },
  });
};

export const useMe = () => {
  const { token, setUser } = useAuthStore();

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async (): Promise<User> => {
      const response = await api.get("/auth/me");

      // لأن الـ interceptor يرجع { user: ... }
      const user = response.data.user;

      setUser(user);

      return user;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
};

export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: async (data: { email: string; otp: string }) => {
      const response = await api.post("/auth/verify-email", data);
      return response.data;
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await api.post("/auth/forgot-password", data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("reset_email", variables.email);
      }
    },
  });
};

export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: async (data: { email: string; otp: string }) => {
      const response = await api.post("/auth/verify-reset-otp", data);
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
      const response = await api.post("/auth/reset-password", data);
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
      const response = await api.patch("/auth/change-password", data);
      return response.data;
    },
  });
};

export const useRefreshToken = () => {
  const { setToken } = useAuthStore();

  return useMutation({
    mutationFn: async (data: { refreshToken: string }) => {
      const response = await api.post<{ accessToken: string; refreshToken?: string }>("/auth/refresh", data);
      return response.data;
    },
    onSuccess: (data) => {
      setToken(data.accessToken);
      if (typeof window !== "undefined") {
        localStorage.setItem("sakani_token", data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem("sakani_refresh_token", data.refreshToken);
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
          ? localStorage.getItem("sakani_refresh_token")
          : null;
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken }).catch(() => {
          // تجاهل أخطاء الـ logout من السيرفر
        });
      }
    },
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      if (typeof window !== "undefined") {
        localStorage.removeItem("sakani_token");
        localStorage.removeItem("sakani_refresh_token");
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
