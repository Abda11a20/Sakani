// apps/frontend/src/app/[locale]/dashboard/landlord/advertisements/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import LandlordLayout from "@/components/layout/LandlordLayout";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useMyListings, useDeleteListing } from "@/hooks/useListings";
import { Spinner, Modal, useToast } from "@/components/ui";
import { getImageUrl } from "@/lib/utils";
import {
  Megaphone,
  Search,
  MapPin,
  Eye,
  Trash2,
  BedDouble,
  Building2,
  Plus,
  AlertTriangle,
  ChevronLeft,
} from "lucide-react";
import type { Listing } from "@/types";

type FilterStatus = "all" | "active" | "pending_review" | "rented";

// ── Status Badge Helper ───────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 font-cairo">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          نشط
        </span>
      );
    case "pending_review":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 font-cairo">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          قيد المراجعة
        </span>
      );
    case "rented":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 font-cairo">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          مؤجر
        </span>
      );
    case "paused":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 font-cairo">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          متوقف
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 font-cairo">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          مرفوض
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-cairo">
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
}: {
  item: Listing;
  isRtl: boolean;
  locale: string;
}) {
  const hasImage = item.images && item.images.length > 0;

  return (
    <Link
      href={`/${locale}/dashboard/landlord/advertisements/${item.id}`}
      className="group text-right w-full flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A847]/60"
    >
      {/* Image */}
      <div className="relative h-[160px] sm:h-[180px] overflow-hidden bg-slate-100 dark:bg-slate-850 shrink-0">
        {hasImage ? (
          <img
            src={getImageUrl(item.images[0])}
            alt={item.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-300 dark:text-slate-700">
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
        <h3 className="font-cairo font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2 text-right">
          {item.title}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1 font-cairo">
          <span className="text-base font-extrabold text-[#D4A847] dark:text-[#E8C06A] font-sans">
            {new Intl.NumberFormat(isRtl ? "ar-EG" : "en-US").format(item.price)}
          </span>
          <span className="text-[10px] text-slate-400">جنيه/شهر</span>
        </div>

        {/* Footer views counter */}
        <div className="mt-auto pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1">
            <Eye size={11} />
            <span className="font-sans">{item.viewCount ?? item.views ?? 0}</span>
            <span>مشاهدة</span>
          </div>
          <span className="text-[#1B4F8A] dark:text-[#7BAEE8] font-bold text-[10px] flex items-center gap-1">
            {isRtl ? "تفاصيل وإجراءات" : "Details & Actions"}
            <ChevronLeft size={11} />
          </span>
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

  const { data: rawListings = [], isLoading, refetch } = useMyListings();
  const listings = rawListings || [];
  const { mutate: deleteListing, isPending: isDeleting } = useDeleteListing();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filter listings
  const filteredListings = useMemo(() => {
    let result = [...listings];
    if (activeFilter !== "all") {
      result = result.filter((item) => item.status === activeFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.title?.toLowerCase().includes(term) ||
          item.district?.toLowerCase().includes(term) ||
          item.city?.toLowerCase().includes(term)
      );
    }
    return result;
  }, [listings, activeFilter, searchTerm]);

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
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-cairo">
              {isRtl ? "إدارة الإعلانات" : "Advertisement Management"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-cairo">
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
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute top-1/2 start-3 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder={isRtl ? "بحث بالإعلان..." : "Search advertisements..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full ps-9 pe-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4A847]/20 focus:border-[#D4A847] font-cairo"
            />
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto shrink-0">
            {(
              [
                { key: "all", label: isRtl ? "الكل" : "All" },
                { key: "active", label: isRtl ? "نشط" : "Active" },
                { key: "pending_review", label: isRtl ? "مراجعة" : "Pending" },
                { key: "rented", label: isRtl ? "مؤجر" : "Rented" },
              ] as const
            ).map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-cairo transition-all whitespace-nowrap ${
                  activeFilter === filter.key
                    ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        {!isLoading && filteredListings.length > 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-600 font-cairo font-medium px-1">
            {isRtl ? `${filteredListings.length} إعلان` : `${filteredListings.length} advertisements`}
          </p>
        )}

        {/* Grid of Cards */}
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <Spinner size="lg" />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl font-cairo">
            <Megaphone size={44} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {isRtl ? "لا توجد إعلانات" : "No Advertisements Found"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs mx-auto text-xs">
              {isRtl ? "لم تقم بإضافة أي إعلانات بعد. ابدأ بإضافة أول إعلان لك الآن!" : "You have not published any advertisements yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredListings.map((item) => (
              <AdCard
                key={item.id}
                item={item}
                isRtl={isRtl}
                locale={locale}
              />
            ))}
          </div>
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
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isRtl ? "هل أنت متأكد من حذف هذا الإعلان؟" : "Are you sure you want to delete?"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto">
              {isRtl
                ? "هذا الإجراء نهائي وسيتم إزالة الإعلان التسويقي من المنصة بالكامل."
                : "This action is permanent and will completely remove the ad from the platform."}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl py-2.5 border border-slate-200 dark:border-slate-800 font-semibold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
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