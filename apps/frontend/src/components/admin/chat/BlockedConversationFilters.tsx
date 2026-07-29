// apps/frontend/src/components/admin/chat/BlockedConversationFilters.tsx
"use client";

import React from "react";
import { Search, Filter, X } from "lucide-react";

export const BLOCK_REASON_LABELS: Record<string, string> = {
  SPAM: "إرسال رسائل مزعجة (Spam)",
  ABUSE: "إساءة أو ألفاظ غير لائقة",
  THREATS: "تهديد أو إزعاج",
  EXTERNAL_LINKS: "إرسال روابط خارجية غير مصرح بها",
  INAPPROPRIATE_CONTENT: "محتوى غير لائق",
  MANUAL: "حظر إداري يدوي",
};

interface BlockedConversationFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedReason: string;
  onReasonChange: (value: string) => void;
  onReset: () => void;
}

export const BlockedConversationFilters: React.FC<BlockedConversationFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedReason,
  onReasonChange,
  onReset,
}) => {
  const hasActiveFilters = Boolean(searchTerm || selectedReason);

  return (
    <div className="bg-slate-50 border-b border-slate-200 p-4 font-cairo flex flex-col sm:flex-row items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <Search size={15} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="بحث باسم العميل أو رقم الهاتف..."
          className="w-full ps-9 pe-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-all"
        />
      </div>

      {/* Reason Filter Dropdown */}
      <div className="relative w-full sm:w-64">
        <Filter size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <select
          value={selectedReason}
          onChange={(e) => onReasonChange(e.target.value)}
          className="w-full ps-9 pe-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
        >
          <option value="">جميع أسباب الحظر</option>
          {Object.entries(BLOCK_REASON_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Reset Filter Button */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <X size={14} />
          <span>إعادة ضبط</span>
        </button>
      )}
    </div>
  );
};
