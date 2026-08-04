'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { ActiveAdResponse, AdTarget } from '../types/ad.types';

export function useActiveAd(placementKey: string) {
  const [ad, setAd] = useState<ActiveAdResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasImpressionRecorded, setHasImpressionRecorded] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchAd() {
      try {
        setIsLoading(true);
        // Calculate minutes from midnight
        const now = new Date();
        const clientMinutes = now.getHours() * 60 + now.getMinutes();

        const res = await api.get<ActiveAdResponse | null>('/ads/active', {
          params: { placementKey, clientMinutes },
        });

        if (!isMounted) return;

        const activeAd = res.data;
        if (!activeAd) {
          setAd(null);
          setIsLoading(false);
          return;
        }

        // Frequency & Session checks on client-side (Only for overlay/popup/fullscreen ads, standard banners always show)
        const isOverlayAd = activeAd.displayType === 'FULLSCREEN' || activeAd.displayType === 'POPUP' || activeAd.displayType === 'FLOATING';

        if (typeof window !== 'undefined' && isOverlayAd) {
          // Check Per-Session Max Display Limit
          const sessionKey = `sakany_ad_session_${activeAd.id}`;
          const currentSessionCount = parseInt(sessionStorage.getItem(sessionKey) || '0', 10);

          if (currentSessionCount >= activeAd.maxDisplayPerSession) {
            setAd(null);
            setIsLoading(false);
            return;
          }

          // Check Per-User Frequency Cap
          const capKey = `sakany_ad_freq_${activeAd.id}`;
          const lastShownTime = localStorage.getItem(capKey);

          if (lastShownTime && activeAd.perUserFrequency === 'EVERY_12_HOURS') {
            const twelveHoursMs = 12 * 60 * 60 * 1000;
            if (Date.now() - parseInt(lastShownTime, 10) < twelveHoursMs) {
              setAd(null);
              setIsLoading(false);
              return;
            }
          }
        }

        setAd(activeAd);
      } catch (err) {
        setAd(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchAd();

    return () => {
      isMounted = false;
    };
  }, [placementKey]);

  // Record Impression once rendered
  useEffect(() => {
    if (ad && !hasImpressionRecorded) {
      setHasImpressionRecorded(true);

      // Record in SessionStorage & LocalStorage (ONLY for overlay/popup/fullscreen ads)
      const isOverlayAd = ad.displayType === 'FULLSCREEN' || ad.displayType === 'POPUP' || ad.displayType === 'FLOATING';
      if (typeof window !== 'undefined' && isOverlayAd) {
        const sessionKey = `sakany_ad_session_${ad.id}`;
        const currentSessionCount = parseInt(sessionStorage.getItem(sessionKey) || '0', 10);
        sessionStorage.setItem(sessionKey, (currentSessionCount + 1).toString());

        const capKey = `sakany_ad_freq_${ad.id}`;
        localStorage.setItem(capKey, Date.now().toString());
      }

      // Track impression API asynchronously
      api.post(`/ads/${ad.id}/impression`).catch(() => {});
    }
  }, [ad, hasImpressionRecorded]);

  // Handle Target Click
  const handleAdClick = useCallback(() => {
    if (!ad) return;

    // Track click event asynchronously
    api.post(`/ads/${ad.id}/click`).catch(() => {});

    const target: AdTarget | undefined | null = ad.target;

    // Resolve target destination
    if (ad.utmUrl) {
      window.open(ad.utmUrl, ad.openMode === 'SAME_TAB' ? '_self' : '_blank');
      return;
    }

    if (!target) return;

    switch (target.type) {
      case 'WHATSAPP':
        if (target.whatsapp) {
          const cleanPhone = target.whatsapp.replace(/\D/g, '');
          window.open(`https://wa.me/${cleanPhone}`, '_blank');
        }
        break;
      case 'PHONE':
        if (target.phone) {
          window.location.href = `tel:${target.phone}`;
        }
        break;
      case 'EMAIL':
        if (target.email) {
          window.location.href = `mailto:${target.email}`;
        }
        break;
      case 'INTERNAL_PAGE':
        if (target.internalRoute) {
          window.location.href = target.internalRoute;
        }
        break;
      case 'APP_DEEP_LINK':
        if (target.appDeepLink) {
          window.location.href = target.appDeepLink;
        }
        break;
      case 'EXTERNAL_URL':
      default:
        if (target.url) {
          window.open(target.url, ad.openMode === 'SAME_TAB' ? '_self' : '_blank');
        }
        break;
    }
  }, [ad]);

  return {
    ad,
    isLoading,
    handleAdClick,
  };
}
