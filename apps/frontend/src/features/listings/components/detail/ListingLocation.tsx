// apps/frontend/src/components/listings/detail/ListingLocation.tsx
"use client";

import React from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { Card, CardBody } from "@/components/ui";
import type { Listing } from "@/types";

const MapDisplay = dynamic(() => import("@/features/listings/components/MapDisplay"), { ssr: false });

interface ListingLocationProps {
  listing: Listing;
  locale: string;
}

export function ListingLocation({ listing, locale }: ListingLocationProps) {
  const isRtl = locale === "ar";
  const hasCoordinatesOrRegion = listing.lat || listing.latitude || listing.district || listing.governorate;

  if (!hasCoordinatesOrRegion) return null;

  return (
    <Card className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden font-cairo">
      <CardBody className="p-5 space-y-3">
        <h2 className="text-sm font-bold text-slate-855 border-b border-slate-100 pb-2 flex items-center gap-2">
          <span className="w-1 h-4 bg-[#0EA5E9] rounded-full" />
          {isRtl ? "موقع العقار" : "Property Location"}
        </h2>

        {listing.address && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700">
            <MapPin size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block mb-0.5">
                {isRtl ? "العنوان بالتفصيل:" : "Detailed Address:"}
              </span>
              <span>{listing.address}</span>
            </div>
          </div>
        )}

        <MapDisplay
          lat={listing.lat ?? listing.latitude ?? 30.0444}
          lng={listing.lng ?? listing.longitude ?? 31.2357}
          hasExactLocation={listing.hasExactLocation ?? false}
          address={listing.address}
          district={listing.district}
          governorate={listing.governorate}
          isRtl={isRtl}
        />
      </CardBody>
    </Card>
  );
}
