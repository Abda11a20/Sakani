// apps/frontend/src/components/search/SearchFilterSidebar.tsx
"use client";

import React from "react";
import { Filter } from "lucide-react";
import { SearchFilterControls } from "./SearchFilterControls";
import type { SearchFilters } from "@/types";

interface SearchFilterSidebarProps {
  filters: SearchFilters;
  onChange: (partial: Partial<SearchFilters>) => void;
  onReset: () => void;
  onApply: () => void;
}

export function SearchFilterSidebar({
  filters,
  onChange,
  onReset,
  onApply,
}: SearchFilterSidebarProps) {
  return (
    <div className="hidden lg:block w-72 shrink-0">
      <div className="sticky top-20 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs font-cairo">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg text-white" style={{ background: "#1B7A6B" }}>
              <Filter size={15} />
            </div>
            <h2 className="font-extrabold text-sm text-slate-800">
              فلاتر البحث
            </h2>
          </div>
        </div>
        <SearchFilterControls
          filters={filters}
          onChange={onChange}
          onReset={onReset}
          onApply={onApply}
        />
      </div>
    </div>
  );
}
