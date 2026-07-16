// apps/frontend/src/app/[locale]/dashboard/landlord/rental-history/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useLandlordRentalHistory, useTerminateContract, useRenewContract } from "@/hooks/useRentalHistory";
import LandlordLayout from "@/components/layout/LandlordLayout";
import { Spinner, Modal } from "@/components/ui";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  History,
  LayoutList,
  AlignLeft,
  Search,
  CalendarRange,
  SortAsc,
  SortDesc,
  Building2,
  Bed,
  CheckCircle2,
  User,
  MapPin,
  BadgeDollarSign,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Hash,
  Clock,
  RefreshCw,
  XCircle,
  FileText,
  CheckSquare,
} from "lucide-react";
import type { RentalHistoryItem, ContractStatus, TerminationReason } from "@/types";
import { getImageUrl } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
type ViewMode = "cards" | "timeline";
type QuickFilter = "all" | "active" | "expired" | "terminated" | "renewed" | "custom";

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

// ── Status Badge Widget ────────────────────────────────────────────────────────
function StatusBadge({ status, locale }: { status: ContractStatus; locale: string }) {
  const isAr = locale === "ar";
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30 font-cairo">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {isAr ? "نشط" : "Active"}
        </span>
      );
    case "expired":
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-800/30 font-cairo">
          <Clock size={12} />
          {isAr ? "منتهي" : "Expired"}
        </span>
      );
    case "terminated":
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30 font-cairo">
          <XCircle size={12} />
          {isAr ? "ملغى مبكراً" : "Terminated"}
        </span>
      );
    case "renewed":
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30 font-cairo">
          <RefreshCw size={12} />
          {isAr ? "مجدد" : "Renewed"}
        </span>
      );
    default:
      return null;
  }
}

// ── Duration Helper ───────────────────────────────────────────────────────────
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

// ── Skeleton ──────────────────────────────────────────────────────────────────
function HistorySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 animate-pulse"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              <div className="flex gap-3">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
              </div>
            </div>
            <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Single History Card ───────────────────────────────────────────────────────
interface HistoryCardProps {
  item: RentalHistoryItem;
  locale: string;
  onClick?: () => void;
}

