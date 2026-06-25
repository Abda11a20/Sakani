// apps/frontend/src/components/chat/ChatWidget.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocale } from "next-intl";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  HeadphonesIcon,
  Bot,
} from "lucide-react";
import Pusher from "pusher-js";
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
  /** إذا كانت محادثة دعم خاصة — targetUserId = id المدير */
  targetUserId?: string;
  /** عنوان الـ Widget */
  title?: string;
}

export default function ChatWidget({ targetUserId, title }: ChatWidgetProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { user, token } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mounted, setMounted] = useState(false);

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

  // Fetch unread count on mount
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
  }, [token, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Handle Mark as Read when opening the chat
  useEffect(() => {
    if (isOpen && unreadCount > 0 && user) {
      const markAsRead = async () => {
        try {
          if (targetUserId) {
            await api.patch(`/chat/read/${targetUserId}`);
          } else {
            // Find unique senders from recent messages
            const senders = new Set(messages.filter(m => !m.isOwn).map(m => m.senderId));
            for (const sender of Array.from(senders)) {
              await api.patch(`/chat/read/${sender}`);
            }
          }
          setUnreadCount(0);
        } catch {
          // ignore
        }
      };
      markAsRead();
    }
  }, [isOpen, targetUserId, unreadCount, user, messages]);

  // Build channel name
  const channelName = useCallback(() => {
    if (!user) return null;
    // According to the new backend logic, all personal events arrive here
    return `private-chat-user-${user.id}`;
  }, [user]);

  // Connect Pusher when widget opens
  useEffect(() => {
    if (!isOpen || !token || !user) return;
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

    const ch = channelName();
    if (!ch) return;

    const channel = pusherRef.current.subscribe(ch);
    channelRef.current = channel;

    channel.bind("pusher:subscription_succeeded", () => setIsConnected(true));
    channel.bind("pusher:subscription_error", () => setIsConnected(false));

    channel.bind("new-message", (data: Omit<ChatMessage, "isOwn">) => {
      // If we are talking to a specific user, ignore messages from others unless we want to show a badge
      if (data.senderId === user.id) return; // Own message from another session

      if (targetUserId && data.senderId !== targetUserId && data.senderId !== user.id) {
        // Message from someone else
        setUnreadCount(prev => prev + 1);
        return;
      }
      
      setMessages((prev) => [
        ...prev,
        { ...data, isOwn: data.senderId === user.id },
      ]);

      if (isOpen) {
        // auto mark as read if open
        api.patch(`/chat/read/${data.senderId}`).catch(() => {});
      } else {
        setUnreadCount(prev => prev + 1);
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
  }, [isOpen, token, user, channelName, targetUserId]);

  // Load history when opening
  useEffect(() => {
    if (!isOpen || !token || !user) return;
    // Load existing messages when opened
    const loadHistory = async () => {
      try {
        if (targetUserId) {
          const res = await api.get(`/chat/conversation/${targetUserId}?limit=50`);
          const history = res.data.messages.map((m: any) => ({
            id: m.id,
            content: m.content,
            senderId: m.sender.id,
            senderName: m.sender.name,
            createdAt: m.createdAt,
            isOwn: m.sender.id === user.id,
          }));
          setMessages(history);
        } else {
          // It's the support widget
          // Normally we'd load the support thread for this user, but the user is the tenant.
          // Wait, there's no dedicated endpoint to load user's own support thread?
          // Let's fallback to just starting fresh or if there's an endpoint:
          // The backend currently only has GET /chat/support which returns admin inbox!
          // We don't have a specific endpoint for user's support chat. It's fine to just stay fresh.
        }
      } catch {
        // ignore
      }
    };
    if (messages.length === 0) {
      loadHistory();
    }
  }, [isOpen, targetUserId, token, user, messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isSending || !user) return;
    const content = input.trim();
    setInput("");
    setIsSending(true);

    try {
      if (targetUserId) {
        await api.post("/chat/send", { receiverId: targetUserId, content });
      } else {
        await api.post("/chat/send", { content }); // Without receiverId it goes to support
      }
      // Optimistic update — Pusher event will also arrive
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

        {/* Input */}
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
            />
            <button
              onClick={handleSend}
              disabled={isSending || !input.trim()}
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
      </div>
    </>
  );
}
