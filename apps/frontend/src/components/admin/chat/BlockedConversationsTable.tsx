// apps/frontend/src/components/admin/chat/BlockedConversationsTable.tsx
"use client";

import React from "react";
import { User as UserIcon, Ban, ShieldAlert } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { BlockedConversationActions } from "./BlockedConversationActions";
import { BLOCK_REASON_LABELS } from "./BlockedConversationFilters";

interface BlockedConversationsTableProps {
  conversations: any[];
  isLoading?: boolean;
  onInspect: (conv: any) => void;
  onCopyPhone: (phone: string) => void;
  onUnblock: (conv: any) => void;
}

export const BlockedConversationsTable: React.FC<BlockedConversationsTableProps> = ({
  conversations,
  isLoading,
  onInspect,
  onCopyPhone,
  onUnblock,
}) => {
  const formatDateShort = (d?: string) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("ar-EG", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 font-cairo flex flex-col items-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mb-3" />
        <span className="text-xs font-bold">جارٍ تحميل قائمة المحظورين...</span>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 font-cairo flex flex-col items-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
          <Ban size={24} />
        </div>
        <h4 className="font-bold text-sm text-slate-800">لا توجد محادثات محظورة مطابقة</h4>
        <p className="text-xs max-w-sm">جميع المحادثات تعمل بشكل طبيعي أو لا يوجد حسابات تنطبق عليها فلاتر البحث.</p>
      </div>
    );
  }

  return (
    <div className="font-cairo w-full overflow-hidden">
      {/* 1. Desktop HTML Table (md screens and above) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-3 px-4 text-start">العميل المحظور</th>
              <th className="py-3 px-4 text-start">رقم الهاتف</th>
              <th className="py-3 px-4 text-start">سبب الحظر</th>
              <th className="py-3 px-4 text-start">تم الحظر بواسطة</th>
              <th className="py-3 px-4 text-start">تاريخ الحظر</th>
              <th className="py-3 px-4 text-center">عدد المرات</th>
              <th className="py-3 px-4 text-end">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 font-medium bg-white">
            {conversations.map((conv) => {
              const client = conv.clientUser;
              const admin = conv.blockedByUser;

              const rawReason = conv.blockReason || "";
              let reasonCode = rawReason;
              let reasonNote = "";
              if (rawReason.includes(": ")) {
                const parts = rawReason.split(": ");
                reasonCode = parts[0];
                reasonNote = parts.slice(1).join(": ");
              }
              const reasonLabel = BLOCK_REASON_LABELS[reasonCode] || rawReason || "حظر يدوي";

              return (
                <tr key={conv.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Client Info */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={client?.avatarUrl} name={client?.name || ""} size="sm" />
                      <span className="font-bold text-slate-900 truncate max-w-[150px]">
                        {client?.name || "عميل غير معروف"}
                      </span>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="py-3 px-4 dir-ltr text-start font-semibold text-slate-600">
                    {client?.phone || "-"}
                  </td>

                  {/* Reason */}
                  <td className="py-3 px-4">
                    <span title={reasonNote || reasonLabel} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-status-danger/15 border border-status-danger/30 text-status-danger font-bold text-[11px]">
                      <ShieldAlert size={12} />
                      <span className="truncate max-w-[140px]">{reasonLabel}</span>
                    </span>
                  </td>

                  {/* Blocked By */}
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {admin?.name || "الأدمن المسؤول"}
                  </td>

                  {/* Block Date */}
                  <td className="py-3 px-4 text-slate-500 dir-ltr text-start">
                    {formatDateShort(conv.blockedAt)}
                  </td>

                  {/* Block Frequency Count */}
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                      {conv.blockCount ?? 1}
                    </span>
                  </td>

                  {/* Actions Dropdown */}
                  <td className="py-3 px-4 text-end">
                    <BlockedConversationActions
                      onInspect={() => onInspect(conv)}
                      onCopyPhone={() => client?.phone && onCopyPhone(client.phone)}
                      onUnblock={() => onUnblock(conv)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. Mobile Responsive Cards View (< md screens) */}
      <div className="block md:hidden p-4 space-y-3">
        {conversations.map((conv) => {
          const client = conv.clientUser;
          const admin = conv.blockedByUser;

          const rawReason = conv.blockReason || "";
          let reasonCode = rawReason;
          if (rawReason.includes(": ")) {
            reasonCode = rawReason.split(": ")[0];
          }
          const reasonLabel = BLOCK_REASON_LABELS[reasonCode] || rawReason || "حظر يدوي";

          return (
            <div key={conv.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar src={client?.avatarUrl} name={client?.name || ""} size="md" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{client?.name || "عميل غير معروف"}</h4>
                    <span className="text-[11px] font-semibold text-slate-500 dir-ltr">{client?.phone || "-"}</span>
                  </div>
                </div>

                <BlockedConversationActions
                  onInspect={() => onInspect(conv)}
                  onCopyPhone={() => client?.phone && onCopyPhone(client.phone)}
                  onUnblock={() => onUnblock(conv)}
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 font-bold">
                  <ShieldAlert size={11} />
                  <span>{reasonLabel}</span>
                </span>

                <span className="text-slate-500 font-medium">بواسطة: {admin?.name || "الأدمن"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
