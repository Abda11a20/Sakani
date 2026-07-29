// apps/frontend/src/components/search/ActiveFilterChips.tsx
"use client";

import React from "react";
import { X, RotateCcw } from "lucide-react";
import { UNIT_TYPE_CONFIG, GENDER_TARGET_CONFIG, AMENITIES_CONFIG } from "@/lib/constants";
import type { SearchFilters } from "@/types";
import { Button } from "@/components/ui";

interface ActiveFilterChipsProps {
  filters: SearchFilters;
  onChange: (partial: Partial<SearchFilters>) => void;
}

export function ActiveFilterChips({ filters, onChange }: ActiveFilterChipsProps) {
  const chips: { label: string; onRemove: () => void }[] = [];

  if (filters.unitType) {
    const label = UNIT_TYPE_CONFIG[filters.unitType as keyof typeof UNIT_TYPE_CONFIG]?.labelAr ?? filters.unitType;
    chips.push({ label: `وحدة: ${label}`, onRemove: () => onChange({ unitType: undefined, page: 1 }) });
  }
  if (filters.governorate) {
    chips.push({ label: `المحافظة: ${filters.governorate}`, onRemove: () => onChange({ governorate: "", district: "", page: 1 }) });
  }
  if (filters.district) {
    chips.push({ label: `المنطقة: ${filters.district}`, onRemove: () => onChange({ district: "", page: 1 }) });
  }
  if (filters.minPrice) {
    chips.push({ label: `من ${filters.minPrice} ج.م`, onRemove: () => onChange({ minPrice: undefined, page: 1 }) });
  }
  if (filters.maxPrice) {
    chips.push({ label: `حتى ${filters.maxPrice} ج.م`, onRemove: () => onChange({ maxPrice: undefined, page: 1 }) });
  }
  if (filters.verifiedOnly) {
    chips.push({ label: "عقارات موثقة فقط", onRemove: () => onChange({ verifiedOnly: false, page: 1 }) });
  }
  if (filters.genderTarget) {
    const label = GENDER_TARGET_CONFIG[filters.genderTarget as keyof typeof GENDER_TARGET_CONFIG]?.labelAr ?? filters.genderTarget;
    chips.push({ label: `الفئة: ${label}`, onRemove: () => onChange({ genderTarget: undefined, page: 1 }) });
  }
  if (filters.isFurnished !== undefined) {
    chips.push({
      label: filters.isFurnished ? "مفروشة 🛋️" : "فارغة 🚪",
      onRemove: () => onChange({ isFurnished: undefined, page: 1 }),
    });
  }
  filters.amenities?.forEach((a) => {
    const found = AMENITIES_CONFIG.find((am) => am.key === a);
    if (found) {
      chips.push({
        label: found.labelAr,
        onRemove: () => onChange({ amenities: filters.amenities?.filter((x) => x !== a), page: 1 }),
      });
    }
  });

  if (!chips.length) return null;

  const handleResetAll = () => {
    onChange({
      governorate: "",
      district: "",
      unitType: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      verifiedOnly: false,
      genderTarget: undefined,
      isFurnished: undefined,
      amenities: [],
      page: 1,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 font-cairo text-xs">
      <span className="text-text-secondary font-medium me-1">الفلاتر المطبقة:</span>
      {chips.map((chip, i) => (
        <span
          key={i}
          className="flex items-center gap-1.5 px-2.5 py-1 font-bold rounded-full border border-primary/20 bg-primary/10 text-primary transition-all"
        >
          {chip.label}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={chip.onRemove}
            className="h-4 w-4 p-0 rounded-full hover:bg-primary/20 text-primary hover:text-status-danger"
            aria-label="Remove filter"
          >
            <X size={12} />
          </Button>
        </span>
      ))}

      {chips.length >= 2 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleResetAll}
          className="text-xs text-text-secondary hover:text-text underline p-1 h-auto"
          leftIcon={<RotateCcw size={12} />}
        >
          إزالة الفلاتر ({chips.length})
        </Button>
      )}
    </div>
  );
}
