// apps/frontend/src/components/search/SearchFilterDrawer.tsx
"use client";

import React, { useEffect } from "react";
import { X, RotateCcw, Check } from "lucide-react";
import { SearchFilterControls } from "./SearchFilterControls";
import type { SearchFilters } from "@/types";
import { Button } from "@/components/ui";

export interface SearchFilterDrawerProps {
  open: boolean;
  draftFilters?: SearchFilters;
  onChange?: (partial: Partial<SearchFilters>) => void;
  onReset: () => void;
  onApply: () => void;
  onClose: () => void;
  totalCount?: number;
  title?: string;
  subtitle?: string;
  applyText?: string;
  children?: React.ReactNode;
}

export function SearchFilterDrawer({
  open,
  draftFilters,
  onChange,
  onReset,
  onApply,
  onClose,
  totalCount,
  title = "فلاتر البحث",
  subtitle = "حدد مواصفات البحث المناسبة لك",
  applyText,
  children,
}: SearchFilterDrawerProps) {
  // Close drawer on Escape key press
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      id="mobile-filter-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-drawer-title"
      className="fixed inset-0 z-50 flex items-center justify-center font-cairo p-3 sm:p-4"
    >
      {/* Backdrop Blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container — Centered & Elevated Card Dialog */}
      <div className="relative w-full max-w-sm bg-surface rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-border z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sticky Header */}
        <div className="sticky top-0 bg-surface flex items-center justify-between px-4 py-2.5 border-b border-divider shrink-0 z-10">
          <div className="flex items-center gap-2">
            <img
              src="/icon-192.png"
              alt="سكني"
              className="w-6 h-6 object-contain rounded-lg shadow-xs shrink-0"
            />
            <div>
              <h2 id="filter-drawer-title" className="text-xs font-extrabold text-text leading-tight">
                {title}
              </h2>
              <p className="text-[10px] text-text-secondary font-medium leading-tight">
                {subtitle}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="إغلاق الفلاتر"
            className="h-8 w-8 p-0 rounded-lg text-text-secondary hover:bg-surface-tertiary"
          >
            <X size={16} aria-hidden="true" />
          </Button>
        </div>

        {/* Scrollable Filter Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {children ? (
            children
          ) : (
            draftFilters && onChange && (
              <SearchFilterControls
                filters={draftFilters}
                onChange={onChange}
                onReset={onReset}
                onApply={onApply}
                hideActions={true}
              />
            )
          )}
        </div>

        {/* Action Bar */}
        <div className="p-3 bg-surface border-t border-divider flex items-center gap-2 shrink-0 z-10 shadow-lg">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onApply}
            fullWidth
            leftIcon={<Check size={15} className="stroke-[3]" />}
            className="text-xs font-bold py-2.5 rounded-xl"
          >
            {applyText ? applyText : totalCount !== undefined ? `عرض (${totalCount}) نتيجة` : "تطبيق الفلاتر"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onReset}
            leftIcon={<RotateCcw size={13} />}
            className="text-xs font-bold py-2.5 rounded-xl whitespace-nowrap"
          >
            مسح الكل
          </Button>
        </div>

      </div>
    </div>
  );
}
