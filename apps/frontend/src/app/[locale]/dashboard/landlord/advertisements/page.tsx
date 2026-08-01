// apps/frontend/src/app/[locale]/dashboard/landlord/advertisements/page.tsx
"use client";

import React, { useDeferredValue, useState } from "react";
import LandlordLayout from "@/components/layout/LandlordLayout";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useMyPaginatedListings, useDeleteListing } from "@/hooks/useListings";
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
} from "lucide-react";
import type { Listing } from "@/types";

type FilterStatus = "all" | "active" | "pending_review" | "rented" | "paused";

import { useRepublishListing } from "@/hooks/useListings";
import { RefreshCw } from "lucide-react";
import { SearchPagination } from "@/features/search";

// ── Status Badge Helper ───────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-status-success/15 text-status-success border border-status-success/30 font-cairo">
          <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
          نشط
        </span>
      );
    case "pending_review":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-status-warning/15 text-status-warning border border-status-warning/30 font-cairo">
          <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
          قيد المراجعة
        </span>
      );
    case "rented":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-tertiary text-text-secondary border border-border font-cairo">
          <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary" />
          مؤجر
        </span>
      );
    case "paused":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-status-warning/15 text-status-warning border border-status-warning/30 font-cairo">
          <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
          متوقف
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-status-danger/15 text-status-danger border border-status-danger/30 font-cairo">
          <span className="w-1.5 h-1.5 rounded-full bg-status-danger" />
          مرفوض
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-secondary text-text-secondary border border-border font-cairo">
          {status}
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
              <><BedDouble size={10} /> سرير</>
            ) : (
              <><Building2 size={10} /> شقة</>
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
          <span className="text-[10px] text-slate-400">جنيه/شهر</span>
        </div>

        {/* Footer views counter & Actions */}
        <div className="mt-auto pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1">
            <Eye size={11} />
            <span className="font-sans">{item.viewCount ?? item.views ?? 0}</span>
            <span>مشاهدة</span>
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
              {isRtl ? "إدارة الإعلانات" : "Advertisement Management"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-cairo">
              {isRtl
                ? "اضغط على أي إعلان لعرض تفاصيله وإجراءاته."
                : "Click any ad to view its details and actions."}
            </p>
          </div>
          <Link href={`/${locale}/dashboard/landlord/listings/add`}>
            <button className="font-cairo flex items-center gap-2 bg-[#D4A847] hover:bg-[#C49535] text-white rounded-xl py-2.5 px-5 shadow-sm text-sm font-bold transition-colors">
              <Plus size={16} />
              <span>{isRtl ? "إضافة إعلان جديد" : "Add New Ad"}</span>
            </button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white p-3.5 rounded-2xl border border-slate-200">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute top-1/2 start-3 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder={isRtl ? "بحث بالإعلان..." : "Search advertisements..."}
              value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
              className="w-full ps-9 pe-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4A847]/20 focus:border-[#D4A847] font-cairo"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto shrink-0">
            {(
              [
                { key: "all", label: isRtl ? "الكل" : "All" },
                { key: "active", label: isRtl ? "نشط" : "Active" },
                { key: "pending_review", label: isRtl ? "مراجعة" : "Pending" },
                { key: "rented", label: isRtl ? "مؤجر" : "Rented" },
                { key: "paused", label: isRtl ? "متوقف" : "Paused" },
              ] as const
            ).map((filter) => (
              <button
                key={filter.key}
                onClick={() => {
                  setActiveFilter(filter.key);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-cairo transition-all whitespace-nowrap ${
                  activeFilter === filter.key
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        {!isLoading && pagination.total > 0 && (
          <p className="text-xs text-slate-400 font-cairo font-medium px-1">
            {isRtl ? `${pagination.total} إعلان` : `${pagination.total} advertisements`}
          </p>
        )}

        {/* Grid of Cards */}
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <Spinner size="lg" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24 bg-white border border-dashed border-slate-200 rounded-3xl font-cairo">
            <Megaphone size={44} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">
              {isRtl ? "لا توجد إعلانات" : "No Advertisements Found"}
            </h3>
            <p className="text-slate-500 mt-1.5 max-w-xs mx-auto text-xs">
              {isRtl ? "لم تقم بإضافة أي إعلانات بعد. ابدأ بإضافة أول إعلان لك الآن!" : "You have not published any advertisements yet."}
            </p>
          </div>
        ) : (
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
        )}

        {!isLoading && (
          <SearchPagination
            page={pagination.page}
            lastPage={pagination.lastPage}
            onPageChange={setPage}
          />
        )}
      </div>

{/* Delete Confirmation Modal */}
      {deleteId && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteId(null)}
          title={isRtl ? "تأكيد حذف الإعلان" : "Confirm Deletion"}
        >
          <div className="p-6 text-center space-y-4 font-cairo">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {isRtl ? "هل أنت متأكد من حذف هذا الإعلان؟" : "Are you sure you want to delete?"}
            </h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              {isRtl
                ? "هذا الإجراء نهائي وسيتم إزالة الإعلان التسويقي من المنصة بالكامل."
                : "This action is permanent and will completely remove the ad from the platform."}
            </p>
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
