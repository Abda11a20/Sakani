// apps/frontend/src/app/[locale]/listings/[id]/listing-detail-client.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Star,
  Wifi,
  Wind,
  Building2,
  BedDouble,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Calendar,
  Zap,
  Shield,
  WashingMachine,
  Layers,
  Receipt,
  UserCheck,
  Clock,
  Heart,
  Share2,
  Info,
  Check,
  User,
  Maximize2
} from "lucide-react";
import { api } from "@/lib/api";
import { UNIT_TYPE_CONFIG, GENDER_TARGET_CONFIG } from "@/lib/constants";
import { ListingCard } from "@/components/listings/ListingCard";
import { useAuthStore } from "@/store/auth.store";
import { useWishlist } from "@/hooks/useWishlist";
import {
  Avatar,
  Badge,
  Card,
  CardBody,
  useToast
} from "@/components/ui";
import { getImageUrl } from "@/lib/utils";
import type { Listing, Review } from "@/types";

// ── Types ─────────────────────────────────────────────────────
interface ListingDetailClientProps {
  listing: Listing;
  reviews: Review[];
  suggested: Listing[];
  locale: string;
}



const AMENITY_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  wifi: { icon: <Wifi size={14} />, label: "واي فاي" },
  ac: { icon: <Wind size={14} />, label: "تكييف" },
  elevator: { icon: <Layers size={14} />, label: "أسانسير" },
  washer: { icon: <WashingMachine size={14} />, label: "غسالة" },
  gas: { icon: <Zap size={14} />, label: "غاز" },
  security: { icon: <Shield size={14} />, label: "أمن وحراسة" },
  furnished: { icon: <BedDouble size={14} />, label: "مفروش" },
};

