// apps/frontend/src/app/[locale]/dashboard/tenant/viewing-requests/page.tsx
"use client";

import React, { useState } from "react";
import { useAuthGuard } from "@/features/auth";
import { REQUEST_STATUS_CONFIG } from "@/lib/constants";
// eslint-disable-next-line import/no-named-as-default-member
import { useTenantRequests, useCancelRequest } from "@/hooks/useRequests";
import { useCreateReview, useMyReviews } from "@/hooks/useReviews";
import TenantLayout from "@/components/layout/TenantLayout";
import { Spinner, Button, Badge, Modal, useToast } from "@/components/ui";
import {
  FileText,
  Calendar,
  Clock,
  Trash2,
  Star,
  HelpCircle,
  MessageSquare,
  Eye,
  Building2,
  Bed,
  MapPin,
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
  const [page] = useState(1);
  const isAr = locale === "ar";

  // Queries & Mutations
  const { data: requestsData, isLoading: isRequestsLoading } = useTenantRequests(page);
  const { data: myReviews = [], isLoading: isReviewsLoading } = useMyReviews();
  const { mutate: cancelRequest, isPending: isCancelling } = useCancelRequest();
  const { mutate: createReview, isPending: isSubmittingReview } = useCreateReview();

  // Tab Filtering
  const [activeTab, setActiveTab] = useState<FilterStatus>("all");

  // Modal States
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
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
        setSelectedRequest(null);
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
          setSelectedRequest(null);
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

  const getListingCoverUrl = (listing?: any) => {
    if (!listing?.images || listing.images.length === 0) return null;
    const first = listing.images[0];
    const urlStr = typeof first === "string" ? first : first?.url || first?.path;
    return urlStr ? getImageUrl(urlStr) : null;
  };

  const getStatusBadge = (status: string) => {
    const normalized = status === "approved" ? "accepted" : status;
    const cfg = REQUEST_STATUS_CONFIG[normalized as keyof typeof REQUEST_STATUS_CONFIG];
    return (
      <Badge variant={cfg?.color ?? "gray"} className="font-bold font-cairo text-xs px-2.5 py-1">
        {cfg?.labelAr ?? status}
      </Badge>
    );
  };

  return (
    <TenantLayout>
      <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-cairo flex items-center gap-2 text-text">
            <FileText size={26} className="text-primary" />
            <span>{isAr ? "طلبات الاستئجار والمعاينة" : "Viewing Requests"}</span>
          </h1>
          <p className="text-text-secondary mt-1 font-cairo text-xs sm:text-sm">
            {isAr
              ? "تابع حالة طلبات المعاينة التي قمت بتقديمها وتواصل مع المؤجرين."
              : "Track your submitted viewing requests and coordinate with landlords."}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4 font-cairo">
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
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === tab.key
                  ? "bg-primary text-white shadow-xs font-bold"
                  : "bg-surface border border-border text-text-secondary hover:bg-surface-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Compact Cards Grid — Matched with Rental History */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-surface border border-dashed border-border rounded-3xl font-cairo space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20">
              <FileText size={32} />
            </div>
            <h3 className="text-base font-bold text-text">
              {isAr ? "لا توجد طلبات معاينة" : "No viewing requests found"}
            </h3>
            <p className="text-text-secondary text-xs max-w-xs mx-auto">
              {isAr
                ? "لم تقم بتقديم طلبات استئجار تطابق التصفية الحالية."
                : "No viewing requests match your current tab filter."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredItems.map((req) => {
              const coverUrl = getListingCoverUrl(req.listing);
              const isApartment = req.listing?.unitType === "apartment";

              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className="group bg-white rounded-3xl border border-slate-200 p-3 sm:p-4 hover:shadow-md hover:border-[#1B4F8A]/30 transition-all hover:scale-[1.01] cursor-pointer flex flex-col justify-between items-center text-center gap-3 relative"
                >
                  {/* Cover Image Banner (Full Width) */}
                  <div className="w-full h-32 sm:h-36 rounded-2xl overflow-hidden shrink-0 border border-slate-100 shadow-xs">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={req.listing?.title || ""}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-50 flex items-center justify-center border border-blue-100">
                        {isApartment ? (
                          <Building2 size={32} className="text-[#1B4F8A]" />
                        ) : (
                          <Bed size={32} className="text-[#1B4F8A]" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div className="space-y-1 w-full px-1">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 font-cairo line-clamp-2 min-h-[2.25rem]">
                      {req.listing?.title || "عقار غير معروف"}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {getStatusBadge(req.status)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Details Modal */}
        {selectedRequest && (
          <Modal
            isOpen={true}
            onClose={() => setSelectedRequest(null)}
            title={isAr ? "تفاصيل طلب المعاينة" : "Viewing Request Details"}
            size="md"
          >
            <div className="p-1 sm:p-2 space-y-4 font-cairo">
              {/* Cover & Title Header */}
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                {getListingCoverUrl(selectedRequest.listing) ? (
                  <img
                    src={getListingCoverUrl(selectedRequest.listing)!}
                    alt={selectedRequest.listing?.title || ""}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0">
                    <Building2 size={26} className="text-[#1B4F8A]" />
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                    {selectedRequest.listing?.title || "عقار غير معروف"}
                  </h3>
                </div>
              </div>

              {/* Date & Location Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px]">
                    <Calendar size={12} className="text-amber-500" />
                    <span>تاريخ المعاينة المطلوب</span>
                  </span>
                  <p className="font-bold text-slate-900">
                    {new Date(selectedRequest.preferredDate).toLocaleDateString("ar-EG")}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px]">
                    <Clock size={12} className="text-slate-400" />
                    <span>تاريخ تقديم الطلب</span>
                  </span>
                  <p className="font-bold text-slate-900">
                    {new Date(selectedRequest.createdAt).toLocaleDateString("ar-EG")}
                  </p>
                </div>

                {selectedRequest.listing?.address && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2 space-y-1">
                    <span className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px]">
                      <MapPin size={12} className="text-[#1B4F8A]" />
                      <span>العنوان والموقع</span>
                    </span>
                    <p className="font-bold text-slate-900">
                      {selectedRequest.listing.address}
                    </p>
                  </div>
                )}
              </div>

              {/* Message Note if present */}
              {selectedRequest.message && (
                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/50 space-y-1 text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-amber-900 text-[10px]">
                    <MessageSquare size={12} />
                    <span>ملاحظات الطلب:</span>
                  </span>
                  <p className="text-amber-800 leading-relaxed">
                    {selectedRequest.message}
                  </p>
                </div>
              )}

              {/* Action Buttons — Unified with side-by-side icons */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setSelectedRequest(null);
                    router.push(`/${locale}/listings/${selectedRequest.listingId}`);
                  }}
                  leftIcon={<Eye size={16} />}
                  className="flex-1 bg-[#1B4F8A] hover:bg-[#153e6d] text-white font-bold text-xs py-3 rounded-xl shadow-xs"
                >
                  {isAr ? "عرض الإعلان" : "View Listing"}
                </Button>

                {selectedRequest.status === "pending" && (
                  <Button
                    onClick={() => {
                      setCancelModalId(selectedRequest.id);
                    }}
                    leftIcon={<Trash2 size={16} />}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3 rounded-xl shadow-xs"
                  >
                    إلغاء الطلب
                  </Button>
                )}

                {selectedRequest.status === "completed" && selectedRequest.listing && !reviewedListingIds.has(selectedRequest.listingId) && (
                  <Button
                    onClick={() => {
                      setReviewModalListing({ id: selectedRequest.listingId, title: selectedRequest.listing?.title || "" });
                    }}
                    leftIcon={<Star size={16} />}
                    className="flex-1 bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold text-xs py-3 rounded-xl shadow-xs"
                  >
                    كتابة تقييم
                  </Button>
                )}
              </div>
            </div>
          </Modal>
        )}

        {/* Cancel Request Confirmation Modal */}
        {cancelModalId && (
          <Modal
            isOpen={true}
            onClose={() => setCancelModalId(null)}
            title="تأكيد إلغاء الطلب"
          >
            <div className="p-6 text-center space-y-4 font-cairo">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <HelpCircle size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  هل أنت متأكد من إلغاء طلب المعاينة؟
                </h3>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                  سيتم إزالة الطلب وإشعار المؤجر بإلغائه. لا يمكنك التراجع عن هذا الإجراء.
                </p>
              </div>
              <div className="flex gap-2.5 pt-4">
                <Button
                  onClick={() => setCancelModalId(null)}
                  variant="outline"
                  className="flex-1 rounded-xl py-3 border-slate-200 font-semibold text-xs text-slate-600"
                >
                  تراجع
                </Button>
                <Button
                  onClick={handleCancelRequestSubmit}
                  disabled={isCancelling}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl py-3 shadow-xs"
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
            <form onSubmit={handleReviewSubmit} className="p-6 space-y-4 font-cairo text-xs">
              <h4 className="font-bold text-sm text-slate-800">
                تقييمك لعقار: <span className="text-[#1B4F8A]">{reviewModalListing.title}</span>
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
                          size={28}
                          className={
                            isLit
                              ? "text-amber-400 fill-amber-400 stroke-amber-500"
                              : "text-slate-300 stroke-slate-400"
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
                  className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30 focus:border-[#1B4F8A] resize-none text-slate-800"
                />
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={() => setReviewModalListing(null)}
                  variant="outline"
                  className="flex-1 rounded-xl py-3 border-slate-200 text-xs font-semibold"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="flex-1 bg-[#1B4F8A] hover:bg-[#153e6d] text-white font-bold text-xs rounded-xl py-3 shadow-xs"
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

