// apps/frontend/src/components/seo/Breadcrumb.tsx
import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  locale: string;
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ locale, items }) => {
  const isRtl = locale === "ar";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sakanieg.vercel.app";

  const homeLabel = isRtl ? "الرئيسية" : "Home";
  const allItems: BreadcrumbItem[] = [
    { label: homeLabel, href: `/${locale}` },
    ...items.filter((item) => Boolean(item.label)),
  ];

  // ── JSON-LD BreadcrumbList Schema ─────────────────────────────────────────
  const breadcrumbListSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: allItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? `${baseUrl}${item.href}` : undefined,
    })),
  };

  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <>
      {/* Schema Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbListSchema).replace(/</g, "\\u003c"),
        }}
      />

      {/* Accessible UI */}
      <nav
        aria-label="breadcrumb"
        className="py-3 px-4 bg-surface/50 backdrop-blur-xs rounded-xl border border-border/40 my-4 text-xs font-cairo"
      >
        <ol className="flex flex-wrap items-center gap-1.5 text-text-secondary">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;

            return (
              <li key={index} className="inline-flex items-center gap-1.5">
                {index === 0 ? (
                  <Link
                    href={item.href || `/${locale}`}
                    className="flex items-center gap-1 hover:text-primary transition-colors font-medium text-text-secondary"
                  >
                    <Home size={14} className="shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ) : isLast || !item.href ? (
                  <span className="font-bold text-text truncate max-w-[200px] sm:max-w-[300px]">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="hover:text-primary transition-colors font-medium text-text-secondary truncate max-w-[150px]"
                  >
                    {item.label}
                  </Link>
                )}

                {!isLast && (
                  <ChevronIcon size={13} className="shrink-0 text-text-tertiary" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};
