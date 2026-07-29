// apps/frontend/src/components/search/SearchHeader.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Building2,
  Coins,
  ChevronDown,
  X,
  Check,
  RotateCcw,
} from "lucide-react";
import { EGYPTIAN_GOVERNORATES } from "@/lib/constants";
import type { SearchFilters, UnitType } from "@/types";
import { Button, Input } from "@/components/ui";

interface SearchHeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
  onOpenMobileFilters: () => void;
  isFilterOpen?: boolean;
  filters: SearchFilters;
  onChange: (partial: Partial<SearchFilters>) => void;
  activeExtraFiltersCount?: number;
}

export function SearchHeader({
  query,
  onQueryChange,
  onOpenMobileFilters,
  isFilterOpen = false,
  filters,
  onChange,
  activeExtraFiltersCount = 0,
}: SearchHeaderProps) {
  const [openDropdown, setOpenDropdown] = useState<"governorate" | "unitType" | "price" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (name: "governorate" | "unitType" | "price") => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  return (
    <div
      ref={containerRef}
      className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border shadow-xs font-cairo"
    >
      <div className="container mx-auto px-4 py-3 space-y-2.5">
        {/* Top Search Input Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              aria-label="البحث بالمنطقة، المدينة، أو الوصف"
              placeholder="ابحث بالمنطقة، المدينة، الحي، أو الوصف..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              leftIcon={<Search size={18} className="text-text-tertiary" />}
              className="text-xs sm:text-sm font-semibold rounded-xl bg-surface-secondary focus:bg-surface"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onQueryChange("")}
                className="absolute end-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-text-tertiary hover:text-text"
              >
                <X size={14} />
              </Button>
            )}
          </div>

          {/* More Filters Trigger */}
          <Button
            type="button"
            variant={activeExtraFiltersCount > 0 ? "primary" : "outline"}
            size="md"
            onClick={onOpenMobileFilters}
            aria-label="فتح فلاتر البحث المتقدمة"
            aria-expanded={isFilterOpen}
            leftIcon={<SlidersHorizontal size={16} />}
            className="shrink-0 text-xs font-bold rounded-xl"
          >
            الفلاتر
            {activeExtraFiltersCount > 0 && (
              <span className="ms-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-text">
                {activeExtraFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* Quick Filters Strip */}
        <div className="relative flex items-center gap-2 text-xs font-semibold">
          
          {/* 1. Governorate Pill */}
          <div className="relative">
            <Button
              type="button"
              variant={filters.governorate ? "primary" : "outline"}
              size="sm"
              onClick={() => toggleDropdown("governorate")}
              leftIcon={<MapPin size={13} />}
              rightIcon={<ChevronDown size={13} />}
              className="rounded-full text-xs font-bold whitespace-nowrap"
            >
              {filters.governorate || "المحافظة"}
            </Button>

            {openDropdown === "governorate" && (
              <div className="absolute start-0 top-full mt-1 w-36 bg-surface rounded-2xl shadow-xl border border-border p-1.5 z-40 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                <Button
                  type="button"
                  variant={!filters.governorate ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    onChange({ governorate: "", district: "", page: 1 });
                    setOpenDropdown(null);
                  }}
                  className="w-full justify-start text-xs rounded-lg"
                >
                  كل المحافظات
                </Button>
                {EGYPTIAN_GOVERNORATES.map((gov) => (
                  <Button
                    key={gov}
                    type="button"
                    variant={filters.governorate === gov ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => {
                      onChange({ governorate: gov, district: "", page: 1 });
                      setOpenDropdown(null);
                    }}
                    className="w-full justify-start text-xs rounded-lg mt-0.5"
                  >
                    {gov}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Unit Type Pill */}
          <div className="relative">
            <Button
              type="button"
              variant={filters.unitType ? "primary" : "outline"}
              size="sm"
              onClick={() => toggleDropdown("unitType")}
              leftIcon={<Building2 size={13} />}
              rightIcon={<ChevronDown size={13} />}
              className="rounded-full text-xs font-bold whitespace-nowrap"
            >
              {filters.unitType === "apartment"
                ? "شقة كاملة"
                : filters.unitType === "bed"
                ? "سرير / غرفة"
                : "نوع الوحدة"}
            </Button>

            {openDropdown === "unitType" && (
              <div className="absolute start-0 top-full mt-1 w-36 bg-surface rounded-2xl shadow-xl border border-border p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                {[
                  { value: undefined, label: "جميع الوحدات" },
                  { value: "apartment", label: "شقة بالكامل" },
                  { value: "bed", label: "سرير / غرفة" },
                ].map((option) => (
                  <Button
                    key={String(option.value)}
                    type="button"
                    variant={filters.unitType === option.value ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => {
                      onChange({ unitType: option.value as UnitType | undefined, page: 1 });
                      setOpenDropdown(null);
                    }}
                    className="w-full justify-start text-xs rounded-lg mt-0.5"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Price Range Pill */}
          <div className="relative">
            <Button
              type="button"
              variant={filters.minPrice || filters.maxPrice ? "primary" : "outline"}
              size="sm"
              onClick={() => toggleDropdown("price")}
              leftIcon={<Coins size={13} />}
              rightIcon={<ChevronDown size={13} />}
              className="rounded-full text-xs font-bold whitespace-nowrap"
            >
              {filters.minPrice && filters.maxPrice
                ? `${filters.minPrice} - ${filters.maxPrice} ج.م`
                : filters.minPrice
                ? `من ${filters.minPrice} ج.م`
                : filters.maxPrice
                ? `حتى ${filters.maxPrice} ج.م`
                : "السعر"}
            </Button>

            {openDropdown === "price" && (
              <div className="absolute end-0 top-full mt-1 w-56 bg-surface rounded-2xl shadow-xl border border-border p-3 z-40 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-divider pb-1.5">
                  <span className="text-[11px] font-bold text-text">السعر الشهري (جنيه)</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpenDropdown(null)}
                    className="h-5 w-5 p-0 text-text-tertiary hover:text-text"
                  >
                    <X size={13} />
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <input
                    type="range"
                    min={0}
                    max={30000}
                    step={500}
                    value={filters.maxPrice ?? 25000}
                    onChange={(e) => onChange({ maxPrice: Number(e.target.value), page: 1 })}
                    className="w-full h-1 bg-surface-tertiary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      placeholder="من"
                      value={filters.minPrice ?? ""}
                      onChange={(e) => onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
                      className="text-xs font-semibold py-1 px-2 h-8"
                      min={0}
                    />
                    <span className="text-text-tertiary text-xs">—</span>
                    <Input
                      type="number"
                      placeholder="إلى"
                      value={filters.maxPrice ?? ""}
                      onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
                      className="text-xs font-semibold py-1 px-2 h-8"
                      min={0}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1.5 border-t border-divider">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange({ minPrice: undefined, maxPrice: undefined, page: 1 })}
                    className="text-[10px] text-text-secondary hover:text-text p-1 h-auto"
                    leftIcon={<RotateCcw size={10} />}
                  >
                    مسح
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setOpenDropdown(null)}
                    className="text-[11px] font-bold px-3 py-1 h-7 rounded-lg"
                    leftIcon={<Check size={12} />}
                  >
                    تطبيق
                  </Button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
