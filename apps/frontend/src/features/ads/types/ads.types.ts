export type TargetType = 'EXTERNAL_URL' | 'INTERNAL_PAGE' | 'WHATSAPP' | 'PHONE' | 'EMAIL' | 'APP_DEEP_LINK';
export type AdMediaType = 'IMAGE' | 'VIDEO';
export type AdDisplayType = 'BANNER' | 'INTERSTITIAL' | 'POPUP' | 'INLINE';
export type AdCategory = 'REAL_ESTATE' | 'FURNITURE' | 'RESTAURANTS' | 'BANKS' | 'SERVICES' | 'MEDICAL' | 'EDUCATION' | 'OTHER';
export type AdStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED';

export interface AdTarget {
  id?: string;
  type: TargetType;
  url?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  internalRoute?: string;
  appDeepLink?: string;
}

export interface AdMediaItem {
  id?: string;
  url: string;
  thumbnailUrl?: string;
  type?: AdMediaType;
  caption?: string;
  durationSeconds?: number;
  order?: number;
}

export interface Advertisement {
  id: string;
  campaignId: string;
  title: string;
  placementId?: string;
  placementKey?: string;
  placement?: { id: string; key: string; name: string };
  openMode?: string;
  displayType?: AdDisplayType;
  category?: AdCategory;
  viewsCount: number;
  clicksCount: number;
  ctr?: string;
  isPoorPerformance?: boolean;
  status: AdStatus;
  target?: AdTarget;
  mediaItems?: AdMediaItem[];
  campaign?: { id: string; name: string; clientName: string; campaignCode: string };
  isSkippable?: boolean;
  isClosable?: boolean;
  skipSeconds?: number;
  perUserFrequency?: string;
  maxDisplayPerSession?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Campaign {
  id: string;
  campaignCode: string;
  name: string;
  clientName: string;
  clientLogo?: string;
  clientPhone?: string;
  clientEmail?: string;
  price?: number;
  currency?: string;
  isPaid: boolean;
  paymentMethod?: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  status: AdStatus;
  category?: AdCategory;
  budget?: number;
  ads?: Advertisement[];
  createdAt?: string;
}

export interface PlacementConfig {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
}

export interface SystemSetting {
  id?: string;
  key: string;
  value: boolean;
  description?: string;
}

export interface AdsDashboardOverview {
  totalCampaigns: number;
  totalAds: number;
  activeAds: number;
  totalViews: number;
  totalClicks: number;
  overallCtr: string;
}

export interface AdsDashboardAnalytics {
  overview: AdsDashboardOverview;
  topPerforming: Advertisement[];
  poorPerforming: Advertisement[];
  placementConfigs: PlacementConfig[];
  systemSettings: SystemSetting[];
}

export interface CreateCampaignPayload {
  campaignCode: string;
  name: string;
  clientName: string;
  clientLogo?: string;
  clientPhone?: string;
  clientEmail?: string;
  price?: number;
  currency?: string;
  isPaid?: boolean;
  paymentMethod?: string;
  status?: AdStatus;
  startDate: string;
  endDate?: string;
  category?: AdCategory;
  budget?: number;
  notes?: string;
}

export interface CreateAdPayload {
  campaignId: string;
  title: string;
  placementKey: string;
  category?: AdCategory;
  displayType?: AdDisplayType;
  status?: AdStatus;
  target: AdTarget;
  mediaItems: AdMediaItem[];
  maxViews?: number;
  maxClicks?: number;
  isSkippable?: boolean;
  isClosable?: boolean;
  skipSeconds?: number;
  perUserFrequency?: string;
  maxDisplayPerSession?: number;
}
