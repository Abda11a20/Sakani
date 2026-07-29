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
        className="w-full flex items-center justify-between text-xs font-bold text-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-[#1B7A6B] focus:border-[#1B7A6B] focus:ring-1 focus:ring-[#1B7A6B] transition-all cursor-pointer shadow-2xs text-start"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder || "اختر..."}
        </span>
        <ChevronDown
          size={13}
          className={`text-slate-400 shrink-0 transition-transform ${
            isOpen ? "rotate-180 text-[#1B7A6B]" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute start-0 top-full mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-xl z-50 max-h-44 overflow-y-auto p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 font-cairo">
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
                    ? "bg-[#E6F2F0] text-[#1B7A6B]"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check size={12} className="text-[#1B7A6B] shrink-0" />}
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
        <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
          <MapPin size={14} style={{ color: "#1B7A6B" }} />
          <span>الموقع والجغرافيا</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 mb-0.5 block">المحافظة</label>
            <CustomSelect
              value={filters.governorate ?? ""}
              options={[
                { value: "", label: "كل المحافظات" },
                ...EGYPTIAN_GOVERNORATES.map((gov) => ({ value: gov, label: gov })),
              ]}
              onChange={(val) => onChange({ governorate: val, district: "", page: 1 })}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 mb-0.5 block">الحي / المنطقة</label>
            <input
              type="text"
              placeholder="مثال: المنصورة"
              value={filters.district ?? ""}
              onChange={(e) => onChange({ district: e.target.value, page: 1 })}
              className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1B7A6B] bg-white truncate"
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* 2. Unit Type */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
          <Building2 size={14} style={{ color: "#1B7A6B" }} />
          <span>نوع الوحدة السكنية</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "apartment", label: "شقة بالكامل", icon: Building2 },
            { value: "bed", label: "سرير / غرفة", icon: BedDouble },
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
                    ? "border-[#1B7A6B] text-white shadow-xs"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[#1B7A6B]/50 hover:bg-slate-50"
                }`}
                style={{ background: isSelected ? "#1B7A6B" : undefined }}
              >
                <Icon size={14} />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* 3. Price Range (Dual Inputs + Range Slider) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
            <Coins size={14} style={{ color: "#1B7A6B" }} />
            <span>نطاق السعر الشهري</span>
          </div>
          <span className="text-[10px] font-bold text-[#1B7A6B]">
            {filters.minPrice || filters.maxPrice
              ? `${filters.minPrice ?? 0} - ${filters.maxPrice ?? "أقصى"} ج.م`
              : "أي سعر"}
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
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#1B7A6B]"
          />
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              placeholder="من"
              value={filters.minPrice ?? ""}
              onChange={(e) => onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
              className="w-full text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:border-[#1B7A6B] bg-white"
              min={0}
            />
            <span className="text-slate-400 font-bold text-xs">—</span>
            <input
              type="number"
              placeholder="إلى"
              value={filters.maxPrice ?? ""}
              onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
              className="w-full text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:border-[#1B7A6B] bg-white"
              min={0}
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* 4. Gender Target & Sort Side-by-Side */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-semibold text-slate-500 mb-0.5 block">الفئة المستهدفة</label>
          <CustomSelect
            value={filters.genderTarget ?? ""}
            options={[
              { value: "", label: "جميع الفئات" },
              { value: "male", label: GENDER_TARGET_CONFIG.male.labelAr },
              { value: "female", label: GENDER_TARGET_CONFIG.female.labelAr },
              { value: "family", label: GENDER_TARGET_CONFIG.family.labelAr },
            ]}
            onChange={(val) => onChange({ genderTarget: (val || undefined) as GenderTarget | undefined, page: 1 })}
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-500 mb-0.5 block">ترتيب النتائج</label>
          <CustomSelect
            value={filters.sortBy ?? "newest"}
            options={SORT_OPTIONS}
            onChange={(val) => onChange({ sortBy: val as SearchFilters["sortBy"], page: 1 })}
          />
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* 5. Advanced Filters Collapsible Accordion */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => setIsAccordionOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer text-xs font-bold text-slate-800"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[#1B7A6B]">⚙</span>
            <span>مواصفات إضافية (مفروش، خدمات، توثيق)</span>
          </div>
          {isAccordionOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {isAccordionOpen && (
          <div className="p-3 space-y-3 animate-in fade-in duration-150">
            {/* Furnishing Status */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-700 mb-1.5">حالة الفرش</h4>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: undefined, label: "الكل" },
                  { value: true, label: "مفروشة 🛋️" },
                  { value: false, label: "فارغة 🚪" },
                ].map((item) => {
                  const isSelected = filters.isFurnished === item.value;
                  return (
                    <button
                      key={String(item.value)}
                      type="button"
                      onClick={() => onChange({ isFurnished: item.value as any, page: 1 })}
                      className={`py-1 px-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer text-center truncate ${
                        isSelected
                          ? "border-[#1B7A6B] text-white shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:border-[#1B7A6B]/50 hover:bg-slate-50"
                      }`}
                      style={{ background: isSelected ? "#1B7A6B" : undefined }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Verified Only Card with High-Contrast Distinct Toggle */}
            <div className="p-2.5 bg-gradient-to-r from-[#E6F2F0] to-[#F4F9F8] border border-[#1B7A6B]/30 rounded-xl flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white border border-[#1B7A6B]/20 rounded-lg shadow-2xs">
                  <ShieldCheck size={16} style={{ color: "#C4922A" }} />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[#0D3D36]">عقارات موثقة فقط</p>
                  <p className="text-[10px] font-semibold text-slate-500">إظهار إعلانات المؤجرين الموثقين</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={filters.verifiedOnly}
                onClick={() => onChange({ verifiedOnly: !filters.verifiedOnly, page: 1 })}
                className={`relative w-11 h-6 rounded-full border-2 transition-all cursor-pointer shrink-0 shadow-inner ${
                  filters.verifiedOnly
                    ? "bg-[#1B7A6B] border-[#1B7A6B]"
                    : "bg-slate-200 border-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 start-0.5 w-4 h-4 rounded-full shadow-md transition-transform flex items-center justify-center ${
                    filters.verifiedOnly
                      ? "translate-x-5 rtl:-translate-x-5 bg-white"
                      : "translate-x-0 rtl:translate-x-0 bg-slate-600"
                  }`}
                >
                  {filters.verifiedOnly && (
                    <Check size={10} className="text-[#1B7A6B] stroke-[3]" />
                  )}
                </span>
              </button>
            </div>

            {/* Amenities */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-700 mb-1.5">المميزات والخدمات</h4>
              <div className="grid grid-cols-2 gap-1.5">
                {AMENITIES_CONFIG.map(({ key, labelAr }) => {
                  const isChecked = filters.amenities?.includes(key) ?? false;
                  return (
                    <label
                      key={key}
                      onClick={() => toggleAmenity(key)}
                      className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer select-none ${
                        isChecked
                          ? "border-[#1B7A6B] bg-[#E6F2F0] text-[#1B7A6B]"
                          : "border-slate-100 bg-[#FFFFFF] text-slate-600 hover:border-slate-200"
                      }`}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 transition-colors"
                        style={{
                          background: isChecked ? "#1B7A6B" : "#fff",
                          borderColor: isChecked ? "#1B7A6B" : "#CBD5E1",
                        }}
                      >
                        {isChecked && <Check size={10} className="text-white stroke-[3]" />}
                      </div>
                      <span className={isChecked ? "text-[#1B7A6B]" : "text-slate-400"}>
                        {AMENITY_ICON_MAP_SEARCH[key]}
                      </span>
                      <span className="truncate">{labelAr}</span>
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
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onApply}
            className="flex-1 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer hover:opacity-90 flex items-center justify-center gap-1.5"
            style={{ background: "#1B7A6B" }}
          >
            تطبيق الفلاتر
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            <RotateCcw size={13} />
            مسح
          </button>
        </div>
      )}
    </div>
  );
}
