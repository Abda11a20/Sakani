// apps/frontend/src/hooks/useListings.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Listing } from "@/types";

export const useMyListings = () => {
  return useQuery<Listing[]>({
    queryKey: ["listings", "my"],
    queryFn: async (): Promise<Listing[]> => {
      const response = await api.get<Listing[]>("/listings/my");
      return response.data;
    },
  });
};

export const useListing = (id: string | null | undefined) => {
  return useQuery<Listing>({
    queryKey: ["listings", id],
    queryFn: async (): Promise<Listing> => {
      if (!id) throw new Error("Listing ID is required");
      const response = await api.get<Listing>(`/listings/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateListing = () => {
  const queryClient = useQueryClient();

  return useMutation<Listing, Error, Omit<Partial<Listing>, "id">>({
    mutationFn: async (data): Promise<Listing> => {
      const response = await api.post<Listing>("/listings", data);
      return response.data;
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
      const response = await api.patch<Listing>(`/listings/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings", id] });
    },
  });
};

export const useDeleteListing = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id): Promise<void> => {
      await api.delete(`/listings/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings", id] });
    },
  });
};

export const useVacateUnit = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, string>({
    mutationFn: async (id): Promise<any> => {
      const response = await api.patch<any>(`/listings/${id}/vacate`);
      return response.data;
    },
    onSuccess: (data, id) => {
      const listing = data?.listing;
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings", id] });
      queryClient.invalidateQueries({ queryKey: ["listings", "my"] });
      if (listing?.id) {
        queryClient.setQueryData(["listings", listing.id], listing);
        queryClient.setQueryData<Listing[]>(["listings", "my"], (current) =>
          current?.map((item) => (item.id === listing.id ? { ...item, ...listing } : item))
        );
      }
    },
  });
};
