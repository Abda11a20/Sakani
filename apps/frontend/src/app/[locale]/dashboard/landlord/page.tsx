// apps/frontend/src/app/[locale]/dashboard/landlord/page.tsx
"use client";

import React, { useMemo } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useMyListings } from "@/hooks/useListings";
import { useLandlordRequests } from "@/hooks/useRequests";
import { useLandlordDashboardStats } from "@/hooks/useDashboard";
import LandlordLayout from "@/components/layout/LandlordLayout";
import { Card, CardBody, Spinner, Button } from "@/components/ui";
import {
  Building,
  CheckCircle2,
  FileText,
  Plus,
  ArrowUpRight,
  Clock,
  User,
  History,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { getImageUrl } from "@/lib/utils";
import ActivityFeed, { ActivityItem } from "@/components/dashboard/ActivityFeed";

export default function LandlordDashboard() {
  const locale = useLocale();
  const { user, isLoading: isAuthLoading } = useAuthGuard({ role: "landlord" });

  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useLandlordDashboardStats();
  const { data: listings = [], isLoading: isListingsLoading } = useMyListings();
  const { data: requestsData, isLoading: isRequestsLoading } = useLandlordRequests(1);

  const isLoading = isAuthLoading || isStatsLoading || isListingsLoading || isRequestsLoading;

  // Build activity feed items
  const activityItems = useMemo<ActivityItem[]>(() => {
    const list: ActivityItem[] = [];
    
    // Add viewing requests to feed
    const requests = requestsData?.items || [];
    requests.slice(0, 3).forEach((req) => {
      list.push({
        id: `req-${req.id}`,
        title: req.tenant?.name || "طلب معاينة جديد",
        description: `طلب معاينة لعقار: ${req.listing?.title || "غير معروف"}`,
        date: req.createdAt,
        icon: FileText,
        color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
        badge: {
          text: req.status === "pending" ? "جديد" : req.status === "accepted" || req.status === "approved" ? "مقبول" : req.status === "rejected" ? "مرفوض" : "مكتمل",
          variant: req.status === "pending" ? "warning" : req.status === "accepted" || req.status === "approved" ? "success" : req.status === "rejected" ? "danger" : "info",
        }
      });
    });

    // Add recent listings to feed
    listings.slice(0, 2).forEach((lis) => {
      list.push({
        id: `lis-${lis.id}`,
        title: lis.title,
        description: `${lis.district}، ${lis.governorate || ""}`,
        date: lis.createdAt,
        icon: Building,
        color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30",
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [listings, requestsData]);

  const isRtl = locale === "ar";

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <LandlordLayout>
      <div className="space-y-8" dir={isRtl ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-cairo">مرحباً، {user.name} 👋</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-cairo">
              إليك ملخص أداء عقاراتك وإيجاراتك وإحصائياتها.
            </p>
          </div>
          <Link href={`/${locale}/dashboard/landlord/listings/add`}>
            <Button className="font-cairo flex items-center gap-2 bg-[#D4A847] hover:bg-[#C49535] text-white rounded-xl py-6 px-6 shadow-md shadow-[#D4A847]/10">
              <Plus size={18} />
              <span>إضافة إعلان جديد</span>
            </Button>
          </Link>
        </div>

        {/* ── Statistics Section ── */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white font-cairo">
            {isRtl ? "الإحصائيات الرئيسية" : "Key Statistics"}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Total Views */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all">
              <CardBody className="p-4 sm:p-6 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold font-cairo">إجمالي المشاهدات</span>
                  <h3 className="text-2xl font-bold font-sans text-blue-600 dark:text-blue-400">{new Intl.NumberFormat(isRtl ? "ar-EG" : "en-US").format(stats?.totalViews ?? 0)}</h3>
                  <p className="text-[10px] text-slate-400 font-cairo">على جميع إعلاناتك</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <Eye size={22} />
                </div>
              </CardBody>
            </Card>

            {/* Active Listings */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all">
              <CardBody className="p-4 sm:p-6 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold font-cairo">الإعلانات النشطة</span>
                  <h3 className="text-2xl font-bold font-sans text-amber-600 dark:text-amber-400">{stats?.activeListings ?? 0}</h3>
                  <p className="text-[10px] text-slate-400 font-cairo">منشورة ومتاحة للبحث</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Building size={22} />
                </div>
              </CardBody>
            </Card>

            {/* Occupied Units */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all">
              <CardBody className="p-4 sm:p-6 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold font-cairo">الوحدات المؤجرة</span>
                  <h3 className="text-2xl font-bold font-sans text-green-600 dark:text-green-400">{stats?.occupiedUnits ?? 0}</h3>
                  <p className="text-[10px] text-slate-400 font-cairo">عقود إيجار جارية</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={22} />
                </div>
              </CardBody>
            </Card>

            {/* Pending Requests */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all">
              <CardBody className="p-4 sm:p-6 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold font-cairo">طلبات معلقة</span>
                  <h3 className="text-2xl font-bold font-sans text-orange-600 dark:text-orange-400">{stats?.pendingRequests ?? 0}</h3>
                  <p className="text-[10px] text-slate-400 font-cairo">تنتظر ردك وقبولك</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                  <FileText size={22} />
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* ── Content Row (Recent Activity & Quick Actions) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity (Left 2 columns) */}
          <div className="lg:col-span-2">
            <ActivityFeed
              title={isRtl ? "آخر النشاطات والطلبات" : "Recent Activity & Requests"}
              items={activityItems}
              emptyText={isRtl ? "لا توجد نشاطات أو طلبات حديثة حالياً" : "No recent activity or requests found."}
            />
          </div>

          {/* Quick Actions (Right 1 column) */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white font-cairo">
              {isRtl ? "إجراءات سريعة" : "Quick Actions"}
            </h3>
            
            <div className="grid grid-cols-1 gap-3.5">
              <Link
                href={`/${locale}/dashboard/landlord/listings/add`}
                className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-amber-300 dark:hover:border-amber-900 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold font-cairo text-slate-900 dark:text-white">إضافة إعلان جديد</h4>
                    <p className="text-xs text-slate-400 font-cairo">نشر وحدة جديدة في المنصة</p>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
              </Link>

              <Link
                href={`/${locale}/dashboard/landlord/properties`}
                className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-300 dark:hover:border-blue-900 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Building size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold font-cairo text-slate-900 dark:text-white">إدارة العقارات</h4>
                    <p className="text-xs text-slate-400 font-cairo">الشقق والأسرة والغرف</p>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </Link>

              <Link
                href={`/${locale}/dashboard/landlord/rental-history`}
                className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-green-300 dark:hover:border-green-900 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
                    <History size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold font-cairo text-slate-900 dark:text-white">سجل الإيجارات</h4>
                    <p className="text-xs text-slate-400 font-cairo">العقود المكتملة والأرشيف</p>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-slate-300 group-hover:text-green-500 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}
