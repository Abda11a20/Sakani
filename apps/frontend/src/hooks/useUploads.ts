// apps/frontend/src/hooks/useUploads.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface UploadImageResult {
  id: string;
  url: string;
  order: number;
}

export const useUploadListingImages = (listingId: string) => {
  const queryClient = useQueryClient();

  return useMutation<UploadImageResult[], Error, File[]>({
    mutationFn: async (files): Promise<UploadImageResult[]> => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("images", file);
      });

      const response = await api.post<UploadImageResult[]>(
        `/uploads/listings/${listingId}/images`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings", listingId] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
};

export const useDeleteImage = () => {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error, { imageId: string; listingId?: string }>({
    mutationFn: async ({ imageId }) => {
      const response = await api.delete<{ success: boolean; message: string }>(
        `/uploads/images/${imageId}`
      );
      return response.data;
    },
    onSuccess: (_, { listingId }) => {
      if (listingId) {
        queryClient.invalidateQueries({ queryKey: ["listings", listingId] });
      }
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
};

export const useReorderImages = (listingId: string) => {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error, string[]>({
    mutationFn: async (imageIds) => {
      const response = await api.patch<{ success: boolean; message: string }>(
        `/uploads/listings/${listingId}/images/reorder`,
        { imageIds }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings", listingId] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
};
