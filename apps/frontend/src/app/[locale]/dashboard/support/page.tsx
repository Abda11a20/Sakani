// apps/frontend/src/app/[locale]/dashboard/support/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useAuthGuard } from "@/features/auth";
import TenantLayout from "@/components/layout/TenantLayout";
import LandlordLayout from "@/components/layout/LandlordLayout";
import { Spinner, Button, useToast } from "@/components/ui";
import {
  MessageCircle,
  Send,
  Loader2,
  HeadphonesIcon,
  Bot,
  ShieldAlert,
  Paperclip,
  FileText,
  Download,
} from "lucide-react";
import { chatApi } from "@/features/chat";
import { useAuthStore } from "@/features/auth";
import { useChatRealtime } from "@/hooks/realtime/useChatRealtime";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
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
  const searchParams = useSearchParams();
  const paramConvId = searchParams?.get("conversationId") || null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatPartnerName, setChatPartnerName] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get or Create Support Conversation
  useEffect(() => {
    if (isAuthLoading || !token || !user) return;

    if (paramConvId) {
      setConversationId(paramConvId);
      chatApi.getMessages(paramConvId)
        .then(data => {
          const conv = data as any;
          if (conv.blockedAt) {
            setIsBlocked(true);
            setBlockReason(conv.blockReason);
          }
          const partner = conv.participants?.find((p: any) => p.userId !== user.id);
          if (partner && conv.type === 'PRIVATE') {
            setChatPartnerName(partner.user.name);
          }
        })
        .catch(err => console.error("Failed to load conversation details", err));
      return;
    }

    const initSupportConversation = async () => {
      setIsLoadingHistory(true);
      try {
        const data = await chatApi.getSupportMe();
        const conv = (data as any).conversation || data;
        setConversationId(conv.id);
        if (conv.blockedAt) {
          setIsBlocked(true);
          setBlockReason(conv.blockReason);
        }
      } catch (err) {
        console.error("Failed to initialize support chat", err);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    initSupportConversation();
  }, [isAuthLoading, token, user, paramConvId]);

  // Load history when conversation ID is available
  useEffect(() => {
    if (!token || !user || !conversationId) return;

    const loadHistory = async () => {
      try {
        const data = await chatApi.getMessages(conversationId, 100);
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
      } catch (err) {
        console.error("Failed to load message history", err);
      }
    };
    loadHistory();
  }, [conversationId, token, user]);

  // Realtime subscription via centralized useChatRealtime hook
  const { isConnected } = useChatRealtime(
    token && user && conversationId ? conversationId : null,
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

        // Mark conversation as read
        if (conversationId) {
          chatApi.markAsRead(conversationId).catch(() => {});
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
      await chatApi.sendMessage({ conversationId, content: text });

      // Optimistic update
      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          content: text,
          senderId: user.id,
          senderName: user.name,
          createdAt: new Date().toISOString(),
          isOwn: true,
        },
      ]);
    } catch {
      toast({
        title: "خطأ في الإرسال",
        description: "تعذر إرسال الرسالة، يرجى المحاولة مرة أخرى.",
        type: "error",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "حجم الملف كبير جداً",
        description: "الحد الأقصى للملفات هو 10 ميجابايت.",
        type: "error",
      });
      return;
    }

    setIsUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      const res = await chatApi.uploadMedia(conversationId, uploadFormData);
      if (res?.url) {
        await handleSend(res.url);
      }
    } catch {
      toast({
        title: "خطأ في رفع الملف",
        description: "تعذر رفع المرفق، يرجى المحاولة مرة أخرى.",
        type: "error",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const Layout = user?.role === "landlord" ? LandlordLayout : TenantLayout;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 font-cairo">
        {/* Header */}
        <div className="flex items-center justify-between bg-card border border-border p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <HeadphonesIcon size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {chatPartnerName ? `المحادثة مع: ${chatPartnerName}` : "محادثة الدعم الفني المباشر"}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    isConnected ? "bg-emerald-500 animate-pulse" : "bg-[#0EA5E9]"
                  )}
                />
                <span className="text-xs text-muted-foreground font-medium">
                  {isConnected ? "متصل بالخدمة الحية" : "جارٍ الاتصال بالشبكة..."}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Box */}
        <div className="bg-card border border-border rounded-3xl h-[600px] flex flex-col overflow-hidden shadow-sm">
          {/* Blocked Notice */}
          {isBlocked && (
            <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-4 text-red-500 flex items-start gap-3 text-sm">
              <ShieldAlert size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">تم حظر هذه المحادثة من قِبَل إدارة المنصة</p>
                {blockReason && <p className="mt-1 text-xs opacity-90">{blockReason}</p>}
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-muted/5">
            {isLoadingHistory ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <Loader2 size={24} className="animate-spin me-2" />
                <span className="text-sm">جارٍ تحميل المحادثة...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <Bot size={48} className="mb-4 opacity-30 text-primary" />
                <h3 className="font-bold text-base text-foreground mb-1">مرحباً بك في مركز الدعم الفني 👋</h3>
                <p className="text-sm max-w-md">
                  فريقنا متواجد لمساعدتك في أي استفسار أو مشكلة تواجهك. أرسل استفسارك وسنقوم بالرد عليك في أقرب وقت.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isImg = isImageUrl(msg.content);
                const isFile = isFileUrl(msg.content);

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[75%]",
                      msg.isOwn ? "ms-auto items-end" : "me-auto items-start"
                    )}
                  >
                    {!msg.isOwn && (
                      <span className="text-xs font-semibold text-muted-foreground mb-1 px-1">
                        {msg.senderName}
                      </span>
                    )}

                    <div
                      className={cn(
                        "p-4 rounded-2xl text-sm leading-relaxed shadow-sm overflow-hidden",
                        msg.isOwn
                          ? "bg-primary text-white rounded-br-none"
                          : "bg-card border border-border text-foreground rounded-bl-none"
                      )}
                    >
                      {isImg ? (
                        <div className="space-y-2">
                          <img
                            src={msg.content}
                            alt="مرفق صورة"
                            className="max-w-full max-h-64 rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => window.open(msg.content, "_blank")}
                          />
                        </div>
                      ) : isFile ? (
                        <div className="flex items-center gap-3">
                          <FileText size={24} className="shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">مرفق ملف</p>
                            <a
                              href={msg.content}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] underline opacity-90 flex items-center gap-1 mt-0.5"
                            >
                              <Download size={12} />
                              تحميل الملف
                            </a>
                          </div>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>

                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString(isRtl ? "ar-EG" : "en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-4 bg-card border-t border-border">
            {isBlocked ? (
              <p className="text-center text-sm text-muted-foreground py-2 font-medium">
                تم إغلاق المحادثة ولا يمكنك إرسال رسائل جديدة.
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-3"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isSending || !token || !conversationId}
                  className="p-3 rounded-xl border border-border hover:bg-muted/10 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors shrink-0"
                  title="إرفاق ملف أو صورة"
                >
                  {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="أكتب استفسارك هنا..."
                  disabled={isSending || !token || !conversationId}
                  className="flex-1 input-field py-3 text-sm"
                />

                <Button
                  type="submit"
                  disabled={!input.trim() || isSending || !token || !conversationId}
                  className="px-5 py-3 rounded-xl font-bold flex items-center gap-2 shrink-0"
                >
                  {isSending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <span>إرسال</span>
                      <Send size={16} />
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
