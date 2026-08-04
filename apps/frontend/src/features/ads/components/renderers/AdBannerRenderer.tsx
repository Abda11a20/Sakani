'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { ActiveAdResponse } from '../../types/ad.types';
import { getCloudinaryUrl } from '@/lib/utils';

interface Props {
  ad: ActiveAdResponse;
  onAdClick: () => void;
}

export const AdBannerRenderer: React.FC<Props> = ({ ad, onAdClick }) => {
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const primaryMedia = ad.mediaItems?.[0];
  const cleanTitle = ad.title?.replace(/\s*\([A-Z0-9_]+\)$/gi, '') || '';
  const isHeroAd = ad.placementKey === 'HOME_HERO';
  const mediaUrl = primaryMedia?.type === 'IMAGE'
    ? getCloudinaryUrl(primaryMedia.url, { width: 960, quality: 'auto' })
    : primaryMedia?.url;

  // Sync muted state directly to HTMLVideoElement DOM instance
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

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
              <>
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="w-full h-32 sm:h-40 object-fill rounded-lg"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted((prev) => !prev);
                  }}
                  className="absolute bottom-2 left-2 z-10 p-1.5 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition-all shadow-md"
                  title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
              </>
            ) : (
              <img
                src={mediaUrl}
                width={960}
                height={320}
                alt={cleanTitle || 'إعلان'}
                referrerPolicy="no-referrer"
                loading={isHeroAd ? 'eager' : 'lazy'}
                fetchPriority={isHeroAd ? 'high' : 'auto'}
                decoding="async"
                className="w-full h-32 sm:h-40 object-fill rounded-lg transition-transform duration-300 group-hover:scale-[1.01]"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
