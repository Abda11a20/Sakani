// apps/frontend/src/components/listings/detail/ListingOverview.tsx
"use client";

import React from "react";
import {
  MapPin,
  Building2,
  UserCheck,
  Zap,
  Receipt,
  Shield,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui";
import { getFurnishingLabel } from "@/lib/helpers";
import type { Listing } from "@/types";

interface ListingOverviewProps {
  listing: Listing;
  locale: string;
  getGenderTargetLabel: (target?: string) => string;
  getElectricityTypeLabel: (type?: string) => string;
}

export function ListingOverview({
  listing,
  locale,
  getGenderTargetLabel,
  getElectricityTypeLabel,
}: ListingOverviewProps) {
  const isRtl = locale === "ar";

  return (
    <div className="space-y-4">
      {/* Title & Price Block */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
            {listing.title}
          </h1>
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium font-cairo">
            <MapPin size={14} className="text-[#1B4F8A] shrink-0" />
            <span>
              {listing.address ? `${listing.address} - ` : ""}
              {listing.district ? `${listing.district}، ` : ""}
              {listing.governorate || listing.city || ""}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end justify-center shrink-0 border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto border-slate-100">
          <span className="text-2xl font-extrabold text-[#1B4F8A] font-sans">
            {new Intl.NumberFormat(isRtl ? "ar-EG" : "en-US").format(listing.price)}
          </span>
          <span className="text-slate-400 text-[10px] font-semibold mt-0.5">
            {isRtl ? "جنيه / شهرياً" : "EGP / monthly"}
          </span>
        </div>
      </div>

      {/* Dynamic Feature Cards Grid Row */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2.5">
        {/* Property Type */}
        <div className="bg-white border border-slate-200 p-3 rounded-xl flex flex-col items-center text-center shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-1.5 shrink-0">
            <Building2 size={16} />
          </div>
          <span className="text-[9px] text-slate-400 font-semibold">{isRtl ? "نوع العقار" : "Type"}</span>
          {getFurnishingLabel(listing.unitType || listing.type, listing.isFurnished, locale)}
        </div>

        {/* Target occupant */}
        <div className="bg-white border border-slate-200 p-3 rounded-xl flex flex-col items-center text-center shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-[#1B4F8A] flex items-center justify-center mb-1.5 shrink-0">
            <UserCheck size={16} />
          </div>
          <span className="text-[9px] text-slate-400 font-semibold">{isRtl ? "الفئة" : "Target"}</span>
          <span className="text-xs font-bold text-slate-800 mt-0.5">
            {getGenderTargetLabel(listing.genderTarget)}
          </span>
        </div>

        {/* Electricity Meter */}
        <div className="bg-white border border-slate-200 p-3 rounded-xl flex flex-col items-center text-center shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center mb-1.5 shrink-0">
            <Zap size={16} />
          </div>
          <span className="text-[9px] text-slate-400 font-semibold">{isRtl ? "العداد" : "Meter"}</span>
          <span className="text-[10px] font-bold text-slate-800 mt-1 truncate max-w-full">
            {getElectricityTypeLabel(listing.electricityType)}
          </span>
        </div>

        {/* Bills policy */}
        <div className="bg-white border border-slate-200 p-3 rounded-xl flex flex-col items-center text-center shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center mb-1.5 shrink-0">
            <Receipt size={16} />
          </div>
          <span className="text-[9px] text-slate-400 font-semibold">{isRtl ? "الفواتير" : "Bills"}</span>
          <span className="text-[10px] font-bold text-slate-800 mt-1 truncate max-w-full">
            {listing.includesBills ? (isRtl ? "شاملة" : "Included") : (isRtl ? "منفصلة" : "Excluded")}
          </span>
        </div>

        {/* Security Deposit */}
        <div className="bg-white border border-slate-200 p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-xs col-span-3 md:col-span-1">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center mb-1.5 shrink-0">
            <Shield size={16} />
          </div>
          <span className="text-[9px] text-slate-400 font-semibold">{isRtl ? "التأمين" : "Deposit"}</span>
          <span className="text-xs font-bold text-slate-800 mt-0.5">
            {listing.securityDeposit
              ? `${new Intl.NumberFormat(isRtl ? "ar-EG" : "en-US").format(listing.securityDeposit)} ج.م`
              : isRtl
              ? "بدون تأمين"
              : "No Deposit"}
          </span>
        </div>
      </div>

      {/* Description Block */}
      {listing.description && (
        <Card className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
          <CardBody className="p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-850 border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#1B4F8A] rounded-full" />
              {isRtl ? "وصف العقار" : "Property Description"}
            </h2>
            <p className="text-slate-600 leading-relaxed text-xs whitespace-pre-line">
              {listing.description}
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
