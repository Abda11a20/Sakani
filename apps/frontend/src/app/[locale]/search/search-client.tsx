// apps/frontend/src/app/[locale]/search/search-client.tsx
"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMyAlerts } from "@/hooks/useAlerts";
import { useMatchingAlert } from "@/hooks/useAlertMatching";
import {
  Search,
  Filter,
  X,
  Building2,
  BedDouble,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Wind,
  Layers,
  WashingMachine,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { ListingCard, ListingCardSkeleton } from "@/components/listings/ListingCard";
import type { Listing, SearchFilters, UnitType, GenderTarget } from "@/types";

// ── Constants ─────────────────────────────────────────────────
const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "الشرقية",
  "المنوفية", "الغربية", "البحيرة", "القليوبية", "الإسماعيلية",
  "بورسعيد", "السويس", "دمياط", "أسيوط", "سوهاج", "قنا",
];

const AMENITIES = [
  { key: "wifi", label: "واي فاي", icon: Wifi },
  { key: "ac", label: "تكييف", icon: Wind },
  { key: "elevator", label: "أسانسير", icon: Layers },
  { key: "washer", label: "غسالة", icon: WashingMachine },
];

const SORT_OPTIONS = [
  { value: "newest", label: "الأحدث" },
  { value: "cheapest", label: "الأرخص" },
  { value: "expensive", label: "الأغلى" },
  { value: "popular", label: "الأكثر مشاهدة" },
];

// ── Types ─────────────────────────────────────────────────────
interface SearchResult {
  items: Listing[];
  meta: { total: number; page: number; limit: number; lastPage: number };
}

// ── Helpers ───────────────────────────────────────────────────
function buildQueryString(filters: SearchFilters): string {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.unitType) params.set("unitType", filters.unitType);
  if (filters.governorate) params.set("governorate", filters.governorate);
  if (filters.district) params.set("district", filters.district);
  if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters.genderTarget) params.set("genderTarget", filters.genderTarget);
  if (filters.verifiedOnly) params.set("verifiedOnly", "true");
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.amenities?.length) params.set("amenities", filters.amenities.join(","));
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  return params.toString();
}

function parseInitialFilters(raw: Record<string, string>): SearchFilters {
  return {
    query: raw.q || raw.query || "",
    unitType: (raw.unitType as UnitType) || undefined,
    governorate: raw.governorate || "",
    district: raw.district || "",
    minPrice: raw.minPrice ? Number(raw.minPrice) : undefined,
    maxPrice: raw.maxPrice ? Number(raw.maxPrice) : undefined,
    genderTarget: (raw.genderTarget as GenderTarget) || undefined,
    verifiedOnly: raw.verifiedOnly === "true",
    sortBy: (raw.sortBy as SearchFilters["sortBy"]) || "newest",
    amenities: raw.amenities ? raw.amenities.split(",") : [],
    page: raw.page ? Number(raw.page) : 1,
    limit: 12,
  };
}

