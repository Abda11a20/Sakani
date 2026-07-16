// apps/frontend/src/hooks/useNotifications.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Notification, PaginationMeta } from "@/types";

export interface NotificationsResponse {
  notifications: Notification[];
  meta: PaginationMeta;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

/** Paginated list of notifications (newest first). */
export const useNotifications = (page = 1, limit = 20) => {
  return useQuery<NotificationsResponse>({
    queryKey: ["notifications", page, limit],
    queryFn: async (): Promise<NotificationsResponse> => {
      const response = await api.get<NotificationsResponse>("/notifications", {
        params: { page, limit },
      });
      return response.data;
    },
  });
};

/**
 * Unread notification count — polls every 60 s so the badge stays fresh
 * without hammering the server.
 */
export const useUnreadNotificationsCount = () => {
  return useQuery<UnreadCountResponse>({
    queryKey: ["notifications", "unread-count"],
    queryFn: async (): Promise<UnreadCountResponse> => {
      const response = await api.get<UnreadCountResponse>(
        "/notifications/unread-count",
      );
      return response.data;
    },
  });
};

/** Mark a single notification as read; refreshes both list and unread count. */
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation<Notification, Error, string>({
    mutationFn: async (id): Promise<Notification> => {
      const response = await api.patch<Notification>(
        `/notifications/${id}/read`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

/** Mark all notifications as read; refreshes both list and unread count. */
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation<{ updatedCount: number }, Error>({
    mutationFn: async (): Promise<{ updatedCount: number }> => {
      const response = await api.patch<{ updatedCount: number }>(
        "/notifications/read-all",
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

/** Delete a single notification. */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id): Promise<void> => {
      await api.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

/** Delete all notifications for the current user. */
export const useDeleteAllNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error>({
    mutationFn: async (): Promise<void> => {
      await api.delete("/notifications");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
