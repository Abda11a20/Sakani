// apps/frontend/src/components/chat/ChatWidget.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  HeadphonesIcon,
  Bot,
  ShieldAlert,
} from "lucide-react";
import Pusher from "pusher-js";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName?: string;
  createdAt: string;
  isOwn?: boolean;
}

interface ChatWidgetProps {
  /** معرف غرفة المحادثة إذا تم تحديدها من الخارج (خاص بلوحة الأدمن) */
  conversationId?: string;
  /** عنوان الـ Widget */
  title?: string;
}

export default function ChatWidget({ conversationId: propConversationId, title }: ChatWidgetProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { user, token } = useAuthStore();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mounted, setMounted] = useState(false);

  const [conversationId, setConversationId] = useState<string | null>(propConversationId || null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<ReturnType<Pusher["subscribe"]> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync prop changes
  useEffect(() => {
    if (propConversationId) {
      setConversationId(propConversationId);
      // Reset messages when conversation changes
      setMessages([]);
    }
  }, [propConversationId]);

  // Fetch general unread count for current user
  useEffect(() => {
    if (!token || !user) return;
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get<{ unreadCount: number }>("/chat/unread-count");
        setUnreadCount(res.data.unreadCount);
      } catch {
        // fail silently
      }
    };
    fetchUnreadCount();
  }, [token, user, isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Handle Mark as Read when opening the chat
  useEffect(() => {
    if (isOpen && conversationId && user) {
      const markAsRead = async () => {
        try {
          await api.patch(`/chat/conversations/${conversationId}/read`);
          setUnreadCount(0);
          queryClient.invalidateQueries({ queryKey: ["chat", "unread-count"] });
        } catch {
          // ignore
        }
      };
      markAsRead();
    }
  }, [isOpen, conversationId, user, queryClient]);

  // Get or Create Support Conversation for User
  useEffect(() => {
    if (!isOpen || !token || !user || conversationId) return;
    
    const initSupportConversation = async () => {
      try {
        const res = await api.get("/chat/support/me");
        setConversationId(res.data.id);
        if (res.data.blockedAt) {
          setIsBlocked(true);
          setBlockReason(res.data.blockReason);
        } else {
          setIsBlocked(false);
          setBlockReason(null);
        }
      } catch {
        // ignore
      }
    };
    initSupportConversation();
  }, [isOpen, token, user, conversationId]);

  // Load history when conversation ID is available
  useEffect(() => {
    if (!isOpen || !token || !user || !conversationId) return;

    const loadHistory = async () => {
      try {
        const res = await api.get(`/chat/conversations/${conversationId}/messages?limit=50`);
        const history = res.data.messages.map((m: any) => ({
          id: m.id,
          content: m.content,
          senderId: m.sender.id,
          senderName: m.sender.name,
          createdAt: m.createdAt,
          isOwn: m.sender.id === user.id,
        }));
        setMessages(history);
      } catch {
        // ignore
      }
    };
    loadHistory();
  }, [isOpen, conversationId, token, user]);

  // Connect Pusher to conversation channel
  useEffect(() => {
    if (!isOpen || !token || !user || !conversationId) return;
    if (pusherRef.current) return; // already connected

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY ?? "";
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "eu";
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

    pusherRef.current = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: `${backendUrl}/chat/pusher/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const ch = `private-conversation-${conversationId}`;
    const channel = pusherRef.current.subscribe(ch);
    channelRef.current = channel;

    channel.bind("pusher:subscription_succeeded", () => setIsConnected(true));
    channel.bind("pusher:subscription_error", () => setIsConnected(false));

    channel.bind("message.created", (data: any) => {
      // Ignore own message from another session (will be handled by optimistic updates)
      if (data.sender.id === user.id) return;

      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [
          ...prev,
          {
            id: data.id,
            content: data.content,
            senderId: data.sender.id,
            senderName: data.sender.name,
            createdAt: data.createdAt,
            isOwn: false,
          },
        ];
      });

      if (isOpen) {
        api.patch(`/chat/conversations/${conversationId}/read`).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ["chat", "unread-count"] });
      } else {
        setUnreadCount((prev) => prev + 1);
        queryClient.invalidateQueries({ queryKey: ["chat", "unread-count"] });
      }
    });

    channel.bind("conversation.updated", (data: any) => {
      if (data.blockedAt) {
        setIsBlocked(true);
        setBlockReason(data.blockReason);
      } else {
        setIsBlocked(false);
        setBlockReason(null);
      }
    });

    return () => {
      channel.unbind_all();
      pusherRef.current?.unsubscribe(ch);
      pusherRef.current?.disconnect();
      pusherRef.current = null;
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [isOpen, token, user, conversationId]);

  const handleSend = async () => {
    if (!input.trim() || isSending || !user || !conversationId) return;
    const content = input.trim();
    setInput("");
    setIsSending(true);

    try {
      await api.post("/chat/messages", { conversationId, content });
      
      // Optimistic update
      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          content,
          senderId: user.id,
          senderName: user.name,
          createdAt: new Date().toISOString(),
          isOwn: true,
        },
      ]);
    } catch {
      // silently fail
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!mounted || !user) return null;

  const widgetTitle = title ?? (isRtl ? "الدعم الفني" : "Support Chat");

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        id="chat-widget-toggle"
        className={cn(
          "fixed bottom-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95",
          isRtl ? "left-6" : "right-6",
          isOpen
            ? "bg-slate-700 dark:bg-slate-600"
            : "bg-gradient-to-br from-amber-400 to-amber-600"
        )}
        aria-label={widgetTitle}
      >
        {isOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <MessageCircle size={22} className="text-white" />
        )}
        {/* Unread badge */}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Drawer */}
      <div
        className={cn(
          "fixed bottom-24 z-50 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-300",
          isRtl ? "left-6" : "right-6",
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
        style={{ maxHeight: "480px" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <HeadphonesIcon size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white font-cairo">{widgetTitle}</p>
            <p className="text-xs text-amber-100 font-cairo">
              {isConnected ? (isRtl ? "متصل" : "Connected") : (isRtl ? "جاري الاتصال..." : "Connecting...")}
            </p>
          </div>
          <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-emerald-300" : "bg-amber-200 animate-pulse")} />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mb-3">
                <Bot size={22} className="text-amber-500" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 font-cairo">
                {isRtl ? "أهلاً! كيف يمكننا مساعدتك؟" : "Hi! How can we help?"}
              </p>
              <p className="text-xs text-slate-400 font-cairo mt-1">
                {isRtl ? "ابدأ المحادثة الآن" : "Start chatting now"}
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.isOwn ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[75%] px-3 py-2 rounded-xl text-sm font-cairo break-words",
                  msg.isOwn
                    ? "bg-amber-500 text-white rounded-ee-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-es-sm"
                )}
              >
                {msg.content}
                <p
                  className={cn(
                    "text-[10px] mt-0.5",
                    msg.isOwn ? "text-amber-100" : "text-slate-400"
                  )}
                >
                  {new Date(msg.createdAt).toLocaleTimeString("ar-EG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input / Block Status */}
        {isBlocked ? (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-950/20 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2 shrink-0">
            <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={16} />
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 font-cairo">
              {isRtl ? "تم حظر هذه المحادثة من قِبل الإدارة." : "This conversation has been blocked by administration."}
              {blockReason && <span className="block mt-1 font-normal opacity-90">{isRtl ? `السبب: ${blockReason}` : `Reason: ${blockReason}`}</span>}
            </p>
          </div>
        ) : (
          <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRtl ? "اكتب رسالتك..." : "Type a message..."}
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-cairo placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                dir={isRtl ? "rtl" : "ltr"}
                disabled={!conversationId}
              />
              <button
                onClick={handleSend}
                disabled={isSending || !input.trim() || !conversationId}
                className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 dark:disabled:bg-slate-700 text-white disabled:text-slate-400 flex items-center justify-center transition-all shrink-0"
                aria-label="Send"
              >
                {isSending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} className={cn(isRtl && "rotate-180")} />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
