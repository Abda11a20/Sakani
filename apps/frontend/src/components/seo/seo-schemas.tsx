// apps/frontend/src/components/seo/seo-schemas.tsx
import React from "react";

interface SeoSchemasProps {
  locale: string;
}

export const SeoSchemas: React.FC<SeoSchemasProps> = ({ locale }) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sakanieg.vercel.app";
  const isRtl = locale === "ar";

  // 1. Organization & RealEstateAgent Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["Organization", "RealEstateAgent"],
    "@id": `${baseUrl}/#organization`,
    name: "سكني — Sakani",
    alternateName: "منصة سكني لتأجير العقارات والسكن الطلابي في مصر",
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/icon-512.png`,
      width: 512,
      height: 512,
    },
    image: `${baseUrl}/og-image.png`,
    description: isRtl
      ? "منصة سَكني هي أسهل وأأمن طريقة لحجز وتأجير العقارات والأسرة والسكن الطلابي والشبابي في مصر مباشرة من الملاك بدون عمولات مبالغ فيها."
      : "Sakani is Egypt's leading student & youth housing rental platform connecting tenants directly with verified landlords.",
    telephone: "+201289631207",
    email: "sakani.app.otp@gmail.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Cairo",
      addressCountry: "EG",
    },
    sameAs: ["https://www.facebook.com/profile.php?id=61593097584345"],
    priceRange: "$$",
  };

  // 2. WebSite & SearchAction Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: "سكني — Sakani",
    description: isRtl
      ? "ابحث واكتشف أفضل الشقق والغرف والسكن الطلابي للإيجار في مصر"
      : "Find and rent top apartments, rooms, and student housing in Egypt",
    publisher: {
      "@id": `${baseUrl}/#organization`,
    },
    inLanguage: [locale === "ar" ? "ar-EG" : "en-US"],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/${locale}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonStringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonStringify(websiteSchema) }}
      />
    </>
  );
};

function safeJsonStringify(obj: any): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}
