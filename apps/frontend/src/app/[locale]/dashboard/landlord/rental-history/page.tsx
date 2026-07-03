// apps/frontend/src/app/[locale]/dashboard/landlord/rental-history/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useLandlordRentalHistory } from "@/hooks/useRentalHistory";
import LandlordLayout from "@/components/layout/LandlordLayout";
import { Spinner, Modal, Avatar } from "@/components/ui";
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
} from "lucide-react";
import type { RentalHistoryItem } from "@/types";
import { getImageUrl } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
type ViewMode = "cards" | "timeline";
type QuickFilter = "all" | "today" | "week" | "month" | "custom";

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

function getDateRange(filter: QuickFilter): { from?: string; to?: string } {
  if (filter === "all" || filter === "custom") return {};
  const now = new Date();
  const toISO = (d: Date) => d.toISOString().split("T")[0];
  if (filter === "today") {
    const s = toISO(now);
    return { from: s, to: s };
  }
  if (filter === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return { from: toISO(start), to: toISO(now) };
  }
  if (filter === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toISO(start), to: toISO(now) };
  }
  return {};
}

function groupByDate(items: RentalHistoryItem[], locale: string): [string, RentalHistoryItem[]][] {
  // Timeline grouping is done entirely on the frontend.
  // The backend returns a flat list ordered by updatedAt.
  const groups = new Map<string, RentalHistoryItem[]>();
  for (const item of items) {
    const key = new Date(item.updatedAt).toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries());
}

