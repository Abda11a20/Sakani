// apps/frontend/src/app/sitemap.ts
import { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://sakanieg.vercel.app";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://sakani-backend-production.up.railway.app/api/v1";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static pages ────────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
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
        json?.items ?? json?.data ?? [];
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

  return [...staticPages, ...listingPages];
}
