// apps/frontend/src/hooks/useTenantLookup.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { isAxiosError } from "axios";

export interface TenantLookupResult {
  id: string;
  name: string;
  phone: string;
  role: string;
}

export const useLookupTenantByPhone = (phone: string) => {
  const cleaned = phone.replace(/[^0-9]/g, "");
  
  return useQuery<TenantLookupResult | null>({
    queryKey: ["users", "lookup-phone", cleaned],
    queryFn: async (): Promise<TenantLookupResult | null> => {
      if (cleaned.length < 11) return null;
      try {
        const response = await api.get<TenantLookupResult>(
          `/users/lookup-by-phone?phone=${cleaned}`
        );
        return response.data;
      } catch (err: unknown) {
        // Return null if tenant is not found (404)
        if (isAxiosError(err) && err.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: cleaned.length >= 11,
    staleTime: 300_000, // Cache results for 5 minutes
  });
};
