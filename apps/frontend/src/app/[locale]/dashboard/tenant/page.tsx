// apps/frontend/src/app/[locale]/dashboard/tenant/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useTenantRequests } from "@/hooks/useRequests";
import { useMyAlerts, useCreateAlert } from "@/hooks/useAlerts";
import TenantLayout from "@/components/layout/TenantLayout";
import { Spinner, Button, Modal, Input, useToast } from "@/components/ui";
import {
  FileText,
  Bell,
  Search,
  Plus,
  ArrowUpRight,
  TrendingUp,
  History,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useTenantDashboardStats } from "@/hooks/useDashboard";
import ActivityFeed, { ActivityItem } from "@/components/dashboard/ActivityFeed";
import { StatsCard, formatStatsNumber } from "@/components/dashboard/StatsCard";

// ── Egypt Governorates ──
const GOVERNORATES = [
  { value: "القاهرة", label: "القاهرة" },
  { value: "الجيزة", label: "الجيزة" },
  { value: "الإسكندرية", label: "الإسكندرية" },
  { value: "القليوبية", label: "القليوبية" },
  { value: "المنوفية", label: "المنوفية" },
  { value: "الغربية", label: "الغربية" },
  { value: "الدقهلية", label: "الدقهلية" },
  { value: "الشرقية", label: "الشرقية" },
  { value: "دمياط", label: "دمياط" },
  { value: "بورسعيد", label: "بورسعيد" },
  { value: "السويس", label: "السويس" },
  { value: "الإسماعيلية", label: "الإسماعيلية" },
  { value: "الفيوم", label: "الفيوم" },
  { value: "بني سويف", label: "بني سويف" },
  { value: "المنيا", label: "المنيا" },
  { value: "أسيوط", label: "أسيوط" },
  { value: "سوهاج", label: "سوهاج" },
  { value: "قنا", label: "قنا" },
  { value: "الأقصر", label: "الأقصر" },
  { value: "أسوان", label: "أسوان" },
];

