// apps/frontend/src/app/[locale]/dashboard/landlord/advertisements/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import LandlordLayout from "@/components/layout/LandlordLayout";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useListing, useDeleteListing } from "@/hooks/useListings";
import { Spinner, Modal, useToast } from "@/components/ui";
import { getImageUrl } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Review } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Eye,
  Edit2,
  Trash2,
  BedDouble,
  Building2,
  AlertTriangle,
  ExternalLink,
  Calendar,
  RefreshCw,
  LayoutGrid,
  Receipt,
  ShieldCheck,
  Zap,
  UserCheck,
  Wifi,
  Wind,
  WashingMachine,
  Layers,
  Shield,
  Star,
  ArrowRight,
  ArrowLeft,
  Clock,
  Maximize2,
  X,
  CheckCircle,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = { apartment: "شقة", bed: "سرير" };

const AMENITY_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  wifi: { icon: <Wifi size={14} />, label: "واي فاي" },
  ac: { icon: <Wind size={14} />, label: "تكييف" },
  elevator: { icon: <Layers size={14} />, label: "أسانسير" },
  washer: { icon: <WashingMachine size={14} />, label: "غسالة" },
  gas: { icon: <Zap size={14} />, label: "غاز" },
  security: { icon: <Shield size={14} />, label: "أمن وحراسة" },
  furnished: { icon: <BedDouble size={14} />, label: "مفروش" },
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "نشط", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
    pending_review: { label: "قيد المراجعة", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
    rented: { label: "مؤجر", cls: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400" },
    paused: { label: "متوقف", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400" },
    rejected: { label: "مرفوض", cls: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400" },
  };
  const cfg = map[status] ?? { label: status, cls: "bg-slate-100 text-slate-600" };
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-cairo ${cfg.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {cfg.label}
    </span>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" style={{ direction: "ltr" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={12} className={i <= rating ? "text-amber-400 fill-amber-400" : "text-slate-300"} />
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function AdvertisementDetailPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params?.id as string;

  const { data: listing, isLoading } = useListing(id);
  const { mutate: deleteListing, isPending: isDeleting } = useDeleteListing();

  const [activeImg, setActiveImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get<Review[]>(`/reviews/listing/${id}`)
      .then((res) => {
        const data = res.data;
        setReviews(Array.isArray(data) ? data : []);
      })
      .catch(() => setReviews([]));
  }, [id]);

  if (isLoading) {
    return (
      <LandlordLayout>
        <div className="flex justify-center items-center py-40">
          <Spinner size="lg" />
        </div>
      </LandlordLayout>
    );
  }

  if (!listing) {
    return (
      <LandlordLayout>
        <div className="text-center py-40 font-cairo">
          <Building2 size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">{isRtl ? "الإعلان غير موجود" : "Advertisement not found"}</p>
        </div>
      </LandlordLayout>
    );
  }

  const images = listing.images && listing.images.length > 0 ? listing.images : [];
  const totalImages = images.length;

  const handlePrev = () => setActiveImg((p) => (p - 1 + totalImages) % totalImages);
  const handleNext = () => setActiveImg((p) => (p + 1) % totalImages);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const d = touchStart - touchEnd;
    if (d > 50) handleNext();
    if (d < -50) handlePrev();
  };

  const handleDelete = () => {
    deleteListing(id, {
      onSuccess: () => {
        toast({ title: isRtl ? "تم الحذف بنجاح" : "Deleted", description: isRtl ? "تم حذف الإعلان بنجاح." : "The advertisement has been deleted.", type: "success" });
        router.push(`/${locale}/dashboard/landlord/advertisements`);
      },
      onError: () => {
        toast({ title: isRtl ? "فشل الحذف" : "Deletion failed", description: isRtl ? "حدث خطأ، حاول مجدداً." : "An error occurred, please try again.", type: "error" });
        setDeleteModalOpen(false);
      },
    });
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <LandlordLayout>
      <div className="space-y-6 pb-10 font-cairo" dir={isRtl ? "rtl" : "ltr"}>

        {/* ── Breadcrumb & Back ── */}
        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          <Link href={`/${locale}/dashboard/landlord/advertisements`} className="flex items-center gap-1 hover:text-[#1B4F8A] transition-colors font-semibold">
            <BackIcon size={14} />
            {isRtl ? "الإعلانات" : "Advertisements"}
          </Link>
          <ChevronLeft size={12} className={isRtl ? "rotate-180" : ""} />
          <span className="text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{listing.title}</span>
        </div>

        {/* ── Management Actions Bar ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap gap-2.5 items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5 flex-wrap">
            <StatusBadge status={listing.status} />
            <span className="text-xs text-slate-400 hidden sm:block">
              {isRtl ? `رقم الإعلان: #${id.slice(-6).toUpperCase()}` : `Ad ID: #${id.slice(-6).toUpperCase()}`}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/${locale}/listings/${id}`}
              target="_blank"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <ExternalLink size={13} />
              {isRtl ? "عرض للعامة" : "Public View"}
            </Link>
            <Link
              href={`/${locale}/dashboard/landlord/listings/${id}/edit`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1B4F8A] hover:bg-[#153E6D] text-white transition-colors shadow-sm"
            >
              <Edit2 size={13} />
              {isRtl ? "تعديل الإعلان" : "Edit Ad"}
            </Link>
            {listing.type === "bed" ? (
              <Link
                href={`/${locale}/dashboard/landlord/beds?listingId=${id}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
              >
                <BedDouble size={13} />
                {isRtl ? "إدارة الأسرة" : "Manage Beds"}
              </Link>
            ) : (
              <Link
                href={`/${locale}/dashboard/landlord/rentals?listingId=${id}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
              >
                <LayoutGrid size={13} />
                {isRtl ? "إدارة الإيجار" : "Manage Rental"}
              </Link>
            )}
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <Trash2 size={13} />
              {isRtl ? "حذف" : "Delete"}
            </button>
          </div>
        </div>

        {/* ── Image Gallery ── */}
        {totalImages > 0 && (
          <div className="space-y-2.5">
            <div
              className="relative w-full h-[240px] sm:h-[360px] rounded-2xl overflow-hidden bg-slate-950 group cursor-pointer"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => setLightboxOpen(true)}
            >
              {/* Blurred bg */}
              <img src={getImageUrl(images[activeImg])} alt="" className="absolute inset-0 w-full h-full object-cover blur-md opacity-25 pointer-events-none" />
              {/* Main contained image */}
              <img src={getImageUrl(images[activeImg])} alt={listing.title} className="relative z-10 w-full h-full object-contain select-none" />

              {/* Zoom hint */}
              <div className="absolute bottom-3 right-3 bg-black/50 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <Maximize2 size={14} />
              </div>
              {/* Counter */}
              <div className="absolute bottom-3 left-3 bg-black/50 text-white text-[10px] font-sans px-2.5 py-1 rounded-full z-20">
                {activeImg + 1} / {totalImages}
              </div>

              {/* Nav arrows */}
              {totalImages > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all">
                    <ChevronLeft size={18} className={isRtl ? "" : "rotate-180"} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all">
                    <ChevronRight size={18} className={isRtl ? "" : "rotate-180"} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {totalImages > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImg(idx)}
                    className={`w-16 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      idx === activeImg
                        ? "border-[#1B4F8A] ring-2 ring-[#1B4F8A]/20"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Title + Price + Location ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row justify-between gap-4 shadow-sm">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">{listing.title}</h1>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <MapPin size={14} className="text-[#D4A847] shrink-0" />
              <span>{listing.district}، {listing.city}{listing.governorate ? `، ${listing.governorate}` : ""}</span>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end shrink-0 border-t sm:border-t-0 sm:border-s border-slate-100 dark:border-slate-800 pt-3 sm:pt-0 sm:ps-5">
            <span className="text-2xl font-extrabold text-[#D4A847] dark:text-[#E8C06A] font-sans">
              {new Intl.NumberFormat(isRtl ? "ar-EG" : "en-US").format(listing.price)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">{isRtl ? "جنيه مصري / شهرياً" : "EGP / monthly"}</span>
          </div>
        </div>

        {/* ── Feature Cards Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Type */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col items-center text-center gap-2 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-[#1B4F8A] dark:text-[#7BAEE8] flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">{isRtl ? "نوع العقار" : "Type"}</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{TYPE_LABELS[listing.unitType || listing.type] || (listing.unitType || listing.type)}</span>
          </div>

          {/* Gender Target */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col items-center text-center gap-2 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <UserCheck size={18} />
            </div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">{isRtl ? "الفئة" : "Target"}</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {listing.genderTarget === "male" ? "شباب" : listing.genderTarget === "female" ? "بنات" : listing.genderTarget === "family" ? "عائلات" : "مشترك"}
            </span>
          </div>

          {/* Electricity */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col items-center text-center gap-2 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Zap size={18} />
            </div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">{isRtl ? "العداد" : "Meter"}</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {listing.electricityType === "prepaid_card" ? "عداد كارت" : listing.electricityType === "old_meter" ? "قديم" : "حديث"}
            </span>
          </div>

          {/* Bills */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col items-center text-center gap-2 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
              <Receipt size={18} />
            </div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">{isRtl ? "الفواتير" : "Bills"}</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {listing.includesBills ? (isRtl ? "شاملة" : "Included") : (isRtl ? "منفصلة" : "Excluded")}
            </span>
          </div>

          {/* Deposit */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col items-center text-center gap-2 shadow-sm col-span-2 sm:col-span-1">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">{isRtl ? "التأمين" : "Deposit"}</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {listing.securityDeposit ? `${new Intl.NumberFormat("ar-EG").format(listing.securityDeposit)} ج.م` : (isRtl ? "بدون تأمين" : "No Deposit")}
            </span>
          </div>
        </div>

        {/* ── Two-column layout: Info + Stats ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left/Main: Description + Rules + Amenities */}
          <div className="lg:col-span-2 space-y-5">
            {/* Description */}
            {listing.description && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#1B4F8A] rounded-full" />
                  {isRtl ? "وصف العقار" : "Property Description"}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed whitespace-pre-line">{listing.description}</p>
              </div>
            )}

            {/* House Rules */}
            {listing.rules && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-1 h-4 bg-amber-500 rounded-full" />
                  {isRtl ? "قواعد السكن" : "House Rules"}
                </h2>
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4">
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed whitespace-pre-line">{listing.rules}</p>
                </div>
              </div>
            )}

            {/* Beds (if type=bed) */}
            {listing.type === "bed" && listing.beds && listing.beds.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-1 h-4 bg-purple-500 rounded-full" />
                  {isRtl ? "الأسرة المتاحة" : "Available Beds"}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {listing.beds.map((bed) => (
                    <span key={bed.id} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border ${
                      bed.isAvailable
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                        : "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 text-red-500 line-through opacity-60"
                    }`}>
                      <BedDouble size={13} />
                      {isRtl ? `سرير ${bed.bedNumber}` : `Bed ${bed.bedNumber}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {listing.amenities && listing.amenities.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#1B4F8A] rounded-full" />
                  {isRtl ? "مميزات العقار" : "Amenities"}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {listing.amenities.map((key) => {
                    const cfg = AMENITY_CONFIG[key] ?? { icon: <CheckCircle size={14} />, label: key };
                    return (
                      <div key={key} className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-medium text-slate-800 dark:text-slate-200">
                        <span className="text-[#1B4F8A] dark:text-[#7BAEE8] shrink-0">{cfg.icon}</span>
                        {cfg.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-1 h-4 bg-amber-500 rounded-full" />
                  {isRtl ? "تقييمات المستأجرين" : "Tenant Reviews"}
                </h2>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={Math.round(avgRating)} />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">{avgRating.toFixed(1)}</span>
                    <span className="text-[10px] text-slate-400">({reviews.length})</span>
                  </div>
                )}
              </div>
              {reviews.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <Star size={24} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs text-slate-400">{isRtl ? "لا توجد تقييمات بعد" : "No reviews yet"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-2 bg-slate-50/40 dark:bg-slate-900/40">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#1B4F8A]/10 text-[#1B4F8A] flex items-center justify-center text-xs font-bold shrink-0">
                          {review.tenant?.name?.[0] ?? "T"}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{review.tenant?.name ?? "مستأجر"}</p>
                          <StarRating rating={review.rating} />
                        </div>
                        <span className="ms-auto text-[10px] text-slate-400 font-sans">
                          {new Date(review.createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right/Sidebar: Stats & Additional Info */}
          <div className="space-y-4">
            {/* Ad Statistics */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye size={15} className="text-[#1B4F8A]" />
                {isRtl ? "إحصائيات الإعلان" : "Ad Statistics"}
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-850">
                  <span className="text-slate-400">{isRtl ? "رقم الإعلان" : "Ad ID"}</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">#{id.slice(-6).toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-850">
                  <span className="text-slate-400">{isRtl ? "المشاهدات" : "Views"}</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 font-sans flex items-center gap-1">
                    <Eye size={12} className="text-[#1B4F8A]" />
                    {listing.viewCount ?? listing.views ?? 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-850">
                  <span className="text-slate-400">{isRtl ? "الحالة" : "Status"}</span>
                  <StatusBadge status={listing.status} />
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-850">
                  <span className="text-slate-400">{isRtl ? "تاريخ النشر" : "Published"}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Calendar size={11} className="text-[#1B4F8A]" />
                    {new Date(listing.createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400">{isRtl ? "آخر تحديث" : "Last Updated"}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <RefreshCw size={11} className="text-[#1B4F8A]" />
                    {new Date(listing.updatedAt).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Tenant (if rented) */}
            {listing.status === "rented" && listing.currentTenant && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck size={15} className="text-emerald-500" />
                  {isRtl ? "المستأجر الحالي" : "Current Tenant"}
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                    {listing.currentTenant.name?.[0] ?? "T"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{listing.currentTenant.name}</p>
                    {listing.currentTenant.phone && (
                      <a href={`tel:${listing.currentTenant.phone}`} className="text-xs text-[#1B4F8A] dark:text-[#7BAEE8] hover:underline font-medium">
                        {listing.currentTenant.phone}
                      </a>
                    )}
                  </div>
                </div>
                {listing.rentedSince && (
                  <div className="text-xs flex items-center gap-1.5 text-slate-500">
                    <Clock size={12} className="text-[#1B4F8A]" />
                    {isRtl ? "مؤجر منذ:" : "Rented since:"} {new Date(listing.rentedSince).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxOpen && totalImages > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 text-white p-2.5 bg-white/10 hover:bg-white/20 rounded-full z-50" onClick={() => setLightboxOpen(false)}>
            <X size={20} />
          </button>
          {totalImages > 1 && (
            <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-3 bg-white/10 hover:bg-white/20 rounded-full z-50" onClick={(e) => { e.stopPropagation(); handlePrev(); }}>
              <ChevronLeft size={24} className={isRtl ? "" : "rotate-180"} />
            </button>
          )}
          <img src={getImageUrl(images[activeImg])} alt={listing.title} className="max-w-full max-h-[85vh] object-contain rounded-xl select-none" onClick={(e) => e.stopPropagation()} />
          {totalImages > 1 && (
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-3 bg-white/10 hover:bg-white/20 rounded-full z-50" onClick={(e) => { e.stopPropagation(); handleNext(); }}>
              <ChevronRight size={24} className={isRtl ? "" : "rotate-180"} />
            </button>
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs font-sans">{activeImg + 1} / {totalImages}</div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteModalOpen && (
        <Modal isOpen={true} onClose={() => setDeleteModalOpen(false)} title={isRtl ? "تأكيد حذف الإعلان" : "Confirm Deletion"}>
          <div className="p-6 text-center space-y-4 font-cairo">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isRtl ? "هل أنت متأكد من حذف هذا الإعلان؟" : "Are you sure you want to delete?"}
            </h3>
            <p className="text-slate-500 text-xs max-w-xs mx-auto">
              {isRtl ? "هذا الإجراء نهائي وسيتم إزالة الإعلان من المنصة بالكامل." : "This action is permanent and cannot be undone."}
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                {isRtl ? "إلغاء" : "Cancel"}
              </button>
              <button onClick={handleDelete} disabled={isDeleting} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                {isDeleting ? (isRtl ? "جاري الحذف..." : "Deleting...") : (isRtl ? "حذف" : "Delete")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </LandlordLayout>
  );
}
