// apps/frontend/src/components/dashboard/form/listing-form.types.ts

export interface ListingFormData {
  governorate: string;
  district: string;
  address: string;
  lat: number | null;
  lng: number | null;
  hasExactLocation: boolean;
  unitType: "apartment" | "bed" | string;
  isFurnished: boolean;
  totalBeds: string;
  genderTarget: string;
  amenities: string[];
  electricityType: string;
  description: string;
  price: string;
  securityDeposit: string;
  includesBills: boolean;
  roommateFeatureEnabled: boolean;
}

export type ListingFormChangeHandler = <K extends keyof ListingFormData>(
  field: K,
  value: ListingFormData[K]
) => void;

export interface ListingFormImageItem {
  id?: string;
  url: string;
  file?: File;
  isNew: boolean;
}

export interface LocationCandidate {
  displayName: string;
  lat: number;
  lng: number;
  type?: string;
}
