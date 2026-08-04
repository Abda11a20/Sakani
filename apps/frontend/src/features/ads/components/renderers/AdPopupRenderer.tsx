'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { ActiveAdResponse } from '../../types/ad.types';

interface Props {
  ad: ActiveAdResponse;
  onAdClick: () => void;
  onClose: () => void;
}

export const AdPopupRenderer: React.FC<Props> = ({ ad, onAdClick, onClose }) => {
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const primaryMedia = ad.mediaItems?.[0];
  const cleanTitle = ad.title?.replace(/\s*\([A-Z0-9_]+\)$/gi, '') || '';

  // Sync muted state directly to HTMLVideoElement DOM instance
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Smart Auto-Close Timer for Popup (8s for Images, 15s max safety for Videos)
  useEffect(() => {
    const autoCloseSeconds = primaryMedia?.type === 'VIDEO' ? 15 : 8;
    const autoCloseTimer = setTimeout(() => {
      onClose();
    }, autoCloseSeconds * 1000);

    return () => clearTimeout(autoCloseTimer);
  }, [primaryMedia, onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-5 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-white">
        <span className="text-xs font-bold">إعلان مميز</span>
        {ad.isClosable && (
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors text-sm font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Body */}
      <div
        onClick={onAdClick}
        className="group p-4 cursor-pointer hover:bg-gray-50/50 transition-colors space-y-3"
      >
        {primaryMedia && (
          <div className="relative h-36 w-full overflow-hidden rounded-xl bg-gray-100">
            {primaryMedia.type === 'VIDEO' ? (
              <>
                <video
                  ref={videoRef}
                  src={primaryMedia.url}
                  autoPlay
                  muted={isMuted}
                  playsInline
                  onEnded={onClose}
                  className="w-full h-full object-cover"
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
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
              </>
            ) : (
              <img
                src={primaryMedia.url}
                alt={cleanTitle}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            )}
          </div>
        )}

        <div>
          <h5 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors text-sm">
            {cleanTitle}
          </h5>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            اضغط للتفاصيل والتواصل السريع
          </p>
        </div>

        <div className="flex justify-end pt-1">
          <span className="inline-flex items-center rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 group-hover:bg-emerald-100 transition-colors">
            شاهد الآن ←
          </span>
        </div>
      </div>
    </div>
  );
};
