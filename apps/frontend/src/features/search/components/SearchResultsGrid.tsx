// apps/frontend/src/components/search/SearchResultsGrid.tsx
"use client";

import React from "react";
import { Search } from "lucide-react";
import { ListingCardSkeleton } from "@/features/listings";
import { SearchListingCardWrapper } from "./SearchListingCardWrapper";
import type { Listing, SearchFilters } from "@/types";
import { Button, Select } from "@/components/ui";

const SORT_OPTIONS = [
  { value: "newest", label: "الأحدث" },
  { value: "cheapest", label: "الأرخص" },
  { value: "expensive", label: "الأغلى" },
  { value: "popular", label: "الأكثر مشاهدة" },
];

interface SearchResultsGridProps {
  items: Listing[];
  total: number;
  loading: boolean;
  sortBy: string;
  isAuthenticated: boolean;
  onSortChange: (sortBy: SearchFilters["sortBy"]) => void;
  onResetFilters: () => void;
}

export function SearchResultsGrid({
  items,
  total,
  loading,
  sortBy,
  isAuthenticated,
  onSortChange,
  onResetFilters,
}: SearchResultsGridProps) {
  return (
    <div className="flex-1 min-w-0 font-cairo">
      {/* Result count & sort */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-text">
            {loading ? (
              <span className="text-text-secondary">جارٍ البحث...</span>
            ) : (
              <>
                عُثر على <span className="text-primary">{total}</span> نتيجة
              </>
            )}
          </h1>
        </div>
        <div className="min-w-36">
          <Select
            value={sortBy ?? "newest"}
            onValueChange={(val) => onSortChange(val as SearchFilters["sortBy"])}
            options={SORT_OPTIONS}
          />
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-surface-tertiary flex items-center justify-center mb-5">
            <Search size={32} className="text-text-tertiary" />
          </div>
          <h2 className="text-xl font-bold text-text mb-2">لا توجد نتائج</h2>
          <p className="text-text-secondary mb-6">جرب تعديل الفلاتر أو تغيير كلمة البحث</p>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onResetFilters}
            className="px-6 py-2.5 font-semibold rounded-xl"
          >
            مسح الفلاتر
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
          {items.map((listing) => (
            <SearchListingCardWrapper key={listing.id} listing={listing} isAuthenticated={isAuthenticated} />
          ))}
        </div>
      )}
    </div>
  );
}
