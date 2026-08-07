// apps/frontend/src/app/[locale]/community/page.tsx
import type { Metadata } from "next";
import CommunityPageClient from "./CommunityPageClient";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://sakanieg.vercel.app";

interface CommunityPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: CommunityPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isRtl = locale === "ar";

  return {
    title: isRtl
      ? "مجتمع سكني — شارك أنشطتك وتواصل مع جيرانك"
      : "Sakani Community — Share Activities & Connect with Neighbors",
    description: isRtl
      ? "انضم لمجتمع سكني وابحث عن أنشطة مشتركة في منطقتك: كورة قدم، مجموعات دراسة، خروجات، وأكثر. أنشئ فعاليتك وتواصل مع سكان منطقتك بأمان."
      : "Join Sakani Community to find and share local activities near you: sports, study groups, outings, and more. Create events and safely connect with neighbors in your area.",
    alternates: {
      canonical: `${siteUrl}/${locale}/community`,
      languages: {
        ar: `${siteUrl}/ar/community`,
        en: `${siteUrl}/en/community`,
        "x-default": `${siteUrl}/ar/community`,
      },
    },
    openGraph: {
      title: isRtl
        ? "مجتمع سكني — شارك أنشطتك وتواصل مع جيرانك"
        : "Sakani Community — Share Activities & Connect with Neighbors",
      description: isRtl
        ? "ابحث عن أنشطة مشتركة في منطقتك وتواصل مع سكان حيّك بأمان على منصة سكني."
        : "Find shared activities near you and safely connect with neighbors on Sakani.",
      url: `${siteUrl}/${locale}/community`,
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function CommunityPage() {
  return <CommunityPageClient />;
}
