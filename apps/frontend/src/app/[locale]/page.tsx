// apps/frontend/src/app/[locale]/page.tsx
import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HomeHeroSection } from "@/components/home/HomeHeroSection";
import { HomeHowItWorksSection } from "@/components/home/HomeHowItWorksSection";
import { HomeLandlordSection } from "@/components/home/HomeLandlordSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { listingRepository } from "@/features/listings";
import { ListingCard } from "@/features/listings";
import type { Listing } from "@/types";
import { Button } from "@/components/ui";
import { Building2, ArrowLeft, ArrowRight, Search } from "lucide-react";

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
    const res = await listingRepository.getAll({ limit: 4 });
    return res.listings.map((l) => l.toJSON() as Listing);
  } catch {
    return [];
  }
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sakani-app.vercel.app";
  const ArrowIcon = locale === "ar" ? ArrowLeft : ArrowRight;

  const featuredListings = await getFeaturedListings();

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": locale === "en" ? "Sakani" : "سكني — Sakani",
    "url": `${baseUrl}/${locale}`,
  };

  return (
    <main className="font-cairo bg-surface-secondary min-h-screen">
      <JsonLd data={[websiteSchema]} />
      <HomeHeroSection locale={locale} />
      <HomeHowItWorksSection />
      
      {/* Featured Section — 4 Curated Listings */}
      <section className="py-10 md:py-16 px-3 sm:px-4 bg-surface border-t border-b border-border-divider">
        <div className="container mx-auto max-w-6xl">
          
          {/* Header Row — Clean Title & View All Link */}
          <div className="flex flex-row items-center justify-between mb-6 sm:mb-8 gap-2">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text">
                {t("featuredTitle")}
              </h2>
            </div>

            <Link
              href={`/${locale}/search`}
              className="inline-flex items-center gap-1.5 text-sm sm:text-base font-bold text-[#1B4F8A] hover:text-[#142E54] transition-colors"
            >
              <ArrowIcon size={18} />
              <span>{t("viewAll")}</span>
            </Link>
          </div>

          {featuredListings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {featuredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-surface-secondary border border-dashed border-border">
              <Building2 size={32} className="mx-auto text-text-tertiary mb-2" />
              <p className="text-text-secondary font-semibold text-xs sm:text-sm">
                {locale === "en" ? "Adding new featured listings..." : "جاري إضافة عقارات مميزة جديدة..."}
              </p>
              <Link href={`/${locale}/search`} className="mt-3 inline-block">
                <Button variant="primary" size="sm">
                  {t("browseAllBtn")}
                </Button>
              </Link>
            </div>
          )}

          {/* Bottom CTA Button — Strictly Centered in Middle */}
          <div className="mt-8 flex justify-center w-full">
            <Link href={`/${locale}/search`}>
              <Button
                variant="primary"
                size="md"
                rightIcon={<Search size={16} />}
                className="font-bold px-8 rounded-xl shadow-md whitespace-nowrap"
              >
                {t("browseAllBtn")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Landlord CTA Section */}
      <HomeLandlordSection locale={locale} />
    </main>
  );
}
