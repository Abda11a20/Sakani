// apps/frontend/src/components/admin/chat/BlockedConversationActions.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Eye, Copy, Unlock, Check } from "lucide-react";

interface BlockedConversationActionsProps {
  onInspect: () => void;
  onCopyPhone: () => void;
  onUnblock: () => void;
  isUnblocking?: boolean;
}

export const BlockedConversationActions: React.FC<BlockedConversationActionsProps> = ({
  onInspect,
  onCopyPhone,
  onUnblock,
  isUnblocking,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = () => {
    onCopyPhone();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setIsOpen(false);
  };

  return (
    <div className="relative font-cairo" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all cursor-pointer"
        title="خيارات الإجراءات"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className="absolute end-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 divide-y divide-slate-100 font-semibold text-xs text-slate-700">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onInspect();
            }}
            className="w-full px-3 py-2 text-start hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Eye size={14} className="text-blue-500" />
            <span>عرض التفاصيل</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full px-3 py-2 text-start hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-all cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} className="text-slate-400" />}
            <span>{copied ? "تم النسخ!" : "نسخ رقم الهاتف"}</span>
          </button>

          <button
            type="button"
            disabled={isUnblocking}
            onClick={() => {
              setIsOpen(false);
              onUnblock();
            }}
            className="w-full px-3 py-2 text-start hover:bg-emerald-50 hover:text-emerald-700 text-emerald-600 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-40"
          >
            <Unlock size={14} />
            <span>رفع الحظر</span>
          </button>
        </div>
      )}
    </div>
  );
};
