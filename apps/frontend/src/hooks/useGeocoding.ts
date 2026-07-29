// apps/frontend/src/hooks/useGeocoding.ts

import { useState, useCallback } from "react";
import { locationApi, type LocationCandidate } from "@/features/location";

export type { LocationCandidate };

export function useGeocoding() {
  const [isLoading, setIsLoading] = useState(false);
  const [candidates, setCandidates] = useState<LocationCandidate[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchAddress = useCallback(
    async (governorate?: string, district?: string, address?: string) => {
      if (!governorate && !district && !address) {
        setCandidates([]);
        return [];
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const data = await locationApi.geocode({ governorate, district, address });
        const results = data.results || [];
        setCandidates(results);

        if (results.length === 0) {
          setErrorMessage(
            data.message ||
              "لم نتمكن من الوصول لموقع دقيق تلقائياً. يمكنك تحريك الدبوس وتحديد الموقع بنفسك على الخريطة."
          );
        }

        return results;
      } catch {
        setCandidates([]);
        setErrorMessage("تعذر الاتصال بخدمة التحويل الجغرافي. يمكنك اختيار الموقع يدويًا على الخريطة.");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    searchAddress,
    isLoading,
    candidates,
    errorMessage,
    clearCandidates: () => setCandidates([]),
  };
}
