// apps/frontend/src/components/listings/detail/ListingImageGallery.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Heart,
  Share2,
  X,
} from "lucide-react";
import { getImageUrl, getCloudinaryUrl } from "@/lib/utils";
import { Button } from "@/components/ui";

interface ListingImageGalleryProps {
  images: Array<string | { url: string }>;
  title: string;
  isLiked: boolean;
  locale: string;
  onToggleWishlist: () => void;
  onShare: () => void;
}

export function ListingImageGallery({
  images,
  title,
  isLiked,
  locale,
  onToggleWishlist,
  onShare,
}: ListingImageGalleryProps) {
  const isRtl = locale === "ar";
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Touch gesture states
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const totalImages = images.length;

  const handlePrevImage = () => {
    setActiveImageIdx((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const handleNextImage = () => {
    setActiveImageIdx((prev) => (prev + 1) % totalImages);
  };

  // Keyboard navigation & Escape key in Lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        if (isRtl) handleNextImage();
        else handlePrevImage();
      } else if (e.key === "ArrowRight") {
        if (isRtl) handlePrevImage();
        else handleNextImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, isRtl]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNextImage();
    }
    if (isRightSwipe) {
      handlePrevImage();
    }
  };

  return (
    <div className="space-y-2">
      {/* Image Gallery Carousel */}
      <div
        className="relative w-full h-[220px] sm:h-[340px] md:h-[380px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-sm flex items-center justify-center group"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Blurred Background layer */}
        <Image
          src={getCloudinaryUrl(images[activeImageIdx], { width: 40, height: 30, quality: 20 }) || "/placeholder.jpg"}
          alt=""
          fill
          sizes="100vw"
          className="object-cover blur-md opacity-30 select-none pointer-events-none"
          aria-hidden="true"
          unoptimized={!getImageUrl(images[activeImageIdx]).includes('res.cloudinary.com')}
        />

        {/* Foreground image */}
        <Image
          src={getCloudinaryUrl(images[activeImageIdx], { width: 900, height: 600, quality: 'auto', crop: 'fit' }) || "/placeholder.jpg"}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 900px"
          priority={activeImageIdx === 0}
          className="object-contain z-10 cursor-pointer select-none hover:scale-[1.01] transition-transform duration-300"
          onClick={() => setLightboxOpen(true)}
          unoptimized={!getImageUrl(images[activeImageIdx]).includes('res.cloudinary.com')}
        />

        {/* Overlays top left: Heart & Share */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
          <button
            type="button"
            onClick={onToggleWishlist}
            aria-label={isLiked ? "إزالة من المفضلة" : "إضافة للمفضلة"}
            aria-pressed={isLiked}
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-red-500 shadow hover:scale-105 transition-transform"
          >
            <Heart size={15} className={isLiked ? "fill-red-500 text-red-500" : "text-slate-600"} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onShare}
            aria-label="مشاركة الإعلان"
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-600 shadow hover:scale-105 transition-transform"
          >
            <Share2 size={15} aria-hidden="true" />
          </button>
        </div>

        {/* Zoom button */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="عرض الصور بملء الشاشة"
          className="absolute bottom-3 right-3 bg-slate-900/70 hover:bg-slate-900 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-20 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
        >
          <Maximize2 size={14} aria-hidden="true" />
        </button>

        {/* Index counter */}
        <div className="absolute bottom-3 left-3 bg-slate-900/60 backdrop-blur-sm text-white text-[10px] font-sans px-2.5 py-1 rounded-full z-20" aria-live="polite">
          {activeImageIdx + 1} / {totalImages}
        </div>

        {/* Prev/Next Controls */}
        {totalImages > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevImage();
              }}
              aria-label="الصورة السابقة"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 text-slate-800 flex items-center justify-center shadow hover:bg-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 duration-200 z-20"
            >
              <ChevronLeft size={16} className={isRtl ? "" : "rotate-180"} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNextImage();
              }}
              aria-label="الصورة التالية"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 text-slate-800 flex items-center justify-center shadow hover:bg-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 duration-200 z-20"
            >
              <ChevronRight size={16} className={isRtl ? "" : "rotate-180"} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {totalImages > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-thin" role="region" aria-label="الصور المصغرة">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveImageIdx(idx)}
              aria-label={`عرض الصورة المصغرة ${idx + 1}`}
              aria-current={idx === activeImageIdx ? "true" : undefined}
              className={`relative w-14 h-10 rounded-lg overflow-hidden shrink-0 border transition-all focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] ${
                idx === activeImageIdx
                  ? "border-[#0EA5E9] ring-2 ring-[#0EA5E9]/20 scale-102"
                  : "border-slate-200 opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={getCloudinaryUrl(img, { width: 112, height: 80, quality: 70 }) || "/placeholder.jpg"}
                alt={`Thumbnail ${idx + 1}`}
                fill
                sizes="56px"
                className="object-cover"
                unoptimized={!getImageUrl(img).includes('res.cloudinary.com')}
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox full-screen view */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="معاينة الصور بملء الشاشة"
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-transparent"
            onClick={() => setLightboxOpen(false)}
            aria-hidden="true"
          />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="إغلاق المعاينة المكبرة"
            className="absolute top-4 left-4 text-white p-0 h-9 w-9 bg-white/10 hover:bg-white/20 rounded-full z-50"
            onClick={() => setLightboxOpen(false)}
          >
            <X size={20} aria-hidden="true" />
          </Button>

          {totalImages > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="الصورة السابقة"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-0 h-10 w-10 bg-white/10 hover:bg-white/20 rounded-full z-50"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevImage();
              }}
            >
              <ChevronLeft size={24} className={isRtl ? "" : "rotate-180"} aria-hidden="true" />
            </Button>
          )}

          <img
            src={getCloudinaryUrl(images[activeImageIdx], { quality: 'auto', format: 'auto' })}
            alt={`${title} full view`}
            className="max-w-full max-h-[85vh] object-contain rounded-xl select-none z-10"
            onClick={(e) => e.stopPropagation()}
          />

          {totalImages > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="الصورة التالية"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-0 h-10 w-10 bg-white/10 hover:bg-white/20 rounded-full z-50"
              onClick={(e) => {
                e.stopPropagation();
                handleNextImage();
              }}
            >
              <ChevronRight size={24} className={isRtl ? "" : "rotate-180"} aria-hidden="true" />
            </Button>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs font-sans z-10" aria-live="polite">
            {activeImageIdx + 1} / {totalImages}
          </div>
        </div>
      )}
    </div>
  );
}
