// apps/frontend/src/components/dashboard/form/ListingFormLocationStep.tsx
"use client";

import React from "react";
import dynamic from "next/dynamic";
import { MapPin, LocateFixed, Loader2 } from "lucide-react";
import { SearchableCombobox, Textarea } from "@/components/ui";
import { EGYPTIAN_GOVERNORATES, EGYPTIAN_DISTRICTS } from "@/lib/constants";
import type { ListingFormData, ListingFormChangeHandler, LocationCandidate } from "./listing-form.types";

// Lazy-load MapPicker (Leaflet is browser-only)
const MapPicker = dynamic(() => import("@/features/listings/components/MapPicker"), { ssr: false });

interface ListingFormLocationStepProps {
  formData: ListingFormData;
  errors: Record<string, string>;
  showMap: boolean;
  isGeocodingLoading: boolean;
  candidates: LocationCandidate[];
  geocodeError: string | null;
  onChange: ListingFormChangeHandler;
  onExploreLocation: () => void;
  onSelectCandidate: (candidate: LocationCandidate) => void;
  onToggleMap: (show: boolean) => void;
  onConfirmLocation: () => void;
  onClearLocation: () => void;
}

export function ListingFormLocationStep({
  formData,
  errors,
  showMap,
  isGeocodingLoading,
  candidates,
  geocodeError,
  onChange,
  onExploreLocation,
  onSelectCandidate,
  onConfirmLocation,
  onClearLocation,
}: ListingFormLocationStepProps) {
  return (
    <div className="space-y-5 animate-fadeIn">
      <h2 className="text-xl font-bold font-cairo flex items-center gap-2 text-slate-800">
        <MapPin className="text-amber-500" size={20} />
        <span>موقع العقار</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SearchableCombobox
          label="المحافظة"
          placeholder="ابحث أو اختر المحافظة..."
          options={EGYPTIAN_GOVERNORATES as unknown as string[]}
          value={formData.governorate}
          onChange={(val) => {
            onChange("governorate", val);
            onChange("district", "");
          }}
          error={errors.governorate}
        />

        <SearchableCombobox
          label="الحي/المنطقة/المركز"
          placeholder="ابحث أو اكتب الحي..."
          options={EGYPTIAN_DISTRICTS[formData.governorate] || []}
          value={formData.district}
          onChange={(val) => onChange("district", val)}
          error={errors.district}
          allowCustom={true}
        />
      </div>

      <Textarea
        label="العنوان بالتفصيل"
        placeholder="اكتب تفاصيل العنوان (مثال: شارع مصدق، بجوار سوبرماركت...)"
        value={formData.address}
        onChange={(e) => onChange("address", e.target.value)}
        rows={3}
        error={errors.address}
        className="resize-none"
      />

      {/* Location Map Preview & Geocoding Pipeline */}
      <div className="space-y-3 pt-2 font-cairo">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-border pt-4">
          <div>
            <p className="text-sm font-bold text-text font-cairo">
              تحديد وتأكيد الموقع على الخريطة
            </p>
            <p className="text-xs text-text-secondary font-cairo mt-0.5">
              اختياري — يساعد المستأجرين في التوصل للعنوان الدقيق بسرعة
            </p>
          </div>

          <button
            type="button"
            disabled={isGeocodingLoading}
            onClick={onExploreLocation}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition-all shadow-xs disabled:opacity-50 font-cairo shrink-0 cursor-pointer"
          >
            {isGeocodingLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>جارِ استكشاف الخريطة...</span>
              </>
            ) : (
              <>
                <LocateFixed size={14} />
                <span>{showMap ? "إعادة استكشاف المكان 🗺️" : "عرض وتحديد الموقع على الخريطة 🗺️"}</span>
              </>
            )}
          </button>
        </div>

        {/* Candidate Location Suggestions Bar */}
        {candidates.length > 1 && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-cairo">
            <p className="text-xs font-bold text-slate-700">
              تم العثور على أكثر من موقع متوقع، اختر الأقرب منها:
            </p>
            <div className="flex flex-col gap-1.5">
              {candidates.map((cand, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectCandidate(cand)}
                  className={`text-start px-3 py-2 rounded-lg text-xs font-cairo transition-colors flex items-center justify-between ${
                    formData.lat === cand.lat && formData.lng === cand.lng
                      ? "bg-[#0EA5E9]/10 text-amber-700 border border-amber-300 font-bold"
                      : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="line-clamp-1">📍 {cand.displayName}</span>
                  <span className="text-[10px] text-amber-500 font-mono">اختيار</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Friendly Geocoding Fallback Warning */}
        {geocodeError && (
          <p className="text-xs text-amber-600 font-cairo bg-amber-50 p-3 rounded-xl border border-amber-200">
            📍 {geocodeError}
          </p>
        )}

        {showMap && (
          <MapPicker
            lat={formData.lat ?? 30.0444}
            lng={formData.lng ?? 31.2357}
            hasExactLocation={formData.hasExactLocation}
            onChange={(lat, lng) => {
              onChange("lat", lat);
              onChange("lng", lng);
            }}
            onConfirmLocation={onConfirmLocation}
            onClear={onClearLocation}
          />
        )}

        {!showMap && (
          <p className="text-[11px] text-slate-400 font-cairo">
            📍 سيتم عرض موقع تقريبي بناءً على الحي والمحافظة للمستأجرين في حال عدم توثيق الموقع الدقيق
          </p>
        )}
      </div>
    </div>
  );
}
