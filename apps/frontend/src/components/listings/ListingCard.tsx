// apps/frontend/src/components/listings/ListingCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { MapPin, Star, Wifi, Wind, Building2, BedDouble, ArrowLeft, ArrowRight, Heart, CheckCircle, Sparkles, Clock, AlertCircle, Calendar, MessageSquare, Phone, Loader2 } from "lucide-react";
import type { Listing } from "@/types";
import { getIdentityVerificationStatus, isUserVerified } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { cn, getImageUrl } from "@/lib/utils";
import { useWishlist } from "@/hooks/useWishlist";
import { getWhatsAppLink } from "@/lib/whatsapp";
import { useAuthStore } from "@/store/auth.store";
// eslint-disable-next-line import/no-named-as-default-member
import { useListingContactAccess } from "@/hooks/useRequests";


interface ListingCardProps {
  listing: Listing;
  className?: string;
  rating?: number;
  matchingAlert?: any;
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi size={14} />,
  ac: <Wind size={14} />,
  elevator: <Building2 size={14} />,
  furnished: <BedDouble size={14} />,
};

const AMENITY_LABELS: Record<string, string> = {
  wifi: "واي فاي",
  ac: "تكييف",
  elevator: "أسانسير",
  furnished: "مفروش",
};

const TYPE_LABELS: Record<string, string> = {
  apartment: "شقة",
  bed: "سرير",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger"> = {
  available: "success",
  pending: "warning",
  rented: "danger",
};

const STATUS_LABELS: Record<string, string> = {
  available: "متاح",
  pending: "قيد المراجعة",
  rented: "مؤجر",
};

