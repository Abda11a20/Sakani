// apps/frontend/src/app/[locale]/dashboard/landlord/properties/apartments/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import LandlordLayout from "@/components/layout/LandlordLayout";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useMyListings } from "@/hooks/useListings";
import { Spinner, Card, CardBody, Button, Badge } from "@/components/ui";
import { Building2, Search, MapPin, Eye, ArrowUpDown, ChevronRight, User } from "lucide-react";

type OccupancyFilter = "all" | "vacant" | "rented";
type SortOption = "newest" | "price-asc" | "price-desc";

export default function LandlordApartmentsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const { data: rawListings = [], isLoading } = useMyListings();
  const listings = rawListings || [];

  // Filter only apartments
  const apartments = useMemo(() => {
    return listings.filter((l) => (l.type || l.unitType) === "apartment");
  }, [listings]);

  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [occupancyFilter, setOccupancyFilter] = useState<OccupancyFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Filtered & sorted apartments
  const filteredApartments = useMemo(() => {
    let result = [...apartments];

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (apt) =>
          apt.title?.toLowerCase().includes(term) ||
          apt.district?.toLowerCase().includes(term) ||
          apt.city?.toLowerCase().includes(term)
      );
    }

    // Occupancy filter
    if (occupancyFilter === "vacant") {
      result = result.filter((apt) => apt.status !== "rented");
    } else if (occupancyFilter === "rented") {
      result = result.filter((apt) => apt.status === "rented");
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === "price-asc") {
        return (a.price || 0) - (b.price || 0);
      }
      if (sortBy === "price-desc") {
        return (b.price || 0) - (a.price || 0);
      }
      return 0;
    });

    return result;
  }, [apartments, searchTerm, occupancyFilter, sortBy]);

  return (
    <LandlordLayout>
      <div className="space-y-8" dir={isRtl ? "rtl" : "ltr"}>
        {/* Breadcrumb & Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2 font-cairo">
              <Link href={`/${locale}/dashboard/landlord/properties`} className="hover:text-amber-500">
                {isRtl ? "إدارة العقارات" : "My Properties"}
              </Link>
              <ChevronRight size={14} className={isRtl ? "rotate-180" : ""} />
              <span className="text-slate-900 dark:text-slate-200">
                {isRtl ? "الشقق والمساكن" : "Apartments"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-cairo">
              {isRtl ? "الشقق السكنية" : "Apartment Properties"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo mt-1">
              {isRtl
                ? "تتبع حالة إشغال شققك، أدر المستأجرين، واطلع على عقود الإيجار."
                : "Track occupancy of your apartments, manage tenants, and view rental contracts."}
            </p>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          {/* Search Input */}
          <div className="relative w-full lg:max-w-xs">
            <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={isRtl ? "بحث بالاسم أو الحي..." : "Search by name or district..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-cairo"
            />
          </div>

          {/* Right Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            {/* Occupancy Status Filters */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setOccupancyFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-cairo transition-all ${
                  occupancyFilter === "all"
                    ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                }`}
              >
                {isRtl ? "الكل" : "All"}
              </button>
              <button
                onClick={() => setOccupancyFilter("vacant")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-cairo transition-all ${
                  occupancyFilter === "vacant"
                    ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                }`}
              >
                {isRtl ? "شاغرة" : "Vacant"}
              </button>
              <button
                onClick={() => setOccupancyFilter("rented")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-cairo transition-all ${
                  occupancyFilter === "rented"
                    ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                }`}
              >
                {isRtl ? "مؤجرة" : "Rented"}
              </button>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl">
              <ArrowUpDown size={14} className="text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs font-semibold font-cairo text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="newest">{isRtl ? "الأحدث" : "Newest"}</option>
                <option value="price-asc">{isRtl ? "السعر: من الأقل" : "Price: Low to High"}</option>
                <option value="price-desc">{isRtl ? "السعر: من الأعلى" : "Price: High to Low"}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content list */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        ) : filteredApartments.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl font-cairo">
            <Building2 size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {isRtl ? "لا توجد شقق" : "No Apartments Found"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto text-sm">
              {isRtl
                ? "لم نجد أي شقق تطابق خيارات التصفية المحددة."
                : "No apartment units match the selected filters."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApartments.map((apt) => {
              const isRented = apt.status === "rented" || Boolean(apt.currentTenantId);

              return (
                <div
                  key={apt.id}
                  className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all gap-4"
                >
                  {/* Left Section: Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 font-cairo text-base">
                        {apt.title}
                      </h3>
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs mt-1 font-cairo">
                        <MapPin size={13} className="text-amber-500" />
                        <span>
                          {apt.district}، {apt.city}
                        </span>
                      </div>

                      {/* Current Tenant Preview if rented */}
                      {isRented && apt.currentTenant && (
                        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 mt-2 font-cairo font-medium">
                          <User size={12} />
                          <span>
                            {isRtl ? "المستأجر:" : "Tenant:"} {apt.currentTenant.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle Section: Status / Price */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      {isRented ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 font-cairo">
                          {isRtl ? "مؤجرة" : "Rented"}
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 font-cairo">
                          {isRtl ? "شاغرة" : "Vacant"}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm font-sans font-bold text-slate-700 dark:text-slate-300">
                      {new Intl.NumberFormat(isRtl ? "ar-EG" : "en-US").format(apt.price)}{" "}
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-cairo">
                        {isRtl ? "ج.م / شهر" : "EGP/mo"}
                      </span>
                    </div>
                  </div>

                  {/* Right Section: Action Button */}
                  <div className="w-full md:w-auto self-stretch md:self-auto flex items-center">
                    <Link
                      href={`/${locale}/dashboard/landlord/properties/apartments/${apt.id}`}
                      className="w-full md:w-auto"
                    >
                      <Button
                        variant="outline"
                        className="w-full md:w-auto py-2.5 px-4 text-xs font-bold font-cairo rounded-xl flex items-center justify-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-850"
                      >
                        <Eye size={14} />
                        <span>{isRtl ? "تفاصيل العقار" : "Property Details"}</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </LandlordLayout>
  );
}