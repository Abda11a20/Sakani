// apps/frontend/src/app/[locale]/page.tsx
import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HomeHeroSection } from "@/components/home/HomeHeroSection";
import { HomeHowItWorksSection } from "@/components/home/HomeHowItWorksSection";
import { HomeLandlordSection } from "@/components/home/HomeLandlordSection";
import { listingRepository } from "@/features/listings";
import { ListingCard } from "@/features/listings";
import type { Listing } from "@/types";
import { Button } from "@/components/ui";
import { Building2, ArrowLeft, ArrowRight, Search } from "lucide-react";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sakanieg.vercel.app";

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        ar: `${siteUrl}/ar`,
        en: `${siteUrl}/en`,
        "x-default": `${siteUrl}/ar`,
      },
    },
    openGraph: {
      type: "website",
      siteName: locale === "ar" ? "سكني — Sakani" : "Sakani",
      title,
      description,
      url: `${siteUrl}/${locale}`,
      locale: locale === "ar" ? "ar_EG" : "en_US",
      images: [
        {
          url: `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: locale === "ar" ? "سكني — منصة تأجير العقارات والسكن في مصر" : "Sakani — Housing & Rental Platform in Egypt",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${siteUrl}/og-image.png`],
    },
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

import { AdSlot } from "@/features/ads/components/AdSlot";

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const ArrowIcon = locale === "ar" ? ArrowLeft : ArrowRight;
  const seoContent = locale === "ar"
    ? {
        title: "سكني: منصة تأجير الشقق والغرف والأسِرّة في مصر",
        paragraphs: [
          "سكني منصة سكن وتأجير مصرية تساعدك على العثور على شقق وغرف وأسِرّة للإيجار بثقة. نعرض تفاصيل واضحة وصورًا ومعلومات عن الموقع والسعر لتتمكن من مقارنة خيارات السكن المناسبة لاحتياجاتك وميزانيتك قبل اتخاذ قرارك.",
          "سواء كنت طالبًا تبحث عن سكن جامعي، أو موظفًا ترغب في غرفة خاصة، أو أسرة تحتاج إلى شقة، يمكنك استخدام البحث والتصفية حسب المدينة والمنطقة ونوع السكن والسعر. كما يمكنك استعراض تفاصيل الإعلان وطلب معاينة في الموعد المناسب لك.",
          "ولأصحاب العقارات، يوفر سكني طريقة منظمة للوصول إلى المستأجرين وعرض الوحدات والغرف والأسِرّة المتاحة. تساعد المراجعة وطلبات المعاينة على جعل تجربة التأجير أوضح وأكثر أمانًا للطرفين في مختلف مناطق مصر.",
        ],
        link: "تصفح العقارات المتاحة للإيجار في مصر",
      }
    : {
        title: "Sakani: Apartments, Rooms and Shared Beds for Rent in Egypt",
        paragraphs: [
          "Sakani is a premium housing and rental platform in Egypt that helps people find apartments, private rooms and shared beds with confidence. Each listing presents clear details, photos, location information and pricing so renters can compare suitable housing options before making a decision.",
          "Whether you are a student looking for university housing, a professional searching for a private room, or a family needing an apartment, you can filter rentals by city, area, property type and budget. Review listing details, then request a viewing at a time that works for you.",
          "For landlords, Sakani provides an organized way to reach prospective tenants and advertise available properties, rooms and beds. Listing reviews and viewing requests help create a clearer, safer rental experience for both sides across Egypt.",
          "Sakani is designed to make rental searches simpler and more transparent. Use the available information to shortlist homes that fit your needs, compare locations and monthly prices, and contact the advertiser through the platform when you are ready to take the next step. Whether you need a short-term option or a longer stay, the platform helps you start with clearer rental information.",
          "From Cairo and Giza to Alexandria, Ismailia and other Egyptian cities, Sakani brings rental choices together in one place. Our goal is to help tenants discover suitable homes and help property owners present accurate listings, making it easier for everyone to find a practical, comfortable place to live. Before choosing a rental, compare the listing information carefully and arrange a viewing whenever possible so that your next home feels right for you.",
        ],
        link: "Browse rentals available across Egypt",
      };

  const featuredListings = await getFeaturedListings();

  return (
    <main className="font-cairo bg-surface-secondary min-h-screen">
      <AdSlot placementKey="INTERSTITIAL" />
      <HomeHeroSection locale={locale} />
      
      <div className="container mx-auto max-w-6xl px-3 sm:px-4">
        <AdSlot placementKey="HOME_HERO" />
      </div>

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
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  imageSizes="(max-width: 1023px) 50vw, 25vw"
                />
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

      <section className="bg-surface px-4 py-12 md:py-16" aria-labelledby="home-seo-title">
        <div className="container mx-auto max-w-4xl">
          <h2 id="home-seo-title" className="text-2xl font-bold text-text md:text-3xl">
            {seoContent.title}
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-7 text-text-secondary md:text-base">
            {seoContent.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <Link
            href={`/${locale}/search`}
            className="mt-6 inline-flex font-bold text-primary transition-colors hover:text-primary-dark"
          >
            {seoContent.link}
          </Link>
        </div>
      </section>

      {/* Landlord CTA Section */}
      <HomeLandlordSection locale={locale} />
    </main>
  );
}
