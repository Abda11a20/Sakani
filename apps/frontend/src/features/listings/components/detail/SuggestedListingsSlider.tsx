// apps/frontend/src/components/listings/detail/SuggestedListingsSlider.tsx
"use client";

import React from "react";
import { ListingCard } from "@/features/listings";
import type { Listing } from "@/types";

interface SuggestedListingsSliderProps {
  suggested: Listing[];
  locale: string;
}

export function SuggestedListingsSlider({ suggested, locale }: SuggestedListingsSliderProps) {
  const isRtl = locale === "ar";

  if (!suggested || suggested.length === 0) return null;

  return (
    <div className="space-y-4 font-cairo">
      <h2 className="text-sm font-bold text-slate-855 flex items-center gap-2">
        <span className="w-1 h-4 bg-[#1B4F8A] rounded-full" />
        {isRtl ? "إعلانات مشابهة قد تعجبك" : "Similar listings you might like"}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {suggested.slice(0, 4).map((item) => (
          <ListingCard key={item.id} listing={item} />
        ))}
      </div>
    </div>
  );
}