// ── Request Viewing Modal ─────────────────────────────────────
function RequestViewingModal({
  listingId,
  open,
  onClose,
}: {
  listingId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/requests", {
        listingId,
        preferredDate: new Date(`${date}T${time}`).toISOString(),
      });
      setSuccess(true);
    } catch (err) {
      setError("حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const TIME_OPTIONS = [
    { value: "09:00", label: "9 صباحاً" },
    { value: "10:00", label: "10 صباحاً" },
    { value: "11:00", label: "11 صباحاً" },
    { value: "12:00", label: "12 ظهراً" },
    { value: "13:00", label: "1 ظهراً" },
    { value: "14:00", label: "2 ظهراً" },
    { value: "15:00", label: "3 عصراً" },
    { value: "16:00", label: "4 عصراً" },
    { value: "17:00", label: "5 مساءً" },
    { value: "18:00", label: "6 مساءً" },
    { value: "19:00", label: "7 مساءً" },
    { value: "20:00", label: "8 مساءً" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-5 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 z-10 font-cairo text-right" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">طلب معاينة العقار</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-4">
            <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">تم إرسال طلبك بنجاح!</h3>
            <p className="text-slate-550 dark:text-slate-400 text-xs mb-5">
              سيتواصل معك المؤجر في أقرب وقت لتنسيق الموعد وتأكيده.
            </p>
            <button onClick={onClose} className="w-full bg-[#1B4F8A] hover:bg-[#153E6D] text-white py-2.5 rounded-xl font-bold transition-all text-sm">
              حسناً
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-350 mb-1 flex items-center gap-1.5">
                <Calendar size={13} className="text-[#1B4F8A]" />
                تاريخ المعاينة المفضل
              </label>
              <input
                type="date"
                required
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/20 focus:border-[#1B4F8A] text-slate-800 dark:text-slate-200 font-sans"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-355 mb-1 flex items-center gap-1.5">
                <Clock size={13} className="text-[#1B4F8A]" />
                الوقت المفضل
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/20 focus:border-[#1B4F8A] text-slate-800 dark:text-slate-200 font-semibold"
              >
                {TIME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2.5 pt-1.5">
              <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300">
                إلغاء
              </button>
              <button type="submit" disabled={loading || !date} className="flex-1 bg-[#1B4F8A] hover:bg-[#153E6D] text-white py-2 rounded-xl font-bold transition-all shadow-md">
                {loading ? "جارٍ الإرسال..." : "إرسال الطلب"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Star Rating ───────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" style={{ direction: "ltr" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= rating ? "text-amber-400 fill-amber-400" : "text-gray-300 dark:text-slate-750"}
        />
      ))}
    </div>
  );
}

// ── Main Client Component ─────────────────────────────────────
export function ListingDetailClient({
  listing,
  reviews,
  suggested,
  locale,
}: ListingDetailClientProps) {
  const isRtl = locale === "ar";
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [contactAccess, setContactAccess] = useState<{
    canViewPhone: boolean;
    phone: string | null;
  } | null>(null);

  // Swipe gesture touch detection states
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // Send Listing view count update once
  useEffect(() => {
    const viewKey = `sakani_listing_viewed_${listing.id}`;
    if (sessionStorage.getItem(viewKey)) return;

    sessionStorage.setItem(viewKey, "1");
    api.post(`/listings/${listing.id}/view`).catch(() => {
      sessionStorage.removeItem(viewKey);
    });
  }, [listing.id]);

  // Fetch phone contact access for tenants
  useEffect(() => {
    setMounted(true);
    if (currentUser?.role !== "tenant") {
      setContactAccess(null);
      return;
    }

    let cancelled = false;
    api
      .get<{ canViewPhone: boolean; phone: string | null }>(
        `/requests/listing/${listing.id}/contact-access`
      )
      .then((response) => {
        if (!cancelled) {
          setContactAccess(response.data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setContactAccess({ canViewPhone: false, phone: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.role, listing.id]);

  const displayImages = listing.images && listing.images.length > 0
    ? listing.images
    : ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80"];

  const totalImages = displayImages.length;
  const isLiked = isInWishlist(listing.id);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: isRtl ? "تم نسخ الرابط بنجاح" : "Link copied",
        description: isRtl ? "يمكنك الآن مشاركة الإعلان مع أصدقائك." : "The listing link has been copied to your clipboard.",
        type: "success",
      });
    }
  };

  const handlePrevImage = () => {
    setActiveImageIdx((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const handleNextImage = () => {
    setActiveImageIdx((prev) => (prev + 1) % totalImages);
  };

  // Touch handlers for swipe triggers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNextImage();
    }
    if (isRightSwipe) {
      handlePrevImage();
    }
  };

  // Map gender targets cleanly
  const getGenderTargetLabel = (gender?: string) => {
    if (!gender) return isRtl ? "مشترك" : "Mixed";
    const cfg = GENDER_TARGET_CONFIG[gender as keyof typeof GENDER_TARGET_CONFIG];
    return isRtl ? (cfg?.labelAr ?? gender) : (cfg?.labelEn ?? gender);
  };

  // Map electricity meter
  const getElectricityTypeLabel = (meter?: string) => {
    if (meter === "prepaid_card") return isRtl ? "عداد كارت" : "Prepaid";
    if (meter === "old_meter") return isRtl ? "عداد قديم" : "Old Meter";
    return isRtl ? "عداد حديث" : "Modern";
  };

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 4.5;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 font-cairo" dir={isRtl ? "rtl" : "ltr"}>
      {/* 1. Breadcrumbs */}
      <div className="container mx-auto px-4 py-3 max-w-5xl">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href={`/${locale}`} className="hover:text-[#1B4F8A] transition-colors">{isRtl ? "الرئيسية" : "Home"}</Link>
          <ChevronLeft size={12} className={isRtl ? "" : "rotate-180"} />
          <Link href={`/${locale}/search`} className="hover:text-[#1B4F8A] transition-colors">{isRtl ? "البحث" : "Search"}</Link>
          <ChevronLeft size={12} className={isRtl ? "" : "rotate-180"} />
          <span className="text-slate-900 dark:text-slate-200 truncate max-w-[200px]">{listing.title}</span>
        </nav>
      </div>

      {/* Main Details Panel */}
      <div className="container mx-auto px-4 max-w-5xl space-y-4 sm:space-y-5">
        {/* 2. Image Gallery Carousel with Premium Contained Aspect Design */}
        <div
          className="relative w-full h-[220px] sm:h-[340px] md:h-[380px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center group"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Blurred Background layer to look aesthetic */}
          <img
            src={getImageUrl(displayImages[activeImageIdx])}
            alt=""
            className="absolute inset-0 w-full h-full object-cover blur-md opacity-30 select-none pointer-events-none"
          />

          {/* Actual contained foreground image */}
          <img
            src={getImageUrl(displayImages[activeImageIdx])}
            alt={listing.title}
            onClick={() => setLightboxOpen(true)}
            className="relative max-h-full max-w-full object-contain z-10 cursor-pointer select-none hover:scale-[1.01] transition-transform duration-300"
          />

          {/* Overlays top left: Heart & Share */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
            <button
              onClick={() => toggleWishlist(listing.id)}
              className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center text-red-500 shadow hover:scale-105 transition-transform"
            >
              <Heart size={15} className={isLiked ? "fill-red-500 text-red-500" : "text-slate-600 dark:text-slate-350"} />
            </button>
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center text-slate-600 dark:text-slate-355 shadow hover:scale-105 transition-transform"
            >
              <Share2 size={15} />
            </button>
          </div>

          {/* Zoom icon over image center */}
          <div
            onClick={() => setLightboxOpen(true)}
            className="absolute bottom-3 right-3 bg-slate-900/70 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-20"
          >
            <Maximize2 size={14} />
          </div>

          {/* Overlays bottom left: Index counter */}
          <div className="absolute bottom-3 left-3 bg-slate-900/60 backdrop-blur-sm text-white text-[10px] font-sans px-2.5 py-1 rounded-full z-20">
            {activeImageIdx + 1} / {totalImages}
          </div>

          {/* Prev/Next Navigation Controls */}
          {totalImages > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 dark:bg-slate-900/70 text-slate-800 dark:text-white flex items-center justify-center shadow hover:bg-white dark:hover:bg-slate-900 transition-colors opacity-0 group-hover:opacity-100 duration-200 z-20"
              >
                <ChevronLeft size={16} className={isRtl ? "" : "rotate-180"} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 dark:bg-slate-900/70 text-slate-800 dark:text-white flex items-center justify-center shadow hover:bg-white dark:hover:bg-slate-900 transition-colors opacity-0 group-hover:opacity-100 duration-200 z-20"
              >
                <ChevronRight size={16} className={isRtl ? "" : "rotate-180"} />
              </button>
            </>
          )}
        </div>

        {/* Image Gallery Thumbnails Row */}
        {totalImages > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-thin">
            {displayImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIdx(idx)}
                className={`w-14 h-10 rounded-lg overflow-hidden shrink-0 border transition-all ${idx === activeImageIdx
                    ? "border-[#1B4F8A] ring-2 ring-[#1B4F8A]/20 scale-102"
                    : "border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100"
                  }`}
              >
                <img src={getImageUrl(img)} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* 3. Title & Price Block */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
              {listing.title}
            </h1>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-medium">
              <MapPin size={14} className="text-[#1B4F8A] shrink-0" />
              <span>{listing.district}، {listing.city}، {listing.governorate || ""}</span>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end justify-center shrink-0 border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto border-slate-100 dark:border-slate-850">
            <span className="text-2xl font-extrabold text-[#1B4F8A] dark:text-[#7BAEE8] font-sans">
              {new Intl.NumberFormat(isRtl ? "ar-EG" : "en-US").format(listing.price)}
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-semibold mt-0.5">
              {isRtl ? "جنيه / شهرياً" : "EGP / monthly"}
            </span>
          </div>
        </div>

        {/* 4. Dynamic Feature Cards Grid Row (Real Data only) */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2.5">
          {/* Card 1: Property Type */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex flex-col items-center text-center shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-1.5 shrink-0">
              <Building2 size={16} />
            </div>
            <span className="text-[9px] text-slate-400 font-semibold">{isRtl ? "نوع العقار" : "Type"}</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {isRtl
                ? (UNIT_TYPE_CONFIG[(listing.unitType || listing.type) as keyof typeof UNIT_TYPE_CONFIG]?.labelAr ?? (listing.unitType || listing.type))
                : (UNIT_TYPE_CONFIG[(listing.unitType || listing.type) as keyof typeof UNIT_TYPE_CONFIG]?.labelEn ?? (listing.unitType || listing.type))}
            </span>
          </div>

          {/* Card 2: Target occupant */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex flex-col items-center text-center shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-[#1B4F8A] dark:text-[#7BAEE8] flex items-center justify-center mb-1.5 shrink-0">
              <UserCheck size={16} />
            </div>
            <span className="text-[9px] text-slate-400 font-semibold">{isRtl ? "الفئة" : "Target"}</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{getGenderTargetLabel(listing.genderTarget)}</span>
          </div>

          {/* Card 3: Electricity Meter */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex flex-col items-center text-center shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center mb-1.5 shrink-0">
              <Zap size={16} />
            </div>
            <span className="text-[9px] text-slate-400 font-semibold">{isRtl ? "العداد" : "Meter"}</span>
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mt-1 truncate max-w-full">{getElectricityTypeLabel(listing.electricityType)}</span>
          </div>

          {/* Card 4: Bills policy */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex flex-col items-center text-center shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center mb-1.5 shrink-0">
              <Receipt size={16} />
            </div>
            <span className="text-[9px] text-slate-400 font-semibold">{isRtl ? "الفواتير" : "Bills"}</span>
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mt-1 truncate max-w-full">
              {listing.includesBills ? (isRtl ? "شاملة" : "Included") : (isRtl ? "منفصلة" : "Excluded")}
            </span>
          </div>

          {/* Card 5: Security Deposit */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-xs col-span-3 md:col-span-1">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center mb-1.5 shrink-0">
              <Shield size={16} />
            </div>
            <span className="text-[9px] text-slate-400 font-semibold">{isRtl ? "التأمين" : "Deposit"}</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {listing.securityDeposit ? `${new Intl.NumberFormat(isRtl ? "ar-EG" : "en-US").format(listing.securityDeposit)} ج.م` : (isRtl ? "بدون تأمين" : "No Deposit")}
            </span>
          </div>
        </div>

        {/* 5. Description Block */}
        {listing.description && (
          <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardBody className="p-5 space-y-3">
              <h2 className="text-sm font-bold text-slate-850 dark:text-slate-100 border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-[#1B4F8A] rounded-full" />
                {isRtl ? "وصف العقار" : "Property Description"}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs whitespace-pre-line">
                {listing.description}
              </p>
            </CardBody>
          </Card>
        )}

        {/* House Rules */}
        {listing.rules && (
          <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardBody className="p-5 space-y-3">
              <h2 className="text-sm font-bold text-slate-850 dark:text-slate-100 border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-amber-500 rounded-full" />
                {isRtl ? "قواعد وشروط السكن" : "House Rules"}
              </h2>
              <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <p className="text-xs text-amber-850 dark:text-amber-300 leading-relaxed whitespace-pre-line">
                  {listing.rules}
                </p>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Shared beds block if type = bed */}
        {listing.type === "bed" && listing.beds && (
          <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardBody className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-850 dark:text-slate-100 border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-purple-500 rounded-full" />
                {isRtl ? "الأسرة المتاحة" : "Available Beds"}
              </h2>
              <div className="flex flex-wrap gap-2">
                {listing.beds.map((bed) => (
                  <span
                    key={bed.id}
                    className={`px-3 py-2 rounded-xl text-[10px] font-semibold border flex items-center gap-1.5 ${bed.isAvailable
                        ? "bg-green-50/50 dark:bg-green-955/20 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400"
                        : "bg-red-50/50 dark:bg-red-955/10 border-red-100 dark:border-red-900/20 text-red-500 line-through opacity-60"
                      }`}
                  >
                    <BedDouble size={12} />
                    {isRtl ? `سرير ${bed.bedNumber}` : `Bed ${bed.bedNumber}`}
                  </span>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* 6. Amenities Block */}
        {listing.amenities && listing.amenities.length > 0 && (
          <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardBody className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-850 dark:text-slate-100 border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-[#1B4F8A] rounded-full" />
                {isRtl ? "مميزات العقار والخدمات" : "Amenities & Services"}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {listing.amenities.map((key) => {
                  const cfg = AMENITY_CONFIG[key] ?? { icon: <CheckCircle size={14} />, label: key };
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/50 text-xs font-medium text-slate-850 dark:text-slate-200"
                    >
                      <span className="text-[#1B4F8A] dark:text-[#7BAEE8] shrink-0">{cfg.icon}</span>
                      <span>{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        )}

        {/* 7. Additional Info & Landlord Details Splits (Side-by-side) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Columns A: Additional info */}
          <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardBody className="p-5 space-y-4 font-cairo">
              <h3 className="font-bold text-slate-855 dark:text-slate-100 text-sm border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-2">
                <Info size={14} className="text-[#1B4F8A]" />
                {isRtl ? "معلومات إضافية" : "Additional Info"}
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{isRtl ? "رقم الإعلان" : "Listing ID"}</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-350">#{listing.id.slice(-6).toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{isRtl ? "تاريخ النشر" : "Published Date"}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350">
                    {new Date(listing.createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{isRtl ? "آخر تحديث" : "Last Updated"}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350">
                    {new Date(listing.updatedAt).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{isRtl ? "حالة الإشغال" : "Occupancy"}</span>
                  <span className="font-semibold">
                    {listing.status === "rented" ? (
                      <Badge className="bg-slate-100 text-slate-850 dark:bg-slate-850 dark:text-slate-400 text-[10px]">{isRtl ? "مؤجر" : "Rented"}</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-850 dark:bg-green-955/20 dark:text-green-400 text-[10px]">{isRtl ? "متاح" : "Active"}</Badge>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{isRtl ? "إجمالي المشاهدات" : "Views Count"}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 font-sans">{listing.viewCount ?? listing.views ?? 0}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Columns B: Landlord details - DYNAMIC ONLY */}
          {listing.landlord && (
            <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <CardBody className="p-5 space-y-4 font-cairo">
                <h3 className="font-bold text-slate-855 dark:text-slate-100 text-sm border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-2">
                  <User size={14} className="text-[#1B4F8A]" />
                  {isRtl ? "تفاصيل المؤجر" : "Landlord Details"}
                </h3>
                <div className="flex items-center gap-3">
                  {/* Dynamic photo using actual landlord avatarUrl if present, fallback to initials otherwise */}
                  <Avatar
                    src={listing.landlord.avatarUrl ? getImageUrl(listing.landlord.avatarUrl) : null}
                    name={listing.landlord.name}
                    size="md"
                    verified={listing.isVerified}
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white leading-none text-xs">
                      {listing.landlord.name}
                    </h4>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={10} className="text-amber-400 fill-amber-400" />
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">{avgRating.toFixed(1)}</span>
                      {listing.isVerified && (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-955/20 dark:text-amber-400 text-[8px] px-1.5 py-0.25 font-bold ms-1 flex items-center gap-0.5">
                          <Check size={8} />
                          {isRtl ? "موثق" : "Verified"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-850 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{isRtl ? "عدد الإعلانات" : "Listings"}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 font-sans">{listing.landlord._count?.listings ?? 1}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{isRtl ? "عضو منذ" : "Member Since"}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(listing.landlord.createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* 8. Call to Action request viewing block */}
        <Card className="border border-[#1B4F8A]/10 dark:border-slate-800 rounded-2xl bg-[#1B4F8A]/5 dark:bg-slate-900/30 p-5 text-center space-y-3.5 shadow-sm">
          <h3 className="font-bold text-slate-855 dark:text-slate-100 text-base">
            {isRtl ? "هل تريد معاينة العقار على الواقع؟" : "Want to view this property?"}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs max-w-md mx-auto">
            {isRtl
              ? "قدم طلب معاينة وسيتواصل معك المؤجر لتحديد الموعد المناسب وتأكيده."
              : "Submit a viewing request and the landlord will coordinate to set up a convenient viewing time."}
          </p>

          <div className="max-w-md mx-auto pt-1 space-y-2.5">
            <button
              onClick={() => setRequestModalOpen(true)}
              className="w-full bg-[#1B4F8A] hover:bg-[#153E6D] text-white py-3 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 text-xs"
            >
              <Calendar size={14} />
              {isRtl ? "طلب معاينة العقار" : "Request Viewing"}
            </button>

            {/* Display phone contact detail once request is accepted */}
            {mounted && currentUser ? (
              <div className="pt-1 text-xs">
                {contactAccess?.canViewPhone && contactAccess.phone ? (
                  <a
                    href={`tel:${contactAccess.phone}`}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 font-semibold hover:bg-slate-50 transition-colors text-slate-800 dark:text-slate-200"
                  >
                    <Phone size={14} className="text-[#1B4F8A] dark:text-[#7BAEE8]" />
                    {isRtl ? "اتصال بالمؤجر:" : "Call Landlord:"} {contactAccess.phone}
                  </a>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80 text-[10px] text-slate-400">
                    <Phone size={12} className="text-slate-400" />
                    {isRtl ? "سيتم إتاحة رقم التواصل فور قبول طلب المعاينة الخاص بك." : "Phone number becomes available once your viewing request is accepted."}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={`/${locale}/login?returnUrl=/${locale}/listings/${listing.id}`}
                className="flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-[10px] font-semibold hover:bg-slate-50 transition-colors text-slate-500"
              >
                <UserCheck size={12} />
                {isRtl ? "سجّل دخولك كـمستأجر لعرض بيانات التواصل" : "Log in to view contact details"}
              </Link>
            )}
          </div>
        </Card>

        {/* 9. Reviews Block */}
        <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <CardBody className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-slate-855 dark:text-slate-100 flex items-center gap-2">
                <span className="w-1 h-4 bg-[#1B4F8A] rounded-full" />
                {isRtl ? "تقييمات العقار والمؤجر" : "Reviews & Ratings"}
              </h2>
              {reviews.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <StarRating rating={Math.round(avgRating)} />
                  <span className="text-xs font-bold text-slate-855 dark:text-slate-200 font-sans">{avgRating.toFixed(1)}</span>
                  <span className="text-[10px] text-slate-400 font-medium font-sans">({reviews.length})</span>
                </div>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Star size={24} className="mx-auto mb-2 opacity-30 text-slate-450" />
                <p className="text-xs font-semibold">{isRtl ? "لا توجد تقييمات مكتوبة بعد" : "No reviews written yet."}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="border border-slate-150 dark:border-slate-850 rounded-xl p-4 space-y-2 bg-slate-50/40 dark:bg-slate-900/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#1B4F8A]/10 text-[#1B4F8A] flex items-center justify-center text-xs font-bold">
                        {review.tenant?.name?.[0] ?? "T"}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-855 dark:text-slate-200 leading-tight">
                          {review.tenant?.name ?? (isRtl ? "مستأجر" : "Tenant")}
                        </p>
                        <div className="mt-0.5">
                          <StarRating rating={review.rating} />
                        </div>
                      </div>
                      <span className="ms-auto text-[10px] text-slate-400 font-sans font-medium">
                        {new Date(review.createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed font-medium">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Similar Listings (Suggested) */}
        {suggested.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-855 dark:text-slate-100 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#1B4F8A] rounded-full" />
              {isRtl ? "إعلانات مشابهة قد تعجبك" : "Similar listings you might like"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {suggested.slice(0, 4).map((item) => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 10. Request Viewing Modal */}
      <RequestViewingModal
        listingId={listing.id}
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
      />

      {/* 11. Lightbox full-screen view */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setLightboxOpen(false)}>
          <button
            className="absolute top-4 left-4 text-white p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50"
            onClick={() => setLightboxOpen(false)}
          >
            <X size={20} />
          </button>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50"
            onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
          >
            <ChevronLeft size={24} className={isRtl ? "" : "rotate-180"} />
          </button>

          <img
            src={getImageUrl(displayImages[activeImageIdx])}
            alt={`${listing.title} full view`}
            className="max-w-full max-h-[85vh] object-contain rounded-xl select-none"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50"
            onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
          >
            <ChevronRight size={24} className={isRtl ? "" : "rotate-180"} />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs font-sans">
            {activeImageIdx + 1} / {totalImages}
          </div>
        </div>
      )}
    </main>
  );
}
