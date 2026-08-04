import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics.api';

export const ADS_ANALYTICS_QUERY_KEY = ['admin', 'ads', 'analytics'];

export function useAdsAnalytics() {
  const queryClient = useQueryClient();

  const analyticsQuery = useQuery({
    queryKey: ADS_ANALYTICS_QUERY_KEY,
    queryFn: () => analyticsApi.getDashboardAnalytics(),
  });

  const toggleSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: boolean }) =>
      analyticsApi.toggleSystemSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADS_ANALYTICS_QUERY_KEY });
    },
  });

  return {
    ...analyticsQuery,
    toggleSetting: toggleSettingMutation.mutateAsync,
    isTogglingSetting: toggleSettingMutation.isPending,
  };
}
