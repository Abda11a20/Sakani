// apps/frontend/src/hooks/useChat.ts
import { useQuery } from "@tanstack/react-query";
import { chatApi } from "@/features/chat";

export interface UnreadChatCountResponse {
  unreadCount: number;
}

/**
 * Hook to fetch the total unread chat messages count for the current user.
 * Refetches every 30 seconds to keep the sidebar badge fresh.
 */
export const useUnreadChatCount = (enabled = true) => {
  return useQuery<UnreadChatCountResponse>({
    queryKey: ["chat", "unread-count"],
    queryFn: () => chatApi.getUnreadCount(),
    refetchInterval: 30 * 1000,
    enabled,
  });
};
