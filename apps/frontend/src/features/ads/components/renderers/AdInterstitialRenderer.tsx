'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { ActiveAdResponse } from '../../types/ad.types';
import {
  getCloudinaryUrl,
  getCloudinaryVideoPosterUrl,
  getCloudinaryVideoUrl,
} from '@/lib/utils';

interface Props {
  ad: ActiveAdResponse;
  onAdClick: () => void;
  onClose: () => void;
}

export const AdInterstitialRenderer: React.FC<Props> = ({
  ad,
  onAdClick,
  onClose,
}) => {
  const [countdown, setCountdown] = useState<number>(ad.skipSeconds || 5);
  const [canSkip, setCanSkip] = useState<boolean>(!ad.isSkippable);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const primaryMedia = ad.mediaItems?.[0];
  const cleanTitle = ad.title?.replace(/\s*\([A-Z0-9_]+\)$/gi, '') || '';
  const mediaUrl = primaryMedia?.type === 'VIDEO'
    ? getCloudinaryVideoUrl(primaryMedia.url)
    : getCloudinaryUrl(primaryMedia?.url, { width: 1200, quality: 'auto' });
  const videoPoster = getCloudinaryVideoPosterUrl(primaryMedia?.url);

  // Sync muted state directly to HTMLVideoElement DOM instance
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Skip countdown timer
  useEffect(() => {
    if (!ad.isSkippable) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanSkip(true);
    }
  }, [countdown, ad.isSkippable]);

  // Smart Auto-Close Timer (8s for Images, 15s max safety for Videos)
  useEffect(() => {
    const autoCloseSeconds = primaryMedia?.type === 'VIDEO' ? 15 : 8;
    const autoCloseTimer = setTimeout(() => {
      onClose();
    }, autoCloseSeconds * 1000);

    return () => clearTimeout(autoCloseTimer);
  }, [primaryMedia, onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Top Control Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
          <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
            إعلان مميز
          </span>

          {ad.isSkippable ? (
            canSkip ? (
              <button
                onClick={onClose}
                className="flex items-center gap-1 rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold text-gray-900 shadow-md hover:bg-white transition-all"
              >
                تخطي ✕
              </button>
            ) : (
              <div className="flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                تخطي خلال <span className="font-bold text-emerald-400">{countdown}</span>
              </div>
            )
          ) : ad.isClosable ? (
            <button
              onClick={onClose}
              className="rounded-full bg-white/90 p-2 text-gray-700 shadow-md hover:bg-white transition-all"
            >
              ✕
            </button>
          ) : null}
        </div>

        {/* Ad Media Content */}
        <div
          onClick={onAdClick}
          className="group relative cursor-pointer overflow-hidden bg-gray-900"
        >
          <div className="relative h-[360px] sm:h-[450px] w-full">
            {primaryMedia?.type === 'VIDEO' ? (
              <>
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  poster={videoPoster || undefined}
                  width={1200}
                  height={900}
                  autoPlay
                  muted={isMuted}
                  playsInline
                  onEnded={onClose}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted((prev) => !prev);
                  }}
                  className="absolute bottom-4 left-4 z-30 p-2 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition-all shadow-lg"
                  title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              </>
            ) : primaryMedia ? (
              <img
                src={mediaUrl}
                width={1200}
                height={900}
                alt={cleanTitle}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-white">
                {cleanTitle}
              </div>
            )}
          </div>

          {/* Bottom Callout Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 text-white text-right space-y-2">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-xs font-semibold text-gray-200">
                سكني للإعلانات
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold">{cleanTitle}</h3>

            <div className="pt-2 flex justify-end">
              <span className="inline-flex items-center rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-600 transition-colors">
                زيارة الرابط الآن ←
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
