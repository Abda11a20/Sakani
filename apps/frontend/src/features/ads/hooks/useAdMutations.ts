import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adsApi } from '../api/ads.api';
import { placementsApi } from '../api/placements.api';
import { CAMPAIGNS_QUERY_KEY } from './useCampaigns';
import { ADS_ANALYTICS_QUERY_KEY } from './useAdsAnalytics';
import type { CreateAdPayload, AdStatus } from '../types/ads.types';

export function useAdMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ADS_ANALYTICS_QUERY_KEY });
  };

  const createAdMutation = useMutation({
    mutationFn: (payload: CreateAdPayload) => adsApi.createAd(payload),
    onSuccess: invalidateAll,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ adId, status }: { adId: string; status: AdStatus }) =>
      adsApi.updateAdStatus(adId, status),
    onSuccess: invalidateAll,
  });

  const deleteAdMutation = useMutation({
    mutationFn: (adId: string) => adsApi.deleteAd(adId),
    onSuccess: invalidateAll,
  });

  const workflowActionMutation = useMutation({
    mutationFn: ({ adId, action }: { adId: string; action: 'submit-review' | 'approve' | 'publish' }) => {
      if (action === 'submit-review') return adsApi.submitForReview(adId);
      if (action === 'approve') return adsApi.approveAd(adId);
      return adsApi.publishAd(adId);
    },
    onSuccess: invalidateAll,
  });

  const togglePlacementMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      placementsApi.togglePlacement(key, enabled),
    onSuccess: invalidateAll,
  });

  return {
    createAd: createAdMutation.mutateAsync,
    isCreatingAd: createAdMutation.isPending,
    updateStatus: updateStatusMutation.mutateAsync,
    deleteAd: deleteAdMutation.mutateAsync,
    workflowAction: workflowActionMutation.mutateAsync,
    togglePlacement: togglePlacementMutation.mutateAsync,
  };
}
