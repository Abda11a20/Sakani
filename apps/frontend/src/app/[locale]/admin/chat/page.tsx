// apps/frontend/src/app/[locale]/admin/chat/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import {
  Loader2,
  AlertCircle,
  RefreshCcw,
  ShieldAlert,
  Unlock,
  Ban,
  Search,
  Image as ImageIcon,
  X,
  User as UserIcon,
  Headphones,
  Paperclip,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
} from "lucide-react";
import { useAdminSupport, useBlockConversation, useUnblockConversation, SupportConversation } from "@/hooks/useAdmin";
import { Avatar } from "@/components/ui/avatar";
import { useAuthStore } from "@/features/auth";
import { api } from "@/lib/api";
import { chatApi } from "@/features/chat";
import { useChatRealtime } from "@/hooks/realtime/useChatRealtime";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

// Modular Admin Chat Components
import { BlockedConversationFilters, BLOCK_REASON_LABELS } from "@/components/admin/chat/BlockedConversationFilters";
import { BlockedConversationsTable } from "@/components/admin/chat/BlockedConversationsTable";
import { BlockedConversationDrawer } from "@/components/admin/chat/BlockedConversationDrawer";
import { AdminChatSendButton } from "@/components/admin/chat/AdminChatSendButton";
import { ConfirmUnblockModal } from "@/components/admin/chat/ConfirmUnblockModal";

const WHATSAPP_RAW_NUMBER = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "+201551876606";
const CLEAN_WHATSAPP_NUMBER = WHATSAPP_RAW_NUMBER.replace(/[^0-9]/g, "");
const WHATSAPP_LINK = `https://wa.me/${CLEAN_WHATSAPP_NUMBER || "201551876606"}`;

interface ChatMessageItem {
  id: string;
  conversationId?: string;
  content: string;
  type?: "TEXT" | "IMAGE" | string;
  createdAt: string;
  senderId?: string;
  sender?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  isOwn?: boolean;
}

const isImageMessage = (msg?: { type?: string; content?: string } | null) => {
  if (!msg || !msg.content) return false;
  if (msg.type?.toUpperCase() === "IMAGE") return true;
  const url = msg.content.toLowerCase().trim();
  if (url.startsWith("http://") || url.startsWith("https://")) {
    if (
      url.includes("/image/upload/") ||
      url.includes("/images/") ||
      url.includes("cloudinary.com") ||
      /\.(png|jpg|jpeg|webp|gif|svg)($|\?)/i.test(url)
    ) {
      return true;
    }
  }
  return false;
};

