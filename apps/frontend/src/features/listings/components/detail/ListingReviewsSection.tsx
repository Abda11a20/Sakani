// apps/frontend/src/components/listings/detail/ListingReviewsSection.tsx
"use client";

import React from "react";
import { Star } from "lucide-react";
import { Card, CardBody } from "@/components/ui";
import type { Review } from "@/types";

interface ListingReviewsSectionProps {
  reviews: Review[];
  avgRating: number;
  locale: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" style={{ direction: "ltr" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

export function ListingReviewsSection({ reviews, avgRating, locale }: ListingReviewsSectionProps) {
  const isRtl = locale === "ar";

  return (
    <Card className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden font-cairo">
      <CardBody className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-sm font-bold text-slate-855 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#1B4F8A] rounded-full" />
            {isRtl ? "تقييمات العقار والمؤجر" : "Reviews & Ratings"}
          </h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1.5">
              <StarRating rating={Math.round(avgRating)} />
              <span className="text-xs font-bold text-slate-855 font-sans">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-400 font-medium font-sans">({reviews.length})</span>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
            <Star size={24} className="mx-auto mb-2 opacity-30 text-slate-450" />
            <p className="text-xs font-semibold">{isRtl ? "لا توجد تقييمات مكتوبة بعد" : "No reviews written yet."}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border border-slate-150 rounded-xl p-4 space-y-2 bg-slate-50/40"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#1B4F8A]/10 text-[#1B4F8A] flex items-center justify-center text-xs font-bold">
                    {review.tenant?.name?.[0] ?? "T"}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-855 leading-tight">
                      {review.tenant?.name ?? (isRtl ? "مستأجر" : "Tenant")}
                    </p>
                    <div className="mt-0.5">
                      <StarRating rating={review.rating} />
                    </div>
                  </div>
                  <span className="ms-auto text-[10px] text-slate-400 font-sans font-medium">
                    {new Date(review.createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-xs text-slate-650 leading-relaxed font-medium">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
