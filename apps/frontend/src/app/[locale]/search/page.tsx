// apps/frontend/src/app/[locale]/search/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPageClient } from "./search-client";
import { buildPageMetadata } from "@/lib/seo";
import { Breadcrumb } from "@/components/seo/Breadcrumb";


interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string>>;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://sakani-backend-production.up.railway.app/api/v1";

export async function generateMetadata({
  params,
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  const queryParams = await searchParams;
  const isRtl = locale === "ar";

  const { governorate, district, unitType, q } = queryParams;
  const loc = [district, governorate].filter(Boolean).join("، ");

  // Fetch count with 1-hour ISR revalidation cache (does not overload backend)
  let count = 0;
  try {
    const searchUrl = new URL(`${API_BASE}/listings`);
    searchUrl.searchParams.set("status", "active");
    if (district) searchUrl.searchParams.set("district", district);
    if (governorate) searchUrl.searchParams.set("governorate", governorate);
    if (unitType) searchUrl.searchParams.set("unitType", unitType);
    if (q) searchUrl.searchParams.set("q", q);

    const res = await fetch(searchUrl.toString(), {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      count = data?.meta?.totalCount ?? data?.total ?? data?.data?.length ?? 0;
    }
  } catch {
    count = 0;
  }

  let dynamicTitle = "";

  if (count > 0) {
    if (unitType === "apartment") {
      dynamicTitle = isRtl
        ? `أفضل ${count} شقة للإيجار${loc ? ` في ${loc}` : ""}`
        : `Top ${count} Apartments for Rent${loc ? ` in ${loc}` : ""}`;
    } else if (unitType === "bed") {
      dynamicTitle = isRtl
        ? `أفضل ${count} غرفة وسرير للإيجار${loc ? ` في ${loc}` : ""}`
        : `Top ${count} Beds & Rooms for Rent${loc ? ` in ${loc}` : ""}`;
    } else {
      dynamicTitle = isRtl
        ? `أفضل ${count} عقار وسكن للإيجار${loc ? ` في ${loc}` : ""}`
        : `Top ${count} Properties for Rent${loc ? ` in ${loc}` : ""}`;
    }
  } else {
    // Zero results fallback: Never display "Top 0"
    if (unitType === "apartment") {
      dynamicTitle = isRtl
        ? `شقق للإيجار${loc ? ` في ${loc}` : ""}`
        : `Apartments for Rent${loc ? ` in ${loc}` : ""}`;
    } else if (unitType === "bed") {
      dynamicTitle = isRtl
        ? `أسرة وغرف للإيجار${loc ? ` في ${loc}` : ""}`
        : `Beds & Rooms for Rent${loc ? ` in ${loc}` : ""}`;
    } else {
      dynamicTitle = isRtl
        ? `عقارات وشقق للإيجار${loc ? ` في ${loc}` : ""}`
        : `Properties & Apartments for Rent${loc ? ` in ${loc}` : ""}`;
    }
  }

  if (q && !loc) {
    dynamicTitle += `: ${q}`;
  }

  return buildPageMetadata({
    locale,
    path: "/search",
    title: `${dynamicTitle} | سكني`,
    description: isRtl
      ? `استكشف العقارات والشقق والأسرة المتاحة للإيجار ${loc ? `في ${loc}` : "في مصر"} بأفضل الأسعار وأمان تام على منصة سكني.`
      : `Explore properties and rooms for rent ${loc ? `in ${loc}` : "in Egypt"} with verified landlords on Sakani.`,
    queryParams,
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
      <div className="container mx-auto px-4 max-w-7xl pt-2">
        <Breadcrumb locale={locale} items={[{ label: locale === "ar" ? "البحث والعقارات" : "Search & Listings" }]} />
      </div>
      <SearchPageClient locale={locale} initialFilters={initialFilters} />
    </Suspense>
  );
}
