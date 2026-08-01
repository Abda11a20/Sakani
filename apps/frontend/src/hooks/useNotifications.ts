// apps/frontend/src/hooks/useNotifications.ts
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, type NotificationsResponse, type UnreadCountResponse } from "@/features/notifications";
import { useAuthStore } from "@/features/auth/store/auth.store";
import type { Notification } from "@/types";

export type { NotificationsResponse, UnreadCountResponse };

/** Paginated list of notifications (newest first). */
export const useNotifications = (page = 1, limit = 20) => {
  const token = useAuthStore((state) => state.token);

  return useQuery<NotificationsResponse>({
    queryKey: ["notifications", page, limit],
    queryFn: () => notificationsApi.getNotifications(page, limit),
    enabled: !!token,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

/** Multi-tab sync channel to eliminate duplicate polling across open browser tabs. */
const BROADCAST_CHANNEL_NAME = "sakani_notifications_channel";
const LEADER_LOCK_KEY = "sakani_leader_tab_lock";

/**
 * Leader Tab Election Hook using Web Locks API with LocalStorage Heartbeat fallback.
 * Ensures strictly ONE open browser tab acts as the Leader polling HTTP,
 * while follower tabs listen to BroadcastChannel updates with 0 HTTP polling.
 */
function useIsLeaderTab(): boolean {
  const [isLeader, setIsLeader] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;
    const TAB_ID = Math.random().toString(36).substring(2, 9);
    const LEASE_MS = 5000;

    // 1. Web Locks API (supported in 98%+ modern browsers)
    if ("locks" in navigator) {
      navigator.locks
        .request(LEADER_LOCK_KEY, { mode: "exclusive" }, async () => {
          if (isMounted) setIsLeader(true);
          return new Promise<void>((resolve) => {
            window.addEventListener("beforeunload", () => resolve(), { once: true });
          });
        })
        .catch(() => {
          if (isMounted) setIsLeader(false);
        });

      return () => {
        isMounted = false;
      };
    }

    // 2. LocalStorage Heartbeat Fallback
    const claimLeader = () => {
      const now = Date.now();
      const raw = localStorage.getItem(LEADER_LOCK_KEY);
      if (raw) {
        try {
          const { tabId, expiry } = JSON.parse(raw);
          if (tabId === TAB_ID) {
            localStorage.setItem(LEADER_LOCK_KEY, JSON.stringify({ tabId: TAB_ID, expiry: now + LEASE_MS }));
            if (isMounted) setIsLeader(true);
            return;
          }
          if (now < expiry) {
            if (isMounted) setIsLeader(false);
            return;
          }
        } catch {}
      }
      localStorage.setItem(LEADER_LOCK_KEY, JSON.stringify({ tabId: TAB_ID, expiry: now + LEASE_MS }));
      if (isMounted) setIsLeader(true);
    };

    claimLeader();
    const interval = setInterval(claimLeader, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return isLeader;
}

/**
 * Smart Conditional Polling for Unread Count.
 * ONLY the Leader Tab polls HTTP every 15s (`refetchInterval: isLeader ? 15_000 : false`).
 * Follower tabs receive updates via BroadcastChannel with 0 HTTP polling requests.
 */
export const useUnreadNotificationsCount = () => {
  const queryClient = useQueryClient();
  const isLeader = useIsLeaderTab();
  const token = useAuthStore((state) => state.token);
  const prevCountRef = useRef<number | null>(null);

  // Sync state with other open browser tabs
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "UNREAD_COUNT_UPDATE" && typeof event.data.count === "number") {
        queryClient.setQueryData(["notifications", "unread-count"], {
          unreadCount: event.data.count,
        });
      }
    };

    channel.addEventListener("message", handleMessage);
    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, [queryClient]);

  const query = useQuery<UnreadCountResponse>({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: !!token,
    refetchInterval: isLeader && !!token ? 15_000 : false, // ONLY Leader Tab with active token polls HTTP!
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 5_000,
  });

  useEffect(() => {
    if (isLeader && query.data?.unreadCount !== undefined) {
      const currentCount = query.data.unreadCount;
      const prevCount = prevCountRef.current;

      // Broadcast to follower tabs so they update without additional HTTP requests
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        try {
          const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
          channel.postMessage({ type: "UNREAD_COUNT_UPDATE", count: currentCount });
          channel.close();
        } catch {}
      }

      // If new unread notifications arrive
      if (prevCount !== null && currentCount > prevCount) {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["rental-history"] });
        queryClient.invalidateQueries({ queryKey: ["listings"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }

      prevCountRef.current = currentCount;
    }
  }, [isLeader, query.data?.unreadCount, queryClient]);

  return query;
};


/** Mark a single notification as read. */
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation<Notification, Error, string>({
    mutationFn: (id) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

/** Mark all notifications as read. */
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation<{ updatedCount: number }, Error>({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

/** Delete a single notification. */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => notificationsApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

/** Delete all notifications for the current user. */
export const useDeleteAllNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error>({
    mutationFn: () => notificationsApi.deleteAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
