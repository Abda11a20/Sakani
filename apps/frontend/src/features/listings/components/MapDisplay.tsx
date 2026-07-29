// apps/frontend/src/components/listings/MapDisplay.tsx
// Client-only component — loaded via dynamic import (ssr: false)
"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { normalizeArabicText } from "@/lib/constants";

interface MapDisplayProps {
  lat: number;
  lng: number;
  hasExactLocation: boolean;
  address?: string;
  district?: string;
  governorate?: string;
  isRtl?: boolean;
}

// Production Fallback Coordinates for Egyptian Governorates
const EGYPT_GOVERNORATE_COORDS: Record<string, { lat: number; lng: number }> = {
  "القاهرة": { lat: 30.0444, lng: 31.2357 },
  "الجيزة": { lat: 30.0131, lng: 31.2089 },
  "الإسكندرية": { lat: 31.2001, lng: 29.9187 },
  "المنيا": { lat: 28.0871, lng: 30.7618 },
  "الشرقية": { lat: 30.5877, lng: 31.5020 },
  "الدقهلية": { lat: 31.0409, lng: 31.3785 },
  "أسيوط": { lat: 27.1783, lng: 31.1859 },
  "سوهاج": { lat: 26.5590, lng: 31.6957 },
  "أسوان": { lat: 24.0889, lng: 32.8998 },
  "الأقصر": { lat: 25.6872, lng: 32.6396 },
  "بني سويف": { lat: 29.0661, lng: 31.0994 },
  "الفيوم": { lat: 29.3100, lng: 30.8418 },
  "القليوبية": { lat: 30.4144, lng: 31.2096 },
  "الغربية": { lat: 30.7865, lng: 31.0004 },
  "المنوفية": { lat: 30.5972, lng: 30.9876 },
  "البحيرة": { lat: 31.0364, lng: 30.4688 },
  "كفر الشيخ": { lat: 31.1107, lng: 30.9388 },
  "دمياط": { lat: 31.4175, lng: 31.8144 },
  "بورسعيد": { lat: 31.2653, lng: 32.3019 },
  "الإسماعيلية": { lat: 30.6043, lng: 32.2723 },
  "السويس": { lat: 29.9668, lng: 32.5498 },
  "البحر الأحمر": { lat: 27.2579, lng: 33.8116 },
  "مطروح": { lat: 31.3543, lng: 27.2373 },
  "الوادي الجديد": { lat: 25.4514, lng: 30.5463 },
  "شمال سيناء": { lat: 31.1316, lng: 33.8032 },
  "جنوب سيناء": { lat: 28.5392, lng: 33.9749 },
  "قنا": { lat: 26.1551, lng: 32.7160 },
};

