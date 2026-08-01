// apps/frontend/src/app/[locale]/admin/deleted-advertisements/page.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
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
  ChevronLeft,
  ChevronRight,
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
  deletedBy?: { id: string; name: string; role: string } | null;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
      <div className="bg-surface rounded-2xl shadow-xl border border-border p-6 max-w-md w-full mx-4 font-cairo">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
          confirmVariant === "danger" ? "bg-status-danger/15" : "bg-status-warning/15"
        )}>
          <AlertTriangle size={22} className={confirmVariant === "danger" ? "text-status-danger" : "text-status-warning"} />
        </div>
        <h3 className="text-lg font-bold text-text mb-2">{title}</h3>
        <p className="text-sm text-text-secondary mb-6 leading-relaxed">{description}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-surface-tertiary text-text-secondary hover:bg-surface-secondary transition-colors cursor-pointer border border-border"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer",
              confirmVariant === "danger"
                ? "bg-status-danger hover:opacity-90 text-white"
                : "bg-status-warning hover:opacity-90 text-white"
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
  const deleterName = listing.deletedBy?.name || (listing.deletedByRole === "admin" || listing.deletedByRole === "super_admin" ? "الأدمن" : "صاحب الإعلان");

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="relative w-full sm:w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={listing.title}
            fill
            sizes="80px"
            className="object-cover"
          />
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
            <h3 className="font-semibold text-slate-900 font-cairo text-sm line-clamp-1">{listing.title}</h3>
            <p className="text-xs text-slate-500 font-cairo mt-0.5">
              {listing.governorate} · {listing.district}
            </p>
          </div>
          {/* Deleted By Badge */}
          <span className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-bold font-cairo shrink-0 flex items-center gap-1",
            listing.deletedByRole === "admin" || listing.deletedByRole === "super_admin"
              ? "bg-purple-100 text-purple-700"
              : "bg-amber-100 text-amber-700"
          )}>
            حُذف بواسطة: {deleterName} ({listing.deletedByRole === "admin" || listing.deletedByRole === "super_admin" ? "أدمن" : "مؤجر"})
          </span>
        </div>

        {/* Reason & Status BEFORE delete */}
        {(listing.deletedReason || listing.statusBeforeDelete) && (
          <div className="text-xs bg-slate-50 p-2 rounded-lg mb-2 text-slate-600 space-y-0.5">
            {listing.statusBeforeDelete && (
              <p><span className="font-bold">الحالة قبل الحذف:</span> {listing.statusBeforeDelete}</p>
            )}
            {listing.deletedReason && (
              <p><span className="font-bold">سبب الحذف:</span> {listing.deletedReason}</p>
            )}
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-cairo mb-3">
          <span className="flex items-center gap-1">
            <User size={12} />
            المالك: {listing.landlord?.name ?? "—"}
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-cairo bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <RotateCcw size={13} />
            استرجاع
          </button>
          {imageCount > 0 && (
            <button
              onClick={() => onDeleteImages(listing.id, imageCount)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-cairo bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <ImageOff size={13} />
              حذف الصور
            </button>
          )}
          <button
            onClick={() => onPermanentDelete(listing.id, listing.title)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-cairo bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
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
          <h1 className="text-2xl font-bold text-slate-900 font-cairo flex items-center gap-2">
            <Archive size={22} className="text-red-500" />
            الإعلانات المحذوفة
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            أرشيف الإعلانات المحذوفة — يمكن الاسترجاع أو الحذف النهائي
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-cairo disabled:opacity-60"
        >
          <RefreshCw size={15} className={cn(isFetching && "animate-spin")} />
          تحديث
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="ابحث بالاسم أو المؤجر..."
              className="w-full ps-9 pe-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 font-cairo focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Time Range */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
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
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Deleted By */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
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
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-cairo">
        <Info size={16} className="shrink-0" />
        <span>الحذف النهائي يشترط أرشفة الإعلان أولاً وعدم وجود طلبات معاينة نشطة.</span>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
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
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <span className="text-sm text-slate-600">
            {page} / {meta.lastPage}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
            disabled={page === meta.lastPage}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
