// apps/frontend/src/components/dashboard/form/ListingFormNavigation.tsx
"use client";

import React from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";

interface ListingFormNavigationProps {
  currentStep: number;
  totalSteps?: number;
  isSubmitting: boolean;
  isLocalSubmitting: boolean;
  isEditMode: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function ListingFormNavigation({
  currentStep,
  totalSteps = 4,
  isSubmitting,
  isLocalSubmitting,
  isEditMode,
  onPrev,
  onNext,
  onSubmit,
}: ListingFormNavigationProps) {
  const isLoading = isSubmitting || isLocalSubmitting;

  return (
    <div className="flex justify-between items-center pt-6 border-t border-divider font-cairo">
      {currentStep > 1 ? (
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          leftIcon={<ArrowRight size={16} className="rtl:block hidden" />}
          rightIcon={<ArrowLeft size={16} className="rtl:hidden block" />}
        >
          السابق
        </Button>
      ) : (
        <div />
      )}

      {currentStep < totalSteps ? (
        <Button
          type="button"
          variant="primary"
          onClick={onNext}
          rightIcon={<ArrowLeft size={16} className="rtl:block hidden" />}
          leftIcon={<ArrowRight size={16} className="rtl:hidden block" />}
        >
          التالي
        </Button>
      ) : (
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={onSubmit}
          disabled={isLoading}
          loading={isLoading}
        >
          {isEditMode ? "تعديل وحفظ العقار" : "نشر الإعلان"}
        </Button>
      )}
    </div>
  );
}
