// apps/frontend/src/app/[locale]/dashboard/landlord/listings/add/page.tsx
"use client";

import React from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useCreateListing } from "@/hooks/useListings";
import LandlordLayout from "@/components/layout/LandlordLayout";
import ListingForm from "@/components/dashboard/ListingForm";
import { Spinner } from "@/components/ui";

export default function AddListingPage() {
  const { user, isLoading } = useAuthGuard({ requiredRoles: ["landlord"] });
  const { mutateAsync: createListing, isPending } = useCreateListing();

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleSubmit = async (data: any) => {
    return await createListing(data);
  };

  return (
    <LandlordLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-cairo">إضافة إعلان جديد</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-cairo text-sm">
            املأ الخطوات الأربع التالية لنشر عقارك على منصة سكني.
          </p>
        </div>

        <ListingForm onSubmit={handleSubmit} isSubmitting={isPending} />
      </div>
    </LandlordLayout>
  );
}
