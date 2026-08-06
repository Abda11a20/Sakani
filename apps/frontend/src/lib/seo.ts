// apps/frontend/src/lib/seo.ts
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sakanieg.vercel.app";

interface GeneratePageMetadataOptions {
  locale: string;
  path: string; // e.g. "/listings/123" or "/search" or ""
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  noindex?: boolean;
}

/**
 * Strips non-content parameters (pagination, sorting, UI view mode) to produce a clean canonical URL.
 */
export function buildCanonicalUrl(
  locale: string,
  path: string,
  queryParams?: Record<string, string>
): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const baseCanonical = `${BASE_URL}/${locale}${cleanPath === "/" ? "" : cleanPath}`;

  if (!queryParams || Object.keys(queryParams).length === 0) {
    return baseCanonical;
  }

  // Filter out noise parameters (page, sort, view, limit, etc.)
  const IGNORED_PARAMS = new Set([
    "page",
    "sort",
    "view",
    "limit",
    "layout",
    "offset",
    "order",
    "tab",
  ]);

  const filteredSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(queryParams)) {
    if (!IGNORED_PARAMS.has(key.toLowerCase()) && value) {
      filteredSearchParams.set(key, value);
    }
  }

  const queryString = filteredSearchParams.toString();
  return queryString ? `${baseCanonical}?${queryString}` : baseCanonical;
}

/**
 * دالة مساعدة محددة لتوليد Metadata ممتازة ودقيقة لكل صفحة، تشمل:
 * - Canonical URL مطلق
 * - الـ hreflang المتبادلة بين ar و en و x-default
 * - OpenGraph & Twitter Cards
 * - التحكم في الأرشفة (noindex)
 */
export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  keywords,
  ogImage = "/og-image.png",
  noindex = false,
  queryParams,
}: GeneratePageMetadataOptions & { queryParams?: Record<string, string> }): Metadata {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const arUrl = `${BASE_URL}/ar${cleanPath === "/" ? "" : cleanPath}`;
  const enUrl = `${BASE_URL}/en${cleanPath === "/" ? "" : cleanPath}`;
  const currentUrl = buildCanonicalUrl(locale, path, queryParams);


  const metadata: Metadata = {
    title,
    description,
    keywords,
    alternates: {
      canonical: currentUrl,
      languages: {
        ar: arUrl,
        en: enUrl,
        "x-default": arUrl,
      },
    },
    openGraph: {
      type: "website",
      siteName: locale === "ar" ? "سكني — Sakani" : "Sakani",
      title,
      description,
      url: currentUrl,
      locale: locale === "ar" ? "ar_EG" : "en_US",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };

  if (noindex) {
    metadata.robots = {
      index: false,
      follow: false,
    };
  }

  return metadata;
}
