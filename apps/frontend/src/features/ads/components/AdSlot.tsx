'use client';

import React, { useEffect, useState } from 'react';
import { useActiveAd } from '../hooks/useActiveAd';
import { AdBannerRenderer } from './renderers/AdBannerRenderer';
import { AdInterstitialRenderer } from './renderers/AdInterstitialRenderer';
import { AdPopupRenderer } from './renderers/AdPopupRenderer';

interface Props {
  placementKey: string;
  className?: string;
}

export const AdSlot: React.FC<Props> = ({ placementKey, className }) => {
  const isOverlayPlacement = placementKey === 'INTERSTITIAL' || placementKey === 'POPUP';
  const [hasUserInteracted, setHasUserInteracted] = useState(!isOverlayPlacement);
  const { ad, isLoading, handleAdClick } = useActiveAd(placementKey, hasUserInteracted);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (!isOverlayPlacement) return;

    const activate = () => setHasUserInteracted(true);
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, activate, { once: true, passive: true }));

    return () => {
      events.forEach((event) => window.removeEventListener(event, activate));
    };
  }, [isOverlayPlacement]);

  if (isDismissed) {
    return null;
  }

  // Progressive Enhancement / Layout Stability Guard:
  // Reserve space while loading inline banners to eliminate layout shift (CLS)
  if (isLoading) {
    if (isOverlayPlacement) {
      return null;
    }
    return (
      <div className={className}>
        <div className="w-full my-2 rounded-xl border border-border/80 bg-surface p-2 sm:p-2.5 space-y-1.5 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-4 w-16 rounded-md bg-surface-secondary" />
            <div className="h-4 w-14 rounded-md bg-surface-secondary" />
          </div>
          <div className="h-[18px] w-2/3 rounded bg-surface-secondary" />
          <div className="h-32 sm:h-40 w-full rounded-lg bg-surface-secondary" />
        </div>
      </div>
    );
  }

  if (!ad) {
    return null;
  }

  const handleClose = () => {
    setIsDismissed(true);
  };

  switch (ad.displayType) {
    case 'FULLSCREEN':
      return (
        <AdInterstitialRenderer
          ad={ad}
          onAdClick={handleAdClick}
          onClose={handleClose}
        />
      );
    case 'POPUP':
      return (
        <AdPopupRenderer
          ad={ad}
          onAdClick={handleAdClick}
          onClose={handleClose}
        />
      );
    case 'BANNER':
    default:
      return (
        <div className={className}>
          <AdBannerRenderer ad={ad} onAdClick={handleAdClick} />
        </div>
      );
  }
};
