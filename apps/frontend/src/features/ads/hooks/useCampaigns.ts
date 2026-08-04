import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi } from '../api/campaigns.api';
import type { CreateCampaignPayload } from '../types/ads.types';

export const CAMPAIGNS_QUERY_KEY = ['admin', 'ads', 'campaigns'];

export function useCampaigns() {
  const queryClient = useQueryClient();

  const campaignsQuery = useQuery({
    queryKey: CAMPAIGNS_QUERY_KEY,
    queryFn: () => campaignsApi.getAllCampaigns(),
  });

  const createCampaignMutation = useMutation({
    mutationFn: (payload: CreateCampaignPayload) => campaignsApi.createCampaign(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY });
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateCampaignPayload> }) =>
      campaignsApi.updateCampaign(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY });
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY });
    },
  });

  return {
    campaigns: campaignsQuery.data || [],
    isLoading: campaignsQuery.isLoading,
    isError: campaignsQuery.isError,
    error: campaignsQuery.error,
    refetch: campaignsQuery.refetch,
    createCampaign: createCampaignMutation.mutateAsync,
    updateCampaign: updateCampaignMutation.mutateAsync,
    deleteCampaign: deleteCampaignMutation.mutateAsync,
    isCreating: createCampaignMutation.isPending,
    isUpdating: updateCampaignMutation.isPending,
  };
}
