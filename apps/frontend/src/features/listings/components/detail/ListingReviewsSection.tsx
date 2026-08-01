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
    <Card className="border border-border rounded-2xl bg-surface shadow-xs overflow-hidden font-cairo">
      <CardBody className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="text-sm font-bold text-text flex items-center gap-2">
            <span className="w-1 h-4 bg-primary rounded-full" />
            {isRtl ? "تقييمات العقار والمؤجر" : "Reviews & Ratings"}
          </h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1.5">
              <StarRating rating={Math.round(avgRating)} />
              <span className="text-xs font-bold text-text font-sans">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-[10px] text-text-tertiary font-medium font-sans">({reviews.length})</span>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-8 text-text-tertiary border border-dashed border-border rounded-xl">
            <Star size={24} className="mx-auto mb-2 opacity-30 text-text-tertiary" />
            <p className="text-xs font-semibold">{isRtl ? "لا توجد تقييمات مكتوبة بعد" : "No reviews written yet."}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border border-border rounded-xl p-4 space-y-2 bg-surface-secondary/40"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {review.tenant?.name?.[0] ?? "T"}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text leading-tight">
                      {review.tenant?.name ?? (isRtl ? "مستأجر" : "Tenant")}
                    </p>
                    <div className="mt-0.5">
                      <StarRating rating={review.rating} />
                    </div>
                  </div>
                  <span className="ms-auto text-[10px] text-text-tertiary font-sans font-medium">
                    {new Date(review.createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-xs text-text-secondary leading-relaxed font-medium">
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
