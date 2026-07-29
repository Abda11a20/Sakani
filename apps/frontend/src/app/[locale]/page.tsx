// apps/frontend/src/app/[locale]/page.tsx
import React from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HomeHeroSection } from "@/components/home/HomeHeroSection";
import { HomeHowItWorksSection } from "@/components/home/HomeHowItWorksSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { listingRepository } from "@/features/listings";
import { ListingCard, ListingCardSkeleton } from "@/features/listings";
import type { Listing } from "@/types";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

async function getFeaturedListings(): Promise<Listing[]> {
  try {
    const res = await listingRepository.getAll({ isFeatured: true, limit: 6 });
    return res.listings.map((l) => l.toJSON() as Listing);
  } catch {
    return [];
  }
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sakani-app.vercel.app";

  const featuredListings = await getFeaturedListings();

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "سكني — Sakani",
    "url": `${baseUrl}/${locale}`,
  };

  return (
    <main className="font-cairo">
      <JsonLd data={[websiteSchema]} />
      <HomeHeroSection locale={locale} />
      <HomeHowItWorksSection />
      
      {/* Featured Section */}
      <section className="py-20 px-4 bg-surface">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-text font-cairo">العقارات المميزة</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {featuredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
