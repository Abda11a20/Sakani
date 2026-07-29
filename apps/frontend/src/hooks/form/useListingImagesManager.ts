// apps/frontend/src/hooks/form/useListingImagesManager.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui";
import type { Listing } from "@/types";
import type { ListingFormImageItem } from "@/features/dashboard/components/form/listing-form.types";

function buildInitialImages(initialData?: Listing): ListingFormImageItem[] {
  if (initialData?.images && Array.isArray(initialData.images)) {
    return initialData.images.map((img: any, idx) => {
      const imgUrl = typeof img === "object" && img !== null ? img.url : img;
      const imgId = typeof img === "object" && img !== null ? img.id : String(idx);
      return {
        id: imgId,
        url: imgUrl,
        isNew: false,
      };
    });
  }
  return [];
}

export function useListingImagesManager(initialData?: Listing) {
  const { toast } = useToast();
  const [images, setImages] = useState<ListingFormImageItem[]>(() => buildInitialImages(initialData));

  // Sync initial images when initialData ID changes
  useEffect(() => {
    if (initialData?.id) {
      setImages(buildInitialImages(initialData));
    }
  }, [initialData?.id]);

  // Memory cleanup for generated Object URLs
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.isNew && img.url.startsWith("blob:")) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, []);

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const filesArr = Array.from(e.target.files);
        const validFiles: ListingFormImageItem[] = [];

        filesArr.forEach((file) => {
          if (file.size > 5 * 1024 * 1024) {
            toast({
              title: "الملف كبير جداً",
              description: `الملف ${file.name} يتجاوز 5 ميجابايت.`,
              type: "error",
            });
            return;
          }
          if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            toast({
              title: "تنسيق غير مدعوم",
              description: `الملف ${file.name} ليس بتنسيق JPEG أو PNG أو WEBP.`,
              type: "error",
            });
            return;
          }

          validFiles.push({
            url: URL.createObjectURL(file),
            file,
            isNew: true,
          });
        });

        setImages((prev) => {
          if (prev.length + validFiles.length > 10) {
            toast({
              title: "الحد الأقصى للصور",
              description: "يمكنك رفع 10 صور كحد أقصى للعقار الواحد.",
              type: "error",
            });
            return prev;
          }
          return [...prev, ...validFiles];
        });
      }
    },
    [toast]
  );

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const target = prev[index];
      if (target?.isNew && target.url.startsWith("blob:")) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((_, idx) => idx !== index);
    });
  }, []);

  const moveImage = useCallback((index: number, direction: "left" | "right") => {
    setImages((prev) => {
      const newIdx = direction === "left" ? index - 1 : index + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;

      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[newIdx];
      copy[newIdx] = temp;
      return copy;
    });
  }, []);

  const resetImages = useCallback((data?: Listing) => {
    setImages(buildInitialImages(data));
  }, []);

  return {
    images,
    setImages,
    handleImageChange,
    removeImage,
    moveImage,
    resetImages,
  };
}
