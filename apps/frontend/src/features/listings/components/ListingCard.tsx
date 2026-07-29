// apps/frontend/src/components/listings/ListingCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  MapPin,
  Star,
  Wifi,
  Wind,
  Building2,
  BedDouble,
  ArrowLeft,
  ArrowRight,
  Heart,
  CheckCircle,
  Sparkles,
  Clock,
  Calendar,
  MessageSquare,
  Phone,
  Loader2,
  WashingMachine,
  Tv,
  Flame,
  Droplets,
  Filter,
  Shield,
  Home,
  Car,
  ArrowUpDown,
  Zap,
  Bed,
  Users,
} from "lucide-react";
import type { Listing, Alert } from "@/types";
import { getIdentityVerificationStatus, isUserVerified } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import Image from "next/image";
import { cn, getImageUrl } from "@/lib/utils";
import { getFurnishingLabel } from "@/lib/helpers";
import { useWishlist } from "@/hooks/useWishlist";
import { getWhatsAppLink } from "@/lib/whatsapp";
import { useAuthStore } from "@/features/auth";
// eslint-disable-next-line import/no-named-as-default-member
import { useListingContactAccess } from "@/hooks/useRequests";

interface ListingCardProps {
  listing: Listing;
  className?: string;
  rating?: number;
  matchingAlert?: Alert | null;
}

// ── Smart Amenity Resolver ──────────────────────────────────────────────────
const AMENITY_MAP: Record<string, { icon: React.ReactNode; labelAr: string }> = {
  wifi:            { icon: <Wifi size={13} />, labelAr: "واي فاي / إنترنت" },
  ac:              { icon: <Wind size={13} />, labelAr: "تكييف" },
  air_conditioner: { icon: <Wind size={13} />, labelAr: "تكييف" },
  elevator:        { icon: <ArrowUpDown size={13} />, labelAr: "أسانسير" },
  lift:            { icon: <ArrowUpDown size={13} />, labelAr: "أسانسير" },
  washer:          { icon: <WashingMachine size={13} />, labelAr: "غسالة ملابس" },
  washing_machine: { icon: <WashingMachine size={13} />, labelAr: "غسالة ملابس" },
  tv:              { icon: <Tv size={13} />, labelAr: "شاشة تلفزيون" },
  fan:             { icon: <Wind size={13} />, labelAr: "مراوح" },
  stove:           { icon: <Flame size={13} />, labelAr: "بوتاجاز" },
  fridge:          { icon: <Zap size={13} />, labelAr: "ثلاجة" },
  refrigerator:    { icon: <Zap size={13} />, labelAr: "ثلاجة" },
  water_heater:    { icon: <Droplets size={13} />, labelAr: "سخان مياه" },
  heater:          { icon: <Droplets size={13} />, labelAr: "سخان مياه" },
  water_filter:    { icon: <Filter size={13} />, labelAr: "فلتر مياه" },
  natural_gas:     { icon: <Flame size={13} />, labelAr: "غاز طبيعي" },
  gas:             { icon: <Flame size={13} />, labelAr: "غاز طبيعي" },
  furnished:       { icon: <BedDouble size={13} />, labelAr: "مفروش" },
  security:        { icon: <Shield size={13} />, labelAr: "أمن وحراسة" },
  balcony:         { icon: <Home size={13} />, labelAr: "بلكونة" },
  parking:         { icon: <Car size={13} />, labelAr: "جراج" },

  "واي فاي / إنترنت": { icon: <Wifi size={13} />, labelAr: "واي فاي / إنترنت" },
  "واي فاي":          { icon: <Wifi size={13} />, labelAr: "واي فاي" },
  "إنترنت":          { icon: <Wifi size={13} />, labelAr: "إنترنت" },
  "تكييف":           { icon: <Wind size={13} />, labelAr: "تكييف" },
  "أسانسير":         { icon: <ArrowUpDown size={13} />, labelAr: "أسانسير" },
  "غسالة ملابس":     { icon: <WashingMachine size={13} />, labelAr: "غسالة ملابس" },
  "غسالة":           { icon: <WashingMachine size={13} />, labelAr: "غسالة" },
  "شاشة تلفزيون":    { icon: <Tv size={13} />, labelAr: "شاشة تلفزيون" },
  "تلفزيون":         { icon: <Tv size={13} />, labelAr: "تلفزيون" },
  "ثلاجة":           { icon: <Zap size={13} />, labelAr: "ثلاجة" },
  "سخان مياه":       { icon: <Droplets size={13} />, labelAr: "سخان مياه" },
  "سخان":            { icon: <Droplets size={13} />, labelAr: "سخان" },
  "غاز طبيعي":      { icon: <Flame size={13} />, labelAr: "غاز طبيعي" },
  "أمن وحراسة":      { icon: <Shield size={13} />, labelAr: "أمن وحراسة" },
  "أمن":             { icon: <Shield size={13} />, labelAr: "أمن" },
  "بوتاجاز":         { icon: <Flame size={13} />, labelAr: "بوتاجاز" },
  "مراوح":           { icon: <Wind size={13} />, labelAr: "مراوح" },
};

