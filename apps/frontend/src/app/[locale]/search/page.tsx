// apps/frontend/src/app/[locale]/search/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPageClient } from "./search-client";

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string>>;
}

export async function generateMetadata({ params }: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "سكني — نتائج البحث" : "Sakani — Search Results",
    description:
      locale === "ar"
        ? "ابحث في آلاف الإعلانات عن شقق وأسرة في مصر"
        : "Search thousands of listings for apartments and beds in Egypt",
  };
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
