// apps/frontend/src/hooks/useChat.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface UnreadChatCountResponse {
  unreadCount: number;
}

/**
 * Hook to fetch the total unread chat messages count for the current user.
 * Refetches every 30 seconds to keep the sidebar badge fresh.
 */
export const useUnreadChatCount = (enabled: boolean = true) => {
  return useQuery<UnreadChatCountResponse>({
    queryKey: ["chat", "unread-count"],
    queryFn: async (): Promise<UnreadChatCountResponse> => {
      const response = await api.get<UnreadChatCountResponse>("/chat/unread-count");
      return response.data;
    },
    refetchInterval: 30 * 1000, // Poll every 30 seconds
    enabled,
  });
};
