// apps/frontend/src/lib/api/notifications.api.ts
import { api } from "@/lib/api";
import type { Notification, PaginationMeta } from "@/types";

export interface NotificationsResponse {
  notifications: Notification[];
  meta: PaginationMeta;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface PushSubscriptionItem {
  id: string;
  endpoint: string;
  deviceName?: string | null;
  browser?: string | null;
  userAgent?: string;
  createdAt: string;
  lastUsedAt?: string | null;
}

export const notificationsApi = {
  getNotifications: async (page = 1, limit = 20) => {
    const res = await api.get<NotificationsResponse>("/notifications", {
      params: { page, limit },
    });
    return res.data;
  },

  getUnreadCount: async () => {
    const res = await api.get<UnreadCountResponse>("/notifications/unread-count");
    return res.data;
  },

  markAsRead: async (id: string) => {
    const res = await api.patch<Notification>(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await api.patch<{ updatedCount: number }>("/notifications/read-all");
    return res.data;
  },

  deleteNotification: async (id: string) => {
    await api.delete(`/notifications/${id}`);
  },

  deleteAllNotifications: async () => {
    await api.delete("/notifications");
  },

  getPushSubscriptions: async () => {
    const res = await api.get<PushSubscriptionItem[]>("/notifications/push/subscriptions/me");
    return res.data;
  },

  getVapidPublicKey: async () => {
    const res = await api.get<{ publicKey: string | null }>("/notifications/push/vapid-public-key");
    return res.data;
  },

  subscribePush: async (payload: { endpoint: string; keys: { p256dh: string; auth: string }; userAgent?: string }) => {
    const res = await api.post("/notifications/push/subscribe", payload);
    return res.data;
  },

  unsubscribePush: async (payload: { endpoint: string }) => {
    const res = await api.delete("/notifications/push/unsubscribe", { data: payload });
    return res.data;
  },

  deletePushSubscription: async (id: string) => {
    const res = await api.delete(`/notifications/push/subscriptions/${id}`);
    return res.data;
  },
};
