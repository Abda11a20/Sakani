'use client';

import React, { useState } from 'react';
import { useActiveAd } from '../hooks/useActiveAd';
import { AdBannerRenderer } from './renderers/AdBannerRenderer';
import { AdInterstitialRenderer } from './renderers/AdInterstitialRenderer';
import { AdPopupRenderer } from './renderers/AdPopupRenderer';

interface Props {
  placementKey: string;
  className?: string;
}

export const AdSlot: React.FC<Props> = ({ placementKey, className }) => {
  const { ad, isLoading, handleAdClick } = useActiveAd(placementKey);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  // Progressive Enhancement / Zero Footprint Guard:
  // If loading, no ad available, or dismissed by user -> return NULL directly.
  if (isLoading || !ad || isDismissed) {
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
