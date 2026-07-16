// apps/frontend/src/hooks/useBeds.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { bedsApi } from "@/lib/api/beds.api";
import type { Bed } from "@/types";

export interface BedStats {
  total: number;
  available: number;
  rented: number;
}

export interface RentBedPayload {
  tenantId: string;
  startDate: string;
  endDate: string;
}

export const useListingBeds = (listingId: string | null | undefined, isLandlord = false) => {
  return useQuery<Bed[]>({
    queryKey: ["listings", listingId, "beds", isLandlord],
    queryFn: async (): Promise<Bed[]> => {
      if (!listingId) return [];
      // المؤجر يستخدم endpoint /all خاص — يبقى مع api مباشرة
      if (isLandlord) {
        const response = await api.get<any[]>(`/listings/${listingId}/beds/all`);
        return response.data.map((bed: any) => ({
          ...bed,
          isAvailable: bed.status === "available",
        }));
      }
      const response = await bedsApi.getByListing(listingId);
      return (response.data as any[]).map((bed: any) => ({
        ...bed,
        isAvailable: bed.status === "available",
      }));
    },
    enabled: !!listingId,
  });
};

export const useListingBedStats = (listingId: string | null | undefined) => {
  return useQuery<BedStats>({
    queryKey: ["listings", listingId, "beds", "stats"],
    queryFn: async (): Promise<BedStats> => {
      if (!listingId) return { total: 0, available: 0, rented: 0 };
      const response = await bedsApi.getStats(listingId);
      return response.data as BedStats;
    },
    enabled: !!listingId,
  });
};

export const useRentBed = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { bedId: string; data: RentBedPayload }>({
    mutationFn: async ({ bedId, data }): Promise<any> => {
      const response = await bedsApi.rent(bedId, {
        tenantId: data.tenantId,
        rentedSince: data.startDate,
        rentedUntil: data.endDate,
      });
      return response.data;
    },
    onSuccess: (data) => {
      const bed = data?.bed || data;
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      if (bed?.listingId) {
        queryClient.invalidateQueries({ queryKey: ["listings", bed.listingId] });
        queryClient.invalidateQueries({ queryKey: ["listings", bed.listingId, "beds"] });
      }
    },
  });
};

export const useVacateBed = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, string>({
    mutationFn: async (bedId): Promise<any> => {
      const response = await bedsApi.vacate(bedId);
      return response.data;
    },
    onSuccess: (data) => {
      const bed = data?.bed || data;
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      if (bed?.listingId) {
        queryClient.invalidateQueries({ queryKey: ["listings", bed.listingId] });
        queryClient.invalidateQueries({ queryKey: ["listings", bed.listingId, "beds"] });
      }
    },
  });
};
