// apps/frontend/src/app/[locale]/admin/banned/page.tsx
"use client";

import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ShieldBan, Plus, Trash2, ChevronLeft, ChevronRight,
  AlertCircle, Loader2, Phone, Calendar, X, Search
} from "lucide-react";
import { useBannedUsers, useBanUser, useUnbanUser } from "@/hooks/useAdmin";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/features/auth";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export default function AdminBannedPage() {
  const locale = useLocale();
  const tBanned = useTranslations("admin.banned");
  const isRtl = locale === "ar";
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isSuperAdmin = mounted && user?.role === "super_admin";

  const [page, setPage] = useState(1);
  const [showBanForm, setShowBanForm] = useState(false);
  const [banForm, setBanForm] = useState({
    phone: "",
    nationalIdHash: "",
    reason: "",
  });
  
  const [unbanModal, setUnbanModal] = useState<string | null>(null);
  const [selectedBanDetail, setSelectedBanDetail] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, error } = useBannedUsers(page, 10, debouncedSearch);
  const banMutation = useBanUser();
  const unbanMutation = useUnbanUser();

  const banned = data?.banned ?? [];
  const meta = data?.meta;

  const groupBannedByDate = (entries: any[]) => {
    const groups: { [key: string]: any[] } = {};
    entries.forEach((entry) => {
      const dateStr = new Date(entry.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(entry);
    });
    return groups;
  };

  const handleBan = async () => {
    if (!banForm.phone.trim()) {
      toast({ type: "warning", description: "يجب إدخال رقم الهاتف لحظر المستخدم" });
      return;
    }
    try {
      await banMutation.mutateAsync({
        phone: banForm.phone.trim(),
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-text font-cairo">
            {tBanned("title")}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5 font-cairo">
            {tBanned("subtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowBanForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold font-cairo bg-status-danger hover:opacity-90 text-white transition-all shadow-xs cursor-pointer"
        >
          <Plus size={16} />
          {tBanned("addBan")}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={tBanned("searchPlaceholder")}
          className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-border bg-surface text-sm text-text font-cairo placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-status-danger/30"
        />
        <div className={cn("absolute top-3.5 shrink-0", isRtl ? "left-3" : "right-3")}>
          <Search size={16} className="text-text-tertiary" />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-status-danger" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-status-danger/15 border border-status-danger/30 text-status-danger font-cairo text-sm font-bold">
          <AlertCircle size={18} className="shrink-0" />
          <span>{isRtl ? "فشل في تحميل قائمة الحظر" : "Failed to load banned list"}</span>
        </div>
      )}

      {/* Banned List */}
      {!isLoading && !error && (
        <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
          {banned.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-status-success/15 rounded-2xl flex items-center justify-center mb-4 border border-status-success/30">
                <ShieldBan size={28} className="text-status-success" />
              </div>
              <p className="text-text-secondary font-cairo font-semibold">
                {tBanned("emptyState")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {Object.entries(groupBannedByDate(banned)).map(([dateStr, entries]) => (
                <div key={dateStr} className="p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 font-cairo bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
                    <Calendar size={12} />
                    {dateStr}
                  </div>
                  <div className="space-y-2">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50/30 transition-all"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                            <ShieldBan size={18} className="text-red-500" />
                          </div>
                          <div className="space-y-1 min-w-0">
                            {entry.phone && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  onClick={() => setSelectedBanDetail(entry)}
                                  className="text-sm font-semibold text-slate-800 font-mono flex items-center gap-1 hover:underline hover:text-red-500 cursor-pointer"
                                  title="عرض تفاصيل المحظور"
                                >
                                  <Phone size={13} className="text-slate-400 shrink-0" />
                                  {entry.phone}
                                </button>
                                {entry.user && (
                                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                                    {entry.user.name}
                                  </span>
                                )}
                              </div>
                            )}
                            {entry.reason && (
                              <p className="text-xs text-slate-500 font-cairo">
                                السبب: {entry.reason}
                              </p>
                            )}
                          </div>
                        </div>
                        {isSuperAdmin && (
                          <button
                            onClick={() => setUnbanModal(entry.id)}
                            disabled={unbanMutation.isPending}
                            className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-500 transition-all disabled:opacity-50 shrink-0"
                            title="رفع الحظر"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
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
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-40 transition-all"
          >
            {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <span className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium font-cairo text-slate-700">
            {page} / {meta.lastPage}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
            disabled={page === meta.lastPage}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-40 transition-all"
          >
            {isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      )}

      {/* Ban Form Modal */}
      {showBanForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-cairo">
              إضافة مستخدم للحظر
            </h3>
            <p className="text-xs text-slate-500 font-cairo">
              أدخل رقم الهاتف لحظر المستخدم بشكل استباقي أو دائم
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 font-cairo mb-1.5">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={banForm.phone}
                  onChange={(e) => setBanForm({ ...banForm, phone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 font-cairo placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 font-cairo mb-1.5">
                  سبب الحظر (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={banForm.reason}
                  onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                  placeholder="سبب الحظر..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 font-cairo placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
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
                className="flex-1 py-2.5 rounded-xl text-sm font-medium font-cairo bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-cairo flex items-center gap-2">
              <ShieldBan size={20} className="text-emerald-500" /> تأكيد رفع الحظر
            </h3>
            <p className="text-sm text-slate-600 font-cairo leading-relaxed">
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
                className="flex-1 py-2.5 rounded-xl text-sm font-bold font-cairo bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Details Modal */}
      {selectedBanDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 p-6 space-y-5 relative">
            <button
              onClick={() => setSelectedBanDetail(null)}
              className="absolute top-4 left-4 p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <ShieldBan size={22} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-cairo">
                  تفاصيل سجل الحظر
                </h3>
                <p className="text-xs text-slate-500 font-cairo mt-0.5">
                  معلومات كاملة عن الحساب المحظور
                </p>
              </div>
            </div>

            <div className="space-y-4 font-cairo text-sm">
              {/* Ban Info */}
              <div className="bg-red-50/50 border border-red-100/50 rounded-xl p-4 space-y-2.5">
                <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider">
                  معلومات الحظر
                </h4>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <span className="text-slate-500">تاريخ الحظر:</span>
                  <span className="text-slate-800 font-medium">
                    {formatDate(selectedBanDetail.createdAt)}
                  </span>

                  <span className="text-slate-500">سبب الحظر:</span>
                  <span className="text-slate-800 font-medium">
                    {selectedBanDetail.reason || "غير محدد"}
                  </span>
                </div>
              </div>

              {/* Account Owner Info */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  بيانات صاحب الحساب
                </h4>
                {selectedBanDetail.user ? (
                  <div className="grid grid-cols-2 gap-y-2 text-xs text-right" dir="rtl">
                    <span className="text-slate-500">الاسم الكامل:</span>
                    <span className="text-slate-800 font-semibold">
                      {selectedBanDetail.user.name}
                    </span>

                    <span className="text-slate-500">رقم الهاتف:</span>
                    <span className="text-slate-800 font-mono font-medium">
                      {selectedBanDetail.phone}
                    </span>

                    <span className="text-slate-500">البريد الإلكتروني:</span>
                    <span className="text-slate-800 font-mono">
                      {selectedBanDetail.user.email}
                    </span>

                    <span className="text-slate-500">نوع الحساب:</span>
                    <span className="text-slate-800 font-medium">
                      {selectedBanDetail.user.role === "tenant"
                        ? "مستأجر"
                        : selectedBanDetail.user.role === "landlord"
                        ? "مالك"
                        : selectedBanDetail.user.role === "admin"
                        ? "مدير"
                        : selectedBanDetail.user.role === "super_admin"
                        ? "مدير خارق"
                        : selectedBanDetail.user.role}
                    </span>

                    <span className="text-slate-500">نوع الاشتراك:</span>
                    <span className="text-slate-800">
                      {selectedBanDetail.user.plan === "premium" ? "مميز (Premium)" : "مجاني"}
                    </span>

                    <span className="text-slate-500">توثيق الهوية:</span>
                    <span className="text-slate-800 font-medium">
                      {selectedBanDetail.user.identityStatus === "VERIFIED"
                        ? "مؤكد وموثق"
                        : selectedBanDetail.user.identityStatus === "PENDING"
                        ? "قيد المراجعة"
                        : "غير موثق"}
                    </span>

                    <span className="text-slate-500">تاريخ التسجيل:</span>
                    <span className="text-slate-800">
                      {formatDate(selectedBanDetail.user.createdAt)}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-cairo leading-relaxed">
                    لا يوجد حساب مسجل حالياً بهذا الرقم. ربما تم حذف الحساب أو لم يقم بالاشتراك بعد، وتم إدراجه في القائمة كحظر استباقي لمنع تسجيله.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedBanDetail(null)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold font-cairo bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all text-center"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
