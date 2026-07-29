// apps/frontend/src/components/search/SearchPagination.tsx
"use client";

import React from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui";

interface SearchPaginationProps {
  page: number;
  lastPage: number;
  onPageChange: (page: number) => void;
}

export function SearchPagination({ page, lastPage, onPageChange }: SearchPaginationProps) {
  if (lastPage <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-10 font-cairo">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="h-9 w-9 p-0 rounded-xl"
        aria-label="Previous Page"
      >
        <ChevronRight size={18} />
      </Button>

      {Array.from({ length: Math.min(lastPage, 7) }, (_, i) => {
        let pageNum = i + 1;
        if (lastPage > 7) {
          if (page <= 4) pageNum = i + 1;
          else if (page >= lastPage - 3) pageNum = lastPage - 6 + i;
          else pageNum = page - 3 + i;
        }
        return (
          <Button
            key={pageNum}
            type="button"
            variant={page === pageNum ? "primary" : "outline"}
            size="sm"
            onClick={() => onPageChange(pageNum)}
            className="w-9 h-9 p-0 rounded-xl text-sm font-semibold"
          >
            {pageNum}
          </Button>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= lastPage}
        onClick={() => onPageChange(page + 1)}
        className="h-9 w-9 p-0 rounded-xl"
        aria-label="Next Page"
      >
        <ChevronLeft size={18} />
      </Button>
    </div>
  );
}
