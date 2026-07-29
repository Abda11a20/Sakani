// apps/frontend/src/lib/api/location.api.ts
import { api } from "@/lib/api";

export interface LocationCandidate {
  lat: number;
  lng: number;
  displayName: string;
  confidence: "high" | "medium" | "low";
  sourceLevel?: "address" | "cleaned_address" | "district" | "governorate";
}

export const locationApi = {
  geocode: async (params: { governorate?: string; district?: string; address?: string }) => {
    const res = await api.get<{ results: LocationCandidate[]; message?: string }>("/location/geocode", {
      params,
    });
    return res.data;
  },

  reverseGeocode: async (lat: number, lng: number) => {
    const res = await api.get<{ result: LocationCandidate | null }>("/location/reverse-geocode", {
      params: { lat, lng },
    });
    return res.data;
  },
};
