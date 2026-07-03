// apps/frontend/src/app/[locale]/dashboard/support/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import TenantLayout from "@/components/layout/TenantLayout";
import LandlordLayout from "@/components/layout/LandlordLayout";
import { Card, CardBody, Spinner, Button, Input, useToast } from "@/components/ui";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  HeadphonesIcon,
  Bot,
  ShieldAlert,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Download,
  CheckCircle,
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

const isImageUrl = (content: string) => {
  if (!content.startsWith("http")) return false;
  const cleanUrl = content.split("?")[0].toLowerCase();
  return (
    cleanUrl.endsWith(".jpg") ||
    cleanUrl.endsWith(".jpeg") ||
    cleanUrl.endsWith(".png") ||
    cleanUrl.endsWith(".webp") ||
    cleanUrl.endsWith(".gif") ||
    (content.includes("res.cloudinary.com") && content.includes("/image/upload/"))
  );
};

const isFileUrl = (content: string) => {
  if (!content.startsWith("http")) return false;
  return !isImageUrl(content);
};

export default function SupportPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { toast } = useToast();
  const { token } = useAuthStore();
  
  // Guard role options: tenant or landlord
  const { user, isLoading: isAuthLoading } = useAuthGuard({ role: ["tenant", "landlord"] });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<string | null>(null);
  
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<ReturnType<Pusher["subscribe"]> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get or Create Support Conversation
  useEffect(() => {
    if (isAuthLoading || !token || !user) return;
    
    const initSupportConversation = async () => {
      setIsLoadingHistory(true);
      try {
        const res = await api.get("/chat/support/me");
        setConversationId(res.data.id);
        if (res.data.blockedAt) {
          setIsBlocked(true);
          setBlockReason(res.data.blockReason);
        }
      } catch (err) {
        console.error("Failed to initialize support chat", err);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    initSupportConversation();
  }, [isAuthLoading, token, user]);

  // Load history when conversation ID is available
  useEffect(() => {
    if (!token || !user || !conversationId) return;

    const loadHistory = async () => {
      try {
        const res = await api.get(`/chat/conversations/${conversationId}/messages?limit=100`);
        const history = res.data.messages.map((m: any) => ({
          id: m.id,
          content: m.content,
          senderId: m.sender.id,
          senderName: m.sender.name,
          createdAt: m.createdAt,
          isOwn: m.sender.id === user.id,
        }));
        setMessages(history);
      } catch (err) {
        console.error("Failed to load message history", err);
      }
    };
    loadHistory();
  }, [conversationId, token, user]);

  // Connect Pusher to conversation channel
  useEffect(() => {
    if (!token || !user || !conversationId) return;

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY ?? "";
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "eu";
    const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

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

      // Mark conversation as read
      api.patch(`/chat/conversations/${conversationId}/read`).catch(() => {});
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
  }, [token, user, conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || isSending || !user || !conversationId) return;

    if (!textToSend) setInput("");
    setIsSending(true);

    try {
      const response = await api.post("/chat/messages", { conversationId, content: text });
      
      // Optimistic update using backend response data
      const newMsg = response.data;
      setMessages((prev) => {
        // Prevent duplicate if Pusher broadcasted it in the meantime
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [
          ...prev,
          {
            id: newMsg.id,
            content: newMsg.content,
            senderId: user.id,
            senderName: user.name,
            createdAt: newMsg.createdAt,
            isOwn: true,
          },
        ];
      });
    } catch (err: any) {
      toast({
        title: "فشل الإرسال",
        description: err.friendlyMessage || "حدث خطأ أثناء إرسال الرسالة.",
        type: "error",
      });
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

  // Upload attachment and send URL as message
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "الملف كبير جداً",
          description: "الحد الأقصى للمرفقات هو 10 ميجابايت.",
          type: "error",
        });
        return;
      }

      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await api.post("/uploads/chat", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        const fileUrl = response.data.url;
        // Send file URL immediately as a message
        await handleSend(fileUrl);
      } catch (err: any) {
        toast({
          title: "فشل رفع الملف",
          description: err.friendlyMessage || "حدث خطأ أثناء تحميل الملف المرفق.",
          type: "error",
        });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  if (isAuthLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Wrap inside the correct layout dynamically
  const Layout = user.role === "landlord" ? LandlordLayout : TenantLayout;

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-white">
              <HeadphonesIcon size={22} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white font-cairo">الدعم الفني والمساندة</h1>
              <p className="text-xs text-amber-100 font-cairo mt-0.5">
                {isConnected ? (isRtl ? "متصل بالدعم المباشر" : "Live chat connected") : (isRtl ? "جاري الاتصال..." : "Connecting...")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("w-2.5 h-2.5 rounded-full ring-4 ring-white/10", isConnected ? "bg-emerald-300" : "bg-amber-200 animate-pulse")} />
            <span className="text-xs text-white/95 font-semibold font-cairo hidden sm:inline">
              {isConnected ? (isRtl ? "نشط" : "Active") : (isRtl ? "غير متصل" : "Offline")}
            </span>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50 dark:bg-slate-950/20 space-y-4">
          {isLoadingHistory ? (
            <div className="flex justify-center items-center h-full">
              <Spinner size="md" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 max-w-md mx-auto">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center mb-4">
                <Bot size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-cairo">أهلاً بك في الدعم الفني لسكني!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo mt-2 leading-relaxed">
                لديك استفسار أو واجهتك مشكلة؟ اترك رسالتك هنا وسيقوم فريق الدعم بالرد عليك في أقرب وقت ممكن.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((msg) => {
                const isImage = isImageUrl(msg.content);
                const isFile = isFileUrl(msg.content);

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-end gap-2.5",
                      msg.isOwn ? "justify-end" : "justify-start"
                    )}
                  >
                    {!msg.isOwn && (
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-bold shrink-0">
                        A
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl p-4 shadow-sm flex flex-col gap-1.5",
                        msg.isOwn
                          ? "bg-amber-500 text-white rounded-ee-none"
                          : "bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 rounded-es-none"
                      )}
                    >
                      {/* Message Content Renderer */}
                      {isImage ? (
                        <div className="rounded-xl overflow-hidden max-w-sm border border-black/5 dark:border-white/5 bg-slate-100 dark:bg-slate-800">
                          <img
                            src={msg.content}
                            alt="مرفق صورة"
                            className="w-full max-h-[300px] object-contain cursor-zoom-in"
                            onClick={() => window.open(msg.content, "_blank")}
                          />
                        </div>
                      ) : isFile ? (
                        <div className="flex items-center gap-3 p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 max-w-sm">
                          <div className="w-10 h-10 bg-amber-500 text-white rounded-lg flex items-center justify-center shrink-0">
                            <FileText size={20} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate font-sans">
                              {msg.content.split("/").pop() || "document.pdf"}
                            </p>
                            <p className="text-[10px] opacity-80 mt-0.5 font-cairo">ملف مرفق</p>
                          </div>
                          <a
                            href={msg.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-lg bg-white/20 dark:bg-black/20 hover:scale-105 transition-all flex items-center justify-center shrink-0 text-current"
                          >
                            <Download size={14} />
                          </a>
                        </div>
                      ) : (
                        <p className="text-sm font-cairo leading-relaxed font-medium break-words">
                          {msg.content}
                        </p>
                      )}

                      {/* Message Timestamp */}
                      <p
                        className={cn(
                          "text-[9px] self-end font-sans tracking-wide",
                          msg.isOwn ? "text-amber-100" : "text-slate-400 dark:text-slate-500"
                        )}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form / Block status */}
        {isBlocked ? (
          <div className="px-6 py-4 bg-red-50 dark:bg-red-950/20 border-t border-slate-200 dark:border-slate-800 flex items-start gap-3 shrink-0">
            <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-red-700 dark:text-red-400 font-cairo">تم حظر هذه المحادثة</h4>
              <p className="text-xs text-red-600 dark:text-red-500 font-cairo">
                تم تجميد المحادثة من قِبل إدارة المنصة.
                {blockReason && <span className="block mt-1 font-bold">السبب: {blockReason}</span>}
              </p>
            </div>
          </div>
        ) : (
          <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3 max-w-4xl mx-auto">
              {/* File Upload Trigger */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                className="hidden"
              />
              <button
                type="button"
                onClick={triggerFileSelect}
                disabled={isUploading || isSending || !conversationId}
                className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all shrink-0 relative"
                aria-label="Attach file"
              >
                {isUploading ? (
                  <Loader2 size={18} className="animate-spin text-amber-500" />
                ) : (
                  <Paperclip size={18} />
                )}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRtl ? "اكتب استفسارك هنا..." : "Type your message..."}
                className="flex-1 h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white text-sm font-cairo focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400"
                dir={isRtl ? "rtl" : "ltr"}
                disabled={isSending || isUploading || !conversationId}
              />

              {/* Send Button */}
              <Button
                onClick={() => handleSend()}
                disabled={isSending || isUploading || !input.trim() || !conversationId}
                className="h-11 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold font-cairo flex items-center gap-2 shrink-0 transition-all shadow-sm"
              >
                {isSending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Send size={15} className={cn(isRtl && "rotate-180")} />
                    <span className="hidden sm:inline">إرسال</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
