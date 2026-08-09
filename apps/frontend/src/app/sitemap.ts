// apps/frontend/src/app/sitemap.ts
import { MetadataRoute } from "next";
import { CITY_PAGES } from "@/lib/seo/city-pages";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://sakanieg.vercel.app";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://sakani-backend-production.up.railway.app/api/v1";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static pages ────────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/ar`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/en`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/ar/search`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/en/search`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/ar/how-it-works`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/en/how-it-works`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/ar/community`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/en/community`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },

  ];

  // ── Dynamic listing pages ────────────────────────────────────────────────────
  let listingPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(
      `${API_URL}/listings?status=active&limit=100&page=1`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const json = await res.json();
      const listings: Array<{ id: string; updatedAt: string }> =
        json?.listings ?? json?.items ?? json?.data ?? [];
      listingPages = listings.flatMap((listing) => [
        {
          url: `${BASE_URL}/ar/listings/${listing.id}`,
          lastModified: new Date(listing.updatedAt),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        },
        {
          url: `${BASE_URL}/en/listings/${listing.id}`,
          lastModified: new Date(listing.updatedAt),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        },
      ]);
    }
  } catch {
    // In case API is unavailable during build, skip dynamic pages
  }

  const cityPages = await Promise.all(
    CITY_PAGES.map(async (city) => {
      const searchUrl = new URL(`${API_URL}/search`);
      searchUrl.searchParams.set("limit", "1");
      searchUrl.searchParams.set("governorate", city.filters.governorate);
      if (city.filters.district) {
        searchUrl.searchParams.set("district", city.filters.district);
      }

      try {
        const response = await fetch(searchUrl.toString(), {
          next: { revalidate: 3600 },
        });
        if (!response.ok) return [];

        const data = await response.json();
        if (typeof data?.total !== "number" || data.total === 0) return [];

        return (["ar", "en"] as const).map((locale) => ({
          url: `${BASE_URL}/${locale}/rentals/${city.slug}`,
          lastModified: new Date(),
          changeFrequency: "daily" as const,
          priority: 0.8,
        }));
      } catch {
        return [];
      }
    })
  );

  return [...staticPages, ...listingPages, ...cityPages.flat()];
}