export default function AdminChatPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { toast } = useToast();

  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"active" | "blocked">("active");

  // Queries for active vs blocked
  const { data: activeData, isLoading: isActiveLoading, isError: isActiveError, refetch: refetchActive } = useAdminSupport("active");
  const { data: blockedData, isLoading: isBlockedLoading, refetch: refetchBlocked } = useAdminSupport("blocked");

  const [selectedConv, setSelectedConv] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [blockedSearchTerm, setBlockedSearchTerm] = useState("");
  const [selectedReasonFilter, setSelectedReasonFilter] = useState("");

  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Block Modal & Reason State
  const [showBlockModal, setShowBlockModal] = useState<string | null>(null);
  const [blockReasonEnum, setBlockReasonEnum] = useState<string>("SPAM");
  const [blockReasonNote, setBlockReasonNote] = useState<string>("");

  // Inspection Drawer & Confirm Unblock Modal State
  const [inspectConv, setInspectConv] = useState<any | null>(null);
  const [confirmUnblockConv, setConfirmUnblockConv] = useState<any | null>(null);

  // Lightbox Modal state
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  const blockMutation = useBlockConversation();
  const unblockMutation = useUnblockConversation();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  const activeConversations = activeData?.conversations ?? [];
  const blockedConversations = blockedData?.conversations ?? [];
  const blockedCount = blockedData?.meta?.total ?? blockedConversations.length;

  // Filter Active conversations by name or phone
  const filteredActiveConversations = activeConversations.filter((c) => {
    const clientName = c.clientUser?.name?.toLowerCase() || "";
    const clientPhone = c.clientUser?.phone?.toLowerCase() || "";
    const term = searchTerm.toLowerCase().trim();
    return !term || clientName.includes(term) || clientPhone.includes(term);
  });

  // Filter Blocked conversations by name/phone AND reason
  const filteredBlockedConversations = blockedConversations.filter((c) => {
    const clientName = c.clientUser?.name?.toLowerCase() || "";
    const clientPhone = c.clientUser?.phone?.toLowerCase() || "";
    const term = blockedSearchTerm.toLowerCase().trim();

    const matchesTerm = !term || clientName.includes(term) || clientPhone.includes(term);

    const rawReason = c.blockReason || "";
    const matchesReason = !selectedReasonFilter || rawReason.includes(selectedReasonFilter);

    return matchesTerm && matchesReason;
  });

  const formatDate = (d?: string) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (d?: string) => {
    if (!d) return "";
    return new Date(d).toLocaleTimeString(isRtl ? "ar-EG" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fetch conversation messages on selection
  useEffect(() => {
    if (!selectedConv?.id) return;
    let isCancelled = false;

    async function loadMessages() {
      setLoadingMessages(true);
      try {
        const res = await api.get(`/chat/conversations/${selectedConv?.id}/messages?page=1&limit=50`);
        if (!isCancelled) {
          const rawMsgs = res.data?.messages || res.data?.items || (Array.isArray(res.data) ? res.data : []);
          const formatted = rawMsgs.map((m: any) => ({
            ...m,
            isOwn: m.senderId === user?.id,
          }));
          setMessages(formatted);
        }
      } catch {
        if (!isCancelled) setMessages([]);
      } finally {
        if (!isCancelled) setLoadingMessages(false);
      }
    }

    loadMessages();
    return () => {
      isCancelled = true;
    };
  }, [selectedConv?.id, user?.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  // Socket realtime updates
  const { isConnected } = useChatRealtime(selectedConv?.id || null, {
    onMessageCreated: (newMsg: any) => {
      if (newMsg.conversationId === selectedConv?.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [
            ...prev,
            {
              ...newMsg,
              isOwn: newMsg.senderId === user?.id,
            },
          ];
        });
        scrollToBottom();
      }
    },
  });

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedConv || isSending) return;
    const content = inputText.trim();
    setInputText("");
    setIsSending(true);

    try {
      const res = await api.post("/chat/messages", {
        conversationId: selectedConv.id,
        content,
        type: "TEXT",
      });

      const newMsg = res.data;
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [
          ...prev,
          {
            ...newMsg,
            isOwn: true,
          },
        ];
      });

      setSelectedConv((prev) =>
        prev
          ? {
              ...prev,
              lastMessage: {
                content,
                createdAt: new Date().toISOString(),
                sender: { id: user?.id || "", name: user?.name || "الأدمن" },
              },
            }
          : null
      );
      scrollToBottom();
    } catch {
      // silent
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!selectedConv?.id) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      chatApi.sendTyping(selectedConv.id, true).catch(() => {});
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConv) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post(`/chat/conversations/${selectedConv.id}/attachment`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newMsg = res.data;
      setMessages((prev) => [...prev, { ...newMsg, isOwn: true, type: "IMAGE" }]);
      scrollToBottom();
    } catch {
      // silent
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirmBlock = () => {
    if (!showBlockModal) return;
    blockMutation.mutate(
      { conversationId: showBlockModal, reason: blockReasonEnum, note: blockReasonNote },
      {
        onSuccess: () => {
          toast({ type: "success", description: "تم حظر المحادثة وتسجيلها في Audit Log" });
          if (selectedConv?.id === showBlockModal) {
            setSelectedConv((prev) => (prev ? { ...prev, blockedAt: new Date().toISOString(), blockReason: blockReasonEnum } : null));
          }
          setShowBlockModal(null);
          setBlockReasonNote("");
          refetchActive();
          refetchBlocked();
        },
      }
    );
  };

  const handleConfirmUnblockAction = (conversationId: string) => {
    unblockMutation.mutate(conversationId, {
      onSuccess: () => {
        toast({ type: "success", description: "تم رفع الحظر وإعادة المحادثة للعمل بنجاح" });
        if (selectedConv?.id === conversationId) {
          setSelectedConv((prev) => (prev ? { ...prev, blockedAt: undefined, blockReason: undefined } : null));
        }
        setConfirmUnblockConv(null);
        refetchActive();
        refetchBlocked();
      },
    });
  };

  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  return (
    <div className="h-[calc(100vh-90px)] flex flex-col font-cairo bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Page Header & Tabs */}
      <div className="bg-slate-900 text-white px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <Headphones size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">خدمة العملاء</h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">إدارة محادثات الدعم والشكاوى المباشرة مع العملاء</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-[#0F1A2E] p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab("active")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === "active" ? "bg-primary text-white shadow-xs" : "text-white/60 hover:text-white"
            )}
          >
            <MessageSquare size={14} />
            <span>المحادثات</span>
          </button>

          <button
            onClick={() => setActiveTab("blocked")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === "blocked" ? "bg-status-danger text-white shadow-xs" : "text-white/60 hover:text-white"
            )}
          >
            <Ban size={14} />
            <span>المحظورون من الشات</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">{blockedCount}</span>
          </button>

          <button
            onClick={() => {
              refetchActive();
              refetchBlocked();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer me-1"
            title="تحديث البيانات"
          >
            <RefreshCcw size={14} className={isActiveLoading || isBlockedLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ── TAB 1: ACTIVE CHATS VIEW ────────────────────────────────────────── */}
      {activeTab === "active" && (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Sidebar Conversations List */}
          <div className={cn(
            "w-full md:w-80 lg:w-96 border-e border-slate-200 bg-white flex flex-col shrink-0 transition-all",
            selectedConv ? "hidden md:flex" : "flex"
          )}>
            {/* Search Box */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث باسم العميل أو رقم الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full ps-9 pe-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {isActiveLoading ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                  <Loader2 size={24} className="animate-spin mb-2 text-blue-600" />
                  <span className="text-xs font-semibold">جارٍ تحميل المحادثات...</span>
                </div>
              ) : isActiveError ? (
                <div className="p-6 text-center text-rose-600 text-xs font-semibold">
                  <AlertCircle size={22} className="mx-auto mb-2 opacity-80" />
                  <span>تعذر جلب المحادثات. حاول التحديث.</span>
                </div>
              ) : filteredActiveConversations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">لا توجد محادثات مطابقة للبحث.</div>
              ) : (
                filteredActiveConversations.map((conv) => {
                  const isSelected = selectedConv?.id === conv.id;
                  const isConvBlocked = !!conv.blockedAt;
                  const hasImageMsg = isImageMessage(conv.lastMessage);

                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConv(conv)}
                      className={cn(
                        "p-3.5 cursor-pointer transition-all relative flex items-start gap-3 border-s-4",
                        isSelected
                          ? "bg-blue-50/80 border-blue-600 font-medium"
                          : "border-transparent hover:bg-slate-50",
                        isConvBlocked && "bg-rose-50/40"
                      )}
                    >
                      <Avatar src={conv.clientUser?.avatarUrl} name={conv.clientUser?.name || ""} size="md" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {conv.clientUser?.name || "مستخدم غير معروف"}
                          </h4>
                          <span className="text-[10px] text-slate-400 shrink-0">{formatDate(conv.lastMessage?.createdAt || conv.updatedAt)}</span>
                        </div>

                        <span className="text-[10px] text-slate-400 block dir-ltr text-start font-semibold mb-1">{conv.clientUser?.phone || ""}</span>

                        {hasImageMsg ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
                            <ImageIcon size={13} className="shrink-0" />
                            <span>صورة</span>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 truncate">{conv.lastMessage?.content || "بدء المحادثة..."}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Main Panel */}
          {selectedConv ? (
            <div className="w-full flex-1 flex flex-col bg-slate-50 min-w-0">
              {/* Top Active Bar */}
              <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedConv(null)}
                    className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 md:hidden cursor-pointer"
                  >
                    <BackIcon size={18} />
                  </button>

                  <Avatar src={selectedConv.clientUser?.avatarUrl} name={selectedConv.clientUser?.name || ""} size="sm" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      {selectedConv.clientUser?.name || "عميل غير معروف"}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 dir-ltr">{selectedConv.clientUser?.phone || ""}</span>
                      <span className={cn("w-2 h-2 rounded-full", isConnected ? "bg-emerald-500" : "bg-blue-500")} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedConv.blockedAt ? (
                    <button
                      onClick={() => setConfirmUnblockConv(selectedConv)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer"
                    >
                      <Unlock size={13} />
                      <span>إلغاء الحظر</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowBlockModal(selectedConv.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                    >
                      <Ban size={13} />
                      <span>حظر المحادثة</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Block Banner */}
              {selectedConv.blockedAt && (
                <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-rose-700 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-bold shrink-0 gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={16} className="shrink-0" />
                    <span>
                      المحادثة محظورة حالياً من قِبل الإدارة. للتعرف على السبب أو لطلب فك الحظر، يرجى التواصل عبر الواتساب{" "}
                      <a
                        href={WHATSAPP_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-rose-800 hover:text-rose-950 font-black cursor-pointer"
                      >
                        اضغط هنا
                      </a>
                    </span>
                  </div>
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {loadingMessages ? (
                  <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                    <Loader2 size={24} className="animate-spin mb-2 text-blue-600" />
                    <span className="text-xs">جارٍ تحميل الرسائل...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">لا توجد رسائل سابقة في هذه المحادثة.</div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.isOwn;
                    const isImg = isImageMessage(msg);

                    return (
                      <div
                        key={msg.id}
                        className={cn("flex flex-col max-w-[85%] sm:max-w-[70%]", isMine ? "ms-auto items-end" : "me-auto items-start")}
                      >
                        <div
                          className={cn(
                            "p-3 rounded-2xl text-xs leading-relaxed shadow-xs",
                            isMine
                              ? "bg-slate-900 text-white rounded-te-xs"
                              : "bg-white text-slate-900 border border-slate-200 rounded-ts-xs"
                          )}
                        >
                          {isImg ? (
                            <div className="relative group">
                              <img
                                src={msg.content}
                                alt="صورة مرفقة"
                                onClick={() => setLightboxImageUrl(msg.content)}
                                className="max-w-[220px] sm:max-w-xs max-h-60 rounded-xl cursor-pointer hover:opacity-90 transition-all object-cover border border-slate-200 shadow-xs"
                              />
                            </div>
                          ) : (
                            <p dir="auto" className="break-words">{msg.content}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">{formatTime(msg.createdAt)}</span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                {selectedConv.blockedAt ? (
                  <p className="text-center text-xs text-slate-600 font-bold py-2">
                    المحادثة محظورة حالياً. يرجى التواصل عبر الواتساب{" "}
                    <a
                      href={WHATSAPP_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-blue-600 hover:text-blue-800 font-black cursor-pointer"
                    >
                      اضغط هنا
                    </a>{" "}
                    أو رفع الحظر لمواصلة الشات.
                  </p>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                      accept="image/*"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage || isSending}
                      className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 disabled:opacity-40 transition-all shrink-0 cursor-pointer"
                      title="رفع صورة"
                    >
                      {isUploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                    </button>

                    <input
                      type="text"
                      value={inputText}
                      onChange={handleInputChange}
                      placeholder="أكتب ردك للعميل هنا..."
                      disabled={isSending}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-all"
                    />

                    <AdminChatSendButton
                      disabled={!inputText.trim() || isSending}
                      isSending={isSending}
                    />
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center text-slate-400 bg-slate-50/50 p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Headphones size={28} />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">حدد محادثة لبدء المتابعة والرد</h3>
              <p className="text-xs text-slate-500 max-w-sm">اختر إحدى محادثات العملاء من القائمة الجانبية لعرض التارخ المتبادل والرد الفوري.</p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: BLOCKED CONVERSATIONS MANAGEMENT VIEW ────────────────────── */}
      {activeTab === "blocked" && (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <BlockedConversationFilters
            searchTerm={blockedSearchTerm}
            onSearchChange={setBlockedSearchTerm}
            selectedReason={selectedReasonFilter}
            onReasonChange={setSelectedReasonFilter}
            onReset={() => {
              setBlockedSearchTerm("");
              setSelectedReasonFilter("");
            }}
          />

          <div className="flex-1 overflow-y-auto">
            <BlockedConversationsTable
              conversations={filteredBlockedConversations}
              isLoading={isBlockedLoading}
              onInspect={(conv) => setInspectConv(conv)}
              onCopyPhone={(phone) => {
                navigator.clipboard.writeText(phone);
                toast({ type: "success", description: "تم نسخ رقم الهاتف بنجاح" });
              }}
              onUnblock={(conv) => setConfirmUnblockConv(conv)}
            />
          </div>
        </div>
      )}

      {/* Categorized Block Reason Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <Ban size={22} />
              <h3 className="font-bold text-base text-slate-900">تأكيد حظر المحادثة</h3>
            </div>
            <p className="text-xs text-slate-500">
              اختر السبب النمطي للحظر لتسجيله في Audit Log وتطبيق التقييد.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">سبب الحظر الرئيسي (Category)</label>
              <select
                value={blockReasonEnum}
                onChange={(e) => setBlockReasonEnum(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500"
              >
                {Object.entries(BLOCK_REASON_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظة إضافية للأدمن (إختياري)</label>
              <textarea
                value={blockReasonNote}
                onChange={(e) => setBlockReasonNote(e.target.value)}
                placeholder="تفاصيل الملاحظة الإدارية..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 h-20 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowBlockModal(null);
                  setBlockReasonNote("");
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 font-bold hover:bg-slate-50 transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmBlock}
                disabled={blockMutation.isPending}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-40 transition-all cursor-pointer shadow-md"
              >
                {blockMutation.isPending ? "جارٍ الحظر..." : "تأكيد الحظر التسجيلي"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Unblock Modal */}
      {confirmUnblockConv && (
        <ConfirmUnblockModal
          clientName={confirmUnblockConv.clientUser?.name || "العميل"}
          onConfirm={() => handleConfirmUnblockAction(confirmUnblockConv.id)}
          onCancel={() => setConfirmUnblockConv(null)}
          isPending={unblockMutation.isPending}
        />
      )}

      {/* Inspection Drawer */}
      {inspectConv && (
        <BlockedConversationDrawer
          conversation={inspectConv}
          onClose={() => setInspectConv(null)}
          onUnblock={() => setConfirmUnblockConv(inspectConv)}
          isUnblocking={unblockMutation.isPending}
        />
      )}

      {/* Lightbox Modal */}
      {lightboxImageUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setLightboxImageUrl(null)}
            className="absolute top-6 end-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            <X size={24} />
          </button>
          <img src={lightboxImageUrl} alt="معاينة الصورة المكبرة" className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl" />
        </div>
      )}
    </div>
  );
}