function HistoryCard({ item, locale, onClick }: HistoryCardProps) {
  const isApartment = item.listing.unitType === "apartment";
  const coverUrl = item.listing.images?.[0]?.url
    ? getImageUrl(item.listing.images[0].url)
    : null;

  const { totalDays, elapsed, remaining } = getLeaseProgress(item.startDate, item.endDate);

  return (
    <div 
      onClick={onClick}
      className={`group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 hover:shadow-md hover:border-amber-200 dark:hover:border-amber-800/50 transition-all hover:scale-[1.02] flex flex-col justify-between items-center text-center gap-3 relative ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="absolute top-3 end-3 font-mono text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
        {item.contractNumber}
      </div>

      {/* Cover Image or Icon */}
      <div className="shrink-0 mt-2">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={item.listing.title}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-100 dark:border-slate-800 shadow-sm"
          />
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center border-2 border-amber-100 dark:border-amber-900/30 shadow-sm">
            {isApartment ? (
              <Building2 size={28} className="text-amber-500" />
            ) : (
              <Bed size={28} className="text-amber-500" />
            )}
          </div>
        )}
      </div>

      <div className="space-y-1 w-full">
        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 font-cairo line-clamp-2 h-10 sm:h-auto">
          {item.listing.title}
        </h3>
        
        {item.startDate && item.endDate && (
          <p className="text-[10px] text-slate-400 font-mono">
            {new Date(item.startDate).toLocaleDateString(locale)} - {new Date(item.endDate).toLocaleDateString(locale)}
          </p>
        )}

        {item.status === "active" && totalDays > 0 && (
          <p className="text-[10px] text-slate-500 font-cairo bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-lg inline-block mt-1">
            {locale === "ar" ? `مضى ${elapsed} يوم | المتبقي ${remaining} يوم` : `Elapsed: ${elapsed}d | Remaining: ${remaining}d`}
          </p>
        )}
      </div>
      
      <div className="mt-1 flex items-center gap-2">
        <StatusBadge status={item.status} locale={locale} />
      </div>
    </div>
  );
}

// ── Timeline Mode ─────────────────────────────────────────────────────────────
function TimelineView({
  items,
  locale,
  onCardClick
}: {
  items: RentalHistoryItem[];
  locale: string;
  onCardClick?: (item: RentalHistoryItem) => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, RentalHistoryItem[]>();
    for (const item of items) {
      const key = new Date(item.createdAt).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [items]);

  if (groups.length === 0) {
    return <EmptyState locale={locale} />;
  }

  return (
    <div className="space-y-8">
      {groups.map(([dateKey, groupItems]) => (
        <div key={dateKey}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-cairo px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full">
              {new Date(dateKey).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          <div className="space-y-3">
            {groupItems.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="w-px flex-1 bg-slate-200 dark:bg-slate-800 mt-1" />
                </div>
                <div className="flex-1 pb-4">
                  <HistoryCard item={item} locale={locale} onClick={onCardClick ? () => onCardClick(item) : undefined} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ locale }: { locale: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center mb-4 border border-amber-100 dark:border-amber-900/30">
        <History size={36} className="text-amber-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 font-cairo mb-1">
        {locale === "ar" ? "لا توجد عقود إيجار مسجلة بعد" : "No rental contracts registered yet"}
      </h3>
      <p className="text-sm text-slate-400 dark:text-slate-500 font-cairo max-w-xs">
        {locale === "ar"
          ? "ستظهر هنا سجلات العقود وعمليات التأجير."
          : "Lease contract records will appear here."}
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LandlordRentalHistoryPage() {
  const locale = useLocale();
  const { user, isLoading: isAuthLoading } = useAuthGuard({ requiredRoles: ["landlord"] });
  const isRtl = locale === "ar";

  // ── State ──────────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<RentalHistoryItem | null>(null);

  // Early Termination Modal State
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const [terminationReason, setTerminationReason] = useState<TerminationReason>("mutual_agreement");
  const [terminationNotes, setTerminationNotes] = useState("");
  const [checkoutDate, setCheckoutDate] = useState("");

  // Renewal Modal State
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [renewEndDate, setRenewEndDate] = useState("");
  const [renewMonthlyRent, setRenewMonthlyRent] = useState("");
  const [isAutoRenew, setIsAutoRenew] = useState(false);
  const [renewNotes, setRenewNotes] = useState("");

  const terminateMutation = useTerminateContract();
  const renewMutation = useRenewContract();

  // Debounce search
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (v: string) => {
    setSearch(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(1);
    }, 400);
  };

  // Build filter object
  const apiQuery = useMemo(() => {
    const q: any = { page, limit: 10, sort, search: debouncedSearch || undefined };
    if (quickFilter !== "all" && quickFilter !== "custom") {
      q.status = quickFilter;
    }
    if (quickFilter === "custom") {
      if (customFrom) q.from = customFrom;
      if (customTo) q.to = customTo;
    }
    return q;
  }, [quickFilter, customFrom, customTo, page, sort, debouncedSearch]);

  const { data, isLoading, isFetching, refetch } = useLandlordRentalHistory(apiQuery);

  const items = data?.data ?? [];
  const meta = data?.meta;
  const lastPage = meta?.lastPage ?? 1;

  // Expected Revenue calculation
  const totalExpectedRevenue = useMemo(() => {
    return items.reduce((acc, item) => {
      if (!item.startDate || !item.endDate || !item.monthlyRent) return acc;
      const start = new Date(item.startDate).getTime();
      const end = (item.actualCheckout ? new Date(item.actualCheckout) : new Date(item.endDate)).getTime();
      const months = Math.max(1, Math.ceil((end - start) / (30 * 24 * 60 * 60 * 1000)));
      return acc + (item.monthlyRent * months);
    }, 0);
  }, [items]);

  const handleTerminateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    await terminateMutation.mutateAsync({
      id: selectedItem.id,
      data: {
        reason: terminationReason,
        notes: terminationNotes,
        checkoutDate: checkoutDate || undefined,
      },
    });

    setIsTerminateOpen(false);
    setSelectedItem(null);
    refetch();
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !renewEndDate) return;

    await renewMutation.mutateAsync({
      id: selectedItem.id,
      data: {
        newEndDate: renewEndDate,
        newMonthlyRent: renewMonthlyRent ? Number(renewMonthlyRent) : undefined,
        isAutoRenew,
        notes: renewNotes,
      },
    });

    setIsRenewOpen(false);
    setSelectedItem(null);
    refetch();
  };

  if (isAuthLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const quickFilters: { key: QuickFilter; ar: string; en: string }[] = [
    { key: "all", ar: "الكل", en: "All" },
    { key: "active", ar: "نشط", en: "Active" },
    { key: "expired", ar: "منتهي", en: "Expired" },
    { key: "terminated", ar: "ملغى مبكراً", en: "Terminated" },
    { key: "renewed", ar: "مجدد", en: "Renewed" },
    { key: "custom", ar: "نطاق مخصص", en: "Custom Range" },
  ];

  return (
    <LandlordLayout>
      <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-cairo flex items-center gap-2">
              <FileText size={24} className="text-amber-500" />
              {isRtl ? "إدارة عقود الإيجار" : "Lease Contracts Management"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo mt-0.5">
              {isRtl
                ? "سجل العقود الشامل ومتابعة الإشغال والمدد الزمنية"
                : "Comprehensive lease logs, occupancy, and contract durations"}
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all font-cairo ${
                viewMode === "cards"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <LayoutList size={14} />
              {isRtl ? "بطاقات" : "Cards"}
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all font-cairo ${
                viewMode === "timeline"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <AlignLeft size={14} />
              {isRtl ? "جدول زمني" : "Timeline"}
            </button>
          </div>
        </div>

        {/* Expected Revenue widget */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-5 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
          <div>
            <h2 className="text-sm font-medium opacity-90 font-cairo">
              {isRtl ? "الإيراد المتوقع للعقود المعروضة" : "Expected Revenue for displayed contracts"}
            </h2>
            <p className="text-3xl font-extrabold font-sans mt-1">
              {formatPrice(totalExpectedRevenue, locale)} <span className="text-lg font-cairo">{isRtl ? "ج.م" : "EGP"}</span>
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 text-xs font-cairo border border-white/10">
            {isRtl 
              ? "* يعتمد الحساب على مدة كل عقد نشط أو منتهٍ في القائمة الحالية." 
              : "* Calculation depends on duration of active or expired contracts in current page."}
          </div>
        </div>

        {/* ── Filters & Search Bar ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setQuickFilter(f.key);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all font-cairo ${
                  quickFilter === f.key
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/30 dark:hover:text-amber-400"
                }`}
              >
                {isRtl ? f.ar : f.en}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          {quickFilter === "custom" && (
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <CalendarRange size={14} className="text-slate-400" />
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => { setCustomFrom(e.target.value); setPage(1); }}
                  className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <span className="text-slate-400 text-xs font-cairo">
                {isRtl ? "إلى" : "to"}
              </span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => { setCustomTo(e.target.value); setPage(1); }}
                className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          )}

          {/* Search + Sort row */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-52">
              <Search
                size={14}
                className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={
                  isRtl
                    ? "ابحث برقم العقد أو اسم المستأجر..."
                    : "Search by contract number or tenant name..."
                }
                className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-xl ps-8 pe-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-cairo"
              />
            </div>

            {/* Sort */}
            <button
              onClick={() => {
                setSort((s) => (s === "desc" ? "asc" : "desc"));
                setPage(1);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 hover:border-amber-300 hover:text-amber-600 transition-colors font-cairo"
            >
              {sort === "desc" ? (
                <SortDesc size={14} />
              ) : (
                <SortAsc size={14} />
              )}
              {sort === "desc"
                ? isRtl
                  ? "الأحدث أولاً"
                  : "Newest First"
                : isRtl
                ? "الأقدم أولاً"
                : "Oldest First"}
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <HistorySkeleton />
        ) : isFetching && items.length === 0 ? (
          <HistorySkeleton />
        ) : items.length === 0 ? (
          <EmptyState locale={locale} />
        ) : viewMode === "timeline" ? (
          <TimelineView items={items} locale={locale} onCardClick={setSelectedItem} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {items.map((item) => (
              <HistoryCard key={item.id} item={item} locale={locale} onClick={() => setSelectedItem(item)} />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {meta && lastPage > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo">
              {isRtl
                ? `${meta.total} عقد — صفحة ${page} من ${lastPage}`
                : `${meta.total} contracts — Page ${page} of ${lastPage}`}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isRtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
              {Array.from({ length: Math.min(lastPage, 7) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      page === p
                        ? "bg-amber-500 text-white shadow-sm"
                        : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page === lastPage || isFetching}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedItem && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          title={isRtl ? "تفاصيل عقد الإيجار" : "Lease details"}
        >
          <div className="p-4 sm:p-6 space-y-5 font-cairo">
            {/* Cover and Title */}
            <div className="flex items-center gap-4">
              {selectedItem.listing.images?.[0]?.url ? (
                <img
                  src={getImageUrl(selectedItem.listing.images[0].url)}
                  alt={selectedItem.listing.title}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-100 dark:border-slate-800"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center border-2 border-amber-100 dark:border-amber-900/30">
                  {selectedItem.listing.unitType === "apartment" ? (
                    <Building2 size={28} className="text-amber-500" />
                  ) : (
                    <Bed size={28} className="text-amber-500" />
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
                <h3 className="font-bold text-sm sm:text-lg text-slate-900 dark:text-slate-100 leading-snug truncate">
                  {selectedItem.listing.title}
                </h3>
              </div>
            </div>

            {/* Lease duration widget with Elapsed and Remaining */}
            {selectedItem.startDate && selectedItem.endDate && (
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {isRtl ? "البداية" : "Start"}: {formatDate(selectedItem.startDate, locale)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {isRtl ? "النهاية" : "End"}: {formatDate(selectedItem.endDate, locale)}
                  </span>
                </div>

                {/* Progress bar */}
                {(() => {
                  const { totalDays, elapsed, remaining, percentage } = getLeaseProgress(selectedItem.startDate, selectedItem.endDate);
                  return (
                    <div className="space-y-1">
                      <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 transition-all" 
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

            {/* Grid details */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {selectedItem.tenant && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 text-slate-500">
                    <User size={14} className="sm:w-4 sm:h-4 shrink-0" />
                    <span className="text-[10px] sm:text-xs font-medium">{isRtl ? "المستأجر" : "Tenant"}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="font-bold text-xs sm:text-sm">{selectedItem.tenant.name}</p>
                    {selectedItem.tenant.phone && (
                      <a href={`tel:${selectedItem.tenant.phone}`} className="font-bold text-amber-500 hover:underline text-[10px] sm:text-xs font-sans block" style={{ direction: "ltr", textAlign: isRtl ? "right" : "left" }}>
                        {selectedItem.tenant.phone}
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 text-slate-500">
                  <BadgeDollarSign size={14} className="sm:w-4 sm:h-4 shrink-0" />
                  <span className="text-[10px] sm:text-xs font-medium">{isRtl ? "الإيجار الشهري" : "Monthly Rent"}</span>
                </div>
                <p className="font-bold text-amber-600 dark:text-amber-400 text-xs sm:text-sm">
                  {formatPrice(selectedItem.monthlyRent || selectedItem.listing.price, locale)} {isRtl ? "ج.م" : "EGP"}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-800 col-span-2">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 text-slate-500">
                  <MapPin size={14} className="sm:w-4 sm:h-4 shrink-0" />
                  <span className="text-[10px] sm:text-xs font-medium">{isRtl ? "الموقع" : "Location"}</span>
                </div>
                <p className="font-bold text-xs sm:text-sm">
                  {selectedItem.listing.governorate}، {selectedItem.listing.district}
                </p>
              </div>
            </div>
            
            {/* Audit Notes/checkout details if expired or terminated */}
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

            <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {isRtl ? "أنشئ في: " : "Created: "}{formatDate(selectedItem.createdAt, locale)}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Hash size={10} />
                {selectedItem.id}
              </span>
            </div>

            {/* Actions list */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
              <Link
                href={`/${locale}/listings/${selectedItem.listing.id}`}
                className="flex-1 text-center inline-flex justify-center items-center gap-1.5 text-xs sm:text-sm font-medium px-4 py-2.5 sm:py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {isRtl ? "عرض الإعلان" : "View Listing"}
              </Link>
              
              {selectedItem.status === "active" && (
                <>
                  <button
                    onClick={() => setIsRenewOpen(true)}
                    className="flex-1 inline-flex justify-center items-center gap-1.5 text-xs sm:text-sm font-medium px-4 py-2.5 sm:py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                  >
                    <RefreshCw size={14} />
                    {isRtl ? "تجديد العقد" : "Renew Contract"}
                  </button>
                  <button
                    onClick={() => setIsTerminateOpen(true)}
                    className="flex-1 inline-flex justify-center items-center gap-1.5 text-xs sm:text-sm font-medium px-4 py-2.5 sm:py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors"
                  >
                    <XCircle size={14} />
                    {isRtl ? "إنهاء العقد" : "Terminate"}
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Early Termination Dialog */}
      {isTerminateOpen && selectedItem && (
        <Modal
          isOpen={true}
          onClose={() => setIsTerminateOpen(false)}
          title={isRtl ? "إنهاء العقد مبكراً" : "Terminate lease early"}
        >
          <form onSubmit={handleTerminateSubmit} className="p-4 sm:p-6 space-y-4 font-cairo">
            <p className="text-xs text-slate-500">
              {isRtl 
                ? `سيتم إغلاق عقد الإيجار رقم ${selectedItem.contractNumber} وتحويل حالة العقار إلى شاغر تلقائياً.`
                : `This will close contract ${selectedItem.contractNumber} and vacate the listing.`}
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{isRtl ? "سبب الإنهاء" : "Reason"}</label>
              <select
                value={terminationReason}
                onChange={(e) => setTerminationReason(e.target.value as TerminationReason)}
                className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="mutual_agreement">{isRtl ? "اتفاق الطرفين" : "Mutual Agreement"}</option>
                <option value="tenant_request">{isRtl ? "طلب المستأجر" : "Tenant Request"}</option>
                <option value="landlord_request">{isRtl ? "طلب المؤجر" : "Landlord Request"}</option>
                <option value="violation">{isRtl ? "مخالفة بنود العقد" : "Violation"}</option>
                <option value="other">{isRtl ? "أسباب أخرى" : "Other"}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{isRtl ? "تاريخ الخروج الفعلي" : "Checkout Date"}</label>
              <input
                type="date"
                value={checkoutDate}
                onChange={(e) => setCheckoutDate(e.target.value)}
                className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{isRtl ? "ملاحظات إضافية" : "Additional Notes"}</label>
              <textarea
                rows={3}
                value={terminationNotes}
                onChange={(e) => setTerminationNotes(e.target.value)}
                placeholder={isRtl ? "أكتب تفاصيل أو أسباب إخلاء السكن..." : "Reason for vacating..."}
                className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTerminateOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm hover:bg-slate-50"
              >
                {isRtl ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={terminateMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 disabled:opacity-40"
              >
                {terminateMutation.isPending ? <Spinner size="sm" /> : (isRtl ? "تأكيد الإنهاء" : "Confirm Termination")}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Renewal Dialog */}
      {isRenewOpen && selectedItem && (
        <Modal
          isOpen={true}
          onClose={() => setIsRenewOpen(false)}
          title={isRtl ? "تجديد عقد الإيجار" : "Renew Lease Contract"}
        >
          <form onSubmit={handleRenewSubmit} className="p-4 sm:p-6 space-y-4 font-cairo">
            <p className="text-xs text-slate-500">
              {isRtl 
                ? `سيتم إقفال العقد الحالي ${selectedItem.contractNumber} كمجدد وإنشاء عقد جديد ملحق به.`
                : `This will mark contract ${selectedItem.contractNumber} as renewed and create a new contract.`}
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{isRtl ? "تاريخ انتهاء العقد الجديد" : "New End Date"}</label>
              <input
                type="date"
                required
                value={renewEndDate}
                onChange={(e) => setRenewEndDate(e.target.value)}
                className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isRtl ? "قيمة الإيجار الجديد شهرياً (اختياري)" : "New Monthly Rent (Optional)"}
              </label>
              <input
                type="number"
                value={renewMonthlyRent}
                onChange={(e) => setRenewMonthlyRent(e.target.value)}
                placeholder={String(selectedItem.monthlyRent || selectedItem.listing.price)}
                className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="isAutoRenew"
                checked={isAutoRenew}
                onChange={(e) => setIsAutoRenew(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 border-slate-300 focus:ring-amber-500"
              />
              <label htmlFor="isAutoRenew" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                {isRtl ? "تفعيل التجديد التلقائي للعقد الجديد" : "Enable automatic renewal for new contract"}
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{isRtl ? "ملاحظات التجديد" : "Renewal Notes"}</label>
              <textarea
                rows={3}
                value={renewNotes}
                onChange={(e) => setRenewNotes(e.target.value)}
                placeholder={isRtl ? "أكتب شروطاً جديدة أو ملاحظات للتجديد..." : "New terms or remarks..."}
                className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRenewOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm hover:bg-slate-50"
              >
                {isRtl ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={renewMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 disabled:opacity-40"
              >
                {renewMutation.isPending ? <Spinner size="sm" /> : (isRtl ? "تجديد العقد" : "Confirm Renewal")}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </LandlordLayout>
  );
}
