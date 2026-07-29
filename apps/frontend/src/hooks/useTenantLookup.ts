// apps/frontend/src/hooks/useTenantLookup.ts
import { useQuery } from "@tanstack/react-query";
import { profileRepository, type TenantLookupResult } from "@/features/profile";
import { isAxiosError } from "axios";

export type { TenantLookupResult };

export const useTenantLookup = (phone: string, enabled = true) => {
  const cleanPhone = phone.trim();
  const isValidPhone = cleanPhone.length >= 10;

  return useQuery<TenantLookupResult | null, Error>({
    queryKey: ["tenant-lookup", cleanPhone],
    queryFn: async () => {
      try {
        return await profileRepository.lookupByPhone(cleanPhone);
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: enabled && isValidPhone,
    staleTime: 60 * 1000,
    retry: false,
  });
};

export const useLookupTenantByPhone = useTenantLookup;
