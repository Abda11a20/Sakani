// apps/frontend/src/app/[locale]/admin/chat/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import {
  MessageCircle,
  Loader2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Calendar,
  CheckCheck,
  AtSign,
  RefreshCcw,
  ShieldAlert,
  Unlock,
  Ban,
} from "lucide-react";
import { useAdminSupport, useBlockConversation, useUnblockConversation } from "@/hooks/useAdmin";
import ChatWidget from "@/components/chat/ChatWidget";
import { cn } from "@/lib/utils";

export default function AdminChatPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useAdminSupport(page, 50);
  
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [showBlockModal, setShowBlockModal] = useState<string | null>(null); // conversationId to block
  const [blockReason, setBlockReason] = useState("");

  const blockMutation = useBlockConversation();
  const unblockMutation = useUnblockConversation();

  const conversations = data?.conversations ?? [];
  const meta = data?.meta;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" }) +
    " - " + new Date(d).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });

  // Open ChatWidget automatically if a conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      setTimeout(() => {
        const toggleBtn = document.getElementById("chat-widget-toggle");
        if (toggleBtn) {
          const isClosed = toggleBtn.querySelector(".lucide-message-circle");
          if (isClosed) {
            toggleBtn.click();
          }
        }
      }, 100);
    }
  }, [selectedConversation]);

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showBlockModal) return;
    try {
      await blockMutation.mutateAsync({
        conversationId: showBlockModal,
        reason: blockReason.trim(),
      });
      
      // Update local state if the selected conversation is blocked
      if (selectedConversation?.id === showBlockModal) {
        setSelectedConversation((prev: any) => ({
          ...prev,
          blockedAt: new Date().toISOString(),
          blockReason: blockReason.trim(),
        }));
      }

      setShowBlockModal(null);
      setBlockReason("");
      refetch();
    } catch {
      // fail silently
    }
  };

  const handleUnblock = async (convId: string) => {
    try {
      await unblockMutation.mutateAsync(convId);

      // Update local state if selected conversation is unblocked
      if (selectedConversation?.id === convId) {
        setSelectedConversation((prev: any) => ({
          ...prev,
          blockedAt: null,
          blockReason: null,
        }));
      }

      refetch();
    } catch {
      // fail silently
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
            <MessageCircle className="text-amber-500" /> رسائل الدعم الفني
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-cairo">
            إدارة الرسائل الواردة من المستخدمين والمستأجرين وتعديل صلاحيات التواصل
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium font-cairo bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} /> تحديث
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-amber-500" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 font-cairo text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>فشل في تحميل الرسائل</span>
        </div>
      )}

      {!isLoading && !error && conversations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
            <CheckCheck size={28} className="text-slate-400" />
          </div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white font-cairo">
            لا توجد رسائل دعم جديدة
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo mt-1">
            صندوق الوارد فارغ حالياً
          </p>
        </div>
      )}

      {!isLoading && !error && conversations.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {conversations.map((conv) => {
              const isConvBlocked = !!conv.blockedAt;
              const hasUnread = conv.unreadCount > 0;
              const client = conv.clientUser;

              return (
                <div
                  key={conv.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer",
                    selectedConversation?.id === conv.id ? "bg-amber-50/50 dark:bg-amber-900/10" : ""
                  )}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm font-cairo">
                        {client?.name?.charAt(0) || "U"}
                      </div>
                      {hasUnread && (
                        <span className="absolute -top-1 -end-1 w-4 h-4 bg-amber-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center animate-pulse">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-900 dark:text-white font-cairo flex items-center gap-1.5">
                          {client?.name || "مستخدم غير معروف"}
                          {isConvBlocked && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 flex items-center gap-0.5">
                              <ShieldAlert size={10} /> محظور
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 font-cairo">
                          <Calendar size={12} />
                          {formatDate(conv.updatedAt)}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo flex items-center gap-1">
                        <AtSign size={12} /> الدور: {client?.role === 'tenant' ? 'مستأجر' : client?.role === 'landlord' ? 'مُعلِن' : client?.role || "مستخدم"}
                      </p>
                      
                      {conv.lastMessage ? (
                        <div className={cn(
                          "text-sm font-cairo line-clamp-1 mt-1 p-2 rounded-lg border",
                          hasUnread ? "bg-amber-50 border-amber-100 text-slate-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-slate-200 font-semibold" 
                          : "bg-slate-50 border-slate-100 text-slate-600 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400"
                        )}>
                          {conv.lastMessage.sender.name}: {conv.lastMessage.content}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic mt-1 font-cairo">
                          لا توجد رسائل بعد
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Block Moderation actions */}
                  <div className="flex items-center justify-end gap-2 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                    {isConvBlocked ? (
                      <button
                        onClick={() => handleUnblock(conv.id)}
                        disabled={unblockMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-cairo text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/30 transition-colors"
                      >
                        <Unlock size={14} /> إلغاء الحظر
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowBlockModal(conv.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-cairo text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/30 transition-colors"
                      >
                        <Ban size={14} /> حظر المحادثة
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.lastPage > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 disabled:opacity-40 transition-all"
          >
            {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <span className="text-sm font-cairo font-bold text-slate-600 dark:text-slate-300">
            {page} / {meta.lastPage}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
            disabled={page === meta.lastPage}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 disabled:opacity-40 transition-all"
          >
            {isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      )}

      {/* Block Dialog Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
                <ShieldAlert className="text-red-500" /> حظر محادثة الدعم
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-cairo">
                سيؤدي هذا إلى منع العميل من إرسال رسائل جديدة في محادثة الدعم الفني هذه.
              </p>
            </div>
            
            <form onSubmit={handleBlockSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-cairo">
                  سبب الحظر
                </label>
                <textarea
                  required
                  rows={3}
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="مثال: إساءة استخدام الخدمة أو تكرار إرسال الرسائل..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-cairo placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowBlockModal(null);
                    setBlockReason("");
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium font-cairo bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={blockMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold font-cairo text-white bg-red-500 hover:bg-red-600 disabled:bg-slate-300 transition-colors shadow-sm"
                >
                  {blockMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : "حظر الآن"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Render ChatWidget for selected conversation */}
      {selectedConversation && (
        <ChatWidget 
          conversationId={selectedConversation.id} 
          title={`محادثة مع ${selectedConversation.clientUser?.name || "مستخدم"}`} 
        />
      )}
    </div>
  );
}
