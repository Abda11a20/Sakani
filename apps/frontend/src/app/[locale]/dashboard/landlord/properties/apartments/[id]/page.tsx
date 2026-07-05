// apps/frontend/src/app/[locale]/dashboard/landlord/properties/apartments/[id]/page.tsx
"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useListing, useVacateUnit } from "@/hooks/useListings";
import { useLandlordRentalHistory } from "@/hooks/useRentalHistory";
import { useQuickRent } from "@/hooks/useRequests";
import { useLookupTenantByPhone } from "@/hooks/useTenantLookup";
import { getWhatsAppLink } from "@/lib/whatsapp";
import LandlordLayout from "@/components/layout/LandlordLayout";
import { Spinner, Card, CardBody, Button, Badge, Modal, useToast } from "@/components/ui";
import {
  Building2,
  ChevronRight,
  MapPin,
  User,
  Calendar,
  AlertTriangle,
  Phone,
  History,
  Info,
  Loader2,
  CheckCircle,
  UserCheck
} from "lucide-react";
import type { RentalHistoryItem } from "@/types";

export default function LandlordApartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { toast } = useToast();
  const id = params?.id as string;

  const { data: apt, isLoading: isAptLoading, refetch } = useListing(id);
  const { mutate: vacateUnit, isPending: isVacating } = useVacateUnit();

  // Load rental history to display previous contracts for this apartment
  const { data: historyData, isLoading: isHistoryLoading } = useLandlordRentalHistory({ limit: 100 });

  const [vacateModalOpen, setVacateModalOpen] = useState(false);
  const [quickRentModalOpen, setQuickRentModalOpen] = useState(false);
  const [quickPhone, setQuickPhone] = useState("");
  const [quickStartDate, setQuickStartDate] = useState("");
  const [quickEndDate, setQuickEndDate] = useState("");
  const [quickFormError, setQuickFormError] = useState("");

  const { data: lookedUpTenant, isLoading: isLookingUp } = useLookupTenantByPhone(quickPhone);
  const { mutate: quickRent, isPending: isQuickRenting } = useQuickRent();

  const isLoading = isAptLoading || isHistoryLoading;

  if (isLoading) {
    return (
      <LandlordLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner size="lg" />
        </div>
      </LandlordLayout>
    );
  }

  if (!apt || (apt.type !== "apartment" && apt.unitType !== "apartment")) {
    return (
      <LandlordLayout>
        <div className="text-center py-20 font-cairo">
          <Building2 size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            {isRtl ? "العقار غير موجود" : "Property Not Found"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto text-sm">
            {isRtl ? "لا تملك صلاحية الوصول لهذا العقار أو أنه غير موجود." : "You do not have access to this property or it does not exist."}
          </p>
          <Link href={`/${locale}/dashboard/landlord/properties/apartments`} className="inline-block mt-6">
            <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-6">
              {isRtl ? "العودة للقائمة" : "Back to List"}
            </Button>
          </Link>
        </div>
      </LandlordLayout>
    );
  }

  const isRented = apt.status === "rented" || Boolean(apt.currentTenantId);

  // Filter completed rentals for this listing
  const aptHistory = (historyData?.data || []).filter(
    (h: RentalHistoryItem) => h.listing?.id === id
  );

  const handleVacateSubmit = () => {
    vacateUnit(id, {
      onSuccess: () => {
        toast({
          title: isRtl ? "تم إنهاء الإيجار بنجاح" : "Rental ended successfully",
          description: isRtl ? "أصبح العقار شاغراً ومتاحاً للحجز مجدداً." : "The property is now vacant and available for booking.",
          type: "success"
        });
        setVacateModalOpen(false);
        refetch();
      },
      onError: () => {
        toast({
          title: isRtl ? "فشل إنهاء الإيجار" : "Failed to vacate unit",
          description: isRtl ? "حدث خطأ أثناء محاولة تعديل حالة العقار." : "An error occurred while updating property status.",
          type: "error"
        });
      }
    });
  };

  const handleQuickRentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuickFormError("");

    if (!quickPhone || quickPhone.length < 11) {
      setQuickFormError(isRtl ? "يرجى إدخال رقم هاتف مستأجر صالح مكون من 11 رقماً على الأقل" : "Please enter a valid 11-digit phone number");
      return;
    }
    if (!lookedUpTenant) {
      setQuickFormError(isRtl ? "يرجى الانتظار حتى يتم التحقق من رقم المستأجر وتأكيد حسابه" : "Please wait for tenant validation");
      return;
    }
    if (!quickStartDate || !quickEndDate) {
      setQuickFormError(isRtl ? "يرجى تحديد تواريخ عقد الإيجار" : "Please select lease dates");
      return;
    }
    if (new Date(quickStartDate) >= new Date(quickEndDate)) {
      setQuickFormError(isRtl ? "تاريخ النهاية يجب أن يكون بعد تاريخ البداية" : "End date must be after start date");
      return;
    }

    quickRent(
      {
        listingId: id,
        phone: quickPhone,
        startDate: new Date(quickStartDate).toISOString(),
        endDate: new Date(quickEndDate).toISOString(),
      },
      {
        onSuccess: () => {
          toast({
            title: isRtl ? "تم التأجير السريع بنجاح" : "Quick Lease Finalized",
            description: isRtl ? "تم إنشاء طلب معاينة وتأجير الشقة للمستأجر فوراً بنجاح." : "Lease has been registered successfully.",
            type: "success",
          });
          setQuickRentModalOpen(false);
          setQuickPhone("");
          setQuickStartDate("");
          setQuickEndDate("");
          refetch();
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message || err.friendlyMessage || (isRtl ? "حدث خطأ أثناء إجراء التأجير السريع." : "An error occurred.");
          setQuickFormError(message);
        },
      }
    );
  };

  return (
    <LandlordLayout>
      <div className="space-y-8" dir={isRtl ? "rtl" : "ltr"}>
        {/* Breadcrumbs */}
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2 font-cairo">
            <Link href={`/${locale}/dashboard/landlord/properties`} className="hover:text-amber-500">
              {isRtl ? "إدارة العقارات" : "My Properties"}
            </Link>
            <ChevronRight size={14} className={isRtl ? "rotate-180" : ""} />
            <Link href={`/${locale}/dashboard/landlord/properties/apartments`} className="hover:text-amber-500">
              {isRtl ? "الشقق" : "Apartments"}
            </Link>
            <ChevronRight size={14} className={isRtl ? "rotate-180" : ""} />
            <span className="text-slate-900 dark:text-slate-200 truncate max-w-[200px]">
              {apt.title}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-cairo">
            {isRtl ? "إدارة حالة العقار" : "Manage Property Status"}
          </h1>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Box */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
              <CardBody className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white font-cairo">
                      {apt.title}
                    </h2>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm font-cairo">
                      <MapPin size={16} className="text-amber-500" />
                      <span>
                        {apt.district}، {apt.city}، {apt.governorate || ""}
                      </span>
                    </div>
                  </div>
                  <div>
                    {isRented ? (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 font-cairo text-sm py-1 px-3">
                        {isRtl ? "مؤجرة" : "Rented"}
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 font-cairo text-sm py-1 px-3">
                        {isRtl ? "شاغرة" : "Vacant"}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-150 dark:border-slate-800 pt-6 grid grid-cols-2 md:grid-cols-3 gap-6 font-cairo">
                  <div>
                    <span className="text-xs text-slate-400 block">{isRtl ? "القيمة الإيجارية" : "Rental Value"}</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-200 font-sans">
                      {new Intl.NumberFormat(isRtl ? "ar-EG" : "en-US").format(apt.price)} EGP/mo
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">{isRtl ? "الموقع التفصيلي" : "District"}</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {apt.district}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">{isRtl ? "المدينة" : "City"}</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {apt.city}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Rental History Card */}
            <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
              <CardBody className="p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
                  <History className="text-slate-500" size={20} />
                  <h3 className="font-bold text-slate-850 dark:text-slate-200 font-cairo text-base">
                    {isRtl ? "سجل الإيجارات المكتملة" : "Completed Rentals Log"}
                  </h3>
                </div>

                {aptHistory.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm font-cairo">
                    {isRtl ? "لا توجد عقود إيجار سابقة مكتملة لهذا العقار." : "No previous completed contracts for this property."}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-850">
                    {aptHistory.map((item: RentalHistoryItem) => (
                      <div key={item.id} className="py-3 flex justify-between items-center text-sm font-cairo">
                        <div className="space-y-1">
                          <span className="font-semibold block text-slate-850 dark:text-slate-200">
                            {item.tenant?.name || (isRtl ? "مستأجر غير معروف" : "Unknown Tenant")}
                          </span>
                          <span className="text-xs text-slate-500 font-sans">
                            {isRtl ? "تاريخ الطلب:" : "Requested:"} {new Date(item.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')} | {isRtl ? "الإتمام:" : "Completed:"} {new Date(item.updatedAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                          </span>
                        </div>
                        <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-350 font-cairo">
                          {isRtl ? "مكتمل" : "Completed"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Occupancy & Tenant Management */}
          <div className="space-y-6">
            <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
              <CardBody className="p-6 space-y-6">
                <h3 className="font-bold text-slate-850 dark:text-slate-200 font-cairo text-base border-b border-slate-100 dark:border-slate-850 pb-3">
                  {isRtl ? "حالة المستأجر الحالي" : "Current Tenant Status"}
                </h3>

                {isRented && apt.currentTenant ? (
                  <div className="space-y-5 font-cairo">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <User size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {apt.currentTenant.name}
                        </h4>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {isRtl ? "مستأجر نشط" : "Active Tenant"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-850">
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Phone size={14} className="text-slate-400" />
                        <span className="font-sans">{apt.currentTenant.phone || "—"}</span>
                      </div>
                      {apt.rentedSince && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <Calendar size={14} className="text-slate-400" />
                          <span>
                            {isRtl ? "تاريخ التأجير:" : "Lease Started:"}{" "}
                            <span className="font-sans">
                              {new Date(apt.rentedSince).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => setVacateModalOpen(true)}
                      className="w-full bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 font-bold rounded-xl py-3 border border-red-200 dark:border-red-900/30 text-xs"
                    >
                      {isRtl ? "إنهاء الإيجار يدوياً (إخلاء)" : "End Lease / Vacate Unit"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 text-center font-cairo">
                    <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center mx-auto">
                      <Info size={24} />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-slate-850 dark:text-slate-200">
                          {isRtl ? "الشقة شاغرة حالياً" : "Apartment is Vacant"}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
                          {isRtl
                            ? "لا توجد عقود جارية. سيتم تحديد المستأجر تلقائياً عند قبول طلب معاينة."
                            : "No active lease. A tenant is assigned when you finalize a viewing request."}
                        </p>
                      </div>
                      <Button
                        onClick={() => setQuickRentModalOpen(true)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl py-3 text-xs flex items-center justify-center gap-1.5"
                      >
                        <UserCheck size={14} />
                        <span>{isRtl ? "تسجيل عقد إيجار مباشر (برقم الهاتف)" : "Register Direct Lease (Phone)"}</span>
                      </Button>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Vacate Confirmation Modal */}
        {vacateModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setVacateModalOpen(false)}
            title={isRtl ? "تأكيد إخلاء العقار" : "Confirm Vacating Unit"}
          >
            <div className="p-6 text-center space-y-4 font-cairo">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isRtl ? "هل أنت متأكد من إخلاء العقار؟" : "Are you sure you want to vacate?"}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                {isRtl
                  ? "سيتم إنهاء عقد الإيجار الحالي وحفظه في السجل، وستصبح الشقة متاحاً مجدداً للبحث والحجوزات."
                  : "This will terminate the active lease, record it in history, and restore the unit back to vacant/searchable."}
              </p>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setVacateModalOpen(false)}
                  variant="outline"
                  className="flex-1 rounded-xl py-3 border-slate-200 dark:border-slate-800 font-semibold"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  onClick={handleVacateSubmit}
                  disabled={isVacating}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl py-3"
                >
                  {isVacating ? (isRtl ? "جاري الإخلاء..." : "Vacating...") : (isRtl ? "تأكيد الإخلاء" : "Confirm Vacate")}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Quick Rent Modal */}
        {quickRentModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setQuickRentModalOpen(false)}
            title={isRtl ? "تسجيل عقد إيجار سريع ومباشر" : "Direct Quick Lease Registration"}
          >
            <form onSubmit={handleQuickRentSubmit} className="p-6 space-y-4 font-cairo">
              {quickFormError && (
                <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs px-4 py-3 rounded-xl border border-red-200 dark:border-red-900">
                  {quickFormError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {isRtl ? "رقم هاتف المستأجر" : "Tenant Phone Number"}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="01XXXXXXXXX"
                    value={quickPhone}
                    onChange={(e) => setQuickPhone(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100 font-sans"
                    style={{ direction: "ltr", textAlign: "right" }}
                  />
                  {isLookingUp && (
                    <div className="absolute top-1/2 left-3 -translate-y-1/2">
                      <Loader2 size={16} className="animate-spin text-amber-500" />
                    </div>
                  )}
                </div>
              </div>

              {quickPhone.replace(/[^0-9]/g, "").length >= 11 && (
                <>
                  {lookedUpTenant ? (
                    <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 px-4 py-3 rounded-xl">
                      <CheckCircle size={18} className="text-green-500 shrink-0" />
                      <div className="text-xs">
                        <p className="font-bold text-green-800 dark:text-green-300">
                          {isRtl ? "مستأجر موثق بالمنصة" : "Verified Tenant Found"}
                        </p>
                        <p className="text-slate-500 mt-0.5">{lookedUpTenant.name}</p>
                      </div>
                    </div>
                  ) : !isLookingUp ? (
                    <div className="space-y-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 px-4 py-3 rounded-xl">
                      <p className="text-xs text-amber-800 dark:text-amber-300 font-bold">
                        {isRtl ? "هذا الرقم غير مسجل بالمنصة كـ مستأجر حالياً." : "This number is not registered as a tenant."}
                      </p>
                      <a
                        href={`${getWhatsAppLink(quickPhone)}?text=${encodeURIComponent(
                          isRtl
                            ? `مرحباً، أدعوك للتسجيل في منصة سكني لإتمام عقد الإيجار الإلكتروني الخاص بك: ${
                                typeof window !== "undefined" ? window.location.origin : ""
                              }/${locale}/register?role=tenant`
                            : `Hello, register on Sakany to complete your lease: ${
                                typeof window !== "undefined" ? window.location.origin : ""
                              }/${locale}/register?role=tenant`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-green-500 text-white hover:bg-green-600 transition-all"
                      >
                        <Phone size={14} />
                        {isRtl ? "دعوة المستأجر للتسجيل عبر واتساب" : "Invite Tenant via WhatsApp"}
                      </a>
                    </div>
                  ) : null}
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {isRtl ? "تاريخ البداية" : "Start Date"}
                  </label>
                  <input
                    type="date"
                    required
                    value={quickStartDate}
                    onChange={(e) => setQuickStartDate(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {isRtl ? "تاريخ النهاية" : "End Date"}
                  </label>
                  <input
                    type="date"
                    required
                    value={quickEndDate}
                    onChange={(e) => setQuickEndDate(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <Button
                  type="button"
                  onClick={() => setQuickRentModalOpen(false)}
                  variant="outline"
                  className="flex-1 rounded-xl py-3 border-slate-200 dark:border-slate-800"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={isQuickRenting || !lookedUpTenant}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl py-3"
                >
                  {isQuickRenting ? (isRtl ? "جاري الحفظ..." : "Saving...") : (isRtl ? "تسجيل عقد الإيجار" : "Register Lease")}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </LandlordLayout>
  );
}