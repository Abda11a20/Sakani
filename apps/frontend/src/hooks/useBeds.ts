// apps/frontend/src/hooks/useBeds.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bedsApi } from "@/features/beds";
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

type BedFromApi = Bed & { status?: string };

interface RentBedResponse {
  bed?: BedFromApi;
  message?: string;
}

interface VacateBedResponse {
  bed?: BedFromApi;
  message?: string;
}

export const useListingBeds = (listingId: string | null | undefined, isLandlord = false) => {
  return useQuery<Bed[]>({
    queryKey: ["listings", listingId, "beds", isLandlord],
    queryFn: async (): Promise<Bed[]> => {
      if (!listingId) return [];
      if (isLandlord) {
        const response = await bedsApi.getAllByListing(listingId);
        return (response.data as BedFromApi[]).map((bed) => ({
          ...bed,
          isAvailable: bed.status === "available",
        }));
      }
      const response = await bedsApi.getByListing(listingId);
      return (response.data as BedFromApi[]).map((bed) => ({
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

  return useMutation<RentBedResponse, Error, { bedId: string; data: RentBedPayload }>({
    mutationFn: async ({ bedId, data }): Promise<RentBedResponse> => {
      const response = await bedsApi.rent(bedId, {
        tenantId: data.tenantId,
        rentedSince: data.startDate,
        rentedUntil: data.endDate,
      });
      return response.data as RentBedResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      const listingId = data?.bed?.listingId;
      if (listingId) {
        queryClient.invalidateQueries({ queryKey: ["listings", listingId] });
        queryClient.invalidateQueries({ queryKey: ["listings", listingId, "beds"] });
      }
    },
  });
};

export const useVacateBed = () => {
  const queryClient = useQueryClient();

  return useMutation<VacateBedResponse, Error, string>({
    mutationFn: async (bedId): Promise<VacateBedResponse> => {
      const response = await bedsApi.vacate(bedId);
      return response.data as VacateBedResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      const listingId = data?.bed?.listingId;
      if (listingId) {
        queryClient.invalidateQueries({ queryKey: ["listings", listingId] });
        queryClient.invalidateQueries({ queryKey: ["listings", listingId, "beds"] });
      }
    },
  });
};
