// apps/frontend/src/app/[locale]/dashboard/landlord/requests/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { REQUEST_STATUS_CONFIG } from "@/lib/constants";
import { useLandlordRequests, useLandlordRequestStats, useUpdateRequestStatus } from "@/hooks/useRequests";
import LandlordLayout from "@/components/layout/LandlordLayout";
import { Card, CardBody, Spinner, Button, Badge, Modal, useToast, Avatar } from "@/components/ui";
import {
  FileText,
  Calendar,
  Clock,
  User,
  MessageSquare,
  CheckCircle,
  XCircle,
  PlayCircle,
  HelpCircle,
} from "lucide-react";

type FilterStatus = "all" | "pending" | "accepted" | "rejected" | "completed";

export default function LandlordRequests() {
  const locale = useLocale();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuthGuard({ requiredRoles: ["landlord"] });
  const [page, setPage] = useState(1);

  const { data: requestsData, isLoading: isRequestsLoading } = useLandlordRequests(page);
  const { data: stats, isLoading: isStatsLoading } = useLandlordRequestStats();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateRequestStatus();

  const [activeTab, setActiveTab] = useState<FilterStatus>("all");
  const [modalAction, setModalAction] = useState<{
    requestId: string;
    action: "accepted" | "rejected" | "completed";
  } | null>(null);

  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  const isLoading = isAuthLoading || isRequestsLoading || isStatsLoading;

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const items = requestsData?.items || [];

  // Filter items locally based on tab
  const filteredItems = items.filter(req => {
    const statusStr = req.status as string;
    if (activeTab === "all") return true;
    // Map backend 'accepted' or frontend 'approved'
    if (activeTab === "accepted") return statusStr === "accepted" || statusStr === "approved";
    return statusStr === activeTab;
  });

  // Action text maps
  const actionText = {
    accepted: "قبول طلب المعاينة والاستئجار وتوفير بيانات الاتصال للمستأجر؟",
    rejected: "رفض هذا الطلب؟",
    completed: "تعليم هذا الطلب كمكتمل بعد المعاينة والاتفاق؟",
  };

  const handleAction = () => {
    if (!modalAction) return;

    updateStatus(
      { requestId: modalAction.requestId, status: modalAction.action },
      {
        onSuccess: () => {
          toast({
            title: "تم تحديث الطلب",
            description: "تم تحديث حالة الطلب وإشعار المستأجر بنجاح.",
            type: "success",
          });
          setModalAction(null);
        },
        onError: () => {
          toast({
            title: "حدث خطأ",
            description: "فشل تحديث حالة الطلب. يرجى المحاولة مرة أخرى.",
            type: "error",
          });
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const normalized = status === "approved" ? "accepted" : status;
    const cfg = REQUEST_STATUS_CONFIG[normalized as keyof typeof REQUEST_STATUS_CONFIG];
    return (
      <Badge variant={cfg?.color ?? "gray"} className="font-bold font-cairo">
        {cfg?.labelAr ?? status}
      </Badge>
    );
  };

  // Get Stats numbers
  const statsPending = stats?.pending ?? items.filter(r => r.status === "pending").length;
  const statsApproved = stats?.approved ?? items.filter(r => (r.status as string) === "accepted" || r.status === "approved").length;
  const statsRejected = stats?.rejected ?? items.filter(r => r.status === "rejected").length;
  const statsTotal = stats?.total ?? items.length;

  return (
    <LandlordLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-cairo">الطلبات الواردة</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-cairo text-sm">
            إدارة طلبات المعاينة والاستئجار المقدمة من قبل الطلاب والشباب لعقاراتك.
          </p>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "إجمالي الطلبات", value: statsTotal, color: "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900" },
            { label: "جديد (ينتظر ردك)", value: statsPending, color: "text-amber-600 dark:text-amber-400 bg-amber-500/10" },
            { label: "طلبات مقبولة", value: statsApproved, color: "text-green-600 dark:text-green-400 bg-green-500/10" },
            { label: "طلبات مرفوضة", value: statsRejected, color: "text-red-600 dark:text-red-400 bg-red-500/10" },
          ].map((stat, idx) => (
            <div key={idx} className={`p-4 rounded-2xl flex flex-col justify-center border border-slate-200/50 dark:border-slate-800/80 ${stat.color}`}>
              <span className="text-xs font-semibold font-cairo opacity-70">{stat.label}</span>
              <span className="text-2xl font-bold font-sans mt-1">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          {(
            [
              { key: "all", label: "الكل" },
              { key: "pending", label: "جديد" },
              { key: "accepted", label: "مقبول" },
              { key: "rejected", label: "مرفوض" },
              { key: "completed", label: "مكتمل" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium font-cairo transition-all duration-200 ${activeTab === tab.key
                  ? "bg-amber-500 text-white shadow-sm font-bold"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Request Cards Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl font-cairo">
            <FileText size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">لا توجد طلبات</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto text-sm">
              لا توجد طلبات معاينة حالية تطابق التصفية المحددة.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredItems.map((req) => (
              <Card
                key={req.id}
                onClick={() => setSelectedRequest(req)}
                className="cursor-pointer border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
              >
                <CardBody className="p-4 sm:p-5 flex flex-col items-center text-center gap-3">
                  <Avatar
                    name={req.tenant?.name || "مستأجر"}
                    src={(req.tenant as any)?.avatarUrl || (req.tenant as any)?.image || null}
                    size="lg"
                  />

                  <div className="space-y-1 w-full">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 font-cairo line-clamp-1">
                      {req.tenant?.name || "مستأجر غير معروف"}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-cairo line-clamp-2 px-1 h-8 sm:h-auto">
                      {req.listing?.title || "عقار غير محدد"}
                    </p>
                  </div>

                  <div className="mt-1">
                    {getStatusBadge(req.status)}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {/* Request Details Modal */}
        {selectedRequest && (
          <Modal
            isOpen={true}
            onClose={() => setSelectedRequest(null)}
            title="تفاصيل الطلب"
          >
            <div className="p-4 sm:p-6 space-y-5 font-cairo">
              {/* Header */}
              <div className="flex items-center gap-4">
                <Avatar
                  name={selectedRequest.tenant?.name || "مستأجر"}
                  src={(selectedRequest.tenant as any)?.avatarUrl || (selectedRequest.tenant as any)?.image || null}
                  size="xl"
                />
                <div>
                  <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-slate-100">
                    {selectedRequest.tenant?.name || "مستأجر غير معروف"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {getStatusBadge(selectedRequest.status)}
                    <span className="text-xs text-slate-400">
                      تاريخ: {new Date(selectedRequest.createdAt).toLocaleDateString("ar-EG")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Listing Title */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">العقار المطلوب</p>
                <p className="font-bold text-amber-600 dark:text-amber-400 text-sm sm:text-base">
                  {selectedRequest.listing?.title || "غير محدد"}
                </p>
              </div>

              {/* Grid details */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 text-slate-500">
                    <Calendar size={14} className="sm:w-4 sm:h-4 shrink-0" />
                    <span className="text-[10px] sm:text-xs font-medium">موعد المعاينة</span>
                  </div>
                  <p className="font-bold text-xs sm:text-sm">
                    {selectedRequest.preferredDate
                      ? new Date(selectedRequest.preferredDate).toLocaleDateString("ar-EG")
                      : "غير محدد"}
                  </p>
                </div>

                {selectedRequest.tenant?.phone && ((selectedRequest.status as string) === "accepted" || selectedRequest.status === "approved" || selectedRequest.status === "completed") ? (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 text-slate-500">
                      <User size={14} className="sm:w-4 sm:h-4 shrink-0" />
                      <span className="text-[10px] sm:text-xs font-medium">رقم الهاتف</span>
                    </div>
                    <a href={`tel:${selectedRequest.tenant.phone}`} className="font-bold text-amber-500 hover:underline text-xs sm:text-sm font-sans block" style={{ direction: "ltr", textAlign: "right" }}>
                      {selectedRequest.tenant.phone}
                    </a>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-800 opacity-50 flex flex-col items-center justify-center text-center">
                    <User size={14} className="text-slate-400 mb-1" />
                    <span className="text-[10px] sm:text-xs font-medium text-slate-500">يظهر بعد القبول</span>
                  </div>
                )}
              </div>

              {/* Message */}
              {selectedRequest.notes && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">رسالة المستأجر</p>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {selectedRequest.notes}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                {selectedRequest.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedRequest(null);
                        setModalAction({ requestId: selectedRequest.id, action: "accepted" });
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm"
                    >
                      قبول الطلب
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedRequest(null);
                        setModalAction({ requestId: selectedRequest.id, action: "rejected" });
                      }}
                      variant="outline"
                      className="flex-1 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/10 font-bold py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm"
                    >
                      رفض الطلب
                    </Button>
                  </div>
                )}

                {((selectedRequest.status as string) === "accepted" || (selectedRequest.status as string) === "approved") && (
                  <Link
                    href={`/${locale}/dashboard/landlord/rentals?listingId=${selectedRequest.listingId}&requestId=${selectedRequest.id}`}
                    className="w-full text-center bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 sm:py-3 rounded-xl shadow-sm text-xs sm:text-sm block"
                  >
                    إكمال وتأكيد المعاينة وتوقيع العقد
                  </Link>
                )}

                {selectedRequest.status === "completed" && (
                  <div className="flex items-center justify-center gap-1.5 text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-sm">
                    <CheckCircle size={16} />
                    <span>تمت المعاينة بنجاح</span>
                  </div>
                )}

                {selectedRequest.status === "rejected" && (
                  <div className="flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-sm">
                    <XCircle size={16} />
                    <span>تم رفض الطلب</span>
                  </div>
                )}
              </div>
            </div>
          </Modal>
        )}

        {/* Action Confirmation Modal */}
        {modalAction && (
          <Modal
            isOpen={true}
            onClose={() => setModalAction(null)}
            title="تأكيد اتخاذ الإجراء"
          >
            <div className="p-6 text-center space-y-4 font-cairo">
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                <HelpCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                هل أنت متأكد من تنفيذ هذا الإجراء؟
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                {actionText[modalAction.action]}
              </p>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setModalAction(null)}
                  variant="outline"
                  className="flex-1 rounded-xl py-3 border-slate-200 dark:border-slate-800 font-semibold"
                >
                  تراجع
                </Button>
                <Button
                  onClick={handleAction}
                  disabled={isUpdating}
                  className={`flex-1 text-white font-bold rounded-xl py-3 ${modalAction.action === "accepted"
                      ? "bg-green-600 hover:bg-green-700"
                      : modalAction.action === "rejected"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-amber-500 hover:bg-amber-600"
                    }`}
                >
                  {isUpdating ? "جاري الحفظ..." : "تأكيد الإجراء"}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </LandlordLayout>
  );
}
