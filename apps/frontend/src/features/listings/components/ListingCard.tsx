// apps/frontend/src/features/listings/components/ListingCard.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import {
  Building2,
  Bed,
  Users,
  Sparkles,
  CheckCircle,
  Clock,
  Heart,
  Calendar,
  Phone,
  Shield,
  Star,
  Loader2,
  WashingMachine,
  Wind,
  Wifi,
  ArrowUpDown,
  Zap,
  Droplets,
  Flame,
  BedDouble,
  Home,
  Car,
  Tv,
  Filter,
} from "lucide-react";

import { Modal, Avatar, Badge } from "@/components/ui";
import { getImageUrl, cn } from "@/lib/utils";
import type { Listing } from "@/types";
import { getIdentityVerificationStatus, isUserVerified } from "@/types";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuthStore } from "@/features/auth";
import { useListingContactAccess } from "@/hooks/useRequests";

interface ListingCardProps {
  listing: Listing;
  className?: string;
  rating?: number;
  matchingAlert?: any;
  imageSizes?: string;
}

// ── Smart Amenity Resolver with Locale Support ─────────────────────────────────
const AMENITY_MAP: Record<string, { icon: React.ReactNode; labelAr: string; labelEn: string }> = {
  wifi:            { icon: <Wifi size={13} />, labelAr: "واي فاي / إنترنت", labelEn: "Wi-Fi / Internet" },
  ac:              { icon: <Wind size={13} />, labelAr: "تكييف", labelEn: "Air Conditioning" },
  air_conditioner: { icon: <Wind size={13} />, labelAr: "تكييف", labelEn: "Air Conditioning" },
  air_conditioning: { icon: <Wind size={13} />, labelAr: "تكييف", labelEn: "Air Conditioning" },
  elevator:        { icon: <ArrowUpDown size={13} />, labelAr: "أسانسير", labelEn: "Elevator" },
  lift:            { icon: <ArrowUpDown size={13} />, labelAr: "أسانسير", labelEn: "Elevator" },
  washer:          { icon: <WashingMachine size={13} />, labelAr: "غسالة ملابس", labelEn: "Washing Machine" },
  washing_machine: { icon: <WashingMachine size={13} />, labelAr: "غسالة ملابس", labelEn: "Washing Machine" },
  tv:              { icon: <Tv size={13} />, labelAr: "شاشة تلفزيون", labelEn: "TV" },
  fan:             { icon: <Wind size={13} />, labelAr: "مراوح", labelEn: "Fan" },
  stove:           { icon: <Flame size={13} />, labelAr: "بوتاجاز", labelEn: "Stove" },
  fridge:          { icon: <Zap size={13} />, labelAr: "ثلاجة", labelEn: "Refrigerator" },
  refrigerator:    { icon: <Zap size={13} />, labelAr: "ثلاجة", labelEn: "Refrigerator" },
  water_heater:    { icon: <Droplets size={13} />, labelAr: "سخان مياه", labelEn: "Water Heater" },
  heater:          { icon: <Droplets size={13} />, labelAr: "سخان مياه", labelEn: "Water Heater" },
  water_filter:    { icon: <Filter size={13} />, labelAr: "فلتر مياه", labelEn: "Water Filter" },
  natural_gas:     { icon: <Flame size={13} />, labelAr: "غاز طبيعي", labelEn: "Natural Gas" },
  gas:             { icon: <Flame size={13} />, labelAr: "غاز طبيعي", labelEn: "Natural Gas" },
  furnished:       { icon: <BedDouble size={13} />, labelAr: "مفروش", labelEn: "Furnished" },
  security:        { icon: <Shield size={13} />, labelAr: "أمن وحراسة", labelEn: "Security" },
  balcony:         { icon: <Home size={13} />, labelAr: "بلكونة", labelEn: "Balcony" },
  parking:         { icon: <Car size={13} />, labelAr: "جراج", labelEn: "Parking" },

  "واي فاي / إنترنت": { icon: <Wifi size={13} />, labelAr: "واي فاي / إنترنت", labelEn: "Wi-Fi / Internet" },
  "واي فاي":          { icon: <Wifi size={13} />, labelAr: "واي فاي", labelEn: "Wi-Fi" },
  "إنترنت":          { icon: <Wifi size={13} />, labelAr: "إنترنت", labelEn: "Internet" },
  "تكييف":           { icon: <Wind size={13} />, labelAr: "تكييف", labelEn: "Air Conditioning" },
  "أسانسير":         { icon: <ArrowUpDown size={13} />, labelAr: "أسانسير", labelEn: "Elevator" },
  "غسالة ملابس":     { icon: <WashingMachine size={13} />, labelAr: "غسالة ملابس", labelEn: "Washing Machine" },
  "ثلاجة":           { icon: <Zap size={13} />, labelAr: "ثلاجة", labelEn: "Refrigerator" },
  "سخان مياه":       { icon: <Droplets size={13} />, labelAr: "سخان مياه", labelEn: "Water Heater" },
  "غاز طبيعي":      { icon: <Flame size={13} />, labelAr: "غاز طبيعي", labelEn: "Natural Gas" },
  "أمن وحراسة":      { icon: <Shield size={13} />, labelAr: "أمن وحراسة", labelEn: "Security" },
};

