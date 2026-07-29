// apps/frontend/src/app/[locale]/search/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPageClient } from "./search-client";
import { buildPageMetadata } from "@/lib/seo";

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string>>;
}

export async function generateMetadata({
  params,
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  const queryParams = await searchParams;
  const isRtl = locale === "ar";

  const { governorate, district, unitType, q } = queryParams;

  let dynamicTitle = isRtl ? "البحث عن عقارات وشقق للإيجار" : "Search Properties & Apartments for Rent";

  if (unitType === "apartment") {
    dynamicTitle = isRtl ? "شقق للإيجار" : "Apartments for Rent";
  } else if (unitType === "bed") {
    dynamicTitle = isRtl ? "أسرة وغرف للإيجار" : "Beds & Rooms for Rent";
  }

  if (district || governorate) {
    const loc = [district, governorate].filter(Boolean).join("، ");
    dynamicTitle += isRtl ? ` في ${loc}` : ` in ${loc}`;
  } else if (q) {
    dynamicTitle += `: ${q}`;
  }

  return buildPageMetadata({
    locale,
    path: "/search",
    title: `${dynamicTitle} — سكني`,
    description: isRtl
      ? "ابحث في آلاف العقارات والشقق والأسرة الموثقة للإيجار في مصر بأفضل الأسعار وأمان تام."
      : "Search thousands of verified listings for apartments and beds in Egypt.",
  });
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;
  const initialFilters = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <SearchPageClient locale={locale} initialFilters={initialFilters} />
    </Suspense>
  );
}
