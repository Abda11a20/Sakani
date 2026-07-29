// apps/frontend/src/components/listings/detail/ListingHeaderActions.tsx
"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface ListingHeaderActionsProps {
  title: string;
  locale: string;
}

export function ListingHeaderActions({ title, locale }: ListingHeaderActionsProps) {
  const isRtl = locale === "ar";

  return (
    <div className="container mx-auto px-4 py-3 max-w-5xl">
      <nav className="flex items-center gap-1.5 text-xs text-text-secondary font-cairo">
        <Link href={`/${locale}`} className="hover:text-primary transition-colors">
          {isRtl ? "الرئيسية" : "Home"}
        </Link>
        <ChevronLeft size={12} className={isRtl ? "" : "rotate-180"} />
        <Link href={`/${locale}/search`} className="hover:text-primary transition-colors">
          {isRtl ? "البحث" : "Search"}
        </Link>
        <ChevronLeft size={12} className={isRtl ? "" : "rotate-180"} />
        <span className="text-text font-medium truncate max-w-[200px]">{title}</span>
      </nav>
    </div>
  );
}
