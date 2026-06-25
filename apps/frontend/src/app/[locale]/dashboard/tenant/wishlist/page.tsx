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
import { Heart, Search } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";

export default function TenantWishlist() {
  const locale = useLocale();
  const { user, isLoading: isAuthLoading } = useAuthGuard();
  
  // Get client-side wishlist IDs
  const { wishlistIds } = useWishlist();

  // Load details in parallel for each listing in the wishlist
  const wishlistQueries = useQueries({
    queries: wishlistIds.map((id) => ({
      queryKey: ["listings", id],
      queryFn: async (): Promise<Listing> => {
        const response = await api.get<Listing>(`/listings/${id}`);
        return response.data;
      },
      retry: false, // Don't retry endlessly if the listing was deleted
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

  // Filter out any undefined/failed queries
  const listings = wishlistQueries
    .map((q) => q.data)
    .filter((listing): listing is Listing => !!listing);

  return (
    <TenantLayout>
      <div className="space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-cairo">عقاراتي المفضلة</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-cairo text-sm">
            العقارات والغرف والأسرة التي قمت بحفظها للمقارنة والرجوع إليها لاحقاً.
          </p>
        </div>

        {/* Wishlist Grid & States */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: Math.max(wishlistIds.length, 3) }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : listings.length === 0 ? (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

      </div>
    </TenantLayout>
  );
}
