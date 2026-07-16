// apps/frontend/src/app/[locale]/community/[id]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CommunityPostDetailClient } from "./post-detail-client";

interface PostPageProps {
  params: Promise<{ locale: string; id: string }>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

async function getPost(id: string) {
  try {
    const res = await fetch(`${API_BASE}/community/${id}`, { cache: "no-store" });
    if (res.status === 404) {
      console.warn(`[getPost] 404 Not Found for ID: ${id} at URL: ${API_BASE}/community/${id}`);
      return null;
    }
    if (!res.ok) {
      console.warn(`[getPost] Bad response status: ${res.status}`);
      return null;
    }
    const json = await res.json();
    return json?.data ?? json;
  } catch (err) {
    console.error("[getPost] Fetch exception:", err);
    return null;
  }
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return { title: "نشاط غير موجود" };

  return {
    title: `${post.title} — سكني`,
    description: post.description,
  };
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const { id, locale } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <CommunityPostDetailClient locale={locale} initialPost={post} />
    </Suspense>
  );
}
