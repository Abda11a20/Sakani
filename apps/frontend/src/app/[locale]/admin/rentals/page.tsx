// apps/frontend/src/app/[locale]/admin/rentals/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  FileText,
  Search,
  User,
  Phone,
  Building2,
  Calendar,
  X,
  MapPin,
  Clock,
  CalendarDays,
  BadgeDollarSign,
  UserCheck,
  Building,
  Bed,
  Layers,
  RefreshCw,
  XCircle,
  Mail,
} from "lucide-react";
import { useAdminRentals } from "@/hooks/useAdmin";
import { Spinner } from "@/components/ui/spinner";
import { Modal } from "@/components/ui";
import { cn, getImageUrl } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPrice(price: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-GB").format(price);
}

function getLeaseProgress(startStr?: string, endStr?: string) {
  if (!startStr || !endStr) return { totalDays: 0, elapsed: 0, remaining: 0, percentage: 0 };
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  const now = Date.now();

  const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const elapsed = Math.max(0, Math.min(totalDays, Math.ceil((now - start) / (1000 * 60 * 60 * 24))));
  const remaining = Math.max(0, totalDays - elapsed);
  const percentage = Math.round((elapsed / totalDays) * 100);

  return { totalDays, elapsed, remaining, percentage };
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, locale }: { status: string; locale: string }) {
  const isAr = locale === "ar";
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {isAr ? "نشط" : "Active"}
        </span>
      );
    case "expired":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-800/30">
          <Clock size={10} />
          {isAr ? "منتهي" : "Expired"}
        </span>
      );
    case "terminated":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30">
          <XCircle size={10} />
          {isAr ? "مفسوخ" : "Terminated"}
        </span>
      );
    case "renewed":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30">
          <RefreshCw size={10} />
          {isAr ? "مجدد" : "Renewed"}
        </span>
      );
    default:
      return null;
  }
}