function getAmenityDetails(rawKey: string): { icon: React.ReactNode; label: string } {
  if (!rawKey) return { icon: <CheckCircle size={13} />, label: "" };
  const trimmed = rawKey.trim();
  const lower = trimmed.toLowerCase();

  if (AMENITY_MAP[trimmed]) return { icon: AMENITY_MAP[trimmed].icon, label: AMENITY_MAP[trimmed].labelAr };
  if (AMENITY_MAP[lower]) return { icon: AMENITY_MAP[lower].icon, label: AMENITY_MAP[lower].labelAr };

  if (lower.includes("غسالة") || lower.includes("غساله")) return { icon: <WashingMachine size={13} />, label: trimmed };
  if (lower.includes("تكييف") || lower.includes("مكيف")) return { icon: <Wind size={13} />, label: trimmed };
  if (lower.includes("واي") || lower.includes("انترنت") || lower.includes("إنترنت") || lower.includes("wifi")) return { icon: <Wifi size={13} />, label: trimmed };
  if (lower.includes("اسانسير") || lower.includes("أسانسير") || lower.includes("مصعد")) return { icon: <ArrowUpDown size={13} />, label: trimmed };
  if (lower.includes("ثلاجة") || lower.includes("ثلاجه")) return { icon: <Zap size={13} />, label: trimmed };
  if (lower.includes("سخان")) return { icon: <Droplets size={13} />, label: trimmed };
  if (lower.includes("غاز")) return { icon: <Flame size={13} />, label: trimmed };
  if (lower.includes("بوتاجاز") || lower.includes("بوطاجاز")) return { icon: <Flame size={13} />, label: trimmed };
  if (lower.includes("تلفزيون") || lower.includes("شاشة") || lower.includes("شاشه")) return { icon: <Tv size={13} />, label: trimmed };
  if (lower.includes("امن") || lower.includes("أمن") || lower.includes("حراسة")) return { icon: <Shield size={13} />, label: trimmed };

  return { icon: <CheckCircle size={13} />, label: trimmed };
}

const GENDER_TARGET_LABELS: Record<string, string> = {
  male: "شباب فقط",
  female: "بنات فقط",
  mixed: "شباب أو بنات",
  family: "عائلات فقط",
  any: "الجميع",
};

const UNIT_TYPE_LABELS: Record<string, string> = {
  apartment: "شقة كاملة",
  bed: "سرير مشترك",
};

