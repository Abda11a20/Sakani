// apps/frontend/src/components/home/HomeHeroSection.tsx
import React from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Search, Building2, DoorOpen, BedDouble, CheckCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui";

export async function HomeHeroSection({ locale }: { locale: string }) {
  const t = await getTranslations("home");
  return (
    <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden font-cairo">
      {/* Background gradient */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-br from-text to-primary"
      />
      {/* Decorative glow elements */}
      <div className="absolute top-16 start-8 w-80 h-80 rounded-full opacity-[0.07] -z-10 blur-xl bg-accent" />
      <div className="absolute bottom-16 end-8 w-64 h-64 rounded-full opacity-[0.07] -z-10 blur-xl bg-primary-light" />

      <div className="container mx-auto px-4 text-center text-white py-20">
        {/* Badge */}
        <div className="mb-6">
          <span className="inline-block px-5 py-2 rounded-full text-sm font-semibold mb-6 border border-accent/30 bg-accent/15 text-accent-light">
            {t("heroBadge")}
          </span>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-5">
            {t("heroTitleLine1")}
            <br />
            <span className="text-accent">{t("heroTitleLine2")}</span>
          </h1>
          <p className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
            {t("heroSubtitle")}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mt-10 max-w-2xl mx-auto">
          <div className="rounded-2xl p-2 shadow-2xl border border-white/15 bg-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2">
              {/* Quick type tabs */}
              <div className="hidden sm:flex gap-1 ps-1">
                {[
                  { label: t("apartment"), icon: Building2 },
                  { label: t("room"), icon: DoorOpen },
                  { label: t("bed"), icon: BedDouble },
                ].map(({ label, icon: Icon }) => (
                  <span
                    key={label}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-white/60 cursor-pointer hover:bg-white/10 transition-colors whitespace-nowrap"
                  >
                    <Icon size={13} />
                    {label}
                  </span>
                ))}
              </div>

              <div className="flex-1 flex items-center gap-1 sm:gap-2 px-1 sm:px-3 min-w-0">
                <Search size={18} className="text-white/40 shrink-0" />
                <input
                  id="hero-search"
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-xs sm:text-sm min-w-0 w-full font-cairo"
                />
              </div>

              <Link href={`/${locale}/search`} id="hero-search-btn">
                <Button variant="accent" size="md" className="font-bold text-text">
                  {t("searchButton")}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
          <span className="flex items-center gap-2">
            <Building2 size={16} className="text-accent" />
            <span>{t("statsListings")}</span>
          </span>
          <span className="w-px h-4 bg-white/20 hidden sm:block" />
          <span className="flex items-center gap-2">
            <CheckCircle size={16} className="text-status-success" />
            <span>{t("statsVerified")}</span>
          </span>
          <span className="w-px h-4 bg-white/20 hidden sm:block" />
          <span className="flex items-center gap-2">
            <Shield size={16} className="text-primary-light" />
            <span>{t("statsSecurity")}</span>
          </span>
        </div>
      </div>
    </section>
  );
}
