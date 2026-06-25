// apps/frontend/src/app/[locale]/admin/banned/page.tsx
"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import {
  ShieldBan, Plus, Trash2, ChevronLeft, ChevronRight,
  AlertCircle, Loader2, Phone, Hash, Calendar, X
} from "lucide-react";
import { useBannedUsers, useBanUser, useUnbanUser } from "@/hooks/useAdmin";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

export default function AdminBannedPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { toast } = useToast();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "super_admin";

  const [page, setPage] = useState(1);
  const [showBanForm, setShowBanForm] = useState(false);
  const [banForm, setBanForm] = useState({
    phone: "",
    nationalIdHash: "",
    reason: "",
  });
  
  const [unbanModal, setUnbanModal] = useState<string | null>(null);

  const { data, isLoading, error } = useBannedUsers(page, 10);
  const banMutation = useBanUser();
  const unbanMutation = useUnbanUser();

  const banned = data?.banned ?? [];
  const meta = data?.meta;

  const handleBan = async () => {
    if (!banForm.phone && !banForm.nationalIdHash) {
      toast({ type: "warning", description: "يجب إدخال رقم الهاتف أو هاش الهوية" });
      return;
    }
    try {
      await banMutation.mutateAsync({
        phone: banForm.phone || undefined,
        nationalIdHash: banForm.nationalIdHash || undefined,
        reason: banForm.reason || "تم حظر المستخدم",
      });
      toast({ type: "success", title: "تم الحظر", description: "تمت إضافة المستخدم لقائمة الحظر" });
      setBanForm({ phone: "", nationalIdHash: "", reason: "" });
      setShowBanForm(false);
    } catch {
      toast({ type: "error", description: "فشل في إضافة الحظر" });
    }
  };

  const handleUnban = async () => {
    if (!unbanModal) return;
    try {
      await unbanMutation.mutateAsync(unbanModal);
      toast({ type: "success", description: "تم رفع الحظر وإعادة تفعيل الحساب" });
      setUnbanModal(null);
    } catch {
      toast({ type: "error", description: "فشل في رفع الحظر. (مطلوب صلاحية super_admin)" });
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-cairo">
            قائمة الحظر
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-cairo">
            المستخدمون المحظورون من المنصة
          </p>
        </div>
        <button
          onClick={() => setShowBanForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium font-cairo bg-red-500 hover:bg-red-600 text-white transition-all shadow-sm"
        >
          <Plus size={16} />
          إضافة حظر
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-red-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 font-cairo text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>فشل في تحميل قائمة الحظر</span>
        </div>
      )}

      {/* Banned List */}
      {!isLoading && !error && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {banned.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mb-4">
                <ShieldBan size={28} className="text-emerald-500" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-cairo">
                لا يوجد مستخدمون محظورون حالياً
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {banned.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                      <ShieldBan size={18} className="text-red-500" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      {entry.phone && (
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 font-cairo flex items-center gap-1">
                          <Phone size={13} className="text-slate-400 shrink-0" />
                          {entry.phone}
                        </p>
                      )}
                      {entry.nationalIdHash && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 truncate">
                          <Hash size={12} className="shrink-0" />
                          {entry.nationalIdHash.slice(0, 20)}…
                        </p>
                      )}
                      {entry.reason && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo">
                          السبب: {entry.reason}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 flex items-center gap-1 font-cairo">
                        <Calendar size={12} />
                        {formatDate(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                  {isSuperAdmin && (
                    <button
                      onClick={() => setUnbanModal(entry.id)}
                      disabled={unbanMutation.isPending}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-900/20 transition-all disabled:opacity-50 shrink-0"
                      title="رفع الحظر"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.lastPage > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 transition-all"
          >
            {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <span className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium font-cairo text-slate-700 dark:text-slate-300">
            {page} / {meta.lastPage}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
            disabled={page === meta.lastPage}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 transition-all"
          >
            {isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      )}

      {/* Ban Form Modal */}
      {showBanForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-cairo">
              إضافة مستخدم للحظر
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo">
              يجب توفير رقم الهاتف أو هاش الهوية على الأقل
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 font-cairo mb-1.5">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={banForm.phone}
                  onChange={(e) => setBanForm({ ...banForm, phone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-cairo placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 font-cairo mb-1.5">
                  هاش الهوية الوطنية
                </label>
                <input
                  type="text"
                  value={banForm.nationalIdHash}
                  onChange={(e) => setBanForm({ ...banForm, nationalIdHash: e.target.value })}
                  placeholder="SHA256 hash..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 font-cairo mb-1.5">
                  سبب الحظر (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={banForm.reason}
                  onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                  placeholder="سبب الحظر..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-cairo placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleBan}
                disabled={banMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium font-cairo bg-red-500 hover:bg-red-600 text-white transition-all disabled:opacity-60"
              >
                {banMutation.isPending ? "جاري الحظر..." : "تأكيد الحظر"}
              </button>
              <button
                onClick={() => { setShowBanForm(false); setBanForm({ phone: "", nationalIdHash: "", reason: "" }); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium font-cairo bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unban Confirm Modal */}
      {unbanModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
              <ShieldBan size={20} className="text-emerald-500" /> تأكيد رفع الحظر
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-cairo leading-relaxed">
              هل أنت متأكد من رغبتك في رفع الحظر عن هذا المستخدم؟
              هذا الإجراء سيسمح له بالعودة لاستخدام المنصة بشكل طبيعي.
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleUnban}
                disabled={unbanMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold font-cairo bg-emerald-500 hover:bg-emerald-600 text-white transition-all disabled:opacity-60 shadow-sm"
              >
                {unbanMutation.isPending ? "جاري المعالجة..." : "نعم، رفع الحظر"}
              </button>
              <button
                onClick={() => setUnbanModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold font-cairo bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
