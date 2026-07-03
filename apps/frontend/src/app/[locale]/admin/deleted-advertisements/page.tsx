// apps/frontend/src/app/[locale]/admin/deleted-advertisements/page.tsx
"use client";

import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Archive,
  Search,
  RefreshCw,
  RotateCcw,
  Trash2,
  ImageOff,
  AlertTriangle,
  Building2,
  Calendar,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
  X,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  useDeletedAdminListings,
  useRestoreListing,
  useDeleteListingImages,
  useAdminPermanentDeleteListing,
} from "@/hooks/useAdmin";
import type { Listing } from "@/types";
import { Spinner } from "@/components/ui/spinner";

// ── Types ────────────────────────────────────────────────────────────────────

type DeletedListing = Listing & {
  landlord?: { id: string; name: string; phone?: string; avatarUrl?: string | null; emailVerifiedAt?: string | null };
  images?: Array<{ id: string; url: string; order: number }>;
  _count?: { images: number };
};

type TimeRange = "all" | "today" | "week" | "month";
type DeletedByFilter = "all" | "admin" | "landlord";

// ── Confirm Dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full mx-4 font-cairo">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
          confirmVariant === "danger" ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"
        )}>
          <AlertTriangle size={22} className={confirmVariant === "danger" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{description}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
              confirmVariant === "danger"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-amber-600 hover:bg-amber-700 text-white"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Listing Row ───────────────────────────────────────────────────────────────

function ListingRow({
  listing,
  locale,
  onRestore,
  onDeleteImages,
  onPermanentDelete,
}: {
  listing: DeletedListing;
  locale: string;
  onRestore: (id: string) => void;
  onDeleteImages: (id: string, count: number) => void;
  onPermanentDelete: (id: string, title: string) => void;
}) {
  const isRtl = locale === "ar";
  const dateLocale = isRtl ? ar : enUS;
  const thumbnail = listing.images?.[0]?.url;
  const imageCount = listing._count?.images ?? listing.images?.length ?? 0;
  const deletedAt = listing.deletedAt ? new Date(listing.deletedAt) : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="w-full sm:w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
        {thumbnail ? (
          <img src={thumbnail} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 size={28} className="text-slate-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-white font-cairo text-sm line-clamp-1">{listing.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo mt-0.5">
              {listing.governorate} · {listing.district}
            </p>
          </div>
          {/* Deleted By Badge */}
          <span className={cn(
            "px-2 py-0.5 rounded-lg text-xs font-semibold font-cairo shrink-0",
            listing.deletedByRole === "admin"
              ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
              : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
          )}>
            {listing.deletedByRole === "admin" ? "أدمن" : "مؤجر"}
          </span>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-cairo mb-3">
          <span className="flex items-center gap-1">
            <User size={12} />
            {listing.landlord?.name ?? "—"}
          </span>
          {deletedAt && (
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formatDistanceToNow(deletedAt, { addSuffix: true, locale: dateLocale })}
            </span>
          )}
          <span className="flex items-center gap-1">
            <ImageOff size={12} />
            {imageCount} صورة
          </span>
          <span>{listing.viewCount} مشاهدة</span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onRestore(listing.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-cairo bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
          >
            <RotateCcw size={13} />
            استرجاع
          </button>
          {imageCount > 0 && (
            <button
              onClick={() => onDeleteImages(listing.id, imageCount)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-cairo bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
            >
              <ImageOff size={13} />
              حذف الصور
            </button>
          )}
          <button
            onClick={() => onPermanentDelete(listing.id, listing.title)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-cairo bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          >
            <Trash2 size={13} />
            حذف نهائي
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DeletedAdvertisementsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deletedByRole, setDeletedByRole] = useState<DeletedByFilter>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  // Compute date filters
  const getDateRange = (): { from?: string; to?: string } => {
    const now = new Date();
    if (timeRange === "today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { from: start.toISOString() };
    }
    if (timeRange === "week") {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { from: start.toISOString() };
    }
    if (timeRange === "month") {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return { from: start.toISOString() };
    }
    return {};
  };

  const { from, to } = getDateRange();

  const { data, isLoading, refetch, isFetching } = useDeletedAdminListings({
    page,
    limit: 10,
    deletedByRole: deletedByRole !== "all" ? deletedByRole : undefined,
    search: debouncedSearch || undefined,
    from,
    to,
  });

  const restoreMutation = useRestoreListing();
  const deleteImagesMutation = useDeleteListingImages();
  const permanentDeleteMutation = useAdminPermanentDeleteListing();

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "restore" | "delete_images" | "permanent";
    listingId: string;
    listingTitle?: string;
    imageCount?: number;
  }>({ open: false, type: "restore", listingId: "" });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    clearTimeout((window as any).__searchTimeout);
    (window as any).__searchTimeout = setTimeout(() => {
      setDebouncedSearch(e.target.value);
      setPage(1);
    }, 400);
  };

  const handleFilterChange = () => setPage(1);

  const handleRestore = (id: string) => {
    setConfirmDialog({ open: true, type: "restore", listingId: id });
  };

  const handleDeleteImages = (id: string, count: number) => {
    setConfirmDialog({ open: true, type: "delete_images", listingId: id, imageCount: count });
  };

  const handlePermanentDelete = (id: string, title: string) => {
    setConfirmDialog({ open: true, type: "permanent", listingId: id, listingTitle: title });
  };

  const handleConfirm = async () => {
    const { type, listingId } = confirmDialog;
    setConfirmDialog((prev) => ({ ...prev, open: false }));

    if (type === "restore") {
      await restoreMutation.mutateAsync(listingId);
    } else if (type === "delete_images") {
      await deleteImagesMutation.mutateAsync(listingId);
    } else if (type === "permanent") {
      await permanentDeleteMutation.mutateAsync(listingId);
    }
  };

  const listings = data?.listings ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6 font-cairo" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
            <Archive size={22} className="text-red-500" />
            الإعلانات المحذوفة
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            أرشيف الإعلانات المحذوفة — يمكن الاسترجاع أو الحذف النهائي
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-cairo disabled:opacity-60"
        >
          <RefreshCw size={15} className={cn(isFetching && "animate-spin")} />
          تحديث
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="ابحث بالاسم أو المؤجر..."
              className="w-full ps-9 pe-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 font-cairo focus:outline-none focus:border-blue-400 dark:focus:border-blue-500"
            />
          </div>

          {/* Time Range */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            {([
              { value: "all", label: "الكل" },
              { value: "today", label: "اليوم" },
              { value: "week", label: "الأسبوع" },
              { value: "month", label: "الشهر" },
            ] as { value: TimeRange; label: string }[]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setTimeRange(opt.value); handleFilterChange(); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium font-cairo transition-colors",
                  timeRange === opt.value
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Deleted By */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            {([
              { value: "all", label: "الجميع" },
              { value: "admin", label: "أدمن" },
              { value: "landlord", label: "مؤجر" },
            ] as { value: DeletedByFilter; label: string }[]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setDeletedByRole(opt.value); handleFilterChange(); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium font-cairo transition-colors",
                  deletedByRole === opt.value
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-sm font-cairo">
        <Info size={16} className="shrink-0" />
        <span>الحذف النهائي يشترط أرشفة الإعلان أولاً وعدم وجود طلبات معاينة نشطة.</span>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
          <Archive size={48} className="mb-3 opacity-30" />
          <p className="font-cairo text-base">لا توجد إعلانات محذوفة</p>
          <p className="font-cairo text-sm mt-1">الإعلانات المحذوفة ستظهر هنا</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <ListingRow
              key={listing.id}
              listing={listing as DeletedListing}
              locale={locale}
              onRestore={handleRestore}
              onDeleteImages={handleDeleteImages}
              onPermanentDelete={handlePermanentDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.lastPage > 1 && (
        <div className="flex items-center justify-center gap-2 font-cairo">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {page} / {meta.lastPage}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
            disabled={page === meta.lastPage}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={
          confirmDialog.type === "restore"
            ? "استرجاع الإعلان"
            : confirmDialog.type === "delete_images"
            ? "حذف الصور"
            : "حذف نهائي"
        }
        description={
          confirmDialog.type === "restore"
            ? "سيتم استرجاع الإعلان إلى حالته السابقة قبل الحذف. هل أنت متأكد؟"
            : confirmDialog.type === "delete_images"
            ? `سيتم حذف ${confirmDialog.imageCount ?? 0} صورة من التخزين بشكل نهائي. لن يؤثر هذا على بيانات الإعلان. هل تريد المتابعة؟`
            : `سيتم حذف الإعلان "${confirmDialog.listingTitle}" بشكل نهائي من قاعدة البيانات. هذا الإجراء لا يمكن التراجع عنه.`
        }
        confirmLabel={
          confirmDialog.type === "restore"
            ? "استرجاع"
            : confirmDialog.type === "delete_images"
            ? "حذف الصور"
            : "حذف نهائياً"
        }
        confirmVariant={confirmDialog.type === "restore" ? "warning" : "danger"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
