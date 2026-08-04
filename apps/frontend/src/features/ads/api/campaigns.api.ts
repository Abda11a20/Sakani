import { api } from '@/lib/api';
import type { Campaign, CreateCampaignPayload } from '../types/ads.types';

export const campaignsApi = {
  getAllCampaigns: async (): Promise<Campaign[]> => {
    const res = await api.get('/admin/ads/campaigns');
    return res.data;
  },
  createCampaign: async (payload: CreateCampaignPayload): Promise<Campaign> => {
    const res = await api.post('/admin/ads/campaigns', payload);
    return res.data;
  },
  updateCampaign: async (id: string, payload: Partial<CreateCampaignPayload>): Promise<Campaign> => {
    const res = await api.patch(`/admin/ads/campaigns/${id}`, payload);
    return res.data;
  },
  deleteCampaign: async (id: string): Promise<{ message: string }> => {
    const res = await api.delete(`/admin/ads/campaigns/${id}`);
    return res.data;
  },
  updateAd: async (id: string, payload: any): Promise<any> => {
    const res = await api.patch(`/admin/ads/${id}`, payload);
    return res.data;
  },
};
