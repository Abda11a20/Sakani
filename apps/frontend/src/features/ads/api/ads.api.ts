import { api } from '@/lib/api';
import type { Advertisement, CreateAdPayload, AdStatus } from '../types/ads.types';

export const adsApi = {
  createAd: async (payload: CreateAdPayload): Promise<Advertisement> => {
    const res = await api.post('/admin/ads', payload);
    return res.data;
  },
  updateAdStatus: async (adId: string, status: AdStatus): Promise<Advertisement> => {
    const res = await api.patch(`/admin/ads/${adId}/status`, { status });
    return res.data;
  },
  deleteAd: async (adId: string): Promise<{ message: string }> => {
    const res = await api.delete(`/admin/ads/${adId}`);
    return res.data;
  },
  submitForReview: async (adId: string): Promise<Advertisement> => {
    const res = await api.post(`/admin/ads/${adId}/submit-review`);
    return res.data;
  },
  approveAd: async (adId: string): Promise<Advertisement> => {
    const res = await api.post(`/admin/ads/${adId}/approve`);
    return res.data;
  },
  publishAd: async (adId: string): Promise<Advertisement> => {
    const res = await api.post(`/admin/ads/${adId}/publish`);
    return res.data;
  },
  debugAdMatching: async (params: any) => {
    const res = await api.get('/admin/ads/debug', { params });
    return res.data;
  },
};
