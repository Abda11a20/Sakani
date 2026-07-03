// apps/frontend/src/app/[locale]/admin/rentals/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import {
  FileText,
  Search,
  User,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Info,
  CalendarDays,
} from "lucide-react";
import { useAdminRentals } from "@/hooks/useAdmin";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export default function AdminRentalsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  // State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedLandlordId, setSelectedLandlordId] = useState<string | null>(null);

  // Queries (fetch 50 items to group them effectively on the client)
  const { data: rentalsData, isLoading } = useAdminRentals(page, 50, search);

  // Process data to group by Landlord
  const landlordsGrouped = useMemo(() => {
    if (!rentalsData?.data) return [];

    const groups: Record<string, {
      landlord: {
        id: string;
        name: string;
        phone: string;
        avatarUrl: string | null;
        email: string;
      };
      rentals: Array<{
        id: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        listing: {
          id: string;
          title: string;
          unitType: string;
          price: number;
          governorate: string;
          district: string;
          images: Array<{ url: string }>;
        };
        tenant: {
          id: string;
          name: string;
          phone: string;
          avatarUrl: string | null;
          email: string;
        };
      }>;
      totalValue: number;
    }> = {};

    rentalsData.data.forEach((item) => {
      const landlord = item.listing.landlord;
      if (!landlord) return;

      if (!groups[landlord.id]) {
        groups[landlord.id] = {
          landlord,
          rentals: [],
          totalValue: 0,
        };
      }

      groups[landlord.id].rentals.push(item);
      groups[landlord.id].totalValue += item.listing.price;
    });

    return Object.values(groups).sort((a, b) => b.totalValue - a.totalValue);
  }, [rentalsData]);

  // Landlord modal details
  const selectedLandlord = useMemo(() => {
    return landlordsGrouped.find((g) => g.landlord.id === selectedLandlordId);
  }, [landlordsGrouped, selectedLandlordId]);

  // Overall statistics calculated from fetched data
  const stats = useMemo(() => {
    if (!rentalsData?.data) return { totalRenters: 0, totalContracts: 0, totalValue: 0 };
    
    // Uniq tenants
    const tenantIds = new Set(rentalsData.data.map(item => item.tenant.id));
    const totalValue = rentalsData.data.reduce((acc, curr) => acc + curr.listing.price, 0);

    return {
      totalRenters: tenantIds.size,
      totalContracts: rentalsData.data.length,
      totalValue,
    };
  }, [rentalsData]);

  const handleCloseModal = () => {
    setSelectedLandlordId(null);
  };

  return (
    <div className="space-y-6 font-cairo" dir={isRtl ? "rtl" : "ltr"}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="text-[#1B4F8A]" size={24} />
            إدارة عقود الإيجار
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            متابعة العقود المؤجرة وعائدات العقارات مقسمة حسب المؤجرين
          </p>
        </div>
      </div>

      {/* ── Summary Stats ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat 1: Total Active Rentals */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">إجمالي العقود الموثقة</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-sans">
              {isLoading ? "..." : stats.totalContracts}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FileText size={22} />
          </div>
        </div>

        {/* Stat 2: Total Renters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">عدد المستأجرين</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-sans">
              {isLoading ? "..." : stats.totalRenters}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <User size={22} />
          </div>
        </div>

        {/* Stat 3: Total Rental Value */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">إجمالي قيمة الإيجارات شهرياً</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-sans">
              {isLoading ? "..." : `${stats.totalValue.toLocaleString("ar-EG")} ج.م`}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <TrendingUp size={22} />
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث باسم المؤجر، رقم الهاتف أو عنوان العقار..."
            className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1B4F8A] transition-all"
          />
        </div>
      </div>

      {/* ── Landlords Grid ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-slate-500">جاري تحميل عقود الإيجار...</p>
        </div>
      ) : landlordsGrouped.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
          <Building2 className="mx-auto text-slate-300 dark:text-slate-750 mb-3" size={40} />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">لا توجد عقود مؤجرة</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            لم يتم العثور على أي عقود إيجار مسجلة أو مكتملة تطابق البحث الحالي.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {landlordsGrouped.map((group) => (
            <div
              key={group.landlord.id}
              onClick={() => setSelectedLandlordId(group.landlord.id)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-all duration-200 cursor-pointer group hover:-translate-y-0.5"
            >
              {/* Landlord Header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-lg border border-slate-200 dark:border-slate-700">
                  {group.landlord.avatarUrl ? (
                    <img
                      src={group.landlord.avatarUrl}
                      alt={group.landlord.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    group.landlord.name.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-[#1B4F8A] transition-colors">
                    {group.landlord.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5" dir="ltr">
                    <Phone size={12} className="text-slate-400" />
                    <span>{group.landlord.phone}</span>
                  </p>
                </div>
                <ArrowUpRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>

              {/* Landlord Rental Details */}
              <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3">
                  <span className="text-[10px] font-semibold text-slate-400 block">العقود النشطة</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                    {group.rentals.length} {group.rentals.length > 10 ? "عقد" : "عقود"}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3">
                  <span className="text-[10px] font-semibold text-slate-400 block">إجمالي الإيرادات</span>
                  <span className="text-sm font-bold text-[#1B4F8A] dark:text-blue-400 mt-1 block">
                    {group.totalValue.toLocaleString("ar-EG")} ج.م
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal / Drawer showing individual rentals for selected Landlord ─────── */}
      {selectedLandlord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden font-cairo">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Building2 size={20} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">عقود إيجار المؤجر: {selectedLandlord.landlord.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>الهاتف: {selectedLandlord.landlord.phone}</span>
                    <span>·</span>
                    <span>إجمالي الإيرادات: {selectedLandlord.totalValue.toLocaleString("ar-EG")} ج.م / شهرياً</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body (Scrollable List of Contracts) */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50 dark:bg-slate-950/20">
              {selectedLandlord.rentals.map((rental) => {
                // Dynamically evaluate contract state
                const startDate = new Date(rental.updatedAt);
                const endDate = new Date(rental.updatedAt);
                endDate.setFullYear(startDate.getFullYear() + 1); // 1-year contract length
                
                const isOngoing = new Date() < endDate;

                return (
                  <div
                    key={rental.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center"
                  >
                    {/* Listing & Contract Info */}
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                        {rental.listing.images && rental.listing.images[0]?.url ? (
                          <img
                            src={rental.listing.images[0].url}
                            alt={rental.listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building2 size={24} className="text-slate-400 m-auto mt-4" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {rental.listing.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <MapPin size={12} className="text-slate-400" />
                          <span>{rental.listing.governorate} · {rental.listing.district}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                            {rental.listing.unitType === "apartment" ? "شقة كاملة" : "غرفة / سرير"}
                          </span>
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-md font-bold",
                            isOngoing
                              ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          )}>
                            {isOngoing ? "عقد ساري" : "منتهي الصلاحية"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tenant & Financials */}
                    <div className="flex flex-col sm:flex-row gap-6 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                      {/* Tenant */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase block">المستأجر</span>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold border border-slate-200 dark:border-slate-700">
                            {rental.tenant.avatarUrl ? (
                              <img
                                src={rental.tenant.avatarUrl}
                                alt={rental.tenant.name}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              rental.tenant.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              {rental.tenant.name}
                            </span>
                            <span className="text-[10px] text-slate-500 block" dir="ltr">
                              {rental.tenant.phone}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Contract Range */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase block flex items-center gap-1">
                          <Calendar size={10} /> فترة الإيجار
                        </span>
                        <span className="text-xs text-slate-700 dark:text-slate-300 block font-sans">
                          {startDate.toLocaleDateString("en-US")} - {endDate.toLocaleDateString("en-US")}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          مدة العقد: 12 شهر
                        </span>
                      </div>

                      {/* Price */}
                      <div className="space-y-1 min-w-[90px]">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase block">مبلغ الإيجار</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white block font-sans">
                          {rental.listing.price.toLocaleString("ar-EG")} ج.م
                        </span>
                        <span className="text-[10px] text-slate-450 block">شهرياً</span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={handleCloseModal}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-850 hover:bg-slate-300 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
