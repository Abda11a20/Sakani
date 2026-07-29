// apps/frontend/src/components/listings/MapPicker.tsx
// Client-only component — loaded via dynamic import (ssr: false)
"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, X, Loader2, LocateFixed, CheckCircle2 } from "lucide-react";

interface MapPickerProps {
  lat: number;
  lng: number;
  hasExactLocation?: boolean;
  onChange: (lat: number, lng: number) => void;
  onConfirmLocation?: () => void;
  onClear: () => void;
}

export default function MapPicker({
  lat,
  lng,
  hasExactLocation = false,
  onChange,
  onConfirmLocation,
  onClear,
}: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Locate current user device via GPS Browser API
  const handleLocateMe = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("خاصية تحديد الموقع الجغرافي (GPS) غير مدعومة في هذا المتصفح.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onChange(latitude, longitude);
        reverseGeocode(latitude, longitude);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        alert("تعذر جلب موقعك الحالي. يرجى التأكد من السماح للمتصفح بالوصول لموقع الجهاز (GPS).");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Reverse geocode using Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`,
        { headers: { "User-Agent": "Sakany-App/1.0" } }
      );
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress(null);
      }
    } catch {
      setAddress(null);
    } finally {
      setIsGeocoding(false);
    }
  };

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
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Custom marker icon
      const customIcon = L.divIcon({
        html: `
          <div style="
            width: 34px; height: 34px;
            background: #f59e0b;
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        className: "",
      });

      const marker = L.marker([lat, lng], { draggable: true, icon: customIcon }).addTo(map);
      markerRef.current = marker;

      // Handle marker drag
      marker.on("dragend", () => {
        const position = marker.getLatLng();
        onChange(position.lat, position.lng);
        reverseGeocode(position.lat, position.lng);
      });

      // Handle map click
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onChange(lat, lng);
        reverseGeocode(lat, lng);
      });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
      if (container) {
        (container as any)._leaflet_id = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync marker if lat/lng change externally
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom());
    }
  }, [lat, lng]);

  return (
    <div className="space-y-2.5">
      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-amber-300 shadow-sm">
        <div ref={mapRef} className="w-full h-64" />

        {/* Controls Overlay Bar */}
        <div className="absolute top-2 start-2 end-2 z-[1000] flex items-center justify-between pointer-events-none">
          {/* Locate me button */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
          >
            {isLocating ? <Loader2 size={12} className="animate-spin" /> : <LocateFixed size={12} />}
            موقعي الحالي 🎯
          </button>

          {/* Clear Button */}
          <button
            type="button"
            onClick={onClear}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-red-600 hover:bg-red-50 shadow-sm transition-all"
          >
            <X size={12} />
            إلغاء الموقع
          </button>
        </div>
      </div>

      {/* Address Feedback & Confirm Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
        <div className="flex items-center gap-2 text-xs text-amber-800 font-cairo">
          <MapPin size={15} className="text-amber-500 shrink-0" />
          {isGeocoding ? (
            <span className="flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" /> جارِ استكشاف العنوان القريب...
            </span>
          ) : address ? (
            <span className="line-clamp-1">{address}</span>
          ) : (
            <span>قم بتحريك الدبوس أو الضغط على الخريطة لتحديد الموقع الفعلي</span>
          )}
        </div>

        {/* Confirm Location Button */}
        {onConfirmLocation && (
          <button
            type="button"
            onClick={onConfirmLocation}
            className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold font-cairo flex items-center justify-center gap-1.5 transition-all ${
              hasExactLocation
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-[#0EA5E9] hover:bg-[#0284C7] text-white shadow-sm"
            }`}
          >
            <CheckCircle2 size={14} />
            {hasExactLocation ? "الموقع موثق كـ دقيق ✓" : "تأكيد هذا الموقع كـ دقيق 🎯"}
          </button>
        )}
      </div>
    </div>
  );
}
