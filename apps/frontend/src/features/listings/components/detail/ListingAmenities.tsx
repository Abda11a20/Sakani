// apps/frontend/src/components/listings/detail/ListingAmenities.tsx
"use client";

import React from "react";
import { BedDouble, CheckCircle } from "lucide-react";
import { Card, CardBody } from "@/components/ui";
import type { Listing } from "@/types";

interface ListingAmenitiesProps {
  listing: Listing;
  locale: string;
  amenityConfig: Record<string, { icon: React.ReactNode; labelAr: string; labelEn: string }>;
}

export function ListingAmenities({ listing, locale, amenityConfig }: ListingAmenitiesProps) {
  const isRtl = locale === "ar";

  return (
    <div className="space-y-4">
      {/* House Rules */}
      {listing.rules && (
        <Card className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
          <CardBody className="p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-855 border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="w-1 h-4 bg-amber-500 rounded-full" />
              {isRtl ? "قواعد وشروط السكن" : "House Rules"}
            </h2>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <p className="text-xs text-amber-850 leading-relaxed whitespace-pre-line">
                {listing.rules}
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Shared beds block if type = bed */}
      {listing.type === "bed" && listing.beds && (
        <Card className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
          <CardBody className="p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-855 border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="w-1 h-4 bg-purple-500 rounded-full" />
              {isRtl ? "الأسرة المتاحة" : "Available Beds"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {listing.beds.map((bed) => (
                <span
                  key={bed.id}
                  className={`px-3 py-2 rounded-xl text-[10px] font-semibold border flex items-center gap-1.5 ${
                    bed.isAvailable
                      ? "bg-green-50/50 border-green-200 text-green-700"
                      : "bg-red-50/50 border-red-100 text-red-500 line-through opacity-60"
                  }`}
                >
                  <BedDouble size={12} />
                  {isRtl ? `سرير ${bed.bedNumber}` : `Bed ${bed.bedNumber}`}
                </span>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Amenities Block */}
      {listing.amenities && listing.amenities.length > 0 && (
        <Card className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
          <CardBody className="p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-855 border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#1B4F8A] rounded-full" />
              {isRtl ? "المميزات والمرافق المتاحة" : "Amenities & Facilities"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {listing.amenities.map((key) => {
                const conf = amenityConfig[key];
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-slate-700 text-xs font-semibold"
                  >
                    <span className="text-[#1B4F8A] shrink-0">
                      {conf?.icon ?? <CheckCircle size={14} />}
                    </span>
                    <span className="truncate">{conf ? (isRtl ? conf.labelAr : conf.labelEn) : key}</span>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
