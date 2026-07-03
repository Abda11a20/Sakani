// apps/frontend/src/app/[locale]/dashboard/landlord/beds/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useMyListings } from "@/hooks/useListings";
import { useListingBeds, useListingBedStats, useVacateBed } from "@/hooks/useBeds";
import { useFinalizeBedRental, useRequestDetails } from "@/hooks/useRequests";
import LandlordLayout from "@/components/layout/LandlordLayout";
import { Card, CardBody, Spinner, Button, Badge, Modal, useToast } from "@/components/ui";
import {
  Bed as BedIcon,
  TrendingUp,
  User,
  Calendar,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

export default function LandlordBeds() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const { user, isLoading: isAuthLoading } = useAuthGuard({ role: "landlord" });
  const { data: rawListings = [], isLoading: isListingsLoading } = useMyListings();
  const listings = rawListings || [];
  const requestId = searchParams?.get("requestId");
  const { data: rentalRequest, isLoading: isRequestLoading } = useRequestDetails(requestId);

  // Selected Listing ID
  const [selectedId, setSelectedId] = useState<string>("");

  // Get bed listings only
  const bedListings = listings.filter((l) => l.type === "bed" || l.unitType === "bed");

  // Sync selected listing from URL if present
  useEffect(() => {
    const queryId = searchParams?.get("listingId");
    if (queryId) {
      setSelectedId(queryId);
    } else if (rentalRequest?.listingId) {
      setSelectedId(rentalRequest.listingId);
    } else if (bedListings.length > 0 && !selectedId) {
      setSelectedId(bedListings[0].id);
    }
  }, [searchParams, rentalRequest?.listingId, bedListings, selectedId]);

  // Fetch beds and stats
  const { data: rawBeds = [], isLoading: isBedsLoading } = useListingBeds(selectedId, true);
  const beds = rawBeds || [];
  const { data: stats, isLoading: isStatsLoading } = useListingBedStats(selectedId);

  // Mutations
  const { mutate: finalizeBedRental, isPending: isRenting } = useFinalizeBedRental();
  const { mutate: vacateBed, isPending: isVacating } = useVacateBed();

  // Modals state
  const [rentModalBed, setRentModalBed] = useState<{ id: string; bedNumber: number } | null>(null);
  const [vacateModalBed, setVacateModalBed] = useState<{ id: string; bedNumber: number } | null>(null);

  // Rent Form State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [formError, setFormError] = useState("");

  const isLoading = isAuthLoading || isListingsLoading || (!!requestId && isRequestLoading) || (!!selectedId && (isBedsLoading || isStatsLoading));

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleSelectChange = (id: string) => {
    setSelectedId(id);
    router.replace(`/${locale}/dashboard/landlord/beds?listingId=${id}`);
  };

  const handleRentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!rentModalBed) return;
    if (!requestId) {
      setFormError("يرجى البدء من طلب معاينة مقبول لتحديد المستأجر تلقائياً");
      return;
    }
    if (!rentalRequest || rentalRequest.status !== "accepted") {
      setFormError("ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø·Ù„Ø¨ Ø§Ù„Ù…Ø¹Ø§ÙŠÙ†Ø© Ù…Ù‚Ø¨ÙˆÙ„Ø§Ù‹ Ù‚Ø¨Ù„ ØªØ£Ø¬ÙŠØ± Ø§Ù„Ø³Ø±ÙŠØ±");
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

    finalizeBedRental(
      {
        requestId,
        bedId: rentModalBed.id,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      },
      {
        onSuccess: () => {
          toast({
            title: "تم تأجير السرير",
            description: `تم تسجيل تأجير السرير رقم ${rentModalBed.bedNumber} بنجاح.`,
            type: "success",
          });
          setRentModalBed(null);
          setStartDate("");
          setEndDate("");
        },
        onError: (err: any) => {
          setFormError(err.friendlyMessage || "فشل تسجيل تأجير السرير. تأكد من صحة معرف المستأجر.");
        },
      }
    );
  };

  const handleVacateSubmit = () => {
    if (!vacateModalBed) return;

    vacateBed(vacateModalBed.id, {
      onSuccess: () => {
        toast({
          title: "تم إخلاء السرير",
          description: `تم إخلاء السرير رقم ${vacateModalBed.bedNumber} بنجاح وهو متاح الآن.`,
          type: "success",
        });
        setVacateModalBed(null);
      },
      onError: () => {
        toast({
          title: "حدث خطأ",
          description: "فشل إخلاء السرير. حاول مرة أخرى لاحقاً.",
          type: "error",
        });
      },
    });
  };

  const selectedListing = bedListings.find((l) => l.id === selectedId);

  return (
    <LandlordLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-cairo">إدارة الأسرة والشواغر</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-cairo text-sm">
            قم بتسجيل عقود إيجار الأسرة وإخلاءها لتحديث شواغر الأسرة تلقائياً.
          </p>
        </div>

        {/* Dropdown Selector */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm max-w-xl">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 font-cairo">اختر الإعلان المشترك</label>
            {bedListings.length === 0 ? (
              <p className="text-sm text-red-500 font-cairo">
                ليس لديك أي عقارات من نوع "سرير" (Bed) لتتمكن من إدارتها هنا.
              </p>
            ) : (
              <select
                value={selectedId}
                onChange={(e) => handleSelectChange(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-cairo font-semibold text-slate-800 dark:text-slate-100"
              >
                {bedListings.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title} ({l.district})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {selectedId && selectedListing ? (
          <>
            {/* Stats strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { label: "إجمالي الأسرة", value: stats?.total ?? beds.length, color: "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300" },
                { label: "الأسرة المتاحة", value: stats?.available ?? beds.filter(b => b.isAvailable).length, color: "bg-green-500/10 text-green-600 dark:text-green-400" },
                { label: "الأسرة المؤجرة", value: stats?.rented ?? beds.filter(b => !b.isAvailable).length, color: "bg-red-500/10 text-red-600 dark:text-red-400" },
              ].map((stat, idx) => (
                <div key={idx} className={`p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800 flex items-center justify-between ${stat.color}`}>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold font-cairo opacity-80">{stat.label}</span>
                    <h3 className="text-3xl font-bold font-sans">{stat.value}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-current opacity-10 flex items-center justify-center">
                    <BedIcon size={20} />
                  </div>
                </div>
              ))}
            </div>

            {/* Beds occupancy Grid */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-cairo text-slate-800 dark:text-slate-100">تفاصيل إشغال الأسرة</h2>
              
              {beds.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl font-cairo text-slate-400">
                  <BedIcon size={40} className="mx-auto mb-3 opacity-20" />
                  <p>لا توجد أسرة معرفة لهذا الإعلان بعد.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {beds.map((bed) => {
                    const currentTenant = bed.currentTenant ?? bed.tenant;

                    return (
                    <Card
                      key={bed.id}
                      className={`border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between ${
                        bed.isAvailable
                          ? "border-green-100 bg-green-50/5 dark:bg-green-950/5 dark:border-green-900/50"
                          : "border-red-100 bg-red-50/5 dark:bg-red-950/5 dark:border-red-900/50"
                      }`}
                    >
                      <CardBody className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold font-cairo text-base">سرير رقم {bed.bedNumber}</span>
                            <Badge
                              className={
                                bed.isAvailable
                                  ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 font-bold"
                                  : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 font-bold"
                              }
                            >
                              {bed.isAvailable ? "متاح" : "مؤجر"}
                            </Badge>
                          </div>

                          {/* Occupant details */}
                          {!bed.isAvailable && (
                            <div className="mt-4 space-y-2 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-cairo">
                              <div className="flex items-center gap-2">
                                <User size={13} className="text-amber-500" />
                                <span>المستأجر: <span className="font-bold text-slate-800 dark:text-slate-200">{currentTenant?.name || "غير مسجل"}</span></span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar size={13} className="text-amber-500" />
                                <span>تاريخ عقد الإيجار ساري المفعول</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                          {bed.isAvailable ? (
                            <Button
                              onClick={() => setRentModalBed({ id: bed.id, bedNumber: bed.bedNumber })}
                              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold font-cairo py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
                            >
                              <UserCheck size={14} />
                              <span>تسجيل تأجير السرير</span>
                            </Button>
                          ) : (
                            <Button
                              onClick={() => setVacateModalBed({ id: bed.id, bedNumber: bed.bedNumber })}
                              variant="outline"
                              className="w-full text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/10 font-bold font-cairo py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
                            >
                              <AlertTriangle size={14} />
                              <span>إخلاء السرير</span>
                            </Button>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-20 font-cairo text-slate-400">
            <p>يرجى اختيار إعلان مشترك لعرض الأسرة وإدارتها.</p>
          </div>
        )}

        {/* Rent Bed Modal */}
        {rentModalBed && (
          <Modal
            isOpen={true}
            onClose={() => setRentModalBed(null)}
            title={`تأجير سرير رقم ${rentModalBed.bedNumber}`}
          >
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
                  onClick={() => setRentModalBed(null)}
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

        {/* Vacate Confirmation Modal */}
        {vacateModalBed && (
          <Modal
            isOpen={true}
            onClose={() => setVacateModalBed(null)}
            title={`إخلاء سرير رقم ${vacateModalBed.bedNumber}`}
          >
            <div className="p-6 text-center space-y-4 font-cairo">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
                <HelpCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                هل أنت متأكد من إخلاء السرير رقم {vacateModalBed.bedNumber}؟
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                سيتم إزالة عقد الإيجار الحالي وتغيير حالة السرير إلى متاح للحجز فوراً.
              </p>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setVacateModalBed(null)}
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
      </div>
    </LandlordLayout>
  );
}