export const ListingCard: React.FC<ListingCardProps> = ({ listing, className, rating, matchingAlert }) => {
  const locale = useLocale();
  const router = useRouter();
  const ArrowIcon = locale === "ar" ? ArrowLeft : ArrowRight;
  const [showPreview, setShowPreview] = React.useState(false);

  const availableBeds = listing.beds
    ? listing.beds.filter((b) => b.isAvailable).length
    : null;

  const formattedPrice = new Intl.NumberFormat("ar-EG").format(listing.price);

  // Favorite / Wishlist
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isFavorite = isInWishlist(listing.id);

  // Auth & Contact access via React Query
  const { user: currentUser } = useAuthStore();
  const { data: contactAccess, isLoading: isLoadingContact } = useListingContactAccess(
    listing.id,
    showPreview && currentUser?.role === "tenant"
  );

  return (
    <div
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("button") || target.closest(".cursor-pointer")) {
          return;
        }
        router.push(`/${locale}/listings/${listing.id}`);
      }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer",
        className
      )}
    >
      {/* Image */}
      <div className="relative h-[200px] overflow-hidden bg-gray-100 dark:bg-gray-800">
        {listing.images && listing.images.length > 0 ? (
          <img
            src={getImageUrl(listing.images[0])}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <Building2 size={48} />
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute start-2 top-2 flex flex-col gap-1.5 items-start">
          <Badge variant="default" className="bg-white/90 text-gray-800 backdrop-blur-sm dark:bg-gray-900/90 dark:text-gray-100 font-bold font-cairo">
            {TYPE_LABELS[listing.type]}
          </Badge>
          <Badge variant={STATUS_VARIANT[listing.status]} className="font-bold font-cairo">
            {STATUS_LABELS[listing.status]}
          </Badge>
          {matchingAlert && (
            <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white gap-1 shadow-md border-none font-bold animate-pulse font-cairo text-[10px] px-2 py-0.5">
              <Sparkles size={10} className="animate-spin text-amber-300" style={{ animationDuration: '3s' }} />
              تطابق ذكي
            </Badge>
          )}
        </div>

        <div className="absolute end-2 top-2 flex flex-col gap-1.5">
          {listing.landlord && (() => {
            const status = getIdentityVerificationStatus(listing.landlord);
            if (status === 'verified') {
              return (
                <Badge variant="success" className="gap-1">
                  <CheckCircle size={11} />
                  موثق
                </Badge>
              );
            }
            if (status === 'pending') {
              return (
                <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1">
                  <Clock size={11} />
                  قيد المراجعة
                </Badge>
              );
            }
            if (status === 'rejected') {
              return (
                <Badge className="bg-red-500 hover:bg-red-600 text-white gap-1">
                  <AlertCircle size={11} />
                  مرفوض
                </Badge>
              );
            }
            return (
              <Badge variant="default" className="gap-1 bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 border-none dark:bg-gray-800 dark:text-gray-400">
                غير موثق
              </Badge>
            );
          })()}
          {listing.isFeatured && (
            <Badge variant="gold" className="gap-1">
              <Sparkles size={11} />
              مميز
            </Badge>
          )}
        </div>

        {/* Favorite */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(listing.id);
          }}
          className={cn(
            "absolute bottom-2 end-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm transition-colors shadow-sm",
            isFavorite ? "text-red-500 hover:text-red-600" : "text-gray-500 hover:text-red-500"
          )}
          aria-label="Add to favourites"
        >
          <Heart size={16} className={isFavorite ? "fill-red-500 text-red-500" : ""} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 gap-3">
        {/* Location */}
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          <span style={{ direction: "ltr" }}>
            <MapPin size={14} className="shrink-0 text-gold" />
          </span>
          <span className="text-xs truncate">
            {listing.district}، {listing.city}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-cairo text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
          {listing.title}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-primary dark:text-blue-400">
            {formattedPrice}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            جنيه/شهر
          </span>
        </div>

        {/* Beds available */}
        {listing.type === "bed" && availableBeds !== null && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {availableBeds} {availableBeds === 1 ? "سرير متاح" : "أسرة متاحة"}
          </p>
        )}

        {/* Amenities */}
        {listing.amenities && listing.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {listing.amenities.slice(0, 4).map((amenity) => (
              <span
                key={amenity}
                className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-md px-2 py-1"
                style={{ direction: "ltr" }}
              >
                {AMENITY_ICONS[amenity] ?? null}
                <span>{AMENITY_LABELS[amenity] ?? amenity}</span>
              </span>
            ))}
          </div>
        )}

        {/* Landlord + Rating */}
        {listing.landlord && (
          <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity" onClick={(e) => {
              e.stopPropagation();
              setShowPreview(true);
            }}>
              <Avatar
                src={listing.landlord.avatarUrl || null}
                name={listing.landlord.name}
                size="sm"
                verified={isUserVerified(listing.landlord)}
              />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[90px] hover:text-primary transition-colors">
                {listing.landlord.name}
              </span>
            </div>
            {rating !== undefined && (
              <div className="flex items-center gap-1" style={{ direction: "ltr" }}>
                <Star size={13} className="text-gold fill-gold" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer action */}
      <div className="px-4 pb-4 hidden sm:block">
        <Link
          href={`/${locale}/listings/${listing.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 text-primary dark:text-blue-400 px-4 py-2.5 text-sm font-semibold transition-colors"
        >
          عرض التفاصيل
          <span style={{ direction: "ltr" }}>
            <ArrowIcon size={16} />
          </span>
        </Link>
      </div>

      {/* Landlord Profile Preview Modal */}
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
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5 justify-center">
                {listing.landlord.name}
                {isUserVerified(listing.landlord) && (
                  <CheckCircle className="text-blue-500 fill-blue-500 dark:text-blue-400 dark:fill-blue-400 shrink-0" size={18} />
                )}
              </h3>

              <div className="flex justify-center pt-1">
                {(() => {
                  const status = getIdentityVerificationStatus(listing.landlord);
                  if (status === 'verified') {
                    return (
                      <Badge className="bg-green-500 text-white font-bold text-xs flex items-center gap-1 rounded-full px-2.5 py-0.5">
                        <CheckCircle size={12} />
                        <span>موثق الهوية</span>
                      </Badge>
                    );
                  }
                  if (status === 'pending') {
                    return (
                      <Badge className="bg-amber-500 text-white font-bold text-xs flex items-center gap-1 rounded-full px-2.5 py-0.5">
                        <Clock size={12} />
                        <span>قيد مراجعة الهوية</span>
                      </Badge>
                    );
                  }
                  if (status === 'rejected') {
                    return (
                      <Badge className="bg-red-500 text-white font-bold text-xs flex items-center gap-1 rounded-full px-2.5 py-0.5">
                        <AlertCircle size={12} />
                        <span>مرفوض الهوية</span>
                      </Badge>
                    );
                  }
                  return (
                    <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs rounded-full px-2.5 py-0.5">
                      لم يوثق الهوية
                    </Badge>
                  );
                })()}
              </div>
            </div>

            <div className="w-full border-t border-slate-100 dark:border-slate-800 pt-4 grid grid-cols-2 gap-4 text-start">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">عضو منذ</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Calendar size={14} className="text-slate-400" />
                  {new Date(listing.landlord.createdAt).toLocaleDateString("ar-EG", { year: 'numeric', month: 'long' })}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">عدد الإعلانات</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Building2 size={14} className="text-slate-400" />
                  {listing.landlord._count?.listings ?? 1} إعلان
                </span>
              </div>
            </div>

            {isLoadingContact ? (
              <div className="w-full border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-center py-4">
                <Loader2 className="animate-spin text-amber-500" size={24} />
              </div>
            ) : !currentUser ? (
              <div className="w-full border-t border-slate-100 dark:border-slate-800 pt-4 text-xs text-red-500 font-bold leading-relaxed px-4 py-2 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900">
                لا يمكن التواصل مع المعلن إلا بعد تسجيل الدخول كـ (مستأجر) وتقديم طلب معاينة ويقوم المؤجر بقبوله.
              </div>
            ) : currentUser.role !== "tenant" ? (
              <div className="w-full border-t border-slate-100 dark:border-slate-800 pt-4 text-xs text-red-500 font-bold leading-relaxed px-4 py-2 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900">
                يجب أن تسجل دخولك بصفة (مستأجر) لتتمكن من تقديم طلبات المعاينة والتواصل مع المعلنين.
              </div>
            ) : contactAccess?.canViewPhone && contactAccess.phone ? (
              <div className="w-full border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-2">
                <a
                  href={`tel:${contactAccess.phone}`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/95 transition-all shadow-md"
                >
                  <Phone size={16} /> اتصل بالمعلن
                </a>
                <a
                  href={getWhatsAppLink(contactAccess.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-green-500 text-white hover:bg-green-600 transition-all shadow-md"
                >
                  <MessageSquare size={16} /> مراسلة عبر واتساب
                </a>
              </div>
            ) : (
              <div className="w-full border-t border-slate-100 dark:border-slate-800 pt-4 text-xs text-amber-600 dark:text-amber-400 font-bold leading-relaxed px-4 py-3 bg-amber-50 dark:bg-amber-950/10 rounded-xl border border-amber-200/50 dark:border-amber-900/50">
                لا يمكن التواصل مع المعلن إلا بعد قبول طلب المعاينة الخاص بك من قبل المؤجر.
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
export const ListingCardSkeleton: React.FC = () => (
  <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 animate-pulse">
    <div className="h-[200px] bg-gray-200 dark:bg-gray-800" />
    <div className="p-4 space-y-3">
      <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="h-6 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="flex gap-2">
        <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-800" />
      </div>
      <div className="h-9 w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
    </div>
  </div>
);