// ── Filter Sidebar ────────────────────────────────────────────
function FilterSidebar({
  filters,
  onChange,
  onReset,
  onApply,
  className = "",
}: {
  filters: SearchFilters;
  onChange: (partial: Partial<SearchFilters>) => void;
  onReset: () => void;
  onApply: () => void;
  className?: string;
}) {
  const toggleAmenity = (key: string) => {
    const current = filters.amenities ?? [];
    const next = current.includes(key)
      ? current.filter((a) => a !== key)
      : [...current, key];
    onChange({ amenities: next });
  };

  return (
    <aside className={`flex flex-col gap-6 ${className}`}>
      {/* Unit Type */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">نوع الوحدة</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "apartment", label: "شقة", icon: Building2 },
            { value: "bed", label: "سرير", icon: BedDouble },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() =>
                onChange({
                  unitType: filters.unitType === value ? undefined : (value as UnitType),
                  page: 1,
                })
              }
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-semibold transition-all
                ${filters.unitType === value
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-card text-foreground hover:border-primary/50"
                }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">السعر (جنيه/شهر)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="من"
            value={filters.minPrice ?? ""}
            onChange={(e) => onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
            className="input-field flex-1 text-sm py-2"
            min={0}
          />
          <span className="text-muted-foreground text-sm">—</span>
          <input
            type="number"
            placeholder="إلى"
            value={filters.maxPrice ?? ""}
            onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
            className="input-field flex-1 text-sm py-2"
            min={0}
          />
        </div>
      </div>

      {/* Governorate */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">المحافظة</h3>
        <select
          value={filters.governorate ?? ""}
          onChange={(e) => onChange({ governorate: e.target.value, district: "", page: 1 })}
          className="input-field w-full text-sm py-2"
        >
          <option value="">كل المحافظات</option>
          {GOVERNORATES.map((gov) => (
            <option key={gov} value={gov}>{gov}</option>
          ))}
        </select>
      </div>

      {/* District */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">الحي / المنطقة</h3>
        <input
          type="text"
          placeholder="مثال: المنصورة، الزقازيق..."
          value={filters.district ?? ""}
          onChange={(e) => onChange({ district: e.target.value, page: 1 })}
          className="input-field w-full text-sm py-2"
        />
      </div>

      {/* Gender Target */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">الفئة المستهدفة</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: undefined, label: "الجميع" },
            { value: "male", label: "شباب" },
            { value: "female", label: "بنات" },
            { value: "family", label: "عائلات" },
          ].map(({ value, label }) => (
            <button
              key={label}
              onClick={() => onChange({ genderTarget: value as GenderTarget | undefined, page: 1 })}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all
                ${filters.genderTarget === value
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-card text-foreground hover:border-primary/50"
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">المميزات</h3>
        <div className="space-y-2">
          {AMENITIES.map(({ key, label, icon: Icon }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.amenities?.includes(key) ?? false}
                onChange={() => toggleAmenity(key)}
                className="w-4 h-4 rounded accent-primary"
              />
              <Icon size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm text-foreground">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Verified Only */}
      <div>
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-green-500" />
            <div>
              <p className="text-sm font-semibold text-foreground">موثق فقط</p>
              <p className="text-xs text-muted-foreground">عرض إعلانات المؤجرين الموثقين فقط</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={filters.verifiedOnly}
            onClick={() => onChange({ verifiedOnly: !filters.verifiedOnly, page: 1 })}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              filters.verifiedOnly ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`absolute top-0.5 start-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                filters.verifiedOnly ? "translate-x-5 rtl:-translate-x-5" : ""
              }`}
            />
          </button>
        </label>
      </div>

      {/* Sort */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">ترتيب النتائج</h3>
        <select
          value={filters.sortBy ?? "newest"}
          onChange={(e) => onChange({ sortBy: e.target.value as SearchFilters["sortBy"], page: 1 })}
          className="input-field w-full text-sm py-2"
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onApply}
          className="flex-1 btn-primary py-2.5 text-sm font-bold rounded-xl"
        >
          تطبيق الفلاتر
        </button>
        <button
          onClick={onReset}
          className="px-4 py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-muted/10 transition-colors"
        >
          مسح الكل
        </button>
      </div>
    </aside>
  );
}

// ── Active Filter Chips ───────────────────────────────────────
function ActiveFilterChips({
  filters,
  onChange,
}: {
  filters: SearchFilters;
  onChange: (partial: Partial<SearchFilters>) => void;
}) {
  const chips: { label: string; onRemove: () => void }[] = [];

  if (filters.unitType) {
    const labels: Record<string, string> = { apartment: "شقة", bed: "سرير" };
    chips.push({ label: labels[filters.unitType], onRemove: () => onChange({ unitType: undefined, page: 1 }) });
  }
  if (filters.governorate) chips.push({ label: filters.governorate, onRemove: () => onChange({ governorate: "", page: 1 }) });
  if (filters.district) chips.push({ label: filters.district, onRemove: () => onChange({ district: "", page: 1 }) });
  if (filters.minPrice) chips.push({ label: `من ${filters.minPrice} جنيه`, onRemove: () => onChange({ minPrice: undefined, page: 1 }) });
  if (filters.maxPrice) chips.push({ label: `حتى ${filters.maxPrice} جنيه`, onRemove: () => onChange({ maxPrice: undefined, page: 1 }) });
  if (filters.verifiedOnly) chips.push({ label: "موثق فقط", onRemove: () => onChange({ verifiedOnly: false, page: 1 }) });
  if (filters.genderTarget) {
    const labels: Record<string, string> = { male: "شباب", female: "بنات", family: "عائلات", any: "الجميع" };
    chips.push({ label: labels[filters.genderTarget] ?? "", onRemove: () => onChange({ genderTarget: undefined, page: 1 }) });
  }
  filters.amenities?.forEach((a) => {
    const found = AMENITIES.find((am) => am.key === a);
    if (found) {
      chips.push({
        label: found.label,
        onRemove: () => onChange({ amenities: filters.amenities?.filter((x) => x !== a), page: 1 }),
      });
    }
  });

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {chips.map((chip, i) => (
        <span
          key={i}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20"
        >
          {chip.label}
          <button onClick={chip.onRemove} className="hover:text-red-500 transition-colors">
            <X size={12} />
          </button>
        </span>
      ))}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────
function Pagination({
  page,
  lastPage,
  onPageChange,
}: {
  page: number;
  lastPage: number;
  onPageChange: (p: number) => void;
}) {
  if (lastPage <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="p-2 rounded-xl border border-border disabled:opacity-40 hover:bg-muted/10 transition-colors"
      >
        <ChevronRight size={18} />
      </button>

      {Array.from({ length: Math.min(lastPage, 7) }, (_, i) => {
        let pageNum = i + 1;
        if (lastPage > 7) {
          if (page <= 4) pageNum = i + 1;
          else if (page >= lastPage - 3) pageNum = lastPage - 6 + i;
          else pageNum = page - 3 + i;
        }
        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
              page === pageNum
                ? "bg-primary text-white"
                : "border border-border hover:bg-muted/10 text-foreground"
            }`}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        disabled={page >= lastPage}
        onClick={() => onPageChange(page + 1)}
        className="p-2 rounded-xl border border-border disabled:opacity-40 hover:bg-muted/10 transition-colors"
      >
        <ChevronLeft size={18} />
      </button>
    </div>
  );
}

// Wrapper card to fetch alert matching for search results without breaking hooks rules
function SearchListingCard({ listing }: { listing: Listing }) {
  const matchingAlert = useMatchingAlert(listing);
  return <ListingCard listing={listing} matchingAlert={matchingAlert} />;
}

// ── Main Search Client Component ──────────────────────────────
export function SearchPageClient({
  locale,
  initialFilters,
}: {
  locale: string;
  initialFilters: Record<string, string>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { data: alerts } = useMyAlerts();

  const [filters, setFilters] = useState<SearchFilters>(() =>
    parseInitialFilters(initialFilters)
  );
  const [pendingFilters, setPendingFilters] = useState<SearchFilters>(() =>
    parseInitialFilters(initialFilters)
  );
  const [result, setResult] = useState<SearchResult>({ items: [], meta: { total: 0, page: 1, limit: 12, lastPage: 0 } });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync filters from alertId if present
  useEffect(() => {
    const alertId = initialFilters.alertId;
    if (alertId && alerts && alerts.length > 0) {
      const activeAlert = alerts.find((a) => a.id === alertId);
      if (activeAlert) {
        const nextFilters: SearchFilters = {
          query: "",
          unitType: activeAlert.unitType || undefined,
          governorate: activeAlert.governorate || "",
          district: activeAlert.district || "",
          maxPrice: activeAlert.maxPrice || undefined,
          genderTarget: activeAlert.genderTarget || undefined,
          page: 1,
          limit: 12,
        };
        setFilters(nextFilters);
        setPendingFilters(nextFilters);
      }
    }
  }, [initialFilters.alertId, alerts]);

  // Sync URL
  const syncUrl = useCallback(
    (f: SearchFilters) => {
      const qs = buildQueryString(f);
      startTransition(() => {
        router.push(`/${locale}/search${qs ? `?${qs}` : ""}`, { scroll: false });
      });
    },
    [locale, router]
  );

  // Fetch results
  const fetchResults = useCallback(async (f: SearchFilters) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (f.query) params.q = f.query;
      if (f.unitType) params.unitType = f.unitType;
      if (f.governorate) params.governorate = f.governorate;
      if (f.district) params.district = f.district;
      if (f.minPrice) params.minPrice = String(f.minPrice);
      if (f.maxPrice) params.maxPrice = String(f.maxPrice);
      if (f.genderTarget) params.genderTarget = f.genderTarget;
      if (f.verifiedOnly) params.verifiedOnly = "true";
      if (f.sortBy) params.sortBy = f.sortBy;
      if (f.amenities?.length) params.amenities = f.amenities.join(",");
      params.page = String(f.page ?? 1);
      params.limit = String(f.limit ?? 12);

      const response = await api.get("/search", { params });
      const data = response.data;

      // Handle various response shapes
      if (data?.items && data?.meta) {
        setResult(data);
      } else if (data?.data && Array.isArray(data.data)) {
        setResult({
          items: data.data,
          meta: {
            total: data.total ?? data.data.length,
            page: data.page ?? 1,
            limit: data.limit ?? 12,
            lastPage: data.totalPages ?? 1
          }
        });
      } else if (Array.isArray(data)) {
        setResult({ items: data, meta: { total: data.length, page: 1, limit: 12, lastPage: 1 } });
      } else {
        setResult({ items: [], meta: { total: 0, page: 1, limit: 12, lastPage: 0 } });
      }
    } catch {
      setResult({ items: [], meta: { total: 0, page: 1, limit: 12, lastPage: 0 } });
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResults(filters);
      syncUrl(filters);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, fetchResults, syncUrl]);

  const handleFilterChange = (partial: Partial<SearchFilters>) => {
    const next = { ...filters, ...partial };
    setFilters(next);
    setPendingFilters(next);
  };

  const handleApply = () => {
    setFilters(pendingFilters);
    setSidebarOpen(false);
  };

  const handleReset = () => {
    const empty: SearchFilters = { sortBy: "newest", page: 1, limit: 12 };
    setFilters(empty);
    setPendingFilters(empty);
    setSidebarOpen(false);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Top Search Bar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث بالمنطقة، المدينة، أو وصف..."
              value={filters.query ?? ""}
              onChange={(e) => handleFilterChange({ query: e.target.value, page: 1 })}
              className="input-field w-full ps-10 py-2.5 text-sm"
            />
          </div>
          {/* Mobile filter button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center gap-2 btn-primary px-4 py-2.5 text-sm font-semibold rounded-xl"
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">فلاتر</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-20 bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-foreground flex items-center gap-2">
                  <Filter size={16} />
                  الفلاتر
                </h2>
              </div>
              <FilterSidebar
                filters={filters}
                onChange={handleFilterChange}
                onReset={handleReset}
                onApply={handleApply}
              />
            </div>
          </div>

          {/* Results Area */}
          <div className="flex-1 min-w-0">
            {/* Result count & sort */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  {loading ? (
                    <span className="text-muted-foreground">جارٍ البحث...</span>
                  ) : (
                    <>
                      عُثر على{" "}
                      <span className="text-primary">{result.meta.total}</span>{" "}
                      نتيجة
                    </>
                  )}
                </h1>
              </div>
              <select
                value={filters.sortBy ?? "newest"}
                onChange={(e) => handleFilterChange({ sortBy: e.target.value as SearchFilters["sortBy"], page: 1 })}
                className="input-field py-2 px-3 text-sm min-w-36"
              >
                {SORT_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Active Chips */}
            <ActiveFilterChips filters={filters} onChange={handleFilterChange} />

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <ListingCardSkeleton key={i} />
                ))}
              </div>
            ) : result.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center mb-5">
                  <Search size={32} className="text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">لا توجد نتائج</h2>
                <p className="text-muted-foreground mb-6">
                  جرب تعديل الفلاتر أو تغيير كلمة البحث
                </p>
                <button
                  onClick={handleReset}
                  className="btn-primary px-6 py-2.5 text-sm font-semibold rounded-xl"
                >
                  مسح الفلاتر
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
                {result.items.map((listing) => (
                  <SearchListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && (
              <Pagination
                page={result.meta.page}
                lastPage={result.meta.lastPage}
                onPageChange={(p) => handleFilterChange({ page: p })}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute bottom-0 start-0 end-0 bg-background rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-background flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
              <h2 className="font-bold text-foreground">الفلاتر</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-xl hover:bg-muted/10"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <FilterSidebar
                filters={pendingFilters}
                onChange={(p) => setPendingFilters((prev) => ({ ...prev, ...p }))}
                onReset={handleReset}
                onApply={handleApply}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