function dateGroupLabel(dateStr: string, locale: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const todayStr = now.toDateString();
  const yestStr = new Date(now.getTime() - 86_400_000).toDateString();
  if (d.toDateString() === todayStr) return locale === "ar" ? "اليوم" : "Today";
  if (d.toDateString() === yestStr) return locale === "ar" ? "أمس" : "Yesterday";
  return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

  return (
    <div 
      onClick={onClick}
      className={`group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 hover:shadow-md hover:border-amber-200 dark:hover:border-amber-800/50 transition-all hover:scale-[1.02] flex flex-col items-center text-center gap-3 ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Cover Image or Icon */}
      <div className="shrink-0">
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
        {/* Title */}
        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 font-cairo line-clamp-2 h-10 sm:h-auto">
          {item.listing.title}
        </h3>
      </div>
      
      <div className="mt-1 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30 font-cairo shrink-0">
          <CheckCircle2 size={12} />
          {locale === "ar" ? "مكتمل" : "Completed"}
        </span>
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
  const groups = groupByDate(items, locale);

  if (groups.length === 0) {
    return <EmptyState locale={locale} />;
  }

  return (
    <div className="space-y-8">
      {groups.map(([dateKey, groupItems]) => (
        <div key={dateKey}>
          {/* Date Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-cairo px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full">
              {dateGroupLabel(dateKey, locale)}
            </span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Items */}
          <div className="space-y-3">
            {groupItems.map((item) => (
              <div key={item.id} className="flex gap-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="w-px flex-1 bg-slate-200 dark:bg-slate-800 mt-1" />
                </div>
                {/* Card */}
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
        {locale === "ar" ? "لا توجد إيجارات مكتملة بعد" : "No completed rentals yet"}
      </h3>
      <p className="text-sm text-slate-400 dark:text-slate-500 font-cairo max-w-xs">
        {locale === "ar"
          ? "ستظهر هنا سجلات الإيجارات المكتملة."
          : "Completed rental records will appear here."}
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LandlordRentalHistoryPage() {
  const locale = useLocale();
  const { user, isLoading: isAuthLoading } = useAuthGuard({ role: "landlord" });
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

  // Build date range
  const dateRange = useMemo(() => {
    if (quickFilter === "custom") return { from: customFrom || undefined, to: customTo || undefined };
    return getDateRange(quickFilter);
  }, [quickFilter, customFrom, customTo]);

  const { data, isLoading, isFetching } = useLandlordRentalHistory({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    from: dateRange.from,
    to: dateRange.to,
    sort,
  });

  const items = data?.data ?? [];
  const meta = data?.meta;
  const lastPage = meta?.lastPage ?? 1;

  if (isAuthLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const quickFilters: { key: QuickFilter; ar: string; en: string }[] = [
    { key: "all", ar: "الكل", en: "All" },
    { key: "today", ar: "اليوم", en: "Today" },
    { key: "week", ar: "هذا الأسبوع", en: "This Week" },
    { key: "month", ar: "هذا الشهر", en: "This Month" },
    { key: "custom", ar: "نطاق مخصص", en: "Custom Range" },
  ];

  return (
    <LandlordLayout>
      <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-cairo flex items-center gap-2">
              <History size={24} className="text-amber-500" />
              {isRtl ? "سجل الإيجارات" : "Rental History"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo mt-0.5">
              {isRtl
                ? "جميع الإيجارات المكتملة مرتبة من الأحدث إلى الأقدم"
                : "All completed rentals, newest first"}
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
                    ? "ابحث بعنوان الإعلان أو اسم المستأجر..."
                    : "Search by listing title or tenant name..."
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
                ? `${meta.total} نتيجة — صفحة ${page} من ${lastPage}`
                : `${meta.total} results — Page ${page} of ${lastPage}`}
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
          title={locale === "ar" ? "تفاصيل الإيجار" : "Rental Details"}
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
                <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30 mb-1.5">
                  <CheckCircle2 size={12} />
                  {locale === "ar" ? "مكتمل" : "Completed"}
                </span>
                <h3 className="font-bold text-sm sm:text-lg text-slate-900 dark:text-slate-100 leading-snug truncate">
                  {selectedItem.listing.title}
                </h3>
              </div>
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {selectedItem.tenant && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 text-slate-500">
                    <User size={14} className="sm:w-4 sm:h-4 shrink-0" />
                    <span className="text-[10px] sm:text-xs font-medium">{locale === "ar" ? "المستأجر" : "Tenant"}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="font-bold text-xs sm:text-sm">{selectedItem.tenant.name}</p>
                    {selectedItem.tenant.phone && (
                      <a href={`tel:${selectedItem.tenant.phone}`} className="font-bold text-amber-500 hover:underline text-[10px] sm:text-xs font-sans block" style={{ direction: "ltr", textAlign: locale === "ar" ? "right" : "left" }}>
                        {selectedItem.tenant.phone}
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 text-slate-500">
                  <BadgeDollarSign size={14} className="sm:w-4 sm:h-4 shrink-0" />
                  <span className="text-[10px] sm:text-xs font-medium">{locale === "ar" ? "السعر" : "Price"}</span>
                </div>
                <p className="font-bold text-amber-600 dark:text-amber-400 text-xs sm:text-sm">
                  {formatPrice(selectedItem.listing.price, locale)} {locale === "ar" ? "ج.م" : "EGP"}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-800 col-span-2">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 text-slate-500">
                  <MapPin size={14} className="sm:w-4 sm:h-4 shrink-0" />
                  <span className="text-[10px] sm:text-xs font-medium">{locale === "ar" ? "الموقع" : "Location"}</span>
                </div>
                <p className="font-bold text-xs sm:text-sm">
                  {selectedItem.listing.governorate}، {selectedItem.listing.district}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {formatDate(selectedItem.updatedAt, locale)}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Hash size={10} />
                {selectedItem.id}
              </span>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
              <Link
                href={`/${locale}/listings/${selectedItem.listing.id}`}
                className="flex-1 text-center inline-flex justify-center items-center gap-1.5 text-xs sm:text-sm font-medium px-4 py-2.5 sm:py-3 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              >
                {locale === "ar" ? "عرض الإعلان" : "View Listing"}
              </Link>
              {selectedItem.tenant && (
                <Link
                  href={`/${locale}/dashboard/landlord/requests?tenant=${selectedItem.tenant.id}`}
                  className="flex-1 text-center inline-flex justify-center items-center gap-1.5 text-xs sm:text-sm font-medium px-4 py-2.5 sm:py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <User size={14} />
                  {locale === "ar" ? "طلبات المستأجر" : "Tenant Requests"}
                </Link>
              )}
            </div>
          </div>
        </Modal>
      )}
    </LandlordLayout>
  );
}
