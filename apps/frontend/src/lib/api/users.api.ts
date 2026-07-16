// Infrastructure layer
// Not used yet.
// Will be migrated gradually.

// apps/frontend/src/lib/api/users.api.ts
import apiClient from "@/lib/api";

export const usersApi = {
  getProfile: () =>
    apiClient.get("/users/profile"),

  updateProfile: (data: { name?: string; avatarUrl?: string }) =>
    apiClient.patch("/users/profile", data),

  getPublic: (id: string) =>
    apiClient.get(`/users/${id}`),
};
