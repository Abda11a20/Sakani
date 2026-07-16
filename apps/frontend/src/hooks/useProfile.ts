// apps/frontend/src/hooks/useProfile.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usersApi } from "@/lib/api/users.api";
import { useAuthStore } from "@/store/auth.store";
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
      const response = await usersApi.getProfile();
      const user = response.data as User;
      setUser(user); // hydrate the store with the latest profile data
      return user;
    },
    enabled: !!token,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation<User, Error, UpdateProfilePayload>({
    mutationFn: async (data): Promise<User> => {
      const response = await usersApi.updateProfile(data);
      return response.data as User;
    },
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ["users", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
};

// useUploadAvatar و useUploadIdCard يحتفظان بـ api مباشرة
// لأن لهما منطق auth store خاص (تحديث avatarUrl في الـ store)
export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation<{ url: string; message: string }, Error, File>({
    mutationFn: async (file): Promise<{ url: string; message: string }> => {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await api.post<{ url: string; message: string }>(
        "/uploads/avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setUser({ ...currentUser, avatarUrl: data.url });
      }
      queryClient.invalidateQueries({ queryKey: ["users", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
};

export const useUploadIdCard = () => {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error, File>({
    mutationFn: async (file): Promise<{ success: boolean; message: string }> => {
      const formData = new FormData();
      formData.append("idCard", file);

      const response = await api.post<{ success: boolean; message: string }>(
        "/uploads/id-card",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
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
      await api.patch("/auth/change-password", data);
    },
  });
};
export default useProfile;
