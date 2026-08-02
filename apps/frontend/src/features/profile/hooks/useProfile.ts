// apps/frontend/src/features/profile/hooks/useProfile.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileRepository } from "../infrastructure/repositories/axios-profile.repository";
import { getProfileUseCase } from "../domain/usecases/get-profile.usecase";
import { uploadsApi } from "@/features/uploads";
import { authRepository, useAuthStore } from "@/features/auth";
import type { User } from "@/types";

export interface UpdateProfilePayload {
  name: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const useProfile = () => {
  const { token, setUser } = useAuthStore();

  return useQuery<User>({
    queryKey: ["users", "profile"],
    queryFn: async (): Promise<User> => {
      const response = await getProfileUseCase.execute();
      const user = (response as { user: User }).user || response;
      setUser(user);
      return user;
    },
    enabled: !!token,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<User, Error, UpdateProfilePayload>({
    mutationFn: async (data): Promise<User> => {
      const response = await profileRepository.updateProfile(data);
      return response.data as User;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["users", "profile"], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["users", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation<{ avatarUrl: string }, Error, File | FormData>({
    mutationFn: async (input): Promise<{ avatarUrl: string }> => {
      const formData = input instanceof FormData ? input : (() => { const fd = new FormData(); fd.append("avatar", input); return fd; })();
      const response = await uploadsApi.avatar(formData);
      return response.data as { avatarUrl: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
};

export const useUploadIdCard = () => {
  const queryClient = useQueryClient();

  return useMutation<{ idCardUrl: string }, Error, File | FormData>({
    mutationFn: async (input): Promise<{ idCardUrl: string }> => {
      const formData = input instanceof FormData ? input : (() => { const fd = new FormData(); fd.append("file", input); return fd; })();
      const response = await uploadsApi.idCard(formData);
      return response.data as { idCardUrl: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
};

export const useChangePassword = () => {
  return useMutation<void, Error, ChangePasswordPayload>({
    mutationFn: async (data): Promise<void> => {
      await authRepository.changePassword(data);
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  const { user, clearAuth } = useAuthStore();

  return useMutation<any, Error, string | void>({
    mutationFn: async (reason?: string | void): Promise<any> => {
      return await profileRepository.deleteProfile(typeof reason === "string" ? reason : undefined);
    },
    onSuccess: () => {
      const identifier = user?.email || user?.phone || "";
      clearAuth();
      queryClient.clear();
      queryClient.removeQueries();
      const locale = typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "ar" : "ar";
      const redirectUrl = `/${locale}/restore-account?identifier=${encodeURIComponent(identifier)}&remainingDays=30`;
      if (typeof window !== "undefined") {
        window.location.href = redirectUrl;
      }
    },
  });
};
