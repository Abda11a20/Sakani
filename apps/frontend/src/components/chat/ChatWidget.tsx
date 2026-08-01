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
import { useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/features/chat";
import { useAuthStore } from "@/features/auth";
import { useChatRealtime } from "@/hooks/realtime/useChatRealtime";
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
  const { user } = useAuthStore();
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
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const [unreadCount, setUnreadCount] = useState(0);
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
    if (!user) return;
    const fetchUnreadCount = async () => {
      try {
        const data = await chatApi.getUnreadCount();
        setUnreadCount(data.unreadCount);
      } catch {
        // fail silently
      }
    };
    fetchUnreadCount();
  }, [user, isOpen]);

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
          await chatApi.markAsRead(conversationId);
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
    if (!isOpen || !user || conversationId) return;

    const initSupportConversation = async () => {
      try {
        const data = await chatApi.getSupportMe();
        const conv = data.conversation || data;
        setConversationId(conv.id);
        if ((conv as any).blockedAt) {
          setIsBlocked(true);
          setBlockReason((conv as any).blockReason);
        } else {
          setIsBlocked(false);
          setBlockReason(null);
        }
      } catch {
        // ignore
      }
    };
    initSupportConversation();
  }, [isOpen, user, conversationId]);

  // Load history when conversation ID is available
  useEffect(() => {
    if (!isOpen || !user || !conversationId) return;

    const loadHistory = async () => {
      try {
        const data = await chatApi.getMessages(conversationId, 50);
        const rawMessages = Array.isArray(data) ? data : (data as any).messages || [];
        const history = rawMessages.map((m: any) => ({
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
  }, [isOpen, user, conversationId]);

  // Realtime subscription via centralized useChatRealtime hook
  const { isConnected } = useChatRealtime(
    isOpen && user && conversationId ? conversationId : null,
    {
      onMessageCreated: (data: any) => {
        if (data.sender.id === user?.id) return;

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

        if (isOpen && conversationId) {
          chatApi.markAsRead(conversationId).catch(() => {});
          queryClient.invalidateQueries({ queryKey: ["chat", "unread-count"] });
        } else {
          setUnreadCount((prev) => prev + 1);
          queryClient.invalidateQueries({ queryKey: ["chat", "unread-count"] });
        }
      },
      onUserTyping: (data: any) => {
        if (data.userId !== user?.id) {
          setIsPartnerTyping(data.isTyping);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          if (data.isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
              setIsPartnerTyping(false);
            }, 3000);
          }
        }
      },
      onConversationUpdated: (data: any) => {
        if (data.blockedAt) {
          setIsBlocked(true);
          setBlockReason(data.blockReason);
        } else {
          setIsBlocked(false);
          setBlockReason(null);
        }
      },
    }
  );

  const handleSend = async () => {
    if (!input.trim() || isSending || !user || !conversationId) return;
    const content = input.trim();
    setInput("");
    setIsSending(true);

    try {
      await chatApi.sendMessage({ conversationId, content });

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
      // fail silently or handle
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!conversationId) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      chatApi.sendTyping(conversationId, true).catch(() => {});
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed bottom-6 end-6 z-50 font-cairo">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-xl hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all group"
          aria-label="محادثة الدعم الفني"
        >
          <MessageCircle size={26} className="group-hover:rotate-12 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -end-1 flex items-center justify-center w-6 h-6 text-xs font-bold bg-red-500 text-white rounded-full border-2 border-background animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Floating Chat Box */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-primary px-5 py-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <HeadphonesIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-snug">{title || "فريق خدمة العملاء"}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                    )}
                  />
                  <span className="text-[11px] text-white/80 font-medium">
                    {isConnected ? "متصل الآن" : "جارٍ الاتصال..."}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Blocked Notice Banner */}
          {isBlocked && (
            <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3 text-red-500 flex items-start gap-2.5 shrink-0 text-xs">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">المحادثة محظورة من قِبَل الإدارة</p>
                {blockReason && <p className="mt-0.5 opacity-90">{blockReason}</p>}
              </div>
            </div>
          )}

          {/* Messages List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-muted/5">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <Bot size={40} className="mb-3 opacity-30 text-primary" />
                <p className="font-semibold text-sm text-foreground">مرحباً بك في خدمة العملاء 👋</p>
                <p className="text-xs mt-1">كيف يمكننا مساعدتك اليوم؟ أرسل استفسارك وسيقوم أحد ممثلينا بالرد عليك فوراً.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    msg.isOwn ? "ms-auto items-end" : "me-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                      msg.isOwn
                        ? "bg-primary text-white rounded-br-none"
                        : "bg-card border border-border text-foreground rounded-bl-none"
                    )}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString(isRtl ? "ar-EG" : "en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            )}
            {isPartnerTyping && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground italic px-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                <span>يكتب الآن...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-card border-t border-border shrink-0">
            {isBlocked ? (
              <p className="text-center text-xs text-muted-foreground py-2 font-medium">
                لا يمكنك إرسال رسائل في هذه المحادثة.
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="أكتب رسالتك هنا..."
                  disabled={isSending}
                  className="flex-1 bg-muted/20 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary disabled:opacity-50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isSending}
                  className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 active:scale-95 transition-all shrink-0"
                >
                  {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
