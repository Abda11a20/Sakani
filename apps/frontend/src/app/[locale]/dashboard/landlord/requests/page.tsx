// apps/frontend/src/app/[locale]/dashboard/landlord/requests/page.tsx
"use client";

import React, { useState } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
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
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuthGuard({ role: "landlord" });
  const [page, setPage] = useState(1);
  
  const { data: requestsData, isLoading: isRequestsLoading } = useLandlordRequests(page);
  const { data: stats, isLoading: isStatsLoading } = useLandlordRequestStats();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateRequestStatus();

  const [activeTab, setActiveTab] = useState<FilterStatus>("all");
  const [modalAction, setModalAction] = useState<{
    requestId: string;
    action: "accepted" | "rejected" | "completed";
  } | null>(null);

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
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 font-bold font-cairo">جديد</Badge>;
      case "accepted":
      case "approved":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 font-bold font-cairo">مقبول</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 font-bold font-cairo">مرفوض</Badge>;
      case "completed":
        return <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-400 font-bold font-cairo">مكتمل</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 font-cairo">{status}</Badge>;
    }
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
              className={`px-4 py-2 rounded-xl text-sm font-medium font-cairo transition-all duration-200 ${
                activeTab === tab.key
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
          <div className="grid grid-cols-1 gap-6">
            {filteredItems.map((req) => (
              <Card
                key={req.id}
                className="border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <CardBody className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left side: Tenant Info + Message */}
                    <div className="space-y-4 flex-1">
                      <div className="flex items-start gap-4">
                        <Avatar
                          name={req.tenant?.name || "مستأجر"}
                          src={null}
                          size="md"
                        />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 font-cairo">
                              {req.tenant?.name || "مستأجر غير معروف"}
                            </h3>
                            {getStatusBadge(req.status)}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo">
                            طلب معاينة لعقار: <span className="font-semibold text-amber-600 dark:text-amber-400">{req.listing?.title || "غير محدد"}</span>
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-cairo">
                            <Clock size={11} />
                            <span>تاريخ تقديم الطلب: {new Date(req.createdAt).toLocaleDateString("ar-EG")}</span>
                          </div>
                        </div>
                      </div>

                      {/* Details Strip */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <Calendar size={16} className="text-amber-500 shrink-0" />
                          <div className="text-xs font-cairo">
                            <p className="text-slate-400 font-medium">موعد المعاينة المفضل</p>
                            <p className="font-bold mt-0.5">
                              {req.requestedDate
                                ? new Date(req.requestedDate).toLocaleDateString("ar-EG")
                                : "غير محدد"}
                            </p>
                          </div>
                        </div>

                        {req.tenant?.phone && ((req.status as string) === "accepted" || req.status === "approved" || req.status === "completed") && (
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <User size={16} className="text-amber-500 shrink-0" />
                            <div className="text-xs font-cairo">
                              <p className="text-slate-400 font-medium">رقم الهاتف للتواصل</p>
                              <a href={`tel:${req.tenant.phone}`} className="font-bold text-amber-500 hover:underline block mt-0.5 font-sans">
                                {req.tenant.phone}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Notes / Message */}
                      {req.notes && (
                        <div className="flex gap-2 text-slate-600 dark:text-slate-400 text-sm bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                          <MessageSquare size={16} className="text-slate-400 shrink-0 mt-0.5" />
                          <p className="font-cairo leading-relaxed">{req.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Right side: Action Buttons */}
                    <div className="flex flex-row lg:flex-col items-center gap-2 self-stretch lg:self-center shrink-0 border-t lg:border-t-0 lg:border-s border-slate-100 dark:border-slate-800/50 pt-4 lg:pt-0 lg:ps-6">
                      {req.status === "pending" && (
                        <>
                          <Button
                            onClick={() => setModalAction({ requestId: req.id, action: "accepted" })}
                            className="flex-1 lg:w-32 bg-green-600 hover:bg-green-700 text-white font-bold font-cairo flex items-center justify-center gap-1.5 py-3 rounded-xl"
                          >
                            <CheckCircle size={16} />
                            <span>قبول</span>
                          </Button>
                          <Button
                            onClick={() => setModalAction({ requestId: req.id, action: "rejected" })}
                            variant="outline"
                            className="flex-1 lg:w-32 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/10 font-bold font-cairo flex items-center justify-center gap-1.5 py-3 rounded-xl"
                          >
                            <XCircle size={16} />
                            <span>رفض</span>
                          </Button>
                        </>
                      )}

                      {((req.status as string) === "accepted" || (req.status as string) === "approved") && (
                        <Button
                          onClick={() => setModalAction({ requestId: req.id, action: "completed" })}
                          className="w-full lg:w-36 bg-amber-500 hover:bg-amber-600 text-white font-bold font-cairo flex items-center justify-center gap-1.5 py-3 rounded-xl shadow-sm"
                        >
                          <PlayCircle size={16} />
                          <span>إكمال وتأكيد</span>
                        </Button>
                      )}

                      {req.status === "completed" && (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold font-cairo text-sm py-2">
                          <CheckCircle size={16} />
                          <span>تمت المعاينة بنجاح</span>
                        </div>
                      )}

                      {req.status === "rejected" && (
                        <div className="flex items-center gap-1 text-slate-400 font-cairo text-sm py-2">
                          <XCircle size={16} />
                          <span>تم رفض الطلب</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
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
                  className={`flex-1 text-white font-bold rounded-xl py-3 ${
                    modalAction.action === "accepted"
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
