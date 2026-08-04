// apps/frontend/src/app/[locale]/dashboard/landlord/advertisements/page.tsx
"use client";

import React, { useDeferredValue, useState } from "react";
import LandlordLayout from "@/components/layout/LandlordLayout";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useMyPaginatedListings, useDeleteListing, useRepublishListing } from "@/hooks/useListings";
import { Spinner, Modal, useToast } from "@/components/ui";
import { getImageUrl } from "@/lib/utils";
import {
  Megaphone,
  Search,
  MapPin,
  Eye,
  BedDouble,
  Building2,
  Plus,
  AlertTriangle,
  ChevronLeft,
  RefreshCw,
} from "lucide-react";
import type { Listing } from "@/types";
import { SearchPagination } from "@/features/search";

type FilterStatus = "all" | "active" | "pending_review" | "rented" | "paused";

// ── Status Badge Helper ───────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const tCommon = useTranslations("common");
  const label = tCommon.has(`status.${status}`) ? tCommon(`status.${status}`) : status;

  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-status-success/15 text-status-success border border-status-success/30 font-cairo">
          <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
          {label}
        </span>
      );
    case "pending_review":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-status-warning/15 text-status-warning border border-status-warning/30 font-cairo">
          <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
          {label}
        </span>
      );
    case "rented":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-tertiary text-text-secondary border border-border font-cairo">
          <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary" />
          {label}
        </span>
      );
    case "paused":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-status-warning/15 text-status-warning border border-status-warning/30 font-cairo">
          <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
          {label}
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-status-danger/15 text-status-danger border border-status-danger/30 font-cairo">
          <span className="w-1.5 h-1.5 rounded-full bg-status-danger" />
          {label}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-secondary text-text-secondary border border-border font-cairo">
          {label}
        </span>
      );
  }
}

