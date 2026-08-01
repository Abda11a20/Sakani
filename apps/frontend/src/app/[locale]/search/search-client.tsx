// apps/frontend/src/app/[locale]/search/search-client.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { searchRepository, SearchHeader } from "@/features/search";
import { SearchFilterSidebar } from "@/features/search";
import { SearchFilterDrawer } from "@/features/search";
import { ActiveFilterChips } from "@/features/search";
import { SearchResultsGrid } from "@/features/search";
import { SearchPagination } from "@/features/search";
import type { SearchFilters } from "@/types";

// Custom inline debounce hook
function useDebounceValue<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export interface SearchResult {
  items: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

function buildSearchKey(filters: SearchFilters) {
  return [
    "search",
    "listings",
    filters.query ?? "",
    filters.governorate ?? "",
    filters.district ?? "",
    filters.unitType ?? "",
    filters.isFurnished ?? "",
    filters.genderTarget ?? "",
    filters.minPrice ?? "",
    filters.maxPrice ?? "",
    (filters.amenities ?? []).join(","),
    filters.sortBy ?? "newest",
    filters.page ?? 1,
    filters.limit ?? 10,
  ];
}



interface SearchPageClientProps {
  locale?: string;
  initialFilters?: Record<string, string>;
  isAuthenticated?: boolean;
}

export function SearchPageClient({
  initialFilters = {},
  isAuthenticated = false,
}: SearchPageClientProps) {
  const parseFilters = (): SearchFilters => {
    const minP = initialFilters.minPrice;
    const maxP = initialFilters.maxPrice;
    const furn = initialFilters.isFurnished;
    const page = initialFilters.page;

    return {
      query: initialFilters.query || initialFilters.q || undefined,
      governorate: initialFilters.governorate || undefined,
      district: initialFilters.district || undefined,
      unitType: initialFilters.unitType ? (initialFilters.unitType.toLowerCase() as any) : undefined,
      genderTarget: initialFilters.genderTarget ? (initialFilters.genderTarget.toLowerCase() as any) : undefined,
      minPrice: minP ? Number(minP) : undefined,
      maxPrice: maxP ? Number(maxP) : undefined,
      isFurnished: furn !== undefined ? furn === "true" : undefined,
      verifiedOnly: initialFilters.verifiedOnly === "true",
      amenities: initialFilters.amenities?.split(",").filter(Boolean) || undefined,
      sortBy: (initialFilters.sortBy as any) || "newest",
      page: page ? Number(page) : 1,
      limit: 10,
    };
  };

  const [filters, setFilters] = useState<SearchFilters>(parseFilters);
  const [pendingFilters, setPendingFilters] = useState<SearchFilters>(parseFilters);
  const [debouncedFilters, setDebouncedFilters] = useState<SearchFilters>(parseFilters);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const updated = parseFilters();
    setFilters(updated);
    setPendingFilters(updated);
    setDebouncedFilters(updated);
  }, [
    initialFilters.q,
    initialFilters.query,
    initialFilters.governorate,
    initialFilters.district,
    initialFilters.unitType,
    initialFilters.genderTarget,
    initialFilters.minPrice,
    initialFilters.maxPrice,
  ]);

  const debouncedQuery = useDebounceValue(filters.query, 400);

  useEffect(() => {
    setDebouncedFilters((prev) => ({ ...prev, query: debouncedQuery }));
  }, [debouncedQuery]);

  const { data: queryResult, isFetching } = useQuery<SearchResult>({
    queryKey: buildSearchKey(debouncedFilters),
    queryFn: async () => {
      const data = await searchRepository.searchListings(
        {
          governorate: debouncedFilters.governorate,
          district: debouncedFilters.district,
          unitType: debouncedFilters.unitType,
          isFurnished: debouncedFilters.isFurnished,
          genderTarget: debouncedFilters.genderTarget,
          minPrice: debouncedFilters.minPrice,
          maxPrice: debouncedFilters.maxPrice,
          sort: debouncedFilters.sortBy,
          query: debouncedFilters.query,
        },
        debouncedFilters.page || 1,
        10
      );
      return {
        items: data.listings.map((l) => l.toJSON()),
        meta: {
          total: data.total,
          page: debouncedFilters.page || 1,
          limit: 10,
          lastPage: Math.ceil(data.total / 10) || 1,
        },
      };
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const result = queryResult ?? { items: [], meta: { total: 0, page: 1, limit: 10, lastPage: 0 } };

  // Calculate count of active extra filters (excluding basic query & defaults)
  const activeExtraFiltersCount = [
    Boolean(filters.governorate),
    Boolean(filters.district),
    Boolean(filters.unitType),
    Boolean(filters.genderTarget),
    Boolean(filters.minPrice),
    Boolean(filters.maxPrice),
    filters.isFurnished !== undefined,
    Boolean(filters.verifiedOnly),
    (filters.amenities ?? []).length > 0,
  ].filter(Boolean).length;

  const handleFilterChange = (partial: Partial<SearchFilters>) => {
    const next = { ...filters, ...partial };
    setFilters(next);
    setPendingFilters(next);
    setDebouncedFilters(next);
  };

  const handleApply = () => {
    setFilters(pendingFilters);
    setDebouncedFilters(pendingFilters);
    setSidebarOpen(false);
  };

  const handleReset = () => {
    const empty: SearchFilters = { sortBy: "newest", page: 1, limit: 10 };
    setFilters(empty);
    setPendingFilters(empty);
    setDebouncedFilters(empty);
    setSidebarOpen(false);
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      {/* 1. Top Search Header with Quick Filters Strip */}
      <SearchHeader
        query={filters.query ?? ""}
        onQueryChange={(query) => handleFilterChange({ query, page: 1 })}
        onOpenMobileFilters={() => setSidebarOpen(true)}
        isFilterOpen={sidebarOpen}
        filters={filters}
        onChange={handleFilterChange}
        activeExtraFiltersCount={activeExtraFiltersCount}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-8">
          {/* 2. Desktop Sidebar */}
          <SearchFilterSidebar
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleReset}
            onApply={handleApply}
          />

          {/* 3. Results Area */}
          <div className="flex-1 min-w-0">
            <ActiveFilterChips filters={filters} onChange={handleFilterChange} />

            <SearchResultsGrid
              items={result.items}
              total={result.meta.total}
              loading={isFetching}
              sortBy={filters.sortBy ?? "newest"}
              isAuthenticated={isAuthenticated}
              onSortChange={(sortBy) => handleFilterChange({ sortBy, page: 1 })}
              onResetFilters={handleReset}
            />

            {!isFetching && (
              <SearchPagination
                page={result.meta.page}
                lastPage={result.meta.lastPage}
                onPageChange={(page) => handleFilterChange({ page })}
              />
            )}
          </div>
        </div>
      </div>

      {/* 4. Mobile 75vh Filter Drawer */}
      <SearchFilterDrawer
        open={sidebarOpen}
        draftFilters={pendingFilters}
        onChange={(p) => setPendingFilters((prev) => ({ ...prev, ...p }))}
        onReset={handleReset}
        onApply={handleApply}
        onClose={() => setSidebarOpen(false)}
        totalCount={result.meta.total}
      />
    </main>
  );
}
