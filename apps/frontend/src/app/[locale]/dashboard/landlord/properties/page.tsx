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

  const bedListings = listings.filter((l) => (l.type || l.unitType) === "bed");
  const bedTotal = bedListings.length;
  const bedActive = bedListings.filter((l) => l.status === "active").length;
  const bedRented = bedListings.filter((l) => l.status === "rented").length;

  return (
    <LandlordLayout>
      <div className="space-y-8" dir={isRtl ? "rtl" : "ltr"}>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-cairo">
            {isRtl ? "ادارة العقارات" : "My Properties"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo mt-1">
            {isRtl
              ? "اطلع على حالة الاشغال وادر المستاجرين لكل نوع عقار"
              : "View occupancy status and manage tenants for each property type"}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            <Link
              href={`/${locale}/dashboard/landlord/properties/apartments`}
              className="group block relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-800 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                  <Building2 size={28} />
                </div>
                <div className="text-slate-300 dark:text-slate-700 transition-colors group-hover:text-amber-500">
                  <ArrowIcon size={20} />
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-cairo mb-1">
                {isRtl ? "الشقق" : "Apartments"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo mb-5">
                {isRtl ? "الاشغال، المستاجر الحالي، وتاريخ الايجارات" : "Occupancy, current tenant & rental history"}
              </p>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center bg-slate-50 dark:bg-slate-800/60 rounded-xl py-2 px-1">
                  <span className="block text-lg font-bold text-slate-800 dark:text-slate-100 font-sans">{aptTotal}</span>
                  <span className="text-[10px] text-slate-500 font-cairo">{isRtl ? "المجموع" : "Total"}</span>
                </div>
                <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-xl py-2 px-1">
                  <span className="block text-lg font-bold text-green-600 dark:text-green-400 font-sans">{aptActive}</span>
                  <span className="text-[10px] text-green-600 dark:text-green-400 font-cairo">{isRtl ? "نشط" : "Active"}</span>
                </div>
                <div className="text-center bg-amber-50 dark:bg-amber-900/20 rounded-xl py-2 px-1">
                  <span className="block text-lg font-bold text-amber-600 dark:text-amber-400 font-sans">{aptRented}</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-cairo">{isRtl ? "مؤجر" : "Rented"}</span>
                </div>
                <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-xl py-2 px-1">
                  <span className="block text-lg font-bold text-blue-600 dark:text-blue-400 font-sans">{aptPending}</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-cairo">{isRtl ? "مراجعة" : "Pending"}</span>
                </div>
              </div>
            </Link>

            <Link
              href={`/${locale}/dashboard/landlord/beds`}
              className="group block relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                  <Bed size={28} />
                </div>
                <div className="text-slate-300 dark:text-slate-700 transition-colors group-hover:text-blue-500">
                  <ArrowIcon size={20} />
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-cairo mb-1">
                {isRtl ? "الاسرة (سكن مشترك)" : "Beds (Shared Lodging)"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo mb-5">
                {isRtl ? "ادارة الغرف المشتركة والاسرة الفردية للطلاب" : "Manage shared rooms & individual beds for students"}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center bg-slate-50 dark:bg-slate-800/60 rounded-xl py-2 px-1">
                  <span className="block text-lg font-bold text-slate-800 dark:text-slate-100 font-sans">{bedTotal}</span>
                  <span className="text-[10px] text-slate-500 font-cairo">{isRtl ? "المجموع" : "Total"}</span>
                </div>
                <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-xl py-2 px-1">
                  <span className="block text-lg font-bold text-green-600 dark:text-green-400 font-sans">{bedActive}</span>
                  <span className="text-[10px] text-green-600 dark:text-green-400 font-cairo">{isRtl ? "نشط" : "Active"}</span>
                </div>
                <div className="text-center bg-amber-50 dark:bg-amber-900/20 rounded-xl py-2 px-1">
                  <span className="block text-lg font-bold text-amber-600 dark:text-amber-400 font-sans">{bedRented}</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-cairo">{isRtl ? "مؤجر" : "Rented"}</span>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </LandlordLayout>
  );
}