function getAmenityDetails(rawKey: string, isEn: boolean): { icon: React.ReactNode; label: string } {
  if (!rawKey) return { icon: <CheckCircle size={13} />, label: "" };
  const trimmed = rawKey.trim();
  const lower = trimmed.toLowerCase();
  const normalizedKey = lower.replace(/[\s-]+/g, "_");

  const mapped = AMENITY_MAP[trimmed] || AMENITY_MAP[lower] || AMENITY_MAP[normalizedKey];
  if (mapped) return { icon: mapped.icon, label: isEn ? mapped.labelEn : mapped.labelAr };

  return { icon: <CheckCircle size={13} />, label: trimmed };
}

function getUnitTypeLabel(type: string | undefined, isFurnished: boolean | undefined, isEn: boolean): string {
  const t = (type || "").toLowerCase();
  if (isEn) {
    if (t === "apartment") return isFurnished ? "Furnished Apartment" : "Full Apartment";
    if (t === "room") return "Private Room";
    if (t === "bed") return "Shared Bed";
    return "Apartment";
  }
  if (t === "apartment") return isFurnished ? "شقة مفروشة" : "شقة كاملة";
  if (t === "room") return "غرفة خاصة";
  if (t === "bed") return "سرير مشترك";
  return "شقة";
}

