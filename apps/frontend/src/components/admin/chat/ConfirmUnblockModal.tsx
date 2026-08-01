// apps/frontend/src/components/admin/chat/ConfirmUnblockModal.tsx
"use client";

import React from "react";
import { Unlock, X, Loader2 } from "lucide-react";

interface ConfirmUnblockModalProps {
  clientName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export const ConfirmUnblockModal: React.FC<ConfirmUnblockModalProps> = ({
  clientName,
  onConfirm,
  onCancel,
  isPending,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-cairo">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-emerald-600">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Unlock size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">تأكيد رفع الحظر</h3>
              <p className="text-xs text-slate-500">إعادة تفعيل مراسلات الشات للعميل</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-1.5 leading-relaxed">
          <p className="font-bold text-slate-900">
            هل أنت تأكد من رفع الحظر عن العميل <span className="text-primary">&quot;{clientName}&quot;</span>؟
          </p>
          <p className="text-slate-500 text-[11px]">
            سيتم السماح للعميل والأدمن بإرسال رسائل جديدة فوراً. لن يتم حذف سجل الحظر السابق من الـ Audit Log.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            <span>تأكيد رفع الحظر</span>
          </button>
        </div>
      </div>
    </div>
  );
};
