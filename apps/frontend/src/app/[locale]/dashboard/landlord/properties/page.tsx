// apps/frontend/src/app/[locale]/dashboard/landlord/properties/page.tsx
"use client";

import React from "react";
import LandlordLayout from "@/components/layout/LandlordLayout";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Building2, Bed, ArrowRight, ArrowLeft } from "lucide-react";
import { useMyListings } from "@/hooks/useListings";
import { Spinner } from "@/components/ui/spinner";

export default function LandlordPropertiesPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const { data: rawListings = [], isLoading } = useMyListings();
  const listings = rawListings || [];

  const apartments = listings.filter((l) => (l.type || l.unitType) === "apartment");
  const aptTotal = apartments.length;
  const aptActive = apartments.filter((l) => l.status === "active").length;
  const aptRented = apartments.filter((l) => l.status === "rented").length;
  const aptPending = apartments.filter((l) => l.status === "pending_review").length;
  const aptRejected = apartments.filter((l) => l.status === "rejected").length;

  const bedListings = listings.filter((l) => (l.type || l.unitType) === "bed");
  const bedTotal = bedListings.length;
  const bedActive = bedListings.filter((l) => l.status === "active").length;
  const bedRented = bedListings.filter((l) => l.status === "rented").length;
  const bedPending = bedListings.filter((l) => l.status === "pending_review").length;
  const bedRejected = bedListings.filter((l) => l.status === "rejected").length;

  return (
    <LandlordLayout>
      <div className="space-y-8" dir={isRtl ? "rtl" : "ltr"}>
        <div>
          <h1 className="text-2xl font-extrabold text-text font-cairo">
            {isRtl ? "إدارة العقارات" : "My Properties"}
          </h1>
          <p className="text-sm text-text-secondary font-cairo mt-1">
            {isRtl
              ? "اطلع على حالة الإشغال وادر المستأجرين لكل نوع عقار"
              : "View occupancy status and manage tenants for each property type"}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-8 max-w-4xl">
            <Link
              href={`/${locale}/dashboard/landlord/properties/apartments`}
              className="group block relative overflow-hidden rounded-2xl bg-surface border border-border p-4 sm:p-8 shadow-xs hover:shadow-md hover:border-primary/50 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-3 sm:mb-6">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                  <Building2 size={22} className="sm:hidden" />
                  <Building2 size={28} className="hidden sm:block" />
                </div>
                <div className="text-text-tertiary transition-colors group-hover:text-primary">
                  <ArrowIcon size={20} />
                </div>
              </div>
              <h2 className="text-base sm:text-xl font-bold text-text font-cairo mb-1">
                {isRtl ? "الشقق" : "Apartments"}
              </h2>
              <p className="hidden sm:block text-xs text-text-secondary font-cairo mb-5">
                {isRtl ? "الإشغال، المستأجر الحالي، وتاريخ الإيجارات" : "Occupancy, current tenant & rental history"}
              </p>
              <p className="sm:hidden text-[11px] text-text-secondary font-cairo">
                {isRtl ? "إدارة الشقق" : "Manage apartments"}
              </p>
              <div className="mt-3 grid grid-cols-1 gap-1.5 sm:mt-0 sm:grid-cols-5 sm:gap-2">
                <div className="flex items-center justify-between bg-surface-secondary rounded-lg py-1.5 px-2 border border-border sm:block sm:rounded-xl sm:py-2 sm:px-1 sm:text-center">
                  <span className="text-sm font-bold text-text font-sans sm:block sm:text-lg">{aptTotal}</span>
                  <span className="text-[10px] text-text-tertiary font-cairo">{isRtl ? "المجموع" : "Total"}</span>
                </div>
                <div className="flex items-center justify-between bg-status-success/15 rounded-lg py-1.5 px-2 border border-status-success/30 sm:block sm:rounded-xl sm:py-2 sm:px-1 sm:text-center">
                  <span className="text-sm font-bold text-status-success font-sans sm:block sm:text-lg">{aptActive}</span>
                  <span className="text-[10px] text-status-success font-cairo">{isRtl ? "نشط" : "Active"}</span>
                </div>
                <div className="flex items-center justify-between bg-status-warning/15 rounded-lg py-1.5 px-2 border border-status-warning/30 sm:block sm:rounded-xl sm:py-2 sm:px-1 sm:text-center">
                  <span className="text-sm font-bold text-status-warning font-sans sm:block sm:text-lg">{aptRented}</span>
                  <span className="text-[10px] text-status-warning font-cairo">{isRtl ? "مؤجر" : "Rented"}</span>
                </div>
                <div className="flex items-center justify-between bg-status-info/15 rounded-lg py-1.5 px-2 border border-status-info/30 sm:block sm:rounded-xl sm:py-2 sm:px-1 sm:text-center">
                  <span className="text-sm font-bold text-status-info font-sans sm:block sm:text-lg">{aptPending}</span>
                  <span className="text-[10px] text-status-info font-cairo">{isRtl ? "مراجعة" : "Pending"}</span>
                </div>
                <div className="flex items-center justify-between bg-rose-50 rounded-lg py-1.5 px-2 border border-rose-200 sm:block sm:rounded-xl sm:py-2 sm:px-1 sm:text-center">
                  <span className="text-sm font-bold text-rose-600 font-sans sm:block sm:text-lg">{aptRejected}</span>
                  <span className="text-[10px] text-rose-600 font-cairo">{isRtl ? "مرفوض" : "Rejected"}</span>
                </div>
              </div>
            </Link>

            <Link
              href={`/${locale}/dashboard/landlord/beds`}
              className="group block relative overflow-hidden rounded-2xl bg-surface border border-border p-4 sm:p-8 shadow-xs hover:shadow-md hover:border-accent transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-3 sm:mb-6">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-accent/15 text-accent flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                  <Bed size={22} className="sm:hidden" />
                  <Bed size={28} className="hidden sm:block" />
                </div>
                <div className="text-text-tertiary transition-colors group-hover:text-accent">
                  <ArrowIcon size={20} />
                </div>
              </div>
              <h2 className="text-base sm:text-xl font-bold text-slate-900 font-cairo mb-1">
                {isRtl ? "الاسرة (سكن مشترك)" : "Beds (Shared Lodging)"}
              </h2>
              <p className="hidden sm:block text-xs text-slate-500 font-cairo mb-5">
                {isRtl ? "ادارة الغرف المشتركة والاسرة الفردية للطلاب" : "Manage shared rooms & individual beds for students"}
              </p>
              <p className="sm:hidden text-[11px] text-text-secondary font-cairo">
                {isRtl ? "إدارة الأسرّة" : "Manage beds"}
              </p>
              <div className="mt-3 grid grid-cols-1 gap-1.5 sm:mt-0 sm:grid-cols-5 sm:gap-2">
                <div className="flex items-center justify-between bg-slate-50 rounded-lg py-1.5 px-2 sm:block sm:rounded-xl sm:py-2 sm:px-1 sm:text-center">
                  <span className="text-sm font-bold text-slate-800 font-sans sm:block sm:text-lg">{bedTotal}</span>
                  <span className="text-[10px] text-slate-500 font-cairo">{isRtl ? "المجموع" : "Total"}</span>
                </div>
                <div className="flex items-center justify-between bg-green-50 rounded-lg py-1.5 px-2 sm:block sm:rounded-xl sm:py-2 sm:px-1 sm:text-center">
                  <span className="text-sm font-bold text-green-600 font-sans sm:block sm:text-lg">{bedActive}</span>
                  <span className="text-[10px] text-green-600 font-cairo">{isRtl ? "نشط" : "Active"}</span>
                </div>
                <div className="flex items-center justify-between bg-amber-50 rounded-lg py-1.5 px-2 sm:block sm:rounded-xl sm:py-2 sm:px-1 sm:text-center">
                  <span className="text-sm font-bold text-amber-600 font-sans sm:block sm:text-lg">{bedRented}</span>
                  <span className="text-[10px] text-amber-600 font-cairo">{isRtl ? "مؤجر" : "Rented"}</span>
                </div>
                <div className="flex items-center justify-between bg-status-info/15 rounded-lg py-1.5 px-2 border border-status-info/30 sm:block sm:rounded-xl sm:py-2 sm:px-1 sm:text-center">
                  <span className="text-sm font-bold text-status-info font-sans sm:block sm:text-lg">{bedPending}</span>
                  <span className="text-[10px] text-status-info font-cairo">{isRtl ? "مراجعة" : "Pending"}</span>
                </div>
                <div className="flex items-center justify-between bg-rose-50 rounded-lg py-1.5 px-2 border border-rose-200 sm:block sm:rounded-xl sm:py-2 sm:px-1 sm:text-center">
                  <span className="text-sm font-bold text-rose-600 font-sans sm:block sm:text-lg">{bedRejected}</span>
                  <span className="text-[10px] text-rose-600 font-cairo">{isRtl ? "مرفوض" : "Rejected"}</span>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </LandlordLayout>
  );
}
