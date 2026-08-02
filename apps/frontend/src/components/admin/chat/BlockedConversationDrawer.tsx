// apps/frontend/src/components/admin/chat/BlockedConversationDrawer.tsx
"use client";

import React from "react";
import { X, ShieldAlert, History, MessageSquare, Unlock, Copy, Check } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { BLOCK_REASON_LABELS } from "./BlockedConversationFilters";

interface BlockedConversationDrawerProps {
  conversation: any | null;
  onClose: () => void;
  onUnblock: () => void;
  isUnblocking?: boolean;
}

export const BlockedConversationDrawer: React.FC<BlockedConversationDrawerProps> = ({
  conversation,
  onClose,
  onUnblock,
  isUnblocking,
}) => {
  const [copied, setCopied] = React.useState(false);
  if (!conversation) return null;

  const client = conversation.clientUser;
  const admin = conversation.blockedByUser;

  const formatDate = (d?: string) => {
    if (!d) return "غير محدد";
    return new Date(d).toLocaleDateString("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCopyPhone = () => {
    if (client?.phone) {
      navigator.clipboard.writeText(client.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Parse reason code and note
  const rawReason = conversation.blockReason || "";
  let reasonCode = rawReason;
  let reasonNote = "";
  if (rawReason.includes(": ")) {
    const parts = rawReason.split(": ");
    reasonCode = parts[0];
    reasonNote = parts.slice(1).join(": ");
  }

  const reasonLabel = BLOCK_REASON_LABELS[reasonCode] || rawReason || "حظر إداري يدوي";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end font-cairo">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">تفاصيل سجل الحظر</h3>
              <p className="text-[11px] text-slate-400">معلومات التقييد والـ Audit Log</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Client Identity Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
            <Avatar src={client?.avatarUrl} name={client?.name || ""} size="lg" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 truncate mb-1">
                {client?.name || "عميل غير معروف"}
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 dir-ltr">{client?.phone || "لا يوجد رقم"}</span>
                {client?.phone && (
                  <button
                    onClick={handleCopyPhone}
                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                    title="نسخ رقم الهاتف"
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Block Reason & Admin Details */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-600" />
              <span>سبب الحظر الإداري</span>
            </h5>
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="font-bold text-rose-900">{reasonLabel}</div>
              {reasonNote && <p className="text-rose-700 text-[11px] leading-relaxed bg-white/80 p-2.5 rounded-xl border border-rose-100">{reasonNote}</p>}
            </div>
          </div>

          {/* Audit Trail Details */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <History size={16} className="text-blue-600" />
              <span>سجل الحظر والإدارة</span>
            </h5>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                <span className="text-slate-500 font-medium">تم الحظر بواسطة:</span>
                <span className="font-bold text-slate-900">{admin?.name || "الأدمن المسؤول"}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                <span className="text-slate-500 font-medium">تاريخ الحظر:</span>
                <span className="font-semibold text-slate-800 dir-ltr">{formatDate(conversation.blockedAt)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">عدد مرات الحظر التاريخية:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[11px]">
                  {conversation.blockCount ?? 1} مرات
                </span>
              </div>
            </div>
          </div>

          {/* Last Message Snippet */}
          {conversation.lastMessage && (
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <MessageSquare size={16} className="text-slate-500" />
                <span>معاينة آخر رسالة</span>
              </h5>
              <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-700 leading-relaxed font-medium">
                &quot;{conversation.lastMessage.content}&quot;
              </div>
            </div>
          )}
        </div>

        {/* Footer Action Button */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <button
            onClick={() => {
              onClose();
              onUnblock();
            }}
            disabled={isUnblocking}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Unlock size={16} />
            <span>رفع الحظر عن العميل الآن</span>
          </button>
        </div>
      </div>
    </div>
  );
};
