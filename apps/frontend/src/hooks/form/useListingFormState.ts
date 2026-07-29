// apps/frontend/src/hooks/form/useListingFormState.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Listing } from "@/types";
import type { ListingFormData } from "@/features/dashboard/components/form/listing-form.types";

function buildInitialState(initialData?: Listing): ListingFormData {
  return {
    governorate: initialData?.governorate || "القاهرة",
    district: initialData?.district || "",
    address: initialData?.address || "",
    lat: initialData?.latitude || null,
    lng: initialData?.longitude || null,
    hasExactLocation: initialData?.hasExactLocation || false,
    unitType: initialData?.unitType || "apartment",
    isFurnished: initialData?.isFurnished !== undefined ? initialData.isFurnished : true,
    totalBeds:
      initialData?.totalBeds !== undefined && initialData?.totalBeds !== null
        ? String(initialData.totalBeds)
        : "",
    genderTarget: initialData?.genderTarget || "mixed",
    amenities: initialData?.amenities || [],
    electricityType:
      (initialData?.electricityType === "modern_meter" ? "prepaid_card" : initialData?.electricityType) ||
      "prepaid_card",
    description: initialData?.description || "",
    price:
      initialData?.price !== undefined && initialData?.price !== null
        ? String(initialData.price)
        : "",
    securityDeposit:
      initialData?.securityDeposit !== undefined && initialData?.securityDeposit !== null
        ? String(initialData.securityDeposit)
        : "",
    includesBills: initialData?.includesBills || false,
    roommateFeatureEnabled: initialData?.isFeatured || false,
  };
}

export function useListingFormState(initialData?: Listing) {
  const [formData, setFormData] = useState<ListingFormData>(() => buildInitialState(initialData));

  // Re-sync only when initialData ID actually changes
  useEffect(() => {
    if (initialData?.id) {
      setFormData(buildInitialState(initialData));
    }
  }, [initialData?.id]);

  const handleFieldChange = useCallback(
    <K extends keyof ListingFormData>(field: K, value: ListingFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleToggleAmenity = useCallback((key: string) => {
    setFormData((prev) => {
      const isChecked = prev.amenities.includes(key);
      const next = isChecked
        ? prev.amenities.filter((k) => k !== key)
        : [...prev.amenities, key];
      return { ...prev, amenities: next };
    });
  }, []);

  const handleFurnishedChange = useCallback((isFurnished: boolean) => {
    const APPLIANCE_KEYS = ["ac", "washer", "tv", "fan", "stove", "fridge", "water_heater"];
    setFormData((prev) => ({
      ...prev,
      isFurnished,
      amenities:
        isFurnished === false
          ? prev.amenities.filter((k) => !APPLIANCE_KEYS.includes(k))
          : prev.amenities,
    }));
  }, []);

  const resetForm = useCallback((data?: Listing) => {
    setFormData(buildInitialState(data));
  }, []);

  return {
    formData,
    setFormData,
    handleFieldChange,
    handleToggleAmenity,
    handleFurnishedChange,
    resetForm,
  };
}
