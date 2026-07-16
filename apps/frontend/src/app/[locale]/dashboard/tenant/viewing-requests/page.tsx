// apps/frontend/src/app/[locale]/dashboard/tenant/requests/page.tsx
"use client";

import React, { useState } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { REQUEST_STATUS_CONFIG } from "@/lib/constants";
// eslint-disable-next-line import/no-named-as-default-member
import { useTenantRequests, useCancelRequest } from "@/hooks/useRequests";
import { useCreateReview, useMyReviews } from "@/hooks/useReviews";
import TenantLayout from "@/components/layout/TenantLayout";
import { Card, CardBody, Spinner, Button, Badge, Modal, useToast } from "@/components/ui";
import {
  FileText,
  Calendar,
  Clock,
  Building,
  Trash2,
  Star,
  CheckCircle,
  XCircle,
  HelpCircle,
  MessageSquare,
  Eye,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { getImageUrl } from "@/lib/utils";

type FilterStatus = "all" | "pending" | "accepted" | "rejected" | "completed";

export default function TenantRequests() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuthGuard({ requiredRoles: ["tenant"] });
  const [page, setPage] = useState(1);

  // Queries & Mutations
  const { data: requestsData, isLoading: isRequestsLoading } = useTenantRequests(page);
  const { data: myReviews = [], isLoading: isReviewsLoading } = useMyReviews();
  const { mutate: cancelRequest, isPending: isCancelling } = useCancelRequest();
  const { mutate: createReview, isPending: isSubmittingReview } = useCreateReview();

  // Tab Filtering
  const [activeTab, setActiveTab] = useState<FilterStatus>("all");

  // Modal States
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [reviewModalListing, setReviewModalListing] = useState<{ id: string; title: string } | null>(null);

  // Review Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  const isLoading = isAuthLoading || isRequestsLoading || isReviewsLoading;

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const items = requestsData?.items || [];
  const reviewedListingIds = new Set(myReviews.map((review) => review.listingId));

  const filteredItems = items.filter((req) => {
    if (activeTab === "all") return true;
    const statusStr = req.status as string;
    if (activeTab === "accepted") return statusStr === "accepted" || statusStr === "approved";
    return statusStr === activeTab;
  });

  const handleCancelRequestSubmit = () => {
    if (!cancelModalId) return;

    cancelRequest(cancelModalId, {
      onSuccess: () => {
        toast({
          title: "تم إلغاء الطلب",
          description: "تم إلغاء طلب المعاينة بنجاح.",
          type: "success",
        });
        setCancelModalId(null);
      },
      onError: () => {
        toast({
          title: "فشل إلغاء الطلب",
          description: "حدث خطأ أثناء محاولة إلغاء الطلب. حاول مرة أخرى.",
          type: "error",
        });
      },
    });
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalListing) return;

    createReview(
      {
        listingId: reviewModalListing.id,
        rating,
        comment: comment || undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: "تم إضافة التقييم",
            description: "شكراً لك! تم نشر تقييمك للمؤجر والعقار بنجاح.",
            type: "success",
          });
          setReviewModalListing(null);
          setRating(5);
          setComment("");
        },
        onError: () => {
          toast({
            title: "حدث خطأ",
            description: "فشل إرسال التقييم. قد تكون قمت بتقييم هذا العقار بالفعل.",
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

  return (
    <TenantLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-cairo">طلبات الاستئجار</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-cairo text-sm">
            تابع حالة طلبات المعاينة التي قمت بتقديمها وتواصل مع المؤجرين.
          </p>
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
                  ? "bg-blue-600 text-white shadow-sm font-bold"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl font-cairo">
            <FileText size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">لا توجد طلبات</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto text-sm">
              لم تقم بتقديم طلبات استئجار تطابق التصفية الحالية.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredItems.map((req) => {
              const isPending = req.status === "pending";
              const isAccepted = req.status === "accepted" || req.status === "approved";
              const isCompleted = req.status === "completed";
              const isRejected = req.status === "rejected";
              const hasReviewed = reviewedListingIds.has(req.listingId);

              return (
                <Card
                  key={req.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardBody className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Left: Thumbnail & Details */}
                      <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                          {req.listing?.images?.[0] ? (
                            <img
                              src={getImageUrl(req.listing.images[0])}
                              alt={req.listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building size={28} />
                          )}
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate font-cairo">
                              {req.listing?.title || "عقار غير معروف"}
                            </h3>
                            {getStatusBadge(req.status)}
                          </div>
                          
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo">
                            {req.listing?.address || "عنوان غير محدد"}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 font-cairo">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} className="text-amber-500" />
                              <span>تاريخ المعاينة: {new Date(req.preferredDate).toLocaleDateString("ar-EG")}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={11} className="text-slate-400" />
                              <span>تاريخ الطلب: {new Date(req.createdAt).toLocaleDateString("ar-EG")}</span>
                            </span>
                          </div>

                          {/* Notes */}
                          {req.message && (
                            <div className="flex gap-1.5 text-slate-600 dark:text-slate-400 text-xs p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/80 mt-2">
                              <MessageSquare size={13} className="text-slate-400 shrink-0 mt-0.5" />
                              <p className="font-cairo truncate">{req.message}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-row lg:flex-col items-center gap-2 self-stretch lg:self-center shrink-0 border-t lg:border-t-0 lg:border-s border-slate-100 dark:border-slate-800/50 pt-4 lg:pt-0 lg:ps-6 justify-end">
                        <Button
                          onClick={() => router.push(`/${locale}/listings/${req.listingId}`)}
                          className="flex-1 lg:w-32 bg-blue-600 hover:bg-blue-700 text-white font-bold font-cairo flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs"
                        >
                          <Eye size={13} />
                          <span>{locale === "ar" ? "عرض الإعلان" : "View Listing"}</span>
                        </Button>

                        {isPending && (
                          <Button
                            onClick={() => setCancelModalId(req.id)}
                            className="flex-1 lg:w-32 bg-red-600 hover:bg-red-700 text-white font-bold font-cairo flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs"
                          >
                            <Trash2 size={13} />
                            <span>إلغاء الطلب</span>
                          </Button>
                        )}

                        {isAccepted && (
                          <div className="text-center font-cairo text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1 bg-green-500/10 py-1.5 px-3 rounded-full">
                            <CheckCircle size={12} />
                            <span>تم القبول من المؤجر</span>
                          </div>
                        )}

                        {isRejected && (
                          <div className="text-center font-cairo text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-1 bg-red-500/10 py-1.5 px-3 rounded-full">
                            <XCircle size={12} />
                            <span>مرفوض</span>
                          </div>
                        )}

                        {isCompleted && req.listing && !hasReviewed && (
                          <Button
                            onClick={() => setReviewModalListing({ id: req.listingId, title: req.listing?.title || "" })}
                            className="flex-1 lg:w-32 bg-amber-500 hover:bg-amber-600 text-white font-bold font-cairo flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs"
                          >
                            <Star size={13} />
                            <span>كتابة تقييم</span>
                          </Button>
                        )}

                        {isCompleted && hasReviewed && (
                          <div className="text-center font-cairo text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 bg-amber-500/10 py-1.5 px-3 rounded-full">
                            <Star size={12} />
                            <span>تم إضافة التقييم</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        {/* Cancel Request Modal */}
        {cancelModalId && (
          <Modal
            isOpen={true}
            onClose={() => setCancelModalId(null)}
            title="تأكيد إلغاء الطلب"
          >
            <div className="p-6 text-center space-y-4 font-cairo">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
                <HelpCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                هل أنت متأكد من إلغاء طلب المعاينة؟
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                سيتم إزالة الطلب وإشعار المؤجر بإلغائه. لا يمكنك التراجع عن هذا الإجراء.
              </p>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setCancelModalId(null)}
                  variant="outline"
                  className="flex-1 rounded-xl py-3 border-slate-200 dark:border-slate-800 font-semibold"
                >
                  تراجع
                </Button>
                <Button
                  onClick={handleCancelRequestSubmit}
                  disabled={isCancelling}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl py-3"
                >
                  {isCancelling ? "جاري الإلغاء..." : "تأكيد الإلغاء"}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Review Modal */}
        {reviewModalListing && (
          <Modal
            isOpen={true}
            onClose={() => setReviewModalListing(null)}
            title="كتابة تقييم للعقار والمؤجر"
          >
            <form onSubmit={handleReviewSubmit} className="p-6 space-y-4 font-cairo">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                تقييمك لعقار: <span className="text-blue-600">{reviewModalListing.title}</span>
              </h4>

              {/* Star rating selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">التقييم العام</label>
                <div
                  className="flex items-center gap-1 pt-1 justify-center"
                  style={{ direction: "ltr" }}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isLit = hoverRating !== null ? star <= hoverRating : star <= rating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setRating(star)}
                        className="p-1 focus:outline-none transition-transform hover:scale-110 shrink-0"
                      >
                        <Star
                          size={32}
                          className={
                            isLit
                              ? "text-yellow-400 fill-yellow-400 stroke-yellow-500"
                              : "text-slate-300 stroke-slate-400 dark:text-slate-700"
                          }
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text comment */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">تعليقك (اختياري)</label>
                <textarea
                  placeholder="اكتب تفاصيل تجربتك مع العقار والمؤجر..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  onClick={() => setReviewModalListing(null)}
                  variant="outline"
                  className="flex-1 rounded-xl py-3 border-slate-200 dark:border-slate-800"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl py-3"
                >
                  {isSubmittingReview ? "جاري الإرسال..." : "إرسال التقييم"}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </TenantLayout>
  );
}
