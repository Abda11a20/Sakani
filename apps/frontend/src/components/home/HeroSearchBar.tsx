// apps/frontend/src/components/home/HeroSearchBar.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, DoorOpen, BedDouble } from "lucide-react";
import { Button } from "@/components/ui";

interface HeroSearchBarProps {
  locale: string;
  placeholder: string;
  searchButtonText: string;
  apartmentText: string;
  roomText: string;
  bedText: string;
}

export function HeroSearchBar({
  locale,
  placeholder,
  searchButtonText,
  apartmentText,
  roomText,
  bedText,
}: HeroSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = query.trim();
    if (cleanQuery) {
      router.push(`/${locale}/search?q=${encodeURIComponent(cleanQuery)}`);
    } else {
      router.push(`/${locale}/search`);
    }
  };

  const handleTypeSelect = (type: string) => {
    router.push(`/${locale}/search?unitType=${type}`);
  };

  return (
    <form onSubmit={handleSearch} className="mt-8 max-w-2xl mx-auto">
      <div className="rounded-2xl p-2 shadow-2xl border border-white/20 bg-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {/* Quick type tabs */}
          <div className="hidden sm:flex gap-1 ps-1">
            {[
              { label: apartmentText, type: "APARTMENT", icon: Building2 },
              { label: roomText, type: "ROOM", icon: DoorOpen },
              { label: bedText, type: "BED", icon: BedDouble },
            ].map(({ label, type, icon: Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeSelect(type)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-white/80 hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 flex items-center gap-1 sm:gap-2 px-2 sm:px-3 min-w-0">
            <Search size={18} className="text-white/60 shrink-0" />
            <input
              id="hero-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent border-0 text-white placeholder-white/60 outline-none focus:outline-none focus:ring-0 text-xs sm:text-sm min-w-0 w-full font-cairo shadow-none focus:bg-transparent [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:[text-fill-color:white]"
              style={{
                backgroundColor: "transparent",
                color: "#FFFFFF",
                boxShadow: "none",
              }}
            />
          </div>

          <Button type="submit" variant="accent" size="md" className="font-bold px-6 shadow-md">
            {searchButtonText}
          </Button>
        </div>
      </div>
    </form>
  );
}
