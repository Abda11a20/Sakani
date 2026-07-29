// apps/frontend/src/app/[locale]/listings/[id]/listing-detail-client.tsx
"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { requestsApi } from "@/features/requests";
import { listingRepository } from "@/features/listings";

import { GENDER_TARGET_CONFIG, ELECTRICITY_TYPE_CONFIG, AMENITIES_CONFIG } from "@/lib/constants";
import { useAuthStore } from "@/features/auth";
import { useWishlist } from "@/hooks/useWishlist";
import { useToast } from "@/components/ui";
import { CheckCircle, Wifi, Wind, ArrowUpDown, WashingMachine, Tv, Flame, Zap, Droplets, Filter, Shield, Home, Car } from "lucide-react";
import type { Listing, Review } from "@/types";

// Extracted Presentational Sub-components
import { ListingHeaderActions } from "@/features/listings/components/detail/ListingHeaderActions";
import { ListingImageGallery } from "@/features/listings/components/detail/ListingImageGallery";
import { ListingOverview } from "@/features/listings/components/detail/ListingOverview";
import { ListingAmenities } from "@/features/listings/components/detail/ListingAmenities";
import { ListingLocation } from "@/features/listings/components/detail/ListingLocation";
import { ListingActionCard } from "@/features/listings/components/detail/ListingActionCard";
import { ListingReviewsSection } from "@/features/listings/components/detail/ListingReviewsSection";
import { SuggestedListingsSlider } from "@/features/listings/components/detail/SuggestedListingsSlider";
import { RequestViewingModal } from "@/features/listings/components/detail/RequestViewingModal";

interface ListingDetailClientProps {
  listing: Listing;
  reviews: Review[];
  suggested: Listing[];
  locale: string;
}

const AMENITY_ICON_MAP: Record<string, React.ReactNode> = {
  wifi:         <Wifi size={14} />,
  ac:           <Wind size={14} />,
  elevator:     <ArrowUpDown size={14} />,
  washer:       <WashingMachine size={14} />,
  tv:           <Tv size={14} />,
  fan:          <Wind size={14} />,
  stove:        <Flame size={14} />,
  fridge:       <Zap size={14} />,
  water_heater: <Droplets size={14} />,
  water_filter: <Filter size={14} />,
  natural_gas:  <Flame size={14} />,
  gas:          <Flame size={14} />,
  furnished:    <Home size={14} />,
  security:     <Shield size={14} />,
  balcony:      <Home size={14} />,
  parking:      <Car size={14} />,
};

const AMENITY_CONFIG: Record<string, { icon: React.ReactNode; labelAr: string; labelEn: string }> = Object.fromEntries(
  AMENITIES_CONFIG.map((a) => [
    a.key,
    { icon: AMENITY_ICON_MAP[a.key] ?? <CheckCircle size={14} />, labelAr: a.labelAr, labelEn: a.labelEn },
  ])
);

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

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [contactAccess, setContactAccess] = useState<{
    canViewPhone: boolean;
    phone: string | null;
  } | null>(null);

  // Record Listing view once per session
  useEffect(() => {
    const viewKey = `sakani_listing_viewed_${listing.id}`;
    if (sessionStorage.getItem(viewKey)) return;

    sessionStorage.setItem(viewKey, "1");
    listingRepository.recordView(listing.id).catch(() => {
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

  const handleRequestViewingSubmit = async (date: string, time: string) => {
    await requestsApi.create({
      listingId: listing.id,
      preferredDate: new Date(`${date}T${time}`).toISOString(),
    });
  };

  const getGenderTargetLabel = (gender?: string) => {
    if (!gender) return isRtl ? "مشترك" : "Mixed";
    const cfg = GENDER_TARGET_CONFIG[gender as keyof typeof GENDER_TARGET_CONFIG];
    return isRtl ? (cfg?.labelAr ?? gender) : (cfg?.labelEn ?? gender);
  };

  const getElectricityTypeLabel = (meter?: string) => {
    if (!meter) return isRtl ? "غير محدد" : "Not specified";
    const cfg = (ELECTRICITY_TYPE_CONFIG as any)[meter];
    if (!cfg) return meter;
    return isRtl ? cfg.labelAr : cfg.labelEn;
  };

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 4.5;

  return (
    <main className="min-h-screen bg-slate-50 pb-20 font-cairo" dir={isRtl ? "rtl" : "ltr"}>
      {/* 1. Header Navigation Breadcrumbs */}
      <ListingHeaderActions title={listing.title} locale={locale} />

      {/* Main Details Container */}
      <div className="container mx-auto px-4 max-w-5xl space-y-4 sm:space-y-5">
        {/* 2. Image Gallery & Lightbox */}
        <ListingImageGallery
          images={displayImages}
          title={listing.title}
          isLiked={isLiked}
          locale={locale}
          onToggleWishlist={() => toggleWishlist(listing.id)}
          onShare={handleShare}
        />

        {/* 3. Title, Price, Specifications & Description */}
        <ListingOverview
          listing={listing}
          locale={locale}
          getGenderTargetLabel={getGenderTargetLabel}
          getElectricityTypeLabel={getElectricityTypeLabel}
        />

        {/* 4. Amenities & House Rules */}
        <ListingAmenities
          listing={listing}
          locale={locale}
          amenityConfig={AMENITY_CONFIG}
        />

        {/* 5. Location Leaflet Map */}
        <ListingLocation listing={listing} locale={locale} />

        {/* 6. Action Card & Landlord Details */}
        <ListingActionCard
          listing={listing}
          avgRating={avgRating}
          mounted={mounted}
          currentUser={currentUser}
          contactAccess={contactAccess}
          locale={locale}
          onRequestViewing={() => setRequestModalOpen(true)}
        />

        {/* 7. Reviews Section */}
        <ListingReviewsSection
          reviews={reviews}
          avgRating={avgRating}
          locale={locale}
        />

        {/* 8. Similar Suggested Listings */}
        <SuggestedListingsSlider suggested={suggested} locale={locale} />
      </div>

      {/* 9. Request Viewing Modal */}
      <RequestViewingModal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSubmit={handleRequestViewingSubmit}
      />
    </main>
  );
}
