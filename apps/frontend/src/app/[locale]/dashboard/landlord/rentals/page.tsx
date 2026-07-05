"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useMyListings, useVacateUnit } from "@/hooks/useListings";
import { useFinalizeUnitRental, useRequestDetails, useQuickRent } from "@/hooks/useRequests";
import { useLookupTenantByPhone } from "@/hooks/useTenantLookup";
import { getWhatsAppLink } from "@/lib/whatsapp";
import LandlordLayout from "@/components/layout/LandlordLayout";
import { Card, CardBody, Spinner, Button, Badge, Modal, useToast } from "@/components/ui";
import {
  Building,
  User,
  Calendar,
  AlertTriangle,
  UserCheck,
  HelpCircle,
  CheckCircle,
  Loader2,
  Phone,
} from "lucide-react";

export default function LandlordRentals() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const { user, isLoading: isAuthLoading } = useAuthGuard({ role: "landlord" });
  const { data: rawListings = [], isLoading: isListingsLoading } = useMyListings();
  const requestId = searchParams?.get("requestId");
  const { data: rentalRequest, isLoading: isRequestLoading } = useRequestDetails(requestId);

  const listings = rawListings || [];
  const unitListings = listings.filter((listing) => {
    const unitType = listing.unitType || listing.type;
    return unitType === "apartment";
  });

  const [selectedId, setSelectedId] = useState("");
  const [rentModalOpen, setRentModalOpen] = useState(false);
  const [quickRentModalOpen, setQuickRentModalOpen] = useState(false);
  const [vacateModalOpen, setVacateModalOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [quickStartDate, setQuickStartDate] = useState("");
  const [quickEndDate, setQuickEndDate] = useState("");
  const [formError, setFormError] = useState("");
  const [quickFormError, setQuickFormError] = useState("");

  const { mutate: finalizeUnitRental, isPending: isRenting } = useFinalizeUnitRental();
  const { mutate: vacateUnit, isPending: isVacating } = useVacateUnit();
  const { mutate: quickRent, isPending: isQuickRenting } = useQuickRent();

  // Lookup tenant details dynamically
  const { data: lookedUpTenant, isLoading: isLookingUp } = useLookupTenantByPhone(quickPhone);

  useEffect(() => {
    const queryId = searchParams?.get("listingId");
    if (queryId) {
      setSelectedId(queryId);
    } else if (rentalRequest?.listingId) {
      setSelectedId(rentalRequest.listingId);
    } else if (unitListings.length > 0 && !selectedId) {
      setSelectedId(unitListings[0].id);
    }

    if (requestId && rentalRequest && rentalRequest.status === "accepted") {
      setRentModalOpen(true);
    }
  }, [searchParams, rentalRequest, requestId, unitListings, selectedId]);

  const isLoading = isAuthLoading || isListingsLoading || (!!requestId && isRequestLoading);

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const selectedListing = unitListings.find((listing) => listing.id === selectedId);
  const isRented = selectedListing?.status === "rented" || Boolean(selectedListing?.currentTenantId);
  const canRentFromRequest =
    Boolean(requestId) &&
    rentalRequest?.listingId === selectedId &&
    rentalRequest?.status === "accepted" &&
    !isRented;

  const handleSelectChange = (id: string) => {
    setSelectedId(id);
    router.replace(`/${locale}/dashboard/landlord/rentals?listingId=${id}`);
  };

  const handleRentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!requestId) {
      setFormError("يرجى البدء من طلب معاينة مقبول لتحديد المستأجر تلقائياً");
      return;
    }
    if (!rentalRequest || rentalRequest.status !== "accepted") {
      setFormError("يجب أن يكون طلب المعاينة مقبولاً قبل تسجيل عقد الإيجار");
      return;
    }
    if (rentalRequest.listingId !== selectedId) {
      setFormError("طلب المعاينة لا يخص هذا العقار");
      return;
    }
    if (!startDate || !endDate) {
      setFormError("يرجى إدخال تاريخ البداية والنهاية");
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      setFormError("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");
      return;
    }

    finalizeUnitRental(
      {
        requestId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      },
      {
        onSuccess: () => {
          toast({
            title: "تم تأجير العقار",
            description: "تم تسجيل عقد الإيجار وتحديث حالة العقار بنجاح.",
            type: "success",
          });
          setRentModalOpen(false);
          setStartDate("");
          setEndDate("");
        },
        onError: (err: unknown) => {
          const message =
            err instanceof Error && "friendlyMessage" in err
              ? String((err as Error & { friendlyMessage?: string }).friendlyMessage)
              : "فشل تسجيل عقد الإيجار. يرجى المحاولة مرة أخرى.";
          setFormError(message);
        },
      }
    );
  };

  const handleQuickRentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuickFormError("");

    if (!selectedId) {
      setQuickFormError("يرجى اختيار عقار أولاً");
      return;
    }
    if (!quickPhone || quickPhone.length < 11) {
      setQuickFormError("يرجى إدخال رقم هاتف مستأجر صالح مكون من 11 رقماً على الأقل");
      return;
    }
    if (!lookedUpTenant) {
      setQuickFormError("يرجى الانتظار حتى يتم التحقق من رقم المستأجر وتأكيد حسابه");
      return;
    }
    if (!quickStartDate || !quickEndDate) {
      setQuickFormError("يرجى تحديد تواريخ عقد الإيجار");
      return;
    }
    if (new Date(quickStartDate) >= new Date(quickEndDate)) {
      setQuickFormError("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");
      return;
    }

    quickRent(
      {
        listingId: selectedId,
        phone: quickPhone,
        startDate: new Date(quickStartDate).toISOString(),
        endDate: new Date(quickEndDate).toISOString(),
      },
      {
        onSuccess: () => {
          toast({
            title: "تم التأجير السريع بنجاح",
            description: "تم إنشاء طلب معاينة وتأجير العقار للمستأجر فوراً بنجاح.",
            type: "success",
          });
          setQuickRentModalOpen(false);
          setQuickPhone("");
          setQuickStartDate("");
          setQuickEndDate("");
          setQuickFormError("");
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message || "حدث خطأ أثناء إجراء التأجير السريع. تأكد من أن العقار غير مؤجر بالفعل.";
          setQuickFormError(message);
        },
      }
    );
  };

  const handleVacateSubmit = () => {
    if (!selectedListing) return;

    vacateUnit(selectedListing.id, {
      onSuccess: () => {
        toast({
          title: "تم إخلاء العقار",
          description: "أصبح العقار متاحاً للحجز مرة أخرى.",
          type: "success",
        });
        setVacateModalOpen(false);
      },
      onError: () => {
        toast({
          title: "حدث خطأ",
          description: "فشل إخلاء العقار. حاول مرة أخرى لاحقاً.",
          type: "error",
        });
      },
    });
  };

  return (
    <LandlordLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-cairo">إدارة إيجار الوحدات</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-cairo text-sm">
            سجّل إيجار الشقق من طلبات المعاينة المقبولة، وتابع المستأجر الحالي وتواريخ العقد.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm max-w-xl">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 font-cairo">اختر العقار</label>
            {unitListings.length === 0 ? (
              <p className="text-sm text-red-500 font-cairo">
                لا توجد لديك شقق لإدارة إيجارها هنا.
              </p>
            ) : (
              <select
                value={selectedId}
                onChange={(e) => handleSelectChange(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-cairo font-semibold text-slate-800 dark:text-slate-100"
              >
                {unitListings.map((listing) => (
                  <option key={listing.id} value={listing.id}>
                    {listing.title} ({listing.district})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {selectedListing ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm lg:col-span-2">
              <CardBody className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building size={20} className="text-amber-500" />
                      <h2 className="text-xl font-bold font-cairo text-slate-900 dark:text-slate-100">
                        {selectedListing.title}
                      </h2>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo">
                      {selectedListing.address}
                    </p>
                  </div>
                  <Badge
                    className={
                      isRented
                        ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 font-bold"
                        : "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 font-bold"
                    }
                  >
                    {isRented ? "مؤجر" : "متاح"}
                  </Badge>
                </div>

                {isRented ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 font-cairo">
                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <User size={14} />
                        <span>المستأجر الحالي</span>
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-100 mt-2">
                        {selectedListing.currentTenant?.name || "غير مسجل"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 font-cairo">
                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <Calendar size={14} />
                        <span>تاريخ البداية</span>
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-100 mt-2">
                        {selectedListing.rentedSince
                          ? new Date(selectedListing.rentedSince).toLocaleDateString("ar-EG")
                          : "غير محدد"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 font-cairo">
                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <Calendar size={14} />
                        <span>تاريخ النهاية</span>
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-100 mt-2">
                        {selectedListing.rentedUntil
                          ? new Date(selectedListing.rentedUntil).toLocaleDateString("ar-EG")
                          : "غير محدد"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center font-cairo text-slate-500 dark:text-slate-400">
                    هذا العقار متاح حالياً. لتسجيل إيجار جديد، ابدأ من طلب معاينة مقبول لهذا العقار.
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {!isRented && (
                    <>
                      <Button
                        onClick={() => setRentModalOpen(true)}
                        disabled={!canRentFromRequest}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold font-cairo rounded-xl flex items-center justify-center gap-2"
                      >
                        <UserCheck size={16} />
                        <span>تسجيل إيجار العقار</span>
                      </Button>
                      <Button
                        onClick={() => {
                          setQuickPhone("");
                          setQuickStartDate("");
                          setQuickEndDate("");
                          setQuickFormError("");
                          setQuickRentModalOpen(true);
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold font-cairo rounded-xl flex items-center justify-center gap-2 shadow-md"
                      >
                        <Phone size={16} />
                        <span>تأجير سريع (برقم الهاتف)</span>
                      </Button>
                    </>
                  )}
                  {isRented && (
                    <Button
                      onClick={() => setVacateModalOpen(true)}
                      variant="outline"
                      className="text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/10 font-bold font-cairo rounded-xl flex items-center justify-center gap-2"
                    >
                      <AlertTriangle size={16} />
                      <span>إخلاء العقار</span>
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <CardBody className="p-6 space-y-4 font-cairo">
                <h3 className="font-bold text-slate-900 dark:text-slate-100">ملخص الإشغال</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4">
                    <p className="text-xs text-slate-500">إجمالي الوحدات</p>
                    <p className="text-2xl font-bold mt-1">1</p>
                  </div>
                  <div className={isRented ? "rounded-xl bg-red-500/10 text-red-600 p-4" : "rounded-xl bg-green-500/10 text-green-600 p-4"}>
                    <p className="text-xs opacity-80">{isRented ? "مؤجرة" : "متاحة"}</p>
                    <p className="text-2xl font-bold mt-1">1</p>
                  </div>
                </div>
                {canRentFromRequest && rentalRequest?.tenant && (
                  <div className="rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 p-4">
                    <p className="text-xs opacity-80">طلب جاهز للتأجير</p>
                    <p className="font-bold mt-1">{rentalRequest.tenant.name}</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        ) : (
          <div className="text-center py-20 font-cairo text-slate-400">
            يرجى اختيار شقة لإدارة إيجارها.
          </div>
        )}

        {rentModalOpen && (
          <Modal isOpen={true} onClose={() => setRentModalOpen(false)} title="تسجيل عقد إيجار">
            <form onSubmit={handleRentSubmit} className="p-6 space-y-4 font-cairo">
              {formError && (
                <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs px-4 py-3 rounded-xl border border-red-200 dark:border-red-900">
                  {formError}
                </div>
              )}

              {rentalRequest?.tenant && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                  <p className="text-xs text-slate-400">المستأجر</p>
                  <p className="font-bold mt-1">{rentalRequest.tenant.name}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">تاريخ البداية</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">تاريخ النهاية</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <Button
                  type="button"
                  onClick={() => setRentModalOpen(false)}
                  variant="outline"
                  className="flex-1 rounded-xl py-3 border-slate-200 dark:border-slate-800"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isRenting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl py-3"
                >
                  {isRenting ? "جاري الحفظ..." : "تسجيل عقد الإيجار"}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {vacateModalOpen && selectedListing && (
          <Modal isOpen={true} onClose={() => setVacateModalOpen(false)} title="إخلاء العقار">
            <div className="p-6 text-center space-y-4 font-cairo">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
                <HelpCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                هل أنت متأكد من إخلاء هذا العقار؟
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                سيتم إزالة بيانات عقد الإيجار الحالي وتغيير حالة العقار إلى متاح.
              </p>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setVacateModalOpen(false)}
                  variant="outline"
                  className="flex-1 rounded-xl py-3 border-slate-200 dark:border-slate-800 font-semibold"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleVacateSubmit}
                  disabled={isVacating}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl py-3"
                >
                  {isVacating ? "جاري الإخلاء..." : "تأكيد الإخلاء"}
                </Button>
              </div>
            </div>
          </Modal>
        )}
        {quickRentModalOpen && (
          <Modal isOpen={true} onClose={() => setQuickRentModalOpen(false)} title="تأجير سريع (مباشر برقم الهاتف)">
            <form onSubmit={handleQuickRentSubmit} className="p-6 space-y-4 font-cairo">
              {quickFormError && (
                <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs px-4 py-3 rounded-xl border border-red-200 dark:border-red-900">
                  {quickFormError}
                </div>
              )}

              {/* selected listing info preview */}
              {selectedListing && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-xs">
                  <p className="text-slate-400">العقار المحدد للتأجير</p>
                  <p className="font-bold text-slate-800 dark:text-slate-100 mt-1">{selectedListing.title}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">رقم هاتف المستأجر</label>
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

              {/* lookup result feedback */}
              {quickPhone.replace(/[^0-9]/g, "").length >= 11 && (
                <>
                  {lookedUpTenant ? (
                    <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 px-4 py-3 rounded-xl">
                      <CheckCircle size={18} className="text-green-500 shrink-0" />
                      <div className="text-xs">
                        <p className="font-bold text-green-800 dark:text-green-300">مستأجر موثق بالمنصة</p>
                        <p className="text-slate-500 mt-0.5">{lookedUpTenant.name}</p>
                      </div>
                    </div>
                  ) : !isLookingUp ? (
                    <div className="space-y-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 px-4 py-3 rounded-xl">
                      <p className="text-xs text-amber-800 dark:text-amber-300 font-bold">
                        هذا الرقم غير مسجل بالمنصة كـ مستأجر حالياً.
                      </p>
                      <a
                        href={`${getWhatsAppLink(quickPhone)}?text=${encodeURIComponent(
                          `مرحباً، أدعوك للتسجيل في منصة سكني لإتمام عقد الإيجار الإلكتروني الخاص بك: ${
                            typeof window !== "undefined" ? window.location.origin : ""
                          }/${locale}/register?role=tenant`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-green-500 text-white hover:bg-green-600 transition-all"
                      >
                        <Phone size={14} />
                        دعوة المستأجر للتسجيل عبر واتساب
                      </a>
                    </div>
                  ) : null}
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">تاريخ البداية</label>
                  <input
                    type="date"
                    required
                    value={quickStartDate}
                    onChange={(e) => setQuickStartDate(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">تاريخ النهاية</label>
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
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isQuickRenting || !lookedUpTenant}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl py-3"
                >
                  {isQuickRenting ? "جاري الحفظ..." : "تأكيد وتأجير العقار"}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </LandlordLayout>
  );
}
