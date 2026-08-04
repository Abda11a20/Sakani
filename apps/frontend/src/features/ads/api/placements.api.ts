import { api } from '@/lib/api';
import type { PlacementConfig } from '../types/ads.types';

export const placementsApi = {
  togglePlacement: async (key: string, enabled: boolean): Promise<PlacementConfig> => {
    const res = await api.patch(`/admin/ads/placements/${key}`, { enabled });
    return res.data;
  },
};
