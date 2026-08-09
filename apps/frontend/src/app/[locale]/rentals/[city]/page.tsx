import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { getCityPage, CITY_PAGES } from "@/lib/seo/city-pages";
import { buildPageMetadata } from "@/lib/seo";
import { SearchPageClient } from "../../search/search-client";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://sakani-backend-production.up.railway.app/api/v1";

interface CityRentalPageProps {
  params: Promise<{ locale: string; city: string }>;
}

async function getActiveListingCount(city: NonNullable<ReturnType<typeof getCityPage>>) {
  const searchUrl = new URL(`${API_BASE}/search`);
  searchUrl.searchParams.set("limit", "1");
  searchUrl.searchParams.set("governorate", city.filters.governorate);
  if (city.filters.district) {
    searchUrl.searchParams.set("district", city.filters.district);
  }

  try {
    const response = await fetch(searchUrl.toString(), {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return 0;

    const data = await response.json();
    return typeof data?.total === "number" ? data.total : 0;
  } catch {
    return 0;
  }
}

export function generateStaticParams() {
  return CITY_PAGES.flatMap((city) => [
    { locale: "ar", city: city.slug },
    { locale: "en", city: city.slug },
  ]);
}

export async function generateMetadata({ params }: CityRentalPageProps): Promise<Metadata> {
  const { locale, city: slug } = await params;
  const city = getCityPage(slug);
  if (!city) return {};

  const isArabic = locale === "ar";
  const cityName = isArabic ? city.name.ar : city.name.en;
  const listingCount = await getActiveListingCount(city);

  return buildPageMetadata({
    locale,
    path: `/rentals/${city.slug}`,
    title: isArabic
      ? `شقق وغرف للإيجار في ${cityName}`
      : `Apartments, Rooms & Beds for Rent in ${cityName}`,
    description: isArabic
      ? `تصفح إعلانات الشقق والغرف والأسرة المتاحة للإيجار في ${cityName} على سكني.`
      : `Browse available apartments, rooms, and beds for rent in ${cityName} on Sakani.`,
    keywords: isArabic
      ? [`شقق للإيجار في ${cityName}`, `غرف للإيجار في ${cityName}`, `سكن في ${cityName}`]
      : [`rentals in ${cityName}`, `apartments for rent in ${cityName}`, `rooms for rent in ${cityName}`],
    noindex: listingCount === 0,
  });
}

export default async function CityRentalPage({ params }: CityRentalPageProps) {
  const { locale, city: slug } = await params;
  const city = getCityPage(slug);
  if (!city) notFound();

  const isArabic = locale === "ar";
  const cityName = isArabic ? city.name.ar : city.name.en;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <div className="container mx-auto px-4 max-w-7xl pt-2">
        <Breadcrumb
          locale={locale}
          items={[
            { label: isArabic ? "البحث والعقارات" : "Search & Listings", href: `/${locale}/search` },
            { label: cityName },
          ]}
        />
      </div>
      <SearchPageClient
        locale={locale}
        initialFilters={Object.fromEntries(
          Object.entries(city.filters).filter(([, value]) => Boolean(value))
        )}
        cityContext={{
          baseFilters: city.filters,
          resultsHeading: isArabic ? `عقارات للإيجار في ${cityName}` : `Rentals in ${cityName}`,
        }}
      />
    </Suspense>
  );
}