// Production High-Precision District & New City Coordinates
const EGYPT_DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  // المنيا
  "المنيا الجديدة": { lat: 28.0694, lng: 30.7831 },
  "المنيا الجديده": { lat: 28.0694, lng: 30.7831 },
  "المنيا": { lat: 28.0871, lng: 30.7618 },
  "بني مزار": { lat: 28.5042, lng: 30.8000 },
  "ملوي": { lat: 27.7314, lng: 30.8417 },
  "سمالوط": { lat: 28.3122, lng: 30.7108 },
  "مغاغة": { lat: 28.6475, lng: 30.8425 },
  "أبو قرقاص": { lat: 27.9333, lng: 30.8333 },

  // الشرقية والمدن الجديدة
  "العاشر من رمضان": { lat: 30.2974, lng: 31.7412 },
  "الزقازيق": { lat: 30.5877, lng: 31.5020 },
  "بلبيس": { lat: 30.4194, lng: 31.5644 },

  // القاهرة والجيزة والمدن الجديدة
  "6 أكتوبر": { lat: 29.9723, lng: 30.9427 },
  "الشيخ زايد": { lat: 30.0435, lng: 30.9856 },
  "التجمع الخامس": { lat: 30.0074, lng: 31.4338 },
  "التجمع الأول": { lat: 30.0524, lng: 31.4589 },
  "الشروق": { lat: 30.1264, lng: 31.6214 },
  "بدر": { lat: 30.1384, lng: 31.7247 },
  "مدينتي": { lat: 30.1086, lng: 31.6318 },
  "الرحاب": { lat: 30.0636, lng: 31.4908 },
  "المعادي": { lat: 29.9602, lng: 31.2569 },
  "مدينة نصر": { lat: 30.0561, lng: 31.3301 },
  "مصر الجديدة": { lat: 30.0911, lng: 31.3236 },
  "الدقي": { lat: 30.0381, lng: 31.2124 },
  "المهندسين": { lat: 30.0526, lng: 31.2008 },
  "العجوزة": { lat: 30.0575, lng: 31.2131 },
  "الهرم": { lat: 29.9984, lng: 31.1441 },
  "فيصل": { lat: 30.0097, lng: 31.1642 },
  "العبور": { lat: 30.2372, lng: 31.4729 },
  "حلوان": { lat: 29.8414, lng: 31.3008 },
  "المقطم": { lat: 30.0150, lng: 31.3039 },

  // الإسكندرية
  "سموحة": { lat: 31.2156, lng: 29.9489 },
  "ميامي": { lat: 31.2678, lng: 30.0039 },
  "سيدي بشر": { lat: 31.2608, lng: 29.9925 },
  "برج العرب الجديدة": { lat: 30.8925, lng: 29.5878 },
  "العجمي": { lat: 31.1092, lng: 29.7744 },

  // بقية المدن الجديدة والمحافظات
  "المنصورة": { lat: 31.0409, lng: 31.3785 },
  "المنصورة الجديدة": { lat: 31.4589, lng: 31.5236 },
  "طنطا": { lat: 30.7865, lng: 31.0004 },
  "المحلة الكبرى": { lat: 30.9706, lng: 31.1669 },
  "مدينة السادات": { lat: 30.3734, lng: 30.5247 },
  "الفيوم الجديدة": { lat: 29.2789, lng: 30.9324 },
  "بني سويف الجديدة": { lat: 29.0415, lng: 31.1458 },
  "أسيوط الجديدة": { lat: 27.2415, lng: 31.2859 },
  "سوهاج الجديدة": { lat: 26.4958, lng: 31.6214 },
  "قنا الجديدة": { lat: 26.2145, lng: 32.7854 },
  "الأقصر الجديدة": { lat: 25.7145, lng: 32.6854 },
  "أسوان الجديدة": { lat: 24.1854, lng: 32.8954 },
  "دمياط الجديدة": { lat: 31.4389, lng: 31.6589 },
  "العلمين الجديدة": { lat: 30.8359, lng: 28.9489 },
};

function getInitialCoords(lat: number, lng: number, hasExact: boolean, district?: string, governorate?: string) {
  if (hasExact) return { lat, lng };

  // Check normalized district first (e.g. "المنيا الجديدة" or "المنيا الجديده")
  if (district) {
    const normalizedDist = normalizeArabicText(district);
    for (const [key, coords] of Object.entries(EGYPT_DISTRICT_COORDS)) {
      if (normalizeArabicText(key) === normalizedDist) {
        return coords;
      }
    }
  }

  // Fallback to governorate coords
  if (governorate && EGYPT_GOVERNORATE_COORDS[governorate]) {
    return EGYPT_GOVERNORATE_COORDS[governorate];
  }

  return { lat, lng };
}