function getGenderTargetLabel(target: string | undefined, isEn: boolean): string {
  const g = (target || "").toLowerCase();
  if (isEn) {
    if (g === "males_only" || g === "male" || g === "males") return "Males Only";
    if (g === "females_only" || g === "female" || g === "females") return "Females Only";
    if (g === "families" || g === "family") return "Families Only";
    if (g === "mixed") return "Mixed";
    return "All";
  }
  if (g === "males_only" || g === "male" || g === "males") return "شباب فقط";
  if (g === "females_only" || g === "female" || g === "females") return "بنات فقط";
  if (g === "families" || g === "family") return "عائلات فقط";
  if (g === "mixed") return "شباب أو بنات";
  return "الجميع";
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  className,
  rating,
  matchingAlert,
  imageSizes = "(max-width: 768px) 100vw, 400px",
}) => {
  const locale = useLocale();
  const isEn = locale === "en";
  const [showPreview, setShowPreview] = useState(false);

  const isBedListing = listing.unitType === "bed" || listing.type === "bed";

  // Bed stats: only bed listings carry bed availability. Clamp the display as
  // a defensive guard while the backend keeps the stored counter in sync.
  const totalBeds = listing.totalBeds ?? (listing.beds ? listing.beds.length : 0);
  const rawAvailableBedsCount = listing.availableBeds ?? (
    listing.beds ? listing.beds.filter((b) => b.isAvailable || (b as any).status === "available").length : 0
  );
  const availableBedsCount = Math.min(Math.max(0, rawAvailableBedsCount), totalBeds);
  const bookedBedsCount = Math.max(0, totalBeds - availableBedsCount);

  const formattedPrice = new Intl.NumberFormat(isEn ? "en-US" : "ar-EG").format(listing.price);

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
              sizes={imageSizes}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              <Building2 size={48} />
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

          {/* Top Badges Overlay — Start Side */}
          <div className="absolute start-2.5 top-2.5 flex flex-col gap-1.5 items-start z-10">
            <Badge className="bg-[#1B4F8A]/90 backdrop-blur-md text-white border-none font-bold text-[11px] px-2.5 py-0.5 shadow-md flex items-center gap-1">
              {isBedListing ? <Bed size={12} /> : <Building2 size={12} />}
              <span>{getUnitTypeLabel(listing.unitType || listing.type, listing.isFurnished, isEn)}</span>
            </Badge>

            {listing.genderTarget && (
              <Badge className="bg-slate-900/80 backdrop-blur-md text-white border border-slate-700/50 font-bold text-[11px] px-2 py-0.5 shadow-md flex items-center gap-1">
                <Users size={11} />
                <span>{getGenderTargetLabel(listing.genderTarget, isEn)}</span>
              </Badge>
            )}

            {matchingAlert && (
              <Badge className="bg-amber-500 text-white gap-1 shadow-md border-none font-bold animate-pulse text-[10px] px-2 py-0.5">
                <Sparkles size={10} className="animate-spin text-white" style={{ animationDuration: "3s" }} />
                {isEn ? "Smart Match" : "تطابق ذكي"}
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
                    {isEn ? "Verified" : "موثق"}
                  </Badge>
                );
              }
              if (status === "pending") {
                return (
                  <Badge className="bg-amber-500 backdrop-blur-md text-white gap-1 font-bold text-[10px] px-2 py-0.5 shadow-md">
                    <Clock size={11} />
                    {isEn ? "Pending" : "قيد المراجعة"}
                  </Badge>
                );
              }
              return null;
            })()}

            {listing.isFeatured && (
              <Badge variant="gold" className="gap-1 backdrop-blur-md font-bold text-[10px] px-2 py-0.5 shadow-md">
                <Sparkles size={11} />
                {isEn ? "Featured" : "مميز"}
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
            aria-label={isEn ? "Add to wishlist" : "إضافة للمفضلة"}
          >
            <Heart size={17} className={isFavorite ? "fill-rose-500 text-rose-500" : ""} />
          </button>
        </div>

        {/* ── Body Container ── */}
        <div className="flex flex-1 flex-col p-4 gap-2.5">
          {/* Price Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-primary">
                {formattedPrice}
              </span>
              <span className="text-xs font-bold text-text-secondary">
                {isEn ? "EGP / mo" : "ج.م / شهري"}
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-text line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {listing.title}
          </h3>

          {/* Bed availability is meaningful only for bed listings. */}
          {isBedListing && (
            <div className="grid grid-cols-3 gap-0.5 py-2 px-1.5 rounded-xl bg-surface-secondary border border-border w-full">
              <div className="flex items-center justify-center gap-1 text-center w-full px-1">
                <BedDouble size={13} className="text-primary shrink-0" />
                <span className="text-xs font-bold text-text truncate">
                  {totalBeds > 0
                    ? isEn ? `${totalBeds} Beds` : `${totalBeds} أسِرّة`
                    : (isEn ? "1 Bed" : "1 سرير")}
                </span>
              </div>

              <div className="flex items-center justify-center gap-1 text-center border-r border-l border-border w-full px-1">
                <span className="h-2 w-2 rounded-full bg-status-success shrink-0" />
                <span className="text-xs font-bold text-status-success truncate">
                  {availableBedsCount} {isEn ? "Avail" : "متاح"}
                </span>
              </div>

              <div className="flex items-center justify-center gap-1 text-center w-full px-1">
                <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                <span className="text-xs font-bold text-rose-700 truncate">
                  {bookedBedsCount} {isEn ? "Booked" : "محجوز"}
                </span>
              </div>
            </div>
          )}

          {/* Amenities Chips */}
          {listing.amenities && listing.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {listing.amenities.slice(0, 3).map((rawKey) => {
                const { icon, label } = getAmenityDetails(rawKey, isEn);
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
                  +{listing.amenities.length - 3} {isEn ? "more" : "المزيد"}
                </span>
              )}
            </div>
          )}

          <div className="flex-1" />

          {/* Landlord Row */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 min-h-[40px]">
            {listing.landlord ? (
              <button
                type="button"
                onClick={handleLandlordClick}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0"
                title={isEn ? "View landlord info" : "عرض معلومات المعلن"}
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
        <div className="px-3 pb-3">
          <div className="flex w-full items-center justify-center rounded-xl bg-primary hover:bg-primary-dark text-white font-bold px-3 py-2 text-xs sm:text-sm transition-all shadow-sm">
            <span>{isEn ? "View Details" : "عرض التفاصيل"}</span>
          </div>
        </div>
      </Link>

      {/* Preview Modal */}
      {listing.landlord && (
        <Modal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title={isEn ? "Landlord Profile Preview" : "معاينة الحساب الشخصي للمعلن"}
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
                        <span>{isEn ? "Identity Verified" : "موثق الهوية"}</span>
                      </Badge>
                    );
                  }
                  if (status === "pending") {
                    return (
                      <Badge className="bg-amber-500 text-white font-bold text-xs flex items-center gap-1 rounded-full px-2.5 py-0.5">
                        <Clock size={12} />
                        <span>{isEn ? "Pending Review" : "قيد مراجعة الهوية"}</span>
                      </Badge>
                    );
                  }
                  return (
                    <Badge className="bg-slate-100 text-slate-500 font-bold text-xs rounded-full px-2.5 py-0.5">
                      {isEn ? "Not Verified" : "لم يوثق الهوية"}
                    </Badge>
                  );
                })()}
              </div>
            </div>

            <div className="w-full border-t border-slate-100 pt-4 grid grid-cols-2 gap-4 text-start">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">{isEn ? "Member Since" : "عضو منذ"}</span>
                <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Calendar size={14} className="text-slate-400" />
                  {new Date(listing.landlord.createdAt).toLocaleDateString(isEn ? "en-US" : "ar-EG", { year: "numeric", month: "long" })}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">{isEn ? "Listings Count" : "عدد الإعلانات"}</span>
                <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Building2 size={14} className="text-slate-400" />
                  {listing.landlord._count?.listings ?? 1} {isEn ? "Listings" : "إعلان"}
                </span>
              </div>
            </div>

            {isLoadingContact ? (
              <div className="w-full border-t border-slate-100 pt-4 flex justify-center py-4">
                <Loader2 className="animate-spin text-[#1B4F8A]" size={24} />
              </div>
            ) : !currentUser ? (
              <div className="w-full border-t border-slate-100 pt-4 text-xs text-rose-500 font-bold leading-relaxed px-4 py-2 bg-rose-50 rounded-xl border border-rose-200">
                {isEn
                  ? "You must log in as a Tenant and request a viewing to contact the landlord."
                  : "لا يمكن التواصل مع المعلن إلا بعد تسجيل الدخول كـ (مستأجر) وتقديم طلب معاينة ويقوم المؤجر بقبوله."}
              </div>
            ) : currentUser.role !== "tenant" ? (
              <div className="w-full border-t border-slate-100 pt-4 text-xs text-rose-500 font-bold leading-relaxed px-4 py-2 bg-rose-50 rounded-xl border border-rose-200">
                {isEn
                  ? "Log in as a tenant to request viewings and contact landlords."
                  : "يجب أن تسجل دخولك بصفة (مستأجر) لتتمكن من تقديم طلبات المعاينة والتواصل مع المعلنين."}
              </div>
            ) : contactAccess?.canViewPhone && contactAccess.phone ? (
              <div className="w-full border-t border-slate-100 pt-4 flex flex-col gap-2">
                <a
                  href={`tel:${contactAccess.phone}`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-[#1B4F8A] text-white hover:bg-[#153e6d] transition-all shadow-md"
                >
                  <Phone size={16} /> {isEn ? "Call Landlord" : "اتصل بالمعلن"}
                </a>
              </div>
            ) : (
              <div className="w-full border-t border-slate-100 pt-4 text-xs text-amber-600 font-bold leading-relaxed px-4 py-3 bg-amber-50 rounded-xl border border-amber-200/50">
                {isEn
                  ? "Contact details will be unlocked once your viewing request is accepted by the landlord."
                  : "لا يمكن التواصل مع المعلن إلا بعد قبول طلب المعاينة الخاص بك من قبل المؤجر."}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

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
