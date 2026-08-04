'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-1.5 font-cairo text-xs" dir="rtl">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-2.5"
      >
        <ChevronRight size={15} />
        <span>السابق</span>
      </Button>

      <div className="flex items-center gap-1 px-2">
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg font-bold transition-all ${
              p === currentPage
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface text-text-secondary hover:bg-surface-secondary'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-2.5"
      >
        <span>التالي</span>
        <ChevronLeft size={15} />
      </Button>
    </div>
  );
}
