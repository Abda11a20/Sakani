// apps/frontend/src/components/listings/ListingsCarousel.tsx
"use client";

import React, { useRef } from "react";
import type { Listing } from "@/types";
import { ListingCard } from "@/components/listings/ListingCard";
import { useMatchingAlert } from "@/hooks/useAlertMatching";

// Individual card wrapper that resolves its own matching alert
function CarouselItem({ listing }: { listing: Listing }) {
  const matchingAlert = useMatchingAlert(listing);
  return (
    <div className="shrink-0 w-[280px] sm:w-[300px]">
      <ListingCard listing={listing} matchingAlert={matchingAlert} />
    </div>
  );
}

interface ListingsCarouselProps {
  items: Listing[];
}

export function ListingsCarousel({ items }: ListingsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mouse drag scrolling
  const dragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft ?? 0);
    scrollLeft.current = scrollRef.current?.scrollLeft ?? 0;
    if (scrollRef.current) scrollRef.current.style.cursor = "grabbing";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.2;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUpLeave = () => {
    dragging.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = "grab";
  };

  // Shift+wheel horizontal scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (e.shiftKey && scrollRef.current) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  if (items.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpLeave}
      onMouseLeave={handleMouseUpLeave}
      onWheel={handleWheel}
      className="flex gap-4 overflow-x-auto pb-3 select-none"
      style={{
        cursor: "grab",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(27,79,138,0.3) transparent",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {items.map((listing) => (
        <CarouselItem key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
