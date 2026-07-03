// apps/frontend/src/app/[locale]/listings/[id]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingDetailClient } from "./listing-detail-client";
import type { Listing, Review } from "@/types";
import { getImageUrl } from "@/lib/utils";

interface ListingPageProps {
  params: Promise<{ locale: string; id: string }>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

async function getListing(id: string): Promise<Listing | null> {
  try {
    const res = await fetch(`${API_BASE}/listings/${id}`, { next: { revalidate: 60 } });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json;
  } catch {
    return null;
  }
}

async function getReviews(listingId: string): Promise<Review[]> {
  try {
    const res = await fetch(`${API_BASE}/reviews/listing/${listingId}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : (json?.data?.items ?? json?.data ?? []);
  } catch {
    return [];
  }
}

async function getSuggested(listingId: string): Promise<Listing[]> {
  try {
    const res = await fetch(`${API_BASE}/search/suggested/${listingId}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : (json?.data ?? []);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const listing = await getListing(id);
  if (!listing) return { title: "إعلان غير موجود" };

  return {
    title: `${listing.title} — سكني`,
    description: listing.description
      ? listing.description.slice(0, 160)
      : `إعلان ${listing.type === "apartment" ? "شقة" : listing.type === "bed" ? "سرير" : "غير متاح"} في ${listing.district}، ${listing.city}`,
    openGraph: {
      title: listing.title,
      description: listing.description?.slice(0, 160),
      images: listing.images?.[0] ? [getImageUrl(listing.images[0])] : [],
    },
  };
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id, locale } = await params;

  const [listing, reviews, suggested] = await Promise.all([
    getListing(id),
    getReviews(id),
    getSuggested(id),
  ]);

  if (!listing) notFound();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <ListingDetailClient
        listing={listing}
        reviews={reviews}
        suggested={suggested}
        locale={locale}
      />
    </Suspense>
  );
}
