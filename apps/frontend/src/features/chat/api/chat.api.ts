// apps/frontend/src/lib/api/chat.api.ts
import { api } from "@/lib/api";

export interface ChatConversation {
  id: string;
  type: string;
  title?: string;
  unreadCount?: number;
  lastMessage?: any;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  mediaUrl?: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export const chatApi = {
  getUnreadCount: async () => {
    const res = await api.get<{ unreadCount: number }>("/chat/unread-count");
    return res.data;
  },

  getConversations: async (params?: Record<string, any>) => {
    const res = await api.get<{ conversations: ChatConversation[] }>("/chat/conversations", { params });
    return res.data;
  },

  getMessages: async (conversationId: string, limit = 50) => {
    const res = await api.get<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`, {
      params: { limit },
    });
    return res.data;
  },

  sendMessage: async (payload: { conversationId: string; content: string; mediaUrl?: string }) => {
    const res = await api.post<ChatMessage>("/chat/messages", payload);
    return res.data;
  },

  uploadMedia: async (conversationId: string, formData: FormData) => {
    const res = await api.post(`/uploads/chat`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  markAsRead: async (conversationId: string) => {
    const res = await api.patch(`/chat/conversations/${conversationId}/read`);
    return res.data;
  },

  sendTyping: async (conversationId: string, isTyping = true) => {
    const res = await api.post(`/chat/conversations/${conversationId}/typing`, { isTyping });
    return res.data;
  },

  getSupportMe: async () => {
    const res = await api.get<{ conversation: ChatConversation }>("/chat/support/me");
    return res.data;
  },

  createPrivateConversation: async (payload: { targetUserId: string; listingId?: string }) => {
    const res = await api.post<{ conversation: ChatConversation }>("/chat/conversations/private", payload);
    return res.data;
  },
};
