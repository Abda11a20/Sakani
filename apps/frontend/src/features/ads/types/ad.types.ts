export type TargetType =
  | 'EXTERNAL_URL'
  | 'INTERNAL_PAGE'
  | 'WHATSAPP'
  | 'PHONE'
  | 'EMAIL'
  | 'APP_DEEP_LINK';

export type OpenMode = 'NEW_TAB' | 'SAME_TAB' | 'MODAL';

export type AdDisplayType =
  | 'BANNER'
  | 'POPUP'
  | 'FULLSCREEN'
  | 'FLOATING'
  | 'SIDEBAR';

export type AdMediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'HTML';

export type AdCategory =
  | 'REAL_ESTATE'
  | 'FURNITURE'
  | 'RESTAURANTS'
  | 'BANKS'
  | 'SERVICES'
  | 'MEDICAL'
  | 'EDUCATION'
  | 'OTHER';

export type AdStatus =
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PREVIEW'
  | 'PUBLISHED'
  | 'PAUSED'
  | 'EXPIRED'
  | 'LIMIT_REACHED'
  | 'ARCHIVED';

export interface AdTarget {
  id: string;
  type: TargetType;
  url?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  internalRoute?: string | null;
  appDeepLink?: string | null;
}

export interface AdMediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  type: AdMediaType;
  caption?: string | null;
  durationSeconds?: number | null;
  order: number;
}

export interface ActiveAdResponse {
  id: string;
  title: string;
  placementKey: string;
  displayType: AdDisplayType;
  openMode: OpenMode;
  target?: AdTarget | null;
  mediaItems: AdMediaItem[];
  isSkippable: boolean;
  isClosable: boolean;
  skipSeconds: number;
  perUserFrequency: string;
  maxDisplayPerSession: number;
  clientName?: string | null;
  clientLogo?: string | null;
  utmUrl?: string | null;
}

export interface AdVersion {
  id: string;
  adId: string;
  versionNumber: number;
  title: string;
  targetData: any;
  mediaData: any;
  createdAt: string;
}

export interface AdInvoice {
  id: string;
  campaignId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate?: string | null;
  isPaid: boolean;
  pdfUrl?: string | null;
  createdAt: string;
}

export interface Campaign {
  id: string;
  campaignCode: string;
  name: string;
  clientName: string;
  clientPhone?: string | null;
  category: AdCategory;
  price?: number | null;
  budget?: number | null;
  spentAmount: number;
  remainingAmount?: number | null;
  isPaid: boolean;
  status: AdStatus;
  startDate: string;
  endDate?: string | null;
}