// ── Ad Card ───────────────────────────────────────────────────
function AdCard({
  item,
  isRtl,
  locale,
  onRepublish,
}: {
  item: Listing;
  isRtl: boolean;
  locale: string;
  onRepublish?: (id: string) => void;
}) {
  const hasImage = item.images && item.images.length > 0;

  return (
    <Link
      href={`/${locale}/dashboard/landlord/advertisements/${item.id}`}
      className="group text-right w-full flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      {/* Image */}
      <div className="relative h-[160px] sm:h-[180px] overflow-hidden bg-slate-100 shrink-0">
        {hasImage ? (
          <img
            src={getImageUrl(item.images[0])}
            alt={item.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-300">
            <Building2 size={40} />
          </div>
        )}

        {/* Top badges overlay */}
        <div className="absolute top-2.5 start-2.5 flex flex-col gap-1.5">
          <StatusBadge status={item.status} />
        </div>

        {/* Type chip */}
        <div className="absolute bottom-2.5 end-2.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-900/70 text-white backdrop-blur-sm">
            {item.type === "bed" ? (
              <><BedDouble size={10} /> {isRtl ? "سرير" : "Bed"}</>
            ) : (
              <><Building2 size={10} /> {isRtl ? "شقة" : "Apartment"}</>
            )}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        {/* Location */}
        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
          <MapPin size={11} className="text-[#D4A847] shrink-0" />
          <span className="truncate">{item.district}، {item.city}</span>
        </div>

        {/* Title */}
        <h3 className="font-cairo font-semibold text-slate-900 text-sm leading-snug line-clamp-2 text-right">
          {item.title}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1 font-cairo">
          <span className="text-[#D4A847] text-base font-extrabold font-sans">
            {new Intl.NumberFormat(isRtl ? "ar-EG" : "en-US").format(item.price)}
          </span>
          <span className="text-[10px] text-slate-400">{isRtl ? "جنيه/شهر" : "EGP/month"}</span>
        </div>

        {/* Footer views counter & Actions */}
        <div className="mt-auto pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1">
            <Eye size={11} />
            <span className="font-sans">{item.viewCount ?? item.views ?? 0}</span>
            <span>{isRtl ? "مشاهدة" : "views"}</span>
          </div>
          {item.status === "paused" && onRepublish ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRepublish(item.id);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors font-cairo shadow-sm"
            >
              <RefreshCw size={12} />
              {isRtl ? "إعادة نشر" : "Republish"}
            </button>
          ) : (
            <span className="text-[#1B4F8A] font-bold text-[10px] flex items-center gap-1">
              {isRtl ? "تفاصيل وإجراءات" : "Details & Actions"}
              <ChevronLeft size={11} />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function LandlordAdvertisements() {
  const locale = useLocale();
  const tAds = useTranslations("dashboard.landlord.advertisements");
  const tCommon = useTranslations("common");
  const isRtl = locale === "ar";
  const { toast } = useToast();

  const { mutate: deleteListing, isPending: isDeleting } = useDeleteListing();
  const { mutate: republishListing } = useRepublishListing();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const { data, isLoading, refetch } = useMyPaginatedListings({
    page,
    status: activeFilter === "all" ? undefined : activeFilter,
    search: deferredSearchTerm.trim() || undefined,
  });
  const listings = data?.listings ?? [];
  const pagination = data?.meta ?? { total: 0, page: 1, limit: 10, lastPage: 1 };

  const handleRepublish = (id: string) => {
    republishListing(id, {
      onSuccess: () => {
        toast({
          title: isRtl ? "تمت إعادة النشر بنجاح" : "Republished successfully",
          description: isRtl
            ? "تمت إعادة الإعلان إلى المنصة وأصبح نشطاً ومتاحاً."
            : "The ad is now active again on the platform.",
          type: "success",
        });
        refetch();
      },
      onError: (err: any) => {
        toast({
          title: isRtl ? "فشل إعادة النشر" : "Republish failed",
          description: err?.response?.data?.message || (isRtl ? "حدث خطأ أثناء محاولة إعادة النشر." : "An error occurred."),
          type: "error",
        });
      },
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteListing(deleteId, {
      onSuccess: () => {
        toast({
          title: isRtl ? "تم الحذف بنجاح" : "Deleted successfully",
          description: isRtl ? "تم حذف الإعلان بنجاح من المنصة." : "The advertisement has been removed.",
          type: "success",
        });
        setDeleteId(null);
        refetch();
      },
      onError: () => {
        toast({
          title: isRtl ? "فشل الحذف" : "Deletion failed",
          description: isRtl ? "حدث خطأ أثناء محاولة حذف الإعلان." : "An error occurred while deleting the ad.",
          type: "error",
        });
      },
    });
  };

  return (
    <LandlordLayout>
      <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-cairo">
              {tAds("title")}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-cairo">
              {tAds("subtitle")}
            </p>
          </div>
          <Link
            href={`/${locale}/dashboard/landlord/add-listing`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#153e6d] transition-colors shadow-sm font-cairo shrink-0"
          >
            <Plus size={16} />
            <span>{isRtl ? "أضف إعلاناً جديداً" : "Add New Listing"}</span>
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={isRtl ? "ابحث في إعلاناتك بالعنوان، المنطقة، أو المحافظة..." : "Search listings..."}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A] font-cairo"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            {(
              [
                { id: "all", label: tCommon("all") },
                { id: "active", label: tCommon("status.active") },
                { id: "pending_review", label: tCommon("status.pending_review") },
                { id: "rented", label: tCommon("status.rented") },
                { id: "paused", label: tCommon("status.paused") },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => {
                  setActiveFilter(filter.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-cairo transition-all whitespace-nowrap ${
                  activeFilter === filter.id
                    ? "bg-[#1B4F8A] text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-center">
            <Megaphone size={40} className="text-slate-300 mb-3" />
            <h3 className="font-cairo font-bold text-slate-700 text-sm mb-1">
              {isRtl ? "لا توجد إعلانات مطابقة" : "No matching listings"}
            </h3>
            <p className="font-cairo text-xs text-slate-400 max-w-sm mb-4">
              {isRtl
                ? "لم نجد أي إعلانات تنطبق عليها خيارات البحث أو التصفية الحالية."
                : "No listings match your search or filter parameters."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {listings.map((item) => (
                <AdCard
                  key={item.id}
                  item={item}
                  isRtl={isRtl}
                  locale={locale}
                  onRepublish={handleRepublish}
                />
              ))}
            </div>

            {pagination.lastPage > 1 && (
              <SearchPagination
                page={pagination.page}
                lastPage={pagination.lastPage}
                onPageChange={(p) => setPage(p)}
              />
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <Modal isOpen={true} onClose={() => setDeleteId(null)}>
          <div className="p-6 text-center space-y-4 font-cairo">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isRtl ? "هل أنت تأكد من نقل هذا الإعلان إلى الأرشيف؟" : "Archive this advertisement?"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isRtl
                  ? "لن يظهر الإعلان للمستأجرين في نتائج البحث بعد الآن."
                  : "The ad will no longer appear in tenant search results."}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl py-2.5 border border-slate-200 font-semibold text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {isRtl ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl py-2.5 text-sm transition-colors"
              >
                {isDeleting ? (isRtl ? "جاري الحذف..." : "Deleting...") : (isRtl ? "حذف الإعلان" : "Confirm Delete")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </LandlordLayout>
  );
}
