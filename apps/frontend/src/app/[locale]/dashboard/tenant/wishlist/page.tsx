// apps/frontend/src/app/[locale]/dashboard/tenant/wishlist/page.tsx
"use client";

import React from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useWishlist } from "@/hooks/useWishlist";
import { useQueries } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Listing } from "@/types";
import TenantLayout from "@/components/layout/TenantLayout";
import { ListingCard, ListingCardSkeleton } from "@/components/listings/ListingCard";
import { EmptyState, Spinner, Button } from "@/components/ui";
import { Heart, Search, Archive, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";

// ── Archived Listing Card ────────────────────────────────────────────────────

function ArchivedListingCard({ listingId, onRemove }: { listingId: string; onRemove: (id: string) => void }) {
  const { removeFromWishlist } = useWishlist();

  const handleRemove = () => {
    removeFromWishlist(listingId);
    onRemove(listingId);
  };

  return (
    <div className="relative rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 flex flex-col items-center justify-center text-center gap-3 min-h-[180px]">
      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
        <Archive size={18} className="text-slate-500 dark:text-slate-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 font-cairo">هذا العقار لم يعد متاحاً</p>
        <p className="text-xs text-slate-400 dark:text-slate-600 font-cairo mt-0.5">تمت أرشفته أو حذفه</p>
      </div>
      <button
        onClick={handleRemove}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-cairo text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
      >
        <Trash2 size={12} />
        إزالة من المفضلة
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TenantWishlist() {
  const locale = useLocale();
  const { user, isLoading: isAuthLoading } = useAuthGuard({ role: "tenant" });

  // Get client-side wishlist IDs
  const { wishlistIds } = useWishlist();
  const [removed, setRemoved] = React.useState<string[]>([]);

  const activeIds = wishlistIds.filter((id) => !removed.includes(id));

  // Load details in parallel for each listing in the wishlist
  const wishlistQueries = useQueries({
    queries: activeIds.map((id) => ({
      queryKey: ["listings", id],
      queryFn: async (): Promise<Listing | null> => {
        try {
          const response = await api.get<Listing>(`/listings/${id}`);
          return response.data;
        } catch {
          // 404 = deleted/archived listing — return null instead of throwing
          return null;
        }
      },
      retry: false,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isListingsLoading = wishlistQueries.some((q) => q.isLoading);
  const isLoading = isAuthLoading || isListingsLoading;

  if (isAuthLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Separate available and archived listings
  const availableListings: Listing[] = [];
  const archivedIds: string[] = [];

  wishlistQueries.forEach((q, i) => {
    if (q.isSuccess) {
      if (q.data) {
        availableListings.push(q.data);
      } else {
        archivedIds.push(activeIds[i]);
      }
    }
  });

  const totalCount = availableListings.length + archivedIds.length;

  return (
    <TenantLayout>
      <div className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-cairo">عقاراتي المفضلة</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-cairo text-sm">
            الشقق والأسرة التي قمت بحفظها للمقارنة والرجوع إليها لاحقاً.
          </p>
        </div>

        {/* Wishlist Grid & States */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {Array.from({ length: Math.max(activeIds.length, 3) }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : totalCount === 0 ? (
          <EmptyState
            icon={
              <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Heart size={32} className="fill-red-500/20" />
              </div>
            }
            title="لا توجد عقارات في المفضلة"
            description="لم تقم بإضافة أي عقار إلى المفضلة بعد. تصفح العقارات المتاحة الآن لتبدأ الحفظ."
            action={
              <Link href={`/${locale}/search`}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2.5 font-cairo font-bold flex items-center gap-1.5 mx-auto">
                  <Search size={16} />
                  <span>تصفح العقارات المتاحة</span>
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {/* Available listings */}
            {availableListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
            {/* Archived listings — show badge + remove button */}
            {archivedIds.map((id) => (
              <ArchivedListingCard
                key={id}
                listingId={id}
                onRemove={(removedId) => setRemoved((prev) => [...prev, removedId])}
              />
            ))}
          </div>
        )}

      </div>
    </TenantLayout>
  );
}
