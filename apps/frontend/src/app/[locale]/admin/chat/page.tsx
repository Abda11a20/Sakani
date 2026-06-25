// apps/frontend/src/app/[locale]/admin/chat/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useLocale } from "next-intl";
import {
  MessageCircle, Loader2, AlertCircle, ChevronRight, ChevronLeft,
  Calendar, CheckCheck, AtSign, RefreshCcw
} from "lucide-react";
import { useAdminSupport } from "@/hooks/useAdmin";
import ChatWidget from "@/components/chat/ChatWidget";
import { cn } from "@/lib/utils";

export default function AdminChatPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useAdminSupport(page, 50);
  
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);

  const messages = data?.messages ?? [];
  const meta = data?.meta;

  // Extract unique users from support inbox
  const uniqueConversations = useMemo(() => {
    const map = new Map<string, any>();
    messages.forEach(msg => {
      // The sender is the user who contacted support
      if (msg.sender && !map.has(msg.sender.id)) {
        map.set(msg.sender.id, msg);
      }
    });
    return Array.from(map.values());
  }, [messages]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" }) +
    " - " + new Date(d).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });

  // Open ChatWidget automatically if a user is selected
  useEffect(() => {
    if (selectedUser) {
      // Small trick: click the floating button if it exists to open it immediately
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
  }, [selectedUser]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
            <MessageCircle className="text-amber-500" /> رسائل الدعم الفني
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-cairo">
            إدارة الرسائل الواردة من المستخدمين والمستأجرين
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

      {!isLoading && !error && uniqueConversations.length === 0 && (
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

      {!isLoading && !error && uniqueConversations.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {uniqueConversations.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start justify-between gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer",
                  selectedUser?.id === msg.sender.id ? "bg-amber-50 dark:bg-amber-900/10" : ""
                )}
                onClick={() => setSelectedUser({ id: msg.sender.id, name: msg.sender.name })}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm font-cairo shrink-0">
                    {msg.sender.name?.charAt(0)}
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900 dark:text-white font-cairo">
                        {msg.sender.name}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 font-cairo">
                        <Calendar size={12} />
                        {formatDate(msg.createdAt)}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo flex items-center gap-1">
                      <AtSign size={12} /> الدور: {msg.sender.role === 'tenant' ? 'مستأجر' : msg.sender.role === 'landlord' ? 'مُعلِن' : msg.sender.role}
                    </p>
                    <div className={cn(
                      "text-sm font-cairo line-clamp-1 mt-1 p-2 rounded-lg border",
                      !msg.isRead ? "bg-amber-50 border-amber-100 text-slate-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-slate-200 font-semibold" 
                      : "bg-slate-50 border-slate-100 text-slate-600 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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

      {/* When admin selects a user, open a ChatWidget specifically for that user */}
      {selectedUser && (
        <ChatWidget 
          targetUserId={selectedUser.id} 
          title={`محادثة مع ${selectedUser.name}`} 
        />
      )}
    </div>
  );
}
