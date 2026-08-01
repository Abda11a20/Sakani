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
      <div className="sticky top-20 bg-surface border border-border rounded-2xl p-5 shadow-xs font-cairo">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-divider">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
              <Filter size={15} />
            </div>
            <h2 className="font-bold text-sm text-text">
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
