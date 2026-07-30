// apps/frontend/src/hooks/useListings.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { listingRepository, getListingByIdUseCase, createListingUseCase } from "@/features/listings";
import { useAuthStore } from "@/features/auth";
import type { Listing } from "@/types";

export const useMyListings = () => {
  const token = useAuthStore((s) => s.token);

  return useQuery<Listing[]>({
    queryKey: ["listings", "my"],
    queryFn: async (): Promise<Listing[]> => {
      const entities = await listingRepository.getMy();
      return entities.map((e) => e.toJSON() as Listing);
    },
    enabled: !!token,
    staleTime: 60_000,
  });
};

export const useListing = (id: string | null | undefined) => {
  return useQuery<Listing>({
    queryKey: ["listings", id],
    queryFn: async (): Promise<Listing> => {
      if (!id) throw new Error("Listing ID is required");
      const entity = await getListingByIdUseCase.execute(id);
      if (!entity) throw new Error("Listing not found");
      return entity.toJSON() as Listing;
    },
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
};

export const useCreateListing = () => {
  const queryClient = useQueryClient();

  return useMutation<Listing, Error, Omit<Partial<Listing>, "id">>({
    mutationFn: async (data): Promise<Listing> => {
      const entity = await createListingUseCase.execute(data as Record<string, unknown>);
      return entity.toJSON() as Listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
};

export const useUpdateListing = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<Listing, Error, Partial<Listing>>({
    mutationFn: async (data): Promise<Listing> => {
      const entity = await listingRepository.update(id, data as Record<string, unknown>);
      return entity.toJSON() as Listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings", id] });
    },
  });
};

export const useDeleteListing = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (listingId): Promise<void> => {
      await listingRepository.remove(listingId);
    },
    onSuccess: (_, listingId) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings", listingId] });
    },
  });
};

interface VacateUnitResponse {
  listing?: Listing;
  message?: string;
}

export const useVacateUnit = () => {
  const queryClient = useQueryClient();

  return useMutation<VacateUnitResponse, Error, string>({
    mutationFn: async (id): Promise<VacateUnitResponse> => {
      const response = await api.patch<VacateUnitResponse>(`/listings/${id}/vacate`);
      return response.data;
    },
    onSuccess: (data, id) => {
      const listing = data?.listing;
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings', id] });
      queryClient.invalidateQueries({ queryKey: ['listings', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['rental-history'] });
      if (listing?.id) {
        queryClient.setQueryData(['listings', listing.id], listing);
        queryClient.setQueryData<Listing[]>(['listings', 'my'], (current) =>
          current?.map((item) => (item.id === listing.id ? { ...item, ...listing } : item))
        );
      }
    },
  });
};

export const useRepublishListing = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string): Promise<void> => {
      await listingRepository.republish(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings', id] });
      queryClient.invalidateQueries({ queryKey: ['listings', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['rental-history'] });
    },
  });
};
