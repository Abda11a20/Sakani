// apps/frontend/src/hooks/form/useListingFormValidation.ts
"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
import type { ListingFormData, ListingFormImageItem } from "@/features/dashboard/components/form/listing-form.types";

const step1Schema = z.object({
  governorate: z.string().min(1, "المحافظة مطلوبة"),
  district: z.string().min(1, "الحي/المنطقة مطلوبة"),
  address: z.string().min(5, "العنوان التفصيلي يجب أن لا يقل عن 5 أحرف"),
  lat: z.coerce.number().optional().default(30.0444),
  lng: z.coerce.number().optional().default(31.2357),
});

const step2Schema = z
  .object({
    unitType: z.enum(["apartment", "bed"]),
    totalBeds: z.coerce.number().optional(),
    genderTarget: z.enum(["mixed", "male", "female"]),
    amenities: z.array(z.string()),
    electricityType: z.enum(["prepaid_card", "old_meter"]),
    description: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.unitType === "bed" && (!data.totalBeds || data.totalBeds < 1)) {
        return false;
      }
      return true;
    },
    {
      message: "عدد الأسرة مطلوب ويجب أن يكون 1 على الأقل عند اختيار نوع سرير",
      path: ["totalBeds"],
    }
  );

const step4Schema = z.object({
  price: z.coerce.number().min(1, "سعر الإيجار يجب أن يكون أكبر من 0"),
  securityDeposit: z.coerce.number().min(0, "مبلغ التأمين لا يمكن أن يكون سالباً"),
  includesBills: z.boolean(),
  roommateFeatureEnabled: z.boolean().optional(),
});

export function useListingFormValidation(
  formData: ListingFormData,
  images: ListingFormImageItem[]
) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = useCallback(
    (step: number): boolean => {
      setErrors({});
      if (step === 1) {
        const res = step1Schema.safeParse({
          governorate: formData.governorate,
          district: formData.district,
          address: formData.address,
          lat: formData.lat,
          lng: formData.lng,
        });
        if (!res.success) {
          const errs: Record<string, string> = {};
          res.error.issues.forEach((e) => {
            if (e.path[0]) errs[e.path[0] as string] = e.message;
          });
          setErrors(errs);
          return false;
        }
      } else if (step === 2) {
        const res = step2Schema.safeParse({
          unitType: formData.unitType,
          totalBeds: formData.totalBeds,
          genderTarget: formData.genderTarget,
          amenities: formData.amenities,
          electricityType: formData.electricityType,
          description: formData.description,
        });
        if (!res.success) {
          const errs: Record<string, string> = {};
          res.error.issues.forEach((e) => {
            if (e.path[0]) errs[e.path[0] as string] = e.message;
          });
          setErrors(errs);
          return false;
        }
      } else if (step === 3) {
        if (images.length === 0) {
          setErrors({ images: "يجب اختيار صورة واحدة على الأقل للعقار" });
          return false;
        }
      } else if (step === 4) {
        const res = step4Schema.safeParse({
          price: formData.price,
          securityDeposit: formData.securityDeposit,
          includesBills: formData.includesBills,
          roommateFeatureEnabled: formData.roommateFeatureEnabled,
        });
        if (!res.success) {
          const errs: Record<string, string> = {};
          res.error.issues.forEach((e) => {
            if (e.path[0]) errs[e.path[0] as string] = e.message;
          });
          setErrors(errs);
          return false;
        }
      }
      return true;
    },
    [formData, images]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  }, []);

  return {
    errors,
    validateStep,
    clearErrors,
    clearFieldError,
  };
}
