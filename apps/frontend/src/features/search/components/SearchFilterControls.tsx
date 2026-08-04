// apps/frontend/src/components/search/SearchFilterControls.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Building2,
  BedDouble,
  Wifi,
  Wind,
  ArrowUpDown,
  WashingMachine,
  Tv,
  Flame,
  Droplets,
  Shield,
  Home,
  Car,
  ShieldCheck,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  MapPin,
  Coins,
} from "lucide-react";
import { useLocale } from "next-intl";
import { EGYPTIAN_GOVERNORATES, GENDER_TARGET_CONFIG, AMENITIES_CONFIG } from "@/lib/constants";
import type { SearchFilters, UnitType, GenderTarget } from "@/types";

const AMENITY_ICON_MAP_SEARCH: Record<string, React.ReactNode> = {
  wifi:         <Wifi size={13} />,
  ac:           <Wind size={13} />,
  elevator:     <ArrowUpDown size={13} />,
  washer:       <WashingMachine size={13} />,
  tv:           <Tv size={13} />,
  fan:          <Wind size={13} />,
  stove:        <Flame size={13} />,
  fridge:       <Flame size={13} />,
  water_heater: <Droplets size={13} />,
  water_filter: <Droplets size={13} />,
  natural_gas:  <Flame size={13} />,
  security:     <Shield size={13} />,
  balcony:      <Home size={13} />,
  parking:      <Car size={13} />,
};

const SORT_OPTIONS = [
  { value: "newest", label: "الأحدث الإضافة" },
  { value: "cheapest", label: "الأقل سعراً" },
  { value: "expensive", label: "الأعلى سعراً" },
  { value: "popular", label: "الأكثر مشاهدة" },
];

interface CustomSelectProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  placeholder?: string;
}

