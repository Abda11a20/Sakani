// apps/frontend/src/app/[locale]/dashboard/landlord/properties/apartments/[id]/page.tsx
"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useListing, useVacateUnit } from "@/hooks/useListings";
import { useLandlordRentalHistory } from "@/hooks/useRentalHistory";
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
  Info
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
      </div>
    </LandlordLayout>
  );
}