export const ListingCard: React.FC<ListingCardProps> = ({ listing, className, rating, matchingAlert }) => {
  const locale = useLocale();
  const ArrowIcon = locale === "ar" ? ArrowLeft : ArrowRight;
  const [showPreview, setShowPreview] = React.useState(false);

  // Bed stats
  const totalBeds = listing.totalBeds ?? (listing.beds ? listing.beds.length : 0);
  const availableBedsCount = listing.availableBeds ?? (
    listing.beds ? listing.beds.filter((b) => b.isAvailable || (b as any).status === "available").length : 0
  );
  const bookedBedsCount = Math.max(0, totalBeds - availableBedsCount);

  const formattedPrice = new Intl.NumberFormat("ar-EG").format(listing.price);
  const isBedListing = listing.unitType === "bed" || listing.type === "bed";

  // Favorite / Wishlist
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isFavorite = isInWishlist(listing.id);

  // Auth & Contact access
  const { user: currentUser } = useAuthStore();
  const { data: contactAccess, isLoading: isLoadingContact } = useListingContactAccess(
    listing.id,
    showPreview && currentUser?.role === "tenant"
  );

  const handleLandlordClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPreview(true);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(listing.id);
  };

  return (
    <>
      <Link
        href={`/${locale}/listings/${listing.id}`}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer font-cairo",
          className
        )}
      >
        {/* ── Top Image Container ── */}
        <div className="relative h-[200px] overflow-hidden bg-slate-100 shrink-0">
          {listing.images && listing.images.length > 0 ? (
            <Image
              src={getImageUrl(listing.images[0])}
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              <Building2 size={48} />
            </div>
          )}

          {/* Dark Overlay gradient for crisp text overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

          {/* Top Badges Overlay — Start Side */}
          <div className="absolute start-2.5 top-2.5 flex flex-col gap-1.5 items-start z-10">
            <Badge className="bg-[#1B4F8A]/90 backdrop-blur-md text-white border-none font-bold text-[11px] px-2.5 py-0.5 shadow-md flex items-center gap-1">
              {isBedListing ? <Bed size={12} /> : <Building2 size={12} />}
              <span>{UNIT_TYPE_LABELS[listing.unitType || listing.type] || getFurnishingLabel(listing.unitType || listing.type, listing.isFurnished)}</span>
            </Badge>

            {listing.genderTarget && (
              <Badge className="bg-slate-900/80 backdrop-blur-md text-white border border-slate-700/50 font-bold text-[11px] px-2 py-0.5 shadow-md flex items-center gap-1">
                <Users size={11} />
                <span>{GENDER_TARGET_LABELS[listing.genderTarget] || listing.genderTarget}</span>
              </Badge>
            )}

            {matchingAlert && (
              <Badge className="bg-amber-500 text-white gap-1 shadow-md border-none font-bold animate-pulse text-[10px] px-2 py-0.5">
                <Sparkles size={10} className="animate-spin text-white" style={{ animationDuration: "3s" }} />
                تطابق ذكي
              </Badge>
            )}
          </div>

          {/* Top Badges Overlay — End Side */}
          <div className="absolute end-2.5 top-2.5 flex flex-col gap-1.5 items-end z-10">
            {listing.landlord && (() => {
              const status = getIdentityVerificationStatus(listing.landlord);
              if (status === "verified") {
                return (
                  <Badge variant="success" className="gap-1 backdrop-blur-md bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 shadow-md">
                    <CheckCircle size={11} />
                    موثق
                  </Badge>
                );
              }
              if (status === "pending") {
                return (
                  <Badge className="bg-amber-500 backdrop-blur-md text-white gap-1 font-bold text-[10px] px-2 py-0.5 shadow-md">
                    <Clock size={11} />
                    قيد المراجعة
                  </Badge>
                );
              }
              return null;
            })()}

            {listing.isFeatured && (
              <Badge variant="gold" className="gap-1 backdrop-blur-md font-bold text-[10px] px-2 py-0.5 shadow-md">
                <Sparkles size={11} />
                مميز
              </Badge>
            )}
          </div>

          {/* Heart / Wishlist Button */}
          <button
            onClick={handleWishlistClick}
            className={cn(
              "absolute bottom-2.5 end-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-md transition-all duration-200 shadow-md hover:scale-110 z-10",
              isFavorite ? "text-rose-500" : "text-slate-500 hover:text-rose-500"
            )}
            aria-label="إضافة للمفضلة"
          >
            <Heart size={17} className={isFavorite ? "fill-rose-500 text-rose-500" : ""} />
          </button>
        </div>

        {/* ── Body Container ── */}
        <div className="flex flex-1 flex-col p-4 gap-2.5">
          {/* Price & Location Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#1B4F8A]">
                {formattedPrice}
              </span>
              <span className="text-xs font-bold text-slate-500">
                ج.م / شهري
              </span>
            </div>

            <div className="flex items-center gap-1 text-slate-500 max-w-[50%]">
              <MapPin size={13} className="shrink-0 text-[#1B4F8A]" />
              <span className="text-xs font-semibold truncate">
                {listing.district || listing.city || listing.governorate}
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-[#1B4F8A] transition-colors">
            {listing.title}
          </h3>

          {/* ── Clean Compact Beds Stats Box (No extra sub-labels) ── */}
          <div className="grid grid-cols-3 gap-1 py-2 px-3 rounded-xl bg-slate-50 border border-slate-200/80">
            {/* Total Beds */}
            <div className="flex items-center justify-center gap-1.5 text-center">
              <BedDouble size={14} className="text-[#1B4F8A] shrink-0" />
              <span className="text-xs font-bold text-slate-800">
                {totalBeds > 0 ? `${totalBeds} أسِرّة` : (isBedListing ? "1 سرير" : "شقة")}
              </span>
            </div>

            {/* Available Beds */}
            <div className="flex items-center justify-center gap-1 text-center border-r border-l border-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs font-bold text-emerald-700">
                {availableBedsCount} متاح
              </span>
            </div>

            {/* Booked Beds */}
            <div className="flex items-center justify-center gap-1 text-center">
              <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
              <span className="text-xs font-bold text-rose-700">
                {bookedBedsCount} محجوز
              </span>
            </div>
          </div>

          {/* ── Direct Amenities Chips (Directly shown without toggle title) ── */}
          {listing.amenities && listing.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {listing.amenities.slice(0, 3).map((rawKey) => {
                const { icon, label } = getAmenityDetails(rawKey);
                return (
                  <span
                    key={rawKey}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200/80 rounded-lg px-2 py-0.5"
                  >
                    <span className="text-[#1B4F8A]">{icon}</span>
                    <span className="truncate max-w-[110px]">{label}</span>
                  </span>
                );
              })}
              {listing.amenities.length > 3 && (
                <span className="text-[11px] font-bold text-[#1B4F8A] bg-[#1B4F8A]/5 border border-[#1B4F8A]/20 rounded-lg px-2 py-0.5">
                  +{listing.amenities.length - 3} المزيد
                </span>
              )}
            </div>
          )}

          <div className="flex-1" />

          {/* ── Landlord & Rating Row ── */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 min-h-[40px]">
            {listing.landlord ? (
              <button
                type="button"
                onClick={handleLandlordClick}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0"
                title="عرض معلومات المعلن"
              >
                <Avatar
                  src={listing.landlord.avatarUrl || null}
                  name={listing.landlord.name}
                  size="sm"
                  verified={isUserVerified(listing.landlord)}
                />
                <span className="text-xs font-bold text-slate-700 truncate max-w-[110px]">
                  {listing.landlord.name}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-slate-100 shrink-0" />
                <span className="text-xs text-slate-400">—</span>
              </div>
            )}

            {rating !== undefined && (
              <div className="flex items-center gap-1" style={{ direction: "ltr" }}>
                <Star size={13} className="text-amber-500 fill-amber-500" />
                <span className="text-xs font-bold text-slate-700">
                  {rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Unified Sakani Primary CTA Button ── */}
        <div className="px-4 pb-4">
          <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B4F8A] hover:bg-[#153e6d] text-white font-bold px-4 py-2.5 text-sm transition-all duration-200 shadow-md">
            <span>عرض التفاصيل</span>
            <span style={{ direction: "ltr" }}>
              <ArrowIcon size={16} className="transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>

      {/* ── Landlord Profile Preview Modal ── */}
      {listing.landlord && (
        <Modal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title="معاينة الحساب الشخصي للمعلن"
        >
          <div className="flex flex-col items-center text-center p-4 space-y-6 font-cairo">
            <Avatar
              src={listing.landlord.avatarUrl || null}
              name={listing.landlord.name}
              size="lg"
              verified={isUserVerified(listing.landlord)}
            />

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5 justify-center">
                {listing.landlord.name}
                {isUserVerified(listing.landlord) && (
                  <CheckCircle className="text-[#1B4F8A] fill-[#1B4F8A] shrink-0" size={18} />
                )}
              </h3>

              <div className="flex justify-center pt-1">
                {(() => {
                  const status = getIdentityVerificationStatus(listing.landlord);
                  if (status === "verified") {
                    return (
                      <Badge className="bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 rounded-full px-2.5 py-0.5">
                        <CheckCircle size={12} />
                        <span>موثق الهوية</span>
                      </Badge>
                    );
                  }
                  if (status === "pending") {
                    return (
                      <Badge className="bg-amber-500 text-white font-bold text-xs flex items-center gap-1 rounded-full px-2.5 py-0.5">
                        <Clock size={12} />
                        <span>قيد مراجعة الهوية</span>
                      </Badge>
                    );
                  }
                  return (
                    <Badge className="bg-slate-100 text-slate-500 font-bold text-xs rounded-full px-2.5 py-0.5">
                      لم يوثق الهوية
                    </Badge>
                  );
                })()}
              </div>
            </div>

            <div className="w-full border-t border-slate-100 pt-4 grid grid-cols-2 gap-4 text-start">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">عضو منذ</span>
                <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Calendar size={14} className="text-slate-400" />
                  {new Date(listing.landlord.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long" })}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">عدد الإعلانات</span>
                <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Building2 size={14} className="text-slate-400" />
                  {listing.landlord._count?.listings ?? 1} إعلان
                </span>
              </div>
            </div>

            {isLoadingContact ? (
              <div className="w-full border-t border-slate-100 pt-4 flex justify-center py-4">
                <Loader2 className="animate-spin text-[#1B4F8A]" size={24} />
              </div>
            ) : !currentUser ? (
              <div className="w-full border-t border-slate-100 pt-4 text-xs text-rose-500 font-bold leading-relaxed px-4 py-2 bg-rose-50 rounded-xl border border-rose-200">
                لا يمكن التواصل مع المعلن إلا بعد تسجيل الدخول كـ (مستأجر) وتقديم طلب معاينة ويقوم المؤجر بقبوله.
              </div>
            ) : currentUser.role !== "tenant" ? (
              <div className="w-full border-t border-slate-100 pt-4 text-xs text-rose-500 font-bold leading-relaxed px-4 py-2 bg-rose-50 rounded-xl border border-rose-200">
                يجب أن تسجل دخولك بصفة (مستأجر) لتتمكن من تقديم طلبات المعاينة والتواصل مع المعلنين.
              </div>
            ) : contactAccess?.canViewPhone && contactAccess.phone ? (
              <div className="w-full border-t border-slate-100 pt-4 flex flex-col gap-2">
                <a
                  href={`tel:${contactAccess.phone}`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-[#1B4F8A] text-white hover:bg-[#153e6d] transition-all shadow-md"
                >
                  <Phone size={16} /> اتصل بالمعلن
                </a>
                <a
                  href={getWhatsAppLink(contactAccess.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-md"
                >
                  <MessageSquare size={16} /> مراسلة عبر واتساب
                </a>
              </div>
            ) : (
              <div className="w-full border-t border-slate-100 pt-4 text-xs text-amber-600 font-bold leading-relaxed px-4 py-3 bg-amber-50 rounded-xl border border-amber-200/50">
                لا يمكن التواصل مع المعلن إلا بعد قبول طلب المعاينة الخاص بك من قبل المؤجر.
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
export const ListingCardSkeleton: React.FC = () => (
  <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white animate-pulse">
    <div className="h-[200px] bg-slate-200 shrink-0" />
    <div className="p-4 space-y-3 flex-1">
      <div className="h-4 w-24 rounded bg-slate-200" />
      <div className="h-5 w-3/4 rounded bg-slate-200" />
      <div className="h-8 w-full rounded-xl bg-slate-200" />
      <div className="flex gap-2">
        <div className="h-6 w-20 rounded bg-slate-200" />
        <div className="h-6 w-20 rounded bg-slate-200" />
      </div>
    </div>
    <div className="px-4 pb-4">
      <div className="h-10 w-full rounded-xl bg-slate-200" />
    </div>
  </div>
);