function CustomSelect({ value, options, onChange, placeholder }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between text-xs font-bold text-text px-2.5 py-1.5 rounded-xl border border-border bg-surface hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer shadow-xs text-start"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder || "اختر..."}
        </span>
        <ChevronDown
          size={13}
          className={`text-text-tertiary shrink-0 transition-transform ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute start-0 top-full mt-1 w-full bg-surface rounded-xl border border-border shadow-xl z-50 max-h-44 overflow-y-auto p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 font-cairo">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-start px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:bg-surface-tertiary hover:text-text"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check size={12} className="text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface SearchFilterControlsProps {
  filters: SearchFilters;
  onChange: (partial: Partial<SearchFilters>) => void;
  onReset: () => void;
  onApply: () => void;
  className?: string;
  hideActions?: boolean;
}

export function SearchFilterControls({
  filters,
  onChange,
  onReset,
  onApply,
  className = "",
  hideActions = false,
}: SearchFilterControlsProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const toggleAmenity = (key: string) => {
    const current = filters.amenities ?? [];
    const next = current.includes(key)
      ? current.filter((a) => a !== key)
      : [...current, key];
    onChange({ amenities: next, page: 1 });
  };

  return (
    <div className={`flex flex-col gap-2.5 font-cairo ${className}`}>
      {/* 1. Location: Governorate & District Side-by-Side */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs font-bold text-text">
          <MapPin size={14} className="text-primary" />
          <span>{isRtl ? "الموقع والجغرافيا" : "Location & Geography"}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold text-text-secondary mb-0.5 block">{isRtl ? "المحافظة" : "Governorate"}</label>
            <CustomSelect
              value={filters.governorate ?? ""}
              options={[
                { value: "", label: isRtl ? "كل المحافظات" : "All Governorates" },
                ...EGYPTIAN_GOVERNORATES.map((gov) => ({ value: gov, label: gov })),
              ]}
              onChange={(val) => onChange({ governorate: val, district: "", page: 1 })}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-text-secondary mb-0.5 block">{isRtl ? "الحي / المنطقة" : "District / Area"}</label>
            <input
              type="text"
              placeholder={isRtl ? "مثال: المنصورة" : "e.g., Mansoura"}
              value={filters.district ?? ""}
              onChange={(e) => onChange({ district: e.target.value, page: 1 })}
              className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-border focus:outline-none focus:border-primary bg-surface truncate text-text placeholder:text-text-tertiary"
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-border/50" />

      {/* 2. Unit Type */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs font-bold text-text">
          <Building2 size={14} className="text-primary" />
          <span>{isRtl ? "نوع الوحدة السكنية" : "Unit Type"}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "apartment", label: isRtl ? "شقة بالكامل" : "Entire Apartment", icon: Building2 },
            { value: "bed", label: isRtl ? "سرير / غرفة" : "Bed / Room", icon: BedDouble },
          ].map(({ value, label, icon: Icon }) => {
            const isSelected = filters.unitType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() =>
                  onChange({
                    unitType: isSelected ? undefined : (value as UnitType),
                    page: 1,
                  })
                }
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary text-white shadow-xs"
                    : "border-border bg-surface text-text hover:border-primary/50 hover:bg-surface-secondary"
                }`}
              >
                <Icon size={14} />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-border/50" />

      {/* 3. Price Range (Dual Inputs + Range Slider) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs font-bold text-text">
            <Coins size={14} className="text-primary" />
            <span>{isRtl ? "نطاق السعر الشهري" : "Monthly Price Range"}</span>
          </div>
          <span className="text-[10px] font-bold text-primary">
            {filters.minPrice || filters.maxPrice
              ? `${filters.minPrice ?? 0} - ${filters.maxPrice ?? (isRtl ? "أقصى" : "Max")} ${isRtl ? "ج.م" : "EGP"}`
              : (isRtl ? "أي سعر" : "Any Price")}
          </span>
        </div>

        <div className="px-0.5 space-y-1.5">
          <input
            type="range"
            min={0}
            max={30000}
            step={500}
            value={filters.maxPrice ?? 25000}
            onChange={(e) => onChange({ maxPrice: Number(e.target.value), page: 1 })}
            className="w-full h-1.5 bg-surface-tertiary rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              placeholder={isRtl ? "من" : "Min"}
              value={filters.minPrice ?? ""}
              onChange={(e) => onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
              className="w-full text-xs font-semibold px-2 py-1 rounded-lg border border-border focus:outline-none focus:border-primary bg-surface text-text placeholder:text-text-tertiary"
              min={0}
            />
            <span className="text-text-tertiary font-bold text-xs">—</span>
            <input
              type="number"
              placeholder={isRtl ? "إلى" : "Max"}
              value={filters.maxPrice ?? ""}
              onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
              className="w-full text-xs font-semibold px-2 py-1 rounded-lg border border-border focus:outline-none focus:border-primary bg-surface text-text placeholder:text-text-tertiary"
              min={0}
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-border/50" />

      {/* 4. Gender Target & Sort Side-by-Side */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-semibold text-text-secondary mb-0.5 block">{isRtl ? "الفئة المستهدفة" : "Target Audience"}</label>
          <CustomSelect
            value={filters.genderTarget ?? ""}
            options={[
              { value: "", label: isRtl ? "جميع الفئات" : "All Audiences" },
              { value: "male", label: isRtl ? GENDER_TARGET_CONFIG.male.labelAr : GENDER_TARGET_CONFIG.male.labelEn },
              { value: "female", label: isRtl ? GENDER_TARGET_CONFIG.female.labelAr : GENDER_TARGET_CONFIG.female.labelEn },
              { value: "family", label: isRtl ? GENDER_TARGET_CONFIG.family.labelAr : GENDER_TARGET_CONFIG.family.labelEn },
            ]}
            onChange={(val) => onChange({ genderTarget: (val || undefined) as GenderTarget | undefined, page: 1 })}
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-text-secondary mb-0.5 block">{isRtl ? "ترتيب النتائج" : "Sort By"}</label>
          <CustomSelect
            value={filters.sortBy ?? "newest"}
            options={[
              { value: "newest", label: isRtl ? "الأحدث إضافتاً" : "Newest" },
              { value: "cheapest", label: isRtl ? "الأقل سعراً" : "Lowest Price" },
              { value: "expensive", label: isRtl ? "الأعلى سعراً" : "Highest Price" },
              { value: "popular", label: isRtl ? "الأكثر مشاهدة" : "Most Popular" },
            ]}
            onChange={(val) => onChange({ sortBy: val as SearchFilters["sortBy"], page: 1 })}
          />
        </div>
      </div>

      <div className="h-px bg-border/50" />

      {/* 5. Advanced Filters Collapsible Accordion */}
      <div className="border border-border rounded-xl overflow-hidden bg-surface">
        <button
          type="button"
          onClick={() => setIsAccordionOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-2.5 bg-surface-secondary hover:bg-surface-tertiary transition-colors cursor-pointer text-xs font-bold text-text"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-primary">⚙</span>
            <span>{isRtl ? "مواصفات إضافية (مفروش، خدمات، توثيق)" : "Additional Filters (Furnished, Amenities, Verified)"}</span>
          </div>
          {isAccordionOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {isAccordionOpen && (
          <div className="p-3 space-y-3 animate-in fade-in duration-150">
            {/* Furnishing Status */}
            <div>
              <h4 className="text-[11px] font-bold text-text mb-1.5">{isRtl ? "حالة الفرش" : "Furnishing Status"}</h4>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: undefined, label: isRtl ? "الكل" : "All" },
                  { value: true, label: isRtl ? "مفروشة 🛋️" : "Furnished 🛋️" },
                  { value: false, label: isRtl ? "فارغة 🚪" : "Unfurnished 🚪" },
                ].map((item) => {
                  const isSelected = filters.isFurnished === item.value;
                  return (
                    <button
                      key={String(item.value)}
                      type="button"
                      onClick={() => onChange({ isFurnished: item.value as any, page: 1 })}
                      className={`py-1 px-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer text-center truncate ${
                        isSelected
                          ? "border-primary bg-primary text-white shadow-xs"
                          : "border-border bg-surface text-text hover:border-primary/50 hover:bg-surface-secondary"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Verified Only Card with High-Contrast Distinct Toggle */}
            <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-surface border border-primary/20 rounded-lg shadow-2xs">
                  <ShieldCheck size={16} className="text-accent" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-primary">{isRtl ? "عقارات موثقة فقط" : "Verified Listings Only"}</p>
                  <p className="text-[10px] font-semibold text-text-secondary">{isRtl ? "إظهار إعلانات المؤجرين الموثقين" : "Show verified landlord listings"}</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={filters.verifiedOnly}
                onClick={() => onChange({ verifiedOnly: !filters.verifiedOnly, page: 1 })}
                className={`relative w-11 h-6 rounded-full border-2 transition-all cursor-pointer shrink-0 shadow-inner ${
                  filters.verifiedOnly
                    ? "bg-primary border-primary"
                    : "bg-surface-tertiary border-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 start-0.5 w-4 h-4 rounded-full shadow-md transition-transform flex items-center justify-center ${
                    filters.verifiedOnly
                      ? "translate-x-5 rtl:-translate-x-5 bg-white"
                      : "translate-x-0 rtl:translate-x-0 bg-text-tertiary"
                  }`}
                >
                  {filters.verifiedOnly && (
                    <Check size={10} className="text-primary stroke-[3]" />
                  )}
                </span>
              </button>
            </div>

            {/* Amenities */}
            <div>
              <h4 className="text-[11px] font-bold text-text mb-1.5">{isRtl ? "المميزات والخدمات" : "Amenities & Features"}</h4>
              <div className="grid grid-cols-2 gap-1.5">
                {AMENITIES_CONFIG.map(({ key, labelAr, labelEn }) => {
                  const isChecked = filters.amenities?.includes(key) ?? false;
                  return (
                    <label
                      key={key}
                      onClick={() => toggleAmenity(key)}
                      className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer select-none ${
                        isChecked
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-surface text-text-secondary hover:border-primary/30"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 transition-colors ${
                          isChecked ? "bg-primary border-primary" : "bg-surface border-border"
                        }`}
                      >
                        {isChecked && <Check size={10} className="text-white stroke-[3]" />}
                      </div>
                      <span className={isChecked ? "text-primary" : "text-text-tertiary"}>
                        {AMENITY_ICON_MAP_SEARCH[key]}
                      </span>
                      <span className="truncate">{isRtl ? labelAr : labelEn}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Sidebar Inline Actions */}
      {!hideActions && (
        <div className="flex gap-2 pt-2 border-t border-border/50">
          <button
            type="button"
            onClick={onApply}
            className="flex-1 py-2 text-xs font-bold text-white bg-primary rounded-xl shadow-xs transition-all cursor-pointer hover:bg-primary-hover flex items-center justify-center gap-1.5"
          >
            {isRtl ? "تطبيق الفلاتر" : "Apply Filters"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-2 rounded-xl border border-border text-xs font-bold text-text-secondary hover:bg-surface-secondary transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            <RotateCcw size={13} />
            {isRtl ? "مسح" : "Reset"}
          </button>
        </div>
      )}
    </div>
  );
}
