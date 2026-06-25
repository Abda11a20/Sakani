// apps/frontend/src/app/[locale]/dashboard/landlord/page.tsx
"use client";

import React from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useMyListings } from "@/hooks/useListings";
import { useLandlordRequests, useLandlordRequestStats } from "@/hooks/useRequests";
import LandlordLayout from "@/components/layout/LandlordLayout";
import { Card, CardHeader, CardBody, Spinner, Button, Badge } from "@/components/ui";
import {
  Building,
  Eye,
  CheckCircle2,
  FileText,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Clock,
  User,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

export default function LandlordDashboard() {
  const locale = useLocale();
  const { user, isLoading: isAuthLoading } = useAuthGuard({ role: "landlord" });

  const { data: listings = [], isLoading: isListingsLoading } = useMyListings();
  const { data: requestsData, isLoading: isRequestsLoading } = useLandlordRequests(1);
  const { data: stats, isLoading: isStatsLoading } = useLandlordRequestStats();

  const isLoading = isAuthLoading || isListingsLoading || isRequestsLoading || isStatsLoading;

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Calculate statistics
  const landlordListings = listings || [];
  const totalListings = landlordListings.length;
  const activeListings = landlordListings.filter((l) => l.status === "active").length;
  const totalViews = landlordListings.reduce((sum, item) => sum + (item.views || 0), 0);
  
  const landlordItems = requestsData?.items || [];
  const pendingRequests = stats?.pending ?? landlordItems.filter(r => r.status === "pending").length ?? 0;

  const recentRequests = landlordItems.slice(0, 5);
  const recentListings = landlordListings.slice(0, 3);

  return (
    <LandlordLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-cairo">مرحباً، {user.name} 👋</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-cairo">
              إليك ملخص أداء عقاراتك وطلبات الاستئجار اليوم.
            </p>
          </div>
          <Link href={`/${locale}/dashboard/landlord/listings/add`}>
            <Button className="font-cairo flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-6 px-6">
              <Plus size={18} />
              <span>إضافة إعلان جديد</span>
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Listings */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <CardBody className="p-6 flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium font-cairo">إجمالي الإعلانات</span>
                <h3 className="text-3xl font-bold font-sans">{totalListings}</h3>
                <div className="flex items-center gap-1 text-slate-400 text-xs font-cairo">
                  <span>منشور ومسودة</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Building size={22} />
              </div>
            </CardBody>
          </Card>

          {/* Card 2: Active Listings */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <CardBody className="p-6 flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium font-cairo">الإعلانات النشطة</span>
                <h3 className="text-3xl font-bold font-sans text-green-600 dark:text-green-400">{activeListings}</h3>
                <div className="flex items-center gap-1 text-green-500 text-xs font-cairo">
                  <TrendingUp size={12} />
                  <span>متاحة للبحث</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center">
                <CheckCircle2 size={22} />
              </div>
            </CardBody>
          </Card>

          {/* Card 3: Pending Requests */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <CardBody className="p-6 flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium font-cairo">الطلبات الجديدة</span>
                <div className="flex items-center gap-2">
                  <h3 className="text-3xl font-bold font-sans text-blue-600 dark:text-blue-400">{pendingRequests}</h3>
                  {pendingRequests > 0 && (
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full font-bold">
                      جديد
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-xs font-cairo">
                  <span>تنتظر ردك</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileText size={22} />
              </div>
            </CardBody>
          </Card>

          {/* Card 4: Total Views */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <CardBody className="p-6 flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium font-cairo">إجمالي المشاهدات</span>
                <h3 className="text-3xl font-bold font-sans">{totalViews}</h3>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-cairo">
                  <TrendingUp size={12} />
                  <span>تفاعل مستمر</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                <Eye size={22} />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Dashboard Grid Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Requests Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold font-cairo text-slate-800 dark:text-slate-100">آخر الطلبات الواردة</h2>
              <Link href={`/${locale}/dashboard/landlord/requests`}>
                <span className="text-sm font-bold text-amber-500 hover:text-amber-600 font-cairo flex items-center gap-1">
                  عرض الكل
                  <ArrowLeft size={14} className="rtl:rotate-0 rotate-180" />
                </span>
              </Link>
            </div>

            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
              <CardBody className="p-0">
                {recentRequests.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-cairo">
                    <FileText size={40} className="mx-auto mb-3 opacity-30" />
                    <p>لا توجد طلبات واردة بعد</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentRequests.map((req) => (
                      <div key={req.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/35 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold shrink-0">
                            {req.tenant?.name ? req.tenant.name[0] : <User size={18} />}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm font-cairo">
                              {req.tenant?.name || "مستأجر"}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo mt-0.5">
                              طلب معاينة لعقار: <span className="font-medium text-slate-700 dark:text-slate-300">{req.listing?.title || "غير معروف"}</span>
                            </p>
                            {req.requestedDate && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                                <Clock size={11} />
                                <span>{new Date(req.requestedDate).toLocaleDateString("ar-EG")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <Badge
                            className={
                              req.status === "pending"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                                : req.status === "approved"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                : req.status === "rejected"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                : "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400"
                            }
                          >
                            {req.status === "pending"
                              ? "جديد"
                              : req.status === "approved"
                              ? "مقبول"
                              : req.status === "rejected"
                              ? "مرفوض"
                              : "مكتمل"}
                          </Badge>
                          <Link href={`/${locale}/dashboard/landlord/requests`}>
                            <Button size="sm" variant="outline" className="rounded-lg text-xs font-cairo">
                              إدارة
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Quick Listings View */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold font-cairo text-slate-800 dark:text-slate-100">إعلاناتي الأخيرة</h2>
              <Link href={`/${locale}/dashboard/landlord/listings`}>
                <span className="text-sm font-bold text-amber-500 hover:text-amber-600 font-cairo flex items-center gap-1">
                  كل الإعلانات
                  <ArrowLeft size={14} className="rtl:rotate-0 rotate-180" />
                </span>
              </Link>
            </div>

            <div className="space-y-4">
              {recentListings.length === 0 ? (
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6 text-center text-slate-400 dark:text-slate-500 font-cairo">
                  <Building size={32} className="mx-auto mb-2 opacity-30" />
                  <p>لم تقم بإضافة عقارات بعد</p>
                </Card>
              ) : (
                recentListings.map((listing) => (
                  <Card key={listing.id} className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                    <CardBody className="p-4 flex items-center gap-3">
                      <img
                        src={listing.images[0] || "/placeholder-listing.jpg"}
                        alt={listing.title}
                        className="w-16 h-16 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate font-cairo">
                          {listing.title}
                        </h4>
                        <p className="text-xs text-slate-500 truncate mt-0.5 font-cairo">
                          {listing.district}، {listing.city}
                        </p>
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1 font-sans">
                          {new Intl.NumberFormat("ar-EG").format(listing.price)} ج.م/شهر
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}
