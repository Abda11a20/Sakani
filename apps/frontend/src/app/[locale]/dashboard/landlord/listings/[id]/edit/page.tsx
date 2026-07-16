// apps/frontend/src/app/[locale]/dashboard/landlord/listings/[id]/edit/page.tsx
"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useListing, useUpdateListing } from "@/hooks/useListings";
import LandlordLayout from "@/components/layout/LandlordLayout";
import ListingForm from "@/components/dashboard/ListingForm";
import { Spinner } from "@/components/ui";

export default function EditListingPage() {
  const params = useParams();
  const id = params?.id as string;

  const { user, isLoading: isAuthLoading } = useAuthGuard({ requiredRoles: ["landlord"] });
  const { data: listing, isLoading: isListingLoading } = useListing(id);
  const { mutateAsync: updateListing, isPending: isUpdating } = useUpdateListing(id);

  const isLoading = isAuthLoading || isListingLoading;

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!listing) {
    return (
      <LandlordLayout>
        <div className="text-center py-20 font-cairo">
          <p className="text-slate-500">الإعلان غير موجود أو لا تملك صلاحية تعديله.</p>
        </div>
      </LandlordLayout>
    );
  }

  const handleSubmit = async (data: any) => {
    return await updateListing(data);
  };

  return (
    <LandlordLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-cairo">تعديل الإعلان</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-cairo text-sm">
            قم بتحديث مواصفات أو صور أو سعر العقار المنشور.
          </p>
        </div>

        <ListingForm initialData={listing} onSubmit={handleSubmit} isSubmitting={isUpdating} />
      </div>
    </LandlordLayout>
  );
}
