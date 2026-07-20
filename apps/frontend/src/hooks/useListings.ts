// apps/frontend/src/hooks/useListings.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { listingsApi } from "@/lib/api/listings.api";
import { useAuthStore } from "@/store/auth.store";
import type { Listing } from "@/types";

export const useMyListings = () => {
  const token = useAuthStore((s) => s.token);

  return useQuery<Listing[]>({
    queryKey: ["listings", "my"],
    queryFn: async (): Promise<Listing[]> => {
      const response = await listingsApi.getMy();
      return response.data as Listing[];
    },
    enabled: !!token,
  });
};

export const useListing = (id: string | null | undefined) => {
  return useQuery<Listing>({
    queryKey: ["listings", id],
    queryFn: async (): Promise<Listing> => {
      if (!id) throw new Error("Listing ID is required");
      const response = await listingsApi.getOne(id);
      return response.data as Listing;
    },
    enabled: !!id,
  });
};

export const useCreateListing = () => {
  const queryClient = useQueryClient();

  return useMutation<Listing, Error, Omit<Partial<Listing>, "id">>({
    mutationFn: async (data): Promise<Listing> => {
      const response = await listingsApi.create(data as Record<string, unknown>);
      return response.data as Listing;
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
      const response = await listingsApi.update(id, data as Record<string, unknown>);
      return response.data as Listing;
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
      await listingsApi.remove(listingId);
    },
    onSuccess: (_, listingId) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings", listingId] });
    },
  });
};

// Response type derived from the /listings/:id/vacate endpoint usage
interface VacateUnitResponse {
  listing?: Listing;
  message?: string;
}

// useVacateUnit uses a special endpoint not in listingsApi — kept with api directly
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
      if (listing?.id) {
        queryClient.setQueryData(['listings', listing.id], listing);
        queryClient.setQueryData<Listing[]>(['listings', 'my'], (current) =>
          current?.map((item) => (item.id === listing.id ? { ...item, ...listing } : item))
        );
      }
    },
  });
};
