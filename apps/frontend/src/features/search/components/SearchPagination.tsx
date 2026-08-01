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

function getPageItems(page: number, lastPage: number): Array<number | "ellipsis"> {
  if (lastPage <= 7) {
    return Array.from({ length: lastPage }, (_, index) => index + 1);
  }

  const items: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(lastPage - 1, page + 1);

  if (start > 2) items.push("ellipsis");
  for (let pageNumber = start; pageNumber <= end; pageNumber += 1) {
    items.push(pageNumber);
  }
  if (end < lastPage - 1) items.push("ellipsis");
  items.push(lastPage);

  return items;
}

export function SearchPagination({ page, lastPage, onPageChange }: SearchPaginationProps) {
  if (lastPage <= 1) return null;

  const pageItems = getPageItems(page, lastPage);

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

      {pageItems.map((item, index) => {
        if (item === "ellipsis") {
          return (
            <span key={`ellipsis-${index}`} className="flex h-9 w-5 items-center justify-center text-sm font-bold text-text-tertiary">
              …
            </span>
          );
        }

        const pageNum = item;
        return (
          <Button
            key={pageNum}
            type="button"
            variant={page === pageNum ? "primary" : "outline"}
            size="sm"
            onClick={() => onPageChange(pageNum)}
            className="w-9 h-9 p-0 rounded-xl text-sm font-semibold"
            aria-current={page === pageNum ? "page" : undefined}
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