export default function MapDisplay({
  lat: initialLat,
  lng: initialLng,
  hasExactLocation,
  address,
  district,
  governorate,
  isRtl = true,
}: MapDisplayProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  const [displayCoords, setDisplayCoords] = useState<{ lat: number; lng: number }>(() =>
    getInitialCoords(initialLat, initialLng, hasExactLocation, district, governorate)
  );

  // Dynamic Geocoding using detailed address + district + governorate
  useEffect(() => {
    let isCancelled = false;

    if (!hasExactLocation && (district || governorate || address)) {
      const cleanAddress = address ? address.replace(/(بجوار|أمام|بجانب|فوق|شقة|عمارة|دور)\s+[^\s,]+/gi, "").trim() : "";
      
      const queryCandidates = [
        [cleanAddress, district, governorate, "مصر"].filter(Boolean).join(" "),
        [district, governorate, "مصر"].filter(Boolean).join(" "),
        [governorate, "مصر"].filter(Boolean).join(" "),
      ].filter((q, idx, self) => q && self.indexOf(q) === idx);

      const fetchCoords = async (q: string) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&accept-language=ar`,
            { headers: { "User-Agent": "Sakany-App/1.0" } }
          );
          const data = await res.json();
          if (data && data[0]) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
          }
        } catch {
          // ignore
        }
        return null;
      };

      (async () => {
        for (const query of queryCandidates) {
          if (isCancelled) break;
          const result = await fetchCoords(query);
          if (result && !isCancelled) {
            setDisplayCoords(result);
            break;
          }
        }
      })();
    } else {
      setDisplayCoords(getInitialCoords(initialLat, initialLng, hasExactLocation, district, governorate));
    }

    return () => {
      isCancelled = true;
    };
  }, [hasExactLocation, address, district, governorate, initialLat, initialLng]);

  // Sync Leaflet map view & marker whenever displayCoords change dynamically
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([displayCoords.lat, displayCoords.lng], hasExactLocation ? 16 : 13);
      markerRef.current.setLatLng([displayCoords.lat, displayCoords.lng]);
      if (circleRef.current) {
        circleRef.current.setLatLng([displayCoords.lat, displayCoords.lng]);
      }
    }
  }, [displayCoords, hasExactLocation]);

  // Initialize Leaflet Map
  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    if ((container as any)._leaflet_id) {
      (container as any)._leaflet_id = null;
    }

    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;
      if ((container as any)._leaflet_id) {
        (container as any)._leaflet_id = null;
      }

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/leaflet/marker-icon.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });

      const map = L.map(container, {
        center: [displayCoords.lat, displayCoords.lng],
        zoom: hasExactLocation ? 16 : 13,
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: true,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Marker Icon
      const markerColor = hasExactLocation ? "#22c55e" : "#f59e0b";
      const markerHtml = `
        <div style="
          width: 32px; height: 32px;
          background: ${markerColor};
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        className: "",
      });

      const marker = L.marker([displayCoords.lat, displayCoords.lng], { icon: customIcon }).addTo(map);
      markerRef.current = marker;

      // Approximate location circle
      if (!hasExactLocation) {
        const circle = L.circle([displayCoords.lat, displayCoords.lng], {
          radius: 1200,
          color: "#f59e0b",
          fillColor: "#f59e0b",
          fillOpacity: 0.12,
          weight: 2,
          dashArray: "6,6",
        }).addTo(map);
        circleRef.current = circle;
      }

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      }
      if (container) {
        (container as any)._leaflet_id = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locationLabel = isRtl
    ? [district, governorate].filter(Boolean).join(" - ")
    : [district, governorate].filter(Boolean).join(", ");

  return (
    <div className="space-y-2">
      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <div ref={mapRef} className="w-full h-64" />
      </div>

      {/* Location Accuracy Badge */}
      {hasExactLocation ? (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-emerald-700 font-cairo">
              {isRtl ? "موقع دقيق محدد بواسطة المُعلن" : "Exact location provided by landlord"}
            </p>
            <p className="text-[11px] text-emerald-600/70 font-cairo mt-0.5">
              {isRtl
                ? "الموقع الموضح على الخريطة هو الموقع الفعلي للعقار"
                : "The pin on the map represents the actual property location"}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-700 font-cairo">
              {isRtl
                ? `موقع تقريبي في نطاق${locationLabel ? ` (${locationLabel})` : ""}`
                : `Approximate location${locationLabel ? ` in (${locationLabel})` : ""}`}
            </p>
            <p className="text-[11px] text-amber-600/70 font-cairo mt-0.5">
              {isRtl
                ? "لم يُدخل المُعلن الموقع الدقيق. الخريطة تعرض نطاقاً تقريبياً بناءً على بيانات الحي والمحافظة."
                : "The landlord did not share the exact location. The map shows an approximate area based on district & governorate."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
