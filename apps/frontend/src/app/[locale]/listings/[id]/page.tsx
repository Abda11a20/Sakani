// apps/frontend/src/app/[locale]/listings/[id]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingDetailClient } from "./listing-detail-client";
import type { Listing, Review } from "@/types";
import { getCloudinaryUrl } from "@/lib/utils";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo";

interface ListingPageProps {
  params: Promise<{ locale: string; id: string }>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
const APP_BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://sakani-app.vercel.app";

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
  if (!listing) return { title: locale === "ar" ? "إعلان غير موجود" : "Listing Not Found" };

  const description = listing.description
    ? listing.description.slice(0, 160)
    : `إعلان ${listing.type === "apartment" ? "شقة" : "سرير"} في ${listing.district}، ${listing.governorate || listing.city}`;

  const ogImage = listing.images?.[0]
    ? getCloudinaryUrl(listing.images[0], { width: 1200, height: 630, crop: "fill" })
    : `${APP_BASE}/og-image.png`;

  return buildPageMetadata({
    locale,
    path: `/listings/${id}`,
    title: `${listing.title} — سكني`,
    description,
    ogImage,
  });
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id, locale } = await params;

  const [listing, reviews, suggested] = await Promise.all([
    getListing(id),
    getReviews(id),
    getSuggested(id),
  ]);

  if (!listing) notFound();

  // ── JSON-LD Structured Data ────────────────────────────────────────────────
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": listing.title,
    "description": listing.description || `${listing.type === "apartment" ? "شقة" : "سرير"} للإيجار في ${listing.district || ""}`,
    "image": (listing.images || []).map((img) =>
      getCloudinaryUrl(img, { quality: "auto", format: "auto" })
    ),
    "offers": {
      "@type": "Offer",
      "price": listing.price,
      "priceCurrency": "EGP",
      "availability":
        listing.status === "active" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "url": `${APP_BASE}/${locale}/listings/${listing.id}`,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": locale === "ar" ? "الرئيسية" : "Home",
        "item": `${APP_BASE}/${locale}`,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": locale === "ar" ? "البحث" : "Search",
        "item": `${APP_BASE}/${locale}/search`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": listing.title,
        "item": `${APP_BASE}/${locale}/listings/${listing.id}`,
      },
    ],
  };

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <JsonLd data={[productSchema, breadcrumbSchema]} />
      <ListingDetailClient
        listing={listing}
        reviews={reviews}
        suggested={suggested}
        locale={locale}
      />
    </Suspense>
  );
}