export default function AdminRentalsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  // ── State ──────────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeTab, setActiveTab] = useState<"apartments" | "rooms_beds">("apartments");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Queries
  const { data: rentalsData, isLoading } = useAdminRentals(
    page,
    50,
    search || undefined,
    selectedDate || undefined,
    selectedDate || undefined
  );

  const rawRentals = rentalsData?.data ?? [];

  // Split and filter rentals by unitType
  const apartmentsRentals = useMemo(() => {
    return rawRentals.filter((r) => r.listing.unitType === "apartment");
  }, [rawRentals]);

  const roomsBedsRentals = useMemo(() => {
    return rawRentals.filter((r) => r.listing.unitType === "room" || r.listing.unitType === "bed");
  }, [rawRentals]);

  // Overall page stats
  const stats = useMemo(() => {
    const totalCount = rawRentals.length;
    const apartmentsCount = apartmentsRentals.length;
    const roomsCount = roomsBedsRentals.length;
    const totalExpectedMonthly = rawRentals.reduce((sum, r) => sum + (r.monthlyRent || r.listing.price), 0);

    return {
      totalCount,
      apartmentsCount,
      roomsCount,
      totalExpectedMonthly,
    };
  }, [rawRentals, apartmentsRentals, roomsBedsRentals]);

  const displayList = activeTab === "apartments" ? apartmentsRentals : roomsBedsRentals;

  return (
    <div className="space-y-6 font-cairo" dir={isRtl ? "rtl" : "ltr"}>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="text-[#1B4F8A]" size={24} />
            {isRtl ? "سجلات عقود الإيجار الشاملة" : "Lease Contracts Registry"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRtl
              ? "متابعة وإشراف على جميع العقود المبرمة للوحدات السكنية والغرف والأسرة"
              : "Monitor and manage all tenancy agreements for apartments, rooms, and beds"}
          </p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Contracts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">{isRtl ? "إجمالي العقود" : "Total Contracts"}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-sans">
              {isLoading ? "..." : stats.totalCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Layers size={18} />
          </div>
        </div>

        {/* Apartments contracts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">{isRtl ? "عقود الشقق" : "Apartment Contracts"}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-sans">
              {isLoading ? "..." : stats.apartmentsCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Building2 size={18} />
          </div>
        </div>

        {/* Rooms / Beds Contracts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">{isRtl ? "عقود الغرف والأسرة" : "Rooms/Beds Contracts"}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-sans">
              {isLoading ? "..." : stats.roomsCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Bed size={18} />
          </div>
        </div>

        {/* Expected Monthly Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">{isRtl ? "إجمالي القيمة الإيجارية" : "Expected Monthly Rent"}</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-sans">
              {isLoading ? "..." : `${formatPrice(stats.totalExpectedMonthly, locale)} ج.م`}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-450">
            <BadgeDollarSign size={18} />
          </div>
        </div>
      </div>

      {/* ── Tabs selector ── */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("apartments")}
          className={cn(
            "py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
            activeTab === "apartments"
              ? "border-[#1B4F8A] text-[#1B4F8A] dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          )}
        >
          <Building size={16} />
          {isRtl ? "عقود الشقق الكاملة" : "Full Apartments Contracts"}
          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">
            {stats.apartmentsCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("rooms_beds")}
          className={cn(
            "py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
            activeTab === "rooms_beds"
              ? "border-[#1B4F8A] text-[#1B4F8A] dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          )}
        >
          <Bed size={16} />
          {isRtl ? "عقود الغرف والأسرة المشتركة" : "Shared Rooms & Beds"}
          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">
            {stats.roomsCount}
          </span>
        </button>
      </div>

      {/* ── Filters: Search & Date picker ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Text Search */}
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={
              isRtl
                ? "ابحث بعنوان الإعلان، اسم المؤجر أو المستأجر..."
                : "Search by listing, landlord or tenant name..."
            }
            className="w-full ps-10 pe-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A] transition-all"
          />
        </div>

        {/* Date Filter (Search by Day) */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <CalendarDays size={16} className="text-slate-400" />
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {isRtl ? "البحث باليوم:" : "Search by Day:"}
          </span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setPage(1); }}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-[#1B4F8A] focus:outline-none"
          />
          {selectedDate && (
            <button
              onClick={() => { setSelectedDate(""); setPage(1); }}
              className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── List view ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-slate-500">{isRtl ? "جاري تحميل العقود..." : "Loading lease contracts..."}</p>
        </div>
      ) : displayList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
          <Building2 className="mx-auto text-slate-350 dark:text-slate-700 mb-3 animate-pulse" size={44} />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-250">
            {isRtl ? "لا توجد عقود مسجلة" : "No registered contracts"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {isRtl
              ? "لم يتم العثور على أي عقود إيجار مسجلة تطابق محددات البحث الحالية."
              : "No rental contracts found matching the current search parameters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayList.map((item) => {
            const coverUrl = item.listing.images?.[0]?.url
              ? getImageUrl(item.listing.images[0].url)
              : null;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col justify-between gap-3 hover:-translate-y-0.5"
              >
                {/* Contract Number & status */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200/50">
                    {item.contractNumber}
                  </span>
                  <StatusBadge status={item.status} locale={locale} />
                </div>

                {/* Details Section */}
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    {coverUrl ? (
                      <img src={coverUrl} alt={item.listing.title} className="w-full h-full object-cover" />
                    ) : item.listing.unitType === "apartment" ? (
                      <Building2 size={20} className="text-slate-400" />
                    ) : (
                      <Bed size={20} className="text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate">
                      {item.listing.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin size={10} />
                      {item.listing.governorate} · {item.listing.district}
                    </p>
                  </div>
                </div>

                {/* Landlord vs Tenant strip */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-400 font-cairo">
                  <div className="bg-slate-50 dark:bg-slate-800/20 p-2 rounded-lg truncate">
                    <span className="text-[8px] text-slate-400 font-semibold block">{isRtl ? "المؤجر" : "Landlord"}</span>
                    <strong>{item.listing.landlord?.name}</strong>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/20 p-2 rounded-lg truncate">
                    <span className="text-[8px] text-slate-400 font-semibold block">{isRtl ? "المستأجر" : "Tenant"}</span>
                    <strong>{item.tenant?.name}</strong>
                  </div>
                </div>

                {/* Price and Dates */}
                <div className="flex items-center justify-between pt-1 font-sans text-xs">
                  <span className="text-slate-500 text-[10px] font-cairo font-sans">
                    {item.startDate && item.endDate
                      ? `${new Date(item.startDate).toLocaleDateString(locale)} - ${new Date(item.endDate).toLocaleDateString(locale)}`
                      : ""}
                  </span>
                  <span className="font-bold text-[#1B4F8A] dark:text-blue-400">
                    {formatPrice(item.monthlyRent || item.listing.price, locale)} ج.م
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Details Modal ── */}
      {selectedItem && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          title={isRtl ? "تفاصيل عقد الإيجار الشامل" : "Lease Agreement Details"}
        >
          <div className="p-4 sm:p-6 space-y-5 font-cairo max-h-[80vh] overflow-y-auto">
            {/* Cover and Listing Title */}
            <div className="flex items-center gap-4">
              {selectedItem.listing.images?.[0]?.url ? (
                <img
                  src={getImageUrl(selectedItem.listing.images[0].url)}
                  alt={selectedItem.listing.title}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-100 dark:border-slate-850"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center border border-blue-100 dark:border-blue-900/30">
                  {selectedItem.listing.unitType === "apartment" ? (
                    <Building2 size={24} className="text-blue-500" />
                  ) : (
                    <Bed size={24} className="text-blue-500" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/50">
                    {selectedItem.contractNumber}
                  </span>
                  <StatusBadge status={selectedItem.status} locale={locale} />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug truncate">
                  {selectedItem.listing.title}
                </h3>
              </div>
            </div>

            {/* Progress bar */}
            {selectedItem.startDate && selectedItem.endDate && (
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {isRtl ? "تاريخ البدء" : "Start Date"}: {formatDate(selectedItem.startDate, locale)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {isRtl ? "تاريخ الانتهاء" : "End Date"}: {formatDate(selectedItem.endDate, locale)}
                  </span>
                </div>

                {(() => {
                  const { elapsed, remaining, percentage } = getLeaseProgress(selectedItem.startDate, selectedItem.endDate);
                  return (
                    <div className="space-y-1">
                      <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#1B4F8A] transition-all" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{isRtl ? `مضى: ${elapsed} يوم` : `Elapsed: ${elapsed}d`}</span>
                        <span>{percentage}%</span>
                        <span>{isRtl ? `المتبقي: ${remaining} يوم` : `Remaining: ${remaining}d`}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Financial Info */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">{isRtl ? "الإيجار الشهري" : "Monthly Rent"}</span>
                <strong className="text-slate-800 dark:text-white font-sans text-sm block mt-0.5">
                  {formatPrice(selectedItem.monthlyRent || selectedItem.listing.price, locale)} ج.م
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">{isRtl ? "مبلغ التأمين" : "Security Deposit"}</span>
                <strong className="text-slate-800 dark:text-white font-sans text-sm block mt-0.5">
                  {formatPrice(selectedItem.securityDeposit || 0, locale)} ج.م
                </strong>
              </div>
            </div>

            {/* Landlord & Tenant details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Landlord card */}
              {selectedItem.listing.landlord && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold border-b border-slate-200/50 dark:border-slate-800/80 pb-2">
                    <User size={14} />
                    <span className="text-xs">{isRtl ? "تفاصيل المؤجر" : "Landlord Details"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-350">
                      {selectedItem.listing.landlord.avatarUrl ? (
                        <img src={selectedItem.listing.landlord.avatarUrl} alt={selectedItem.listing.landlord.name} className="w-full h-full object-cover rounded-full" />
                      ) : selectedItem.listing.landlord.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-slate-850 dark:text-slate-200 truncate">{selectedItem.listing.landlord.name}</p>
                      <a href={`tel:${selectedItem.listing.landlord.phone}`} className="text-[10px] text-blue-600 flex items-center gap-1 mt-0.5">
                        <Phone size={10} />
                        {selectedItem.listing.landlord.phone}
                      </a>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                        <Mail size={10} />
                        {selectedItem.listing.landlord.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tenant card */}
              {selectedItem.tenant && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold border-b border-slate-200/50 dark:border-slate-800/80 pb-2">
                    <UserCheck size={14} />
                    <span className="text-xs">{isRtl ? "تفاصيل المستأجر" : "Tenant Details"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-350">
                      {selectedItem.tenant.avatarUrl ? (
                        <img src={selectedItem.tenant.avatarUrl} alt={selectedItem.tenant.name} className="w-full h-full object-cover rounded-full" />
                      ) : selectedItem.tenant.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-slate-850 dark:text-slate-200 truncate">{selectedItem.tenant.name}</p>
                      <a href={`tel:${selectedItem.tenant.phone}`} className="text-[10px] text-blue-600 flex items-center gap-1 mt-0.5">
                        <Phone size={10} />
                        {selectedItem.tenant.phone}
                      </a>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                        <Mail size={10} />
                        {selectedItem.tenant.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Termination Details */}
            {selectedItem.status === "terminated" && (
              <div className="bg-amber-50/50 dark:bg-amber-950/10 p-3.5 rounded-xl border border-amber-200/40 text-xs text-amber-800 dark:text-amber-400 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <XCircle size={14} />
                  {isRtl ? "بيانات إلغاء العقد مبكراً" : "Early termination details"}
                </div>
                <p>
                  <strong>{isRtl ? "السبب: " : "Reason: "}</strong>
                  {selectedItem.terminationReason === "tenant_request" && (isRtl ? "طلب المستأجر" : "Tenant request")}
                  {selectedItem.terminationReason === "landlord_request" && (isRtl ? "طلب المؤجر" : "Landlord request")}
                  {selectedItem.terminationReason === "violation" && (isRtl ? "مخالفة بنود العقد" : "Violation")}
                  {selectedItem.terminationReason === "mutual_agreement" && (isRtl ? "اتفاق متبادل" : "Mutual agreement")}
                  {selectedItem.terminationReason === "other" && (isRtl ? "أسباب أخرى" : "Other")}
                </p>
                {selectedItem.terminationNotes && (
                  <p><strong>{isRtl ? "ملاحظات: " : "Notes: "}</strong>{selectedItem.terminationNotes}</p>
                )}
                {selectedItem.actualCheckout && (
                  <p><strong>{isRtl ? "تاريخ الخروج الفعلي: " : "Checkout date: "}</strong>{formatDate(selectedItem.actualCheckout, locale)}</p>
                )}
              </div>
            )}

            {/* Other details */}
            <div className="space-y-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-cairo">
              <p><strong>{isRtl ? "مصدر إنشاء العقد: " : "Creation Source: "}</strong>{selectedItem.createdByType}</p>
              {selectedItem.notes && <p><strong>{isRtl ? "ملاحظات إضافية: " : "Contract Notes: "}</strong>{selectedItem.notes}</p>}
            </div>

            {/* Footer buttons */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <Link
                href={`/${locale}/listings/${selectedItem.listing.id}`}
                className="text-center inline-flex justify-center items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-250 transition-colors"
              >
                {isRtl ? "عرض الإعلان" : "View Listing"}
              </Link>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-center inline-flex justify-center items-center gap-1.5 text-xs font-semibold px-5 py-2.5 rounded-xl bg-[#1B4F8A] text-white hover:bg-opacity-90 transition-colors"
              >
                {isRtl ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
