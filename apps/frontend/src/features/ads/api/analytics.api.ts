import { api } from '@/lib/api';
import type { AdsDashboardAnalytics } from '../types/ads.types';

export const analyticsApi = {
  getDashboardAnalytics: async (): Promise<AdsDashboardAnalytics> => {
    const res = await api.get('/admin/ads/analytics');
    return res.data;
  },
  toggleSystemSetting: async (key: string, value: boolean) => {
    const res = await api.patch(`/admin/ads/settings/${key}`, { value });
    return res.data;
  },
};
