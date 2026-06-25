// apps/frontend/src/components/listings/ListingCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { MapPin, Star, Wifi, Wind, Building2, BedDouble, ArrowLeft, ArrowRight, Heart, CheckCircle, Sparkles } from "lucide-react";
import type { Listing } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/hooks/useWishlist";

interface ListingCardProps {
  listing: Listing;
  className?: string;
  rating?: number;
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
  room: "غرفة",
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

export const ListingCard: React.FC<ListingCardProps> = ({ listing, className, rating }) => {
  const locale = useLocale();
  const ArrowIcon = locale === "ar" ? ArrowLeft : ArrowRight;

  const availableBeds = listing.beds
    ? listing.beds.filter((b) => b.isAvailable).length
    : null;

  const formattedPrice = new Intl.NumberFormat("ar-EG").format(listing.price);

  // Favorite / Wishlist
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isFavorite = isInWishlist(listing.id);

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
        className
      )}
    >
      {/* Image */}
      <div className="relative h-[200px] overflow-hidden bg-gray-100 dark:bg-gray-800">
        {listing.images && listing.images.length > 0 ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <Building2 size={48} />
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute start-2 top-2 flex flex-col gap-1.5">
          <Badge variant="default" className="bg-white/90 text-gray-800 backdrop-blur-sm dark:bg-gray-900/90 dark:text-gray-100">
            {TYPE_LABELS[listing.type]}
          </Badge>
          <Badge variant={STATUS_VARIANT[listing.status]}>
            {STATUS_LABELS[listing.status]}
          </Badge>
        </div>

        <div className="absolute end-2 top-2 flex flex-col gap-1.5">
          {listing.isVerified && (
            <Badge variant="success" className="gap-1">
              <CheckCircle size={11} />
              موثق
            </Badge>
          )}
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
            <div className="flex items-center gap-2">
              <Avatar
                src={null}
                name={listing.landlord.name}
                size="sm"
                verified={listing.isVerified}
              />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[90px]">
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
      <div className="px-4 pb-4">
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
