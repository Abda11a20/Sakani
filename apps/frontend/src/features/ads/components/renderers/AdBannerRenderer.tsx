'use client';

import React from 'react';
import { ActiveAdResponse } from '../../types/ad.types';

interface Props {
  ad: ActiveAdResponse;
  onAdClick: () => void;
}

export const AdBannerRenderer: React.FC<Props> = ({ ad, onAdClick }) => {
  const primaryMedia = ad.mediaItems?.[0];
  const cleanTitle = ad.title?.replace(/\s*\([A-Z0-9_]+\)$/gi, '') || '';

  return (
    <div className="w-full my-2 transition-all duration-300">
      <div
        onClick={onAdClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onAdClick()}
        className="group relative w-full overflow-hidden rounded-xl border border-border/80 bg-surface p-2 sm:p-2.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-1.5"
      >
        {/* Top Header Badge */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
            إعلان مُمول
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold text-primary group-hover:translate-x-[-2px] transition-transform">
            اعرف أكثر ←
          </span>
        </div>

        {/* Title */}
        {cleanTitle && (
          <h4 className="text-xs font-bold text-text truncate">
            {cleanTitle}
          </h4>
        )}

        {/* Media Container: Full Width Edge-to-Edge Display without Side Margins */}
        {primaryMedia && (
          <div className="relative w-full overflow-hidden rounded-lg bg-surface-secondary">
            {primaryMedia.type === 'VIDEO' ? (
              <video
                src={primaryMedia.url}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-32 sm:h-40 object-fill rounded-lg"
              />
            ) : (
              <img
                src={primaryMedia.url}
                alt={cleanTitle || 'إعلان'}
                referrerPolicy="no-referrer"
                className="w-full h-32 sm:h-40 object-fill rounded-lg transition-transform duration-300 group-hover:scale-[1.01]"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
