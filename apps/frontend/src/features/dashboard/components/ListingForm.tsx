// apps/frontend/src/components/dashboard/ListingForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useToast } from "@/components/ui";
import { useUploadListingImages, useDeleteImage, useReorderImages } from "@/hooks/useUploads";
import { uploadsApi } from "@/features/uploads";
import { useGeocoding } from "@/hooks/useGeocoding";
import { useListingFormState } from "@/hooks/form/useListingFormState";
import { useListingImagesManager } from "@/hooks/form/useListingImagesManager";
import { useListingFormValidation } from "@/hooks/form/useListingFormValidation";
import type { Listing } from "@/types";

// Pure UI Components
import type { LocationCandidate } from "./form/listing-form.types";
import { ListingFormWizardHeader } from "./form/ListingFormWizardHeader";
import { ListingFormLocationStep } from "./form/ListingFormLocationStep";
import { ListingFormSpecsStep } from "./form/ListingFormSpecsStep";
import { ListingFormImagesStep } from "./form/ListingFormImagesStep";
import { ListingFormFinancialStep } from "./form/ListingFormFinancialStep";
import { ListingFormNavigation } from "./form/ListingFormNavigation";

interface ListingFormProps {
  initialData?: Listing;
  onSubmit: (data: any) => Promise<Listing>;
  isSubmitting: boolean;
}

export function ListingForm({ initialData, onSubmit, isSubmitting }: ListingFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(!!initialData?.hasExactLocation);
  const { searchAddress, isLoading: isGeocodingLoading, candidates, errorMessage: geocodeError } = useGeocoding();

  const {
    formData,
    setFormData,
    handleFieldChange,
    handleToggleAmenity,
    handleFurnishedChange,
  } = useListingFormState(initialData);

  const {
    images,
    handleImageChange,
    removeImage,
    moveImage,
  } = useListingImagesManager(initialData);

  const { errors, validateStep } = useListingFormValidation(formData, images);

  useUploadListingImages(initialData?.id || "");
  useDeleteImage();
  useReorderImages(initialData?.id || "");

  useEffect(() => {
    if (initialData) {
      setShowMap(!!initialData.hasExactLocation);
    }
  }, [initialData]);

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleStepClick = (step: number) => {
    if (initialData || step < currentStep || validateStep(currentStep)) {
      setCurrentStep(step);
    }
  };

  const handleExploreLocation = async () => {
    setShowMap(true);
    const results = await searchAddress(formData.governorate, formData.district, formData.address);
    if (results && results.length > 0) {
      setFormData((prev) => ({
        ...prev,
        lat: results[0].lat,
        lng: results[0].lng,
      }));
    }
  };

  const handleSelectCandidate = (candidate: LocationCandidate) => {
    setFormData((prev) => ({ ...prev, lat: candidate.lat, lng: candidate.lng }));
  };

  const handleFinalSubmit = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (currentStep < 4) return;
    if (isLocalSubmitting || isSubmitting) return;
    if (!validateStep(4)) return;

    setIsLocalSubmitting(true);
    try {
      const payload = {
        title: `عقار للإيجار في ${formData.district} - ${formData.governorate}`,
        description: formData.description || "لا يوجد وصف إضافي.",
        unitType: formData.unitType,
        price: Number(formData.price),
        securityDeposit: Number(formData.securityDeposit),
        includesBills: formData.includesBills,
        electricityType: formData.electricityType,
        isFurnished: formData.unitType === "bed" ? true : formData.isFurnished,
        totalBeds: formData.unitType === "bed" ? Number(formData.totalBeds) : undefined,
        genderTarget: formData.genderTarget,
        governorate: formData.governorate,
        district: formData.district,
        address: formData.address,
        lat: formData.lat ?? 30.0444,
        lng: formData.lng ?? 31.2357,
        hasExactLocation: formData.hasExactLocation,
        amenities: formData.amenities,
        roommateFeatureEnabled: formData.roommateFeatureEnabled,
      };

      let listing;
      try {
        listing = await onSubmit(payload);
      } catch (err: any) {
        toast({
          title: "حدث خطأ",
          description: err.friendlyMessage || "فشل حفظ تفاصيل العقار. يرجى مراجعة المدخلات.",
          type: "error",
        });
        return;
      }

      const newFiles = images.filter((img) => img.isNew && img.file).map((img) => img.file as File);
      let imagesUploaded = true;

      if (newFiles.length > 0) {
        try {
          const uploadFormData = new FormData();
          newFiles.forEach((file) => {
            uploadFormData.append("images", file);
          });

          await uploadsApi.listingImages(listing.id, uploadFormData);
        } catch {
          imagesUploaded = false;
        }
      }

      if (imagesUploaded) {
        toast({
          title: initialData ? "تم تعديل الإعلان" : "تم نشر الإعلان بنجاح",
          description: initialData ? "تم تعديل تفاصيل العقار بنجاح" : "تم نشر عقارك بنجاح وهو الآن قيد المراجعة.",
          type: "success",
        });
      } else {
        toast({
          title: initialData ? "تم التعديل جزئياً" : "تم النشر مع فشل رفع الصور",
          description: "تم حفظ تفاصيل الإعلان بنجاح، ولكن فشل رفع الصور. يمكنك إضافتها لاحقاً من صفحة التعديل.",
          type: "warning",
        });
      }

      router.push(`/${locale}/dashboard/landlord/listings`);
    } finally {
      setIsLocalSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
      <ListingFormWizardHeader currentStep={currentStep} onStepClick={handleStepClick} />

      <form
        onSubmit={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
            e.preventDefault();
          }
        }}
        className="space-y-6"
      >
        {currentStep === 1 && (
          <ListingFormLocationStep
            formData={formData}
            errors={errors}
            showMap={showMap}
            isGeocodingLoading={isGeocodingLoading}
            candidates={candidates as LocationCandidate[]}
            geocodeError={geocodeError}
            onChange={handleFieldChange}
            onExploreLocation={handleExploreLocation}
            onSelectCandidate={handleSelectCandidate}
            onToggleMap={(show) => setShowMap(show)}
            onConfirmLocation={() => handleFieldChange("hasExactLocation", true)}
            onClearLocation={() => {
              setShowMap(false);
              handleFieldChange("lat", null);
              handleFieldChange("lng", null);
              handleFieldChange("hasExactLocation", false);
            }}
          />
        )}

        {currentStep === 2 && (
          <ListingFormSpecsStep
            formData={formData}
            errors={errors}
            onChange={handleFieldChange}
            onToggleAmenity={handleToggleAmenity}
            onFurnishedChange={handleFurnishedChange}
          />
        )}

        {currentStep === 3 && (
          <ListingFormImagesStep
            images={images}
            error={errors.images}
            onImageChange={handleImageChange}
            onRemoveImage={removeImage}
            onMoveImage={moveImage}
          />
        )}

        {currentStep === 4 && (
          <ListingFormFinancialStep
            formData={formData}
            errors={errors}
            onChange={handleFieldChange}
          />
        )}

        <ListingFormNavigation
          currentStep={currentStep}
          totalSteps={4}
          isSubmitting={isSubmitting}
          isLocalSubmitting={isLocalSubmitting}
          isEditMode={!!initialData}
          onPrev={handlePrev}
          onNext={handleNext}
          onSubmit={handleFinalSubmit}
        />
      </form>
    </div>
  );
}
