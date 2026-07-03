// apps/frontend/src/app/[locale]/admin/listings/page.tsx
"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import Image from "next/image";
import {
  Building2, Check, X, Trash2, ChevronLeft, ChevronRight,
  MapPin, Tag, Phone, AlertCircle, Loader2, Search, IdCard
} from "lucide-react";
import {
  useAdminListings,
  useReviewListing,
  useSoftDeleteListing,
  useIdCardUrl
} from "@/hooks/useAdmin";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

// IdCard Viewer Component to handle fetching the URL only when open
function IdCardViewer({ userId, onClose }: { userId: string, onClose: () => void }) {
  const { data, isLoading, error } = useIdCardUrl(userId, true);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
            <IdCard size={20} className="text-amber-500" /> بطاقة الهوية
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-auto flex items-center justify-center min-h-[300px] bg-slate-50 dark:bg-slate-900/50 relative">
          {isLoading ? (
            <div className="flex flex-col items-center text-amber-500 gap-3">
              <Loader2 size={32} className="animate-spin" />
              <p className="text-sm font-cairo font-medium text-slate-600">جاري جلب الرابط الآمن...</p>
            </div>
          ) : error || !data?.url ? (
            <div className="flex flex-col items-center text-red-500 gap-2">
              <AlertCircle size={32} />
              <p className="text-sm font-cairo text-slate-600">فشل في تحميل الصورة أو أنها غير متوفرة</p>
            </div>
          ) : (
            <div className="relative w-full h-[400px]">
              <Image src={data.url} alt="ID Card" fill className="object-contain" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminListingsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { toast } = useToast();
  
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState<string>("pending_review");
  const [rejectModal, setRejectModal] = useState<{ id: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ id: string; title: string } | null>(null);
  const [idCardViewer, setIdCardViewer] = useState<string | null>(null);

  const { data, isLoading, error } = useAdminListings(page, 10, statusTab);
  const reviewMutation = useReviewListing();
  const deleteMutation = useSoftDeleteListing();

  const handleApprove = async (id: string) => {
    try {
      await reviewMutation.mutateAsync({ id, payload: { status: "active" } });
      toast({ type: "success", title: "تمت الموافقة", description: "تمت الموافقة على الإعلان بنجاح" });
    } catch {
      toast({ type: "error", description: "فشل في الموافقة على الإعلان" });
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await reviewMutation.mutateAsync({
        id: rejectModal.id,
        payload: { status: "rejected", rejectionReason: rejectReason || undefined },
      });
      toast({ type: "success", title: "تم الرفض", description: "تم رفض الإعلان" });
      setRejectModal(null);
      setRejectReason("");
    } catch {
      toast({ type: "error", description: "فشل في رفض الإعلان" });
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteModal.id, reason: "حذف من قبل الأدمن" });
      toast({ type: "success", description: "تم نقل الإعلان إلى الأرشيف بنجاح" });
      setDeleteModal(null);
    } catch {
      toast({ type: "error", description: "فشل في نقل الإعلان إلى الأرشيف" });
    }
  };

  const listings = data?.listings ?? [];
  const meta = data?.meta;

  const tabs = [
    { id: "pending_review", label: "قيد المراجعة" },
    { id: "active", label: "النشطة" },
    { id: "rejected", label: "المرفوضة" },
    { id: "all", label: "الكل" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-cairo">
            إدارة الإعلانات
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-cairo">
            إدارة وتصفية جميع الإعلانات في المنصة
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setStatusTab(tab.id); setPage(1); }}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold font-cairo transition-all whitespace-nowrap",
              statusTab === tab.id
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-amber-500" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 font-cairo text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>فشل في تحميل الإعلانات</span>
        </div>
      )}

      {!isLoading && !error && listings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
            <Search size={28} className="text-slate-400" />
          </div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white font-cairo">
            لا توجد إعلانات مطابقة
          </p>
        </div>
      )}

      {/* Listings Cards */}
      <div className="space-y-4">
        {listings.map((listing) => {
          const firstImage = listing.images?.[0]?.url ?? listing.images?.[0] ?? null;
          const isProcessing = reviewMutation.isPending || deleteMutation.isPending;

          return (
            <div
              key={listing.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="w-full sm:w-44 h-40 sm:h-auto shrink-0 bg-slate-100 dark:bg-slate-800 relative">
                  {firstImage ? (
                    <Image
                      src={typeof firstImage === "string" ? firstImage : firstImage}
                      alt={listing.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 size={32} className="text-slate-300 dark:text-slate-600" />
                    </div>
                  )}
                  <div className="absolute top-2 start-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-lg text-xs font-bold font-cairo text-white shadow",
                      listing.status === "pending_review" ? "bg-amber-500" :
                      listing.status === "active" ? "bg-emerald-500" : "bg-red-500"
                    )}>
                      {listing.status === "pending_review" ? "قيد المراجعة" :
                       listing.status === "active" ? "نشط" :
                       listing.status === "rejected" ? "مرفوض" : "غير معروف"}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white font-cairo leading-snug">
                      {listing.title}
                    </h2>
                    <span className="shrink-0 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-400 font-cairo font-medium">
                      {listing.type === "apartment" ? "شقة" : "سرير"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400 font-cairo">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} /> {listing.address}، {listing.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag size={13} /> {listing.price.toLocaleString("ar-EG")} ج.م / شهر
                    </span>
                  </div>

                  {listing.landlord && (
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xs font-cairo shrink-0">
                          {listing.landlord.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-cairo">
                            {listing.landlord.name}
                          </p>
                          {listing.landlord.phone && (
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <Phone size={11} /> {listing.landlord.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setIdCardViewer(listing.landlord!.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-cairo font-semibold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors shadow-sm"
                      >
                        <IdCard size={14} /> عرض البطاقة
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {listing.status === "pending_review" && (
                      <>
                        <button
                          onClick={() => handleApprove(listing.id)}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium font-cairo bg-emerald-500 hover:bg-emerald-600 text-white transition-all disabled:opacity-60 shadow-sm"
                        >
                          <Check size={15} /> قبول
                        </button>
                        <button
                          onClick={() => setRejectModal({ id: listing.id, title: listing.title })}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium font-cairo bg-red-500 hover:bg-red-600 text-white transition-all disabled:opacity-60 shadow-sm"
                        >
                          <X size={15} /> رفض
                        </button>
                      </>
                    )}
                    {listing.status === "rejected" && (
                      <button
                        onClick={() => handleApprove(listing.id)}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium font-cairo bg-emerald-500 hover:bg-emerald-600 text-white transition-all disabled:opacity-60 shadow-sm"
                      >
                        <Check size={15} /> تفعيل (تراجع عن الرفض)
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteModal({ id: listing.id, title: listing.title })}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium font-cairo bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all disabled:opacity-60"
                      title={isRtl ? "حذف نهائي" : "Delete permanently"}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {meta && meta.lastPage > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <span className="text-sm font-cairo font-bold text-slate-600 dark:text-slate-300">
            {page} / {meta.lastPage}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
            disabled={page === meta.lastPage}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-cairo">
              رفض الإعلان
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo">
              {rejectModal.title}
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 font-cairo mb-1.5">
                سبب الرفض (اختياري)
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="أدخل سبب الرفض ليظهر للمُعلِن..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-cairo placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={reviewMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium font-cairo bg-red-500 hover:bg-red-600 text-white transition-all disabled:opacity-60"
              >
                {reviewMutation.isPending ? "جاري الرفض..." : "تأكيد الرفض"}
              </button>
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium font-cairo bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-lg font-bold text-red-600 font-cairo flex items-center gap-2">
              <AlertCircle size={20} /> حذف الإعلان نهائياً
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-cairo">
              هل أنت متأكد من حذف هذا الإعلان <b>{deleteModal.title}</b> نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium font-cairo bg-red-500 hover:bg-red-600 text-white transition-all disabled:opacity-60"
              >
                {deleteMutation.isPending ? "جاري الحذف..." : "تأكيد الحذف"}
              </button>
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium font-cairo bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ID Card Viewer */}
      {idCardViewer && (
        <IdCardViewer userId={idCardViewer} onClose={() => setIdCardViewer(null)} />
      )}
    </div>
  );
}
