// Infrastructure layer
// Not used yet.
// Will be migrated gradually.

// apps/frontend/src/lib/api/alerts.api.ts
import apiClient from "@/lib/api";

export const alertsApi = {
  getMy: () =>
    apiClient.get("/alerts/my"),

  create: (data: Record<string, unknown>) =>
    apiClient.post("/alerts", data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/alerts/${id}`, data),

  toggle: (id: string) =>
    apiClient.patch(`/alerts/${id}/toggle`),

  delete: (id: string) =>
    apiClient.delete(`/alerts/${id}`),
};