export default function TenantDashboard() {
  const locale = useLocale();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuthGuard({ requiredRoles: ["tenant"] });

  // Fetch Requests & Alerts & Backend Stats
  const { data: stats, isLoading: isStatsLoading } = useTenantDashboardStats();
  const { data: requestsData, isLoading: isRequestsLoading } = useTenantRequests(1);
  const { data: rawAlerts = [], isLoading: isAlertsLoading } = useMyAlerts();
  const { mutate: createAlert, isPending: isCreatingAlert } = useCreateAlert();

  const alerts = rawAlerts || [];

  // Alert Modal State
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [gov, setGov] = useState("القاهرة");
  const [district, setDistrict] = useState("");
  const [unitType, setUnitType] = useState<"apartment" | "bed">("apartment");
  const [maxPrice, setMaxPrice] = useState("");
  const [genderTarget, setGenderTarget] = useState<"mixed" | "male" | "female">("mixed");
  const [specialty, setSpecialty] = useState("");

  const isLoading = isAuthLoading || isStatsLoading || isRequestsLoading || isAlertsLoading;

  // Build activity feed items
  const activityItems = useMemo<ActivityItem[]>(() => {
    const list: ActivityItem[] = [];
    
    // Add viewing requests to feed
    const requests = requestsData?.items || [];
    requests.slice(0, 3).forEach((req) => {
      list.push({
        id: `req-${req.id}`,
        title: req.listing?.title || "طلب معاينة عقار",
        description: `المعاينة المفضلة: ${new Date(req.preferredDate).toLocaleDateString("ar-EG")}`,
        date: req.createdAt,
        icon: FileText,
        color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
        badge: {
          text: req.status === "pending" ? "جديد" : req.status === "accepted" || req.status === "approved" ? "مقبول" : req.status === "rejected" ? "مرفوض" : "مكتمل",
          variant: req.status === "pending" ? "warning" : req.status === "accepted" || req.status === "approved" ? "success" : req.status === "rejected" ? "danger" : "info",
        }
      });
    });

    // Add alerts to feed
    alerts.slice(0, 2).forEach((alert) => {
      list.push({
        id: `alert-${alert.id}`,
        title: `تنبيه ذكي: ${alert.governorate || "كل المحافظات"}`,
        description: `${alert.district || ""} - الحد الأقصى للسعر: ${alert.maxPrice || "بدون حد"}`,
        date: alert.createdAt,
        icon: Bell,
        color: "text-green-500 bg-green-50 dark:bg-green-950/30",
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [requestsData, alerts]);

  const isRtl = locale === "ar";

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleCreateAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAlert(
      {
        governorate: gov,
        district: district || undefined,
        unitType,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        genderTarget,
        specialty: specialty || undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: "تم تفعيل التنبيه",
            description: "سنقوم بإخطارك فور إدراج عقار يطابق هذه المواصفات.",
            type: "success",
          });
          setIsAlertModalOpen(false);
          setDistrict("");
          setMaxPrice("");
          setSpecialty("");
        },
        onError: () => {
          toast({
            title: "فشل تفعيل التنبيه",
            description: "حدث خطأ أثناء حفظ التنبيه. حاول مرة أخرى.",
            type: "error",
          });
        },
      }
    );
  };

  return (
    <TenantLayout>
      <div className="space-y-8" dir={isRtl ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-cairo">مرحباً، {user.name} 👋</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-cairo">
              هنا يمكنك متابعة حالة طلبات الاستئجار والتنبيهات الخاصة بك.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/${locale}/search`}>
              <Button className="font-cairo bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-5 px-5 flex items-center gap-2 shadow-md shadow-blue-500/10">
                <Search size={16} />
                <span>ابحث عن سكن</span>
              </Button>
            </Link>
            <Button
              onClick={() => setIsAlertModalOpen(true)}
              variant="outline"
              className="font-cairo border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-xl py-5 px-5 flex items-center gap-2"
            >
              <Plus size={16} />
              <span>تنبيه جديد</span>
            </Button>
          </div>
        </div>

        {/* ── Statistics Section ── */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white font-cairo">
            {isRtl ? "الإحصائيات الرئيسية" : "Key Statistics"}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatsCard
              title="طلبات نشطة"
              value={stats?.activeRequests ?? 0}
              locale={locale}
              icon={<FileText size={22} />}
              color="blue"
              subtitle="قيد المعاينة أو المقبولة"
            />
            <StatsCard
              title="تنبيهات نشطة"
              value={stats?.activeAlerts ?? 0}
              locale={locale}
              icon={<Bell size={22} />}
              color="green"
              subtitle="للبحث التلقائي عن سكن"
            />
            <StatsCard
              title="الإيجارات المكتملة"
              value={stats?.rentedUnits ?? 0}
              locale={locale}
              icon={<CheckCircle2 size={22} />}
              color="gold"
              subtitle="عقود سكنية مكتملة"
            />
            <StatsCard
              title="إجمالي الإيجار الشهري"
              value={stats?.monthlyRent === 0 ? "0" : `${formatStatsNumber(stats?.monthlyRent ?? 0, locale)} ${isRtl ? "ج.م" : "EGP"}`}
              locale={locale}
              icon={<TrendingUp size={22} />}
              color="green"
              subtitle="مجموع مبالغ الإيجار الحالي"
            />
          </div>
        </div>

        {/* ── Content Row (Recent Activity & Quick Actions) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity (Left 2 columns) */}
          <div className="lg:col-span-2">
            <ActivityFeed
              title={isRtl ? "آخر النشاطات والطلبات" : "Recent Activity & Requests"}
              items={activityItems}
              emptyText={isRtl ? "لا توجد طلبات أو تنبيهات حديثة حالياً" : "No recent requests or alerts found."}
            />
          </div>

          {/* Quick Actions (Right 1 column) */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white font-cairo">
              {isRtl ? "إجراءات سريعة" : "Quick Actions"}
            </h3>

            <div className="grid grid-cols-1 gap-3.5">
              <Link
                href={`/${locale}/search`}
                className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-300 dark:hover:border-blue-900 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Search size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold font-cairo text-slate-900 dark:text-white">ابحث عن سكن ملائم</h4>
                    <p className="text-xs text-slate-400 font-cairo">تصفح العقارات المتاحة للطلاب</p>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </Link>

              <button
                onClick={() => setIsAlertModalOpen(true)}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-green-300 dark:hover:border-green-900 transition-all group text-start"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
                    <Bell size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold font-cairo text-slate-900 dark:text-white">تفعيل تنبيه جديد</h4>
                    <p className="text-xs text-slate-400 font-cairo">مواصفات تهمك وسنخطرك بها</p>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-slate-300 group-hover:text-green-500 transition-colors" />
              </button>

              <Link
                href={`/${locale}/dashboard/tenant/rental-history`}
                className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-amber-300 dark:hover:border-amber-900 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <History size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold font-cairo text-slate-900 dark:text-white">سجل إيجاراتي</h4>
                    <p className="text-xs text-slate-400 font-cairo">الإيجارات المكتملة والأرشيف</p>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
              </Link>
            </div>
          </div>
        </div>

        {/* Create Alert Modal */}
        {isAlertModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setIsAlertModalOpen(false)}
            title="تفعيل تنبيه بحث ذكي جديد"
          >
            <form onSubmit={handleCreateAlertSubmit} className="p-6 space-y-4 font-cairo">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">المحافظة</label>
                <select
                  value={gov}
                  onChange={(e) => setGov(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {GOVERNORATES.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="الحي/المنطقة"
                placeholder="مثال: الدقي، جليم، مدينة نصر"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">نوع الوحدة</label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { key: "apartment", label: "شقة" },
                      { key: "bed", label: "سرير" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setUnitType(opt.key)}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                        unitType === opt.key
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                type="number"
                label="الحد الأقصى للسعر"
                placeholder="مثال: 3000"
                rightIcon={<span className="text-xs font-semibold">ج.م</span>}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">الفئة المستهدفة</label>
                <select
                  value={genderTarget}
                  onChange={(e) => setGenderTarget(e.target.value as any)}
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mixed">الجميع</option>
                  <option value="male">شباب فقط</option>
                  <option value="female">بنات فقط</option>
                </select>
              </div>

              {unitType === "bed" && (
                <Input
                  label="التخصص الدراسي / الوظيفي (اختياري)"
                  placeholder="مثال: هندسة، طب، موظف"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                />
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  onClick={() => setIsAlertModalOpen(false)}
                  variant="outline"
                  className="flex-1 rounded-xl py-3 border-slate-200 dark:border-slate-800"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingAlert}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-3"
                >
                  {isCreatingAlert ? "جاري الحفظ..." : "حفظ وتفعيل التنبيه"}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </TenantLayout>
  );
}
