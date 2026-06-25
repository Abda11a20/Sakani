// apps/frontend/src/app/[locale]/dashboard/tenant/page.tsx
"use client";

import React, { useState } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useTenantRequests } from "@/hooks/useRequests";
import { useMyAlerts, useCreateAlert } from "@/hooks/useAlerts";
import TenantLayout from "@/components/layout/TenantLayout";
import { Card, CardBody, Spinner, Button, Badge, Modal, Input, useToast } from "@/components/ui";
import {
  FileText,
  Bell,
  Star,
  Search,
  Plus,
  Clock,
  Calendar,
  Building,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

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
  const { user, isLoading: isAuthLoading } = useAuthGuard(); // Accept tenant or landlord

  // Fetch Requests & Alerts
  const { data: requestsData, isLoading: isRequestsLoading } = useTenantRequests(1);
  const { data: rawAlerts = [], isLoading: isAlertsLoading } = useMyAlerts();
  const alerts = rawAlerts || [];
  const { mutate: createAlert, isPending: isCreatingAlert } = useCreateAlert();

  // Alert Modal State
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [gov, setGov] = useState("القاهرة");
  const [district, setDistrict] = useState("");
  const [unitType, setUnitType] = useState<"apartment" | "room" | "bed">("apartment");
  const [maxPrice, setMaxPrice] = useState("");
  const [genderTarget, setGenderTarget] = useState<"mixed" | "male" | "female">("mixed");
  const [specialty, setSpecialty] = useState("");

  const isLoading = isAuthLoading || isRequestsLoading || isAlertsLoading;

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const requests = requestsData?.items || [];
  
  // Calculate Stats
  const activeRequestsCount = requests.filter(
    (r) => r.status === "pending" || r.status === "accepted" || r.status === "approved"
  ).length;

  const activeAlertsCount = alerts.filter((a) => a.isActive).length;
  
  // Default to counting completed requests that were reviewed or simply completed requests
  const reviewsCount = requests.filter((r) => r.status === "completed").length;

  const recentRequests = requests.slice(0, 3);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 font-bold font-cairo">تحت المراجعة</Badge>;
      case "accepted":
      case "approved":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 font-bold font-cairo">مقبول</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 font-bold font-cairo">مرفوض</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 font-bold font-cairo">مكتمل</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 font-cairo">{status}</Badge>;
    }
  };

  return (
    <TenantLayout>
      <div className="space-y-8">
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
              <Button className="font-cairo bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-5 px-5 flex items-center gap-2">
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Card 1: Active Requests */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <CardBody className="p-6 flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium font-cairo">طلبات نشطة</span>
                <h3 className="text-3xl font-bold font-sans text-blue-600 dark:text-blue-400">{activeRequestsCount}</h3>
                <div className="text-slate-400 text-xs font-cairo">قيد المراجعة أو المقبولة</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileText size={22} />
              </div>
            </CardBody>
          </Card>

          {/* Card 2: Active Alerts */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <CardBody className="p-6 flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium font-cairo">تنبيهات فعّالة</span>
                <h3 className="text-3xl font-bold font-sans text-green-600 dark:text-green-400">{activeAlertsCount}</h3>
                <div className="text-slate-400 text-xs font-cairo">تنبيهات تطابق إعلانات جديدة</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center">
                <Bell size={22} />
              </div>
            </CardBody>
          </Card>

          {/* Card 3: Reviews written */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <CardBody className="p-6 flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium font-cairo">تقييمات كتبتها</span>
                <h3 className="text-3xl font-bold font-sans text-amber-600 dark:text-amber-400">{reviewsCount}</h3>
                <div className="text-slate-400 text-xs font-cairo">ملاحظات وتقييم للمؤجرين</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Star size={22} />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Recent Requests Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold font-cairo text-slate-800 dark:text-slate-100">آخر طلبات الاستئجار</h2>
            <Link href={`/${locale}/dashboard/tenant/requests`}>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline font-cairo flex items-center gap-1">
                عرض كل الطلبات
                <ArrowLeft className="rtl:rotate-0 rotate-180" size={14} />
              </span>
            </Link>
          </div>

          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
            <CardBody className="p-0">
              {recentRequests.length === 0 ? (
                <div className="text-center py-16 text-slate-400 dark:text-slate-500 font-cairo">
                  <FileText size={48} className="mx-auto mb-3 opacity-20" />
                  <p>لا توجد طلبات سابقة. ابدأ بالبحث وتأجير العقار المفضل لديك.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/35 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                          {req.listing?.images?.[0] ? (
                            <img
                              src={req.listing.images[0]}
                              alt={req.listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building size={20} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm font-cairo">
                            {req.listing?.title || "عقار غير محدد"}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-cairo">
                            {req.listing?.address || "عنوان غير محدد"}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 font-cairo">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              <span>المعاينة: {new Date(req.requestedDate).toLocaleDateString("ar-EG")}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        {getStatusBadge(req.status)}
                        <Link href={`/${locale}/dashboard/tenant/requests`}>
                          <Button size="sm" variant="outline" className="rounded-lg text-xs font-cairo">
                            عرض التفاصيل
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
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { key: "apartment", label: "شقة" },
                      { key: "room", label: "غرفة" },
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
