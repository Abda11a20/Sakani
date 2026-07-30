// apps/frontend/src/components/home/HomeHeroSection.tsx
import React from "react";
import { getTranslations } from "next-intl/server";
import { Building2, CheckCircle, Shield } from "lucide-react";
import { HeroSearchBar } from "./HeroSearchBar";

export async function HomeHeroSection({ locale }: { locale: string }) {
  const t = await getTranslations("home");
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden font-cairo bg-gradient-to-br from-[#0F1A2E] via-[#142E54] to-[#1B4F8A] text-white">
      {/* Decorative Glow Elements */}
      <div className="absolute top-12 start-8 w-80 h-80 rounded-full opacity-20 blur-3xl bg-accent pointer-events-none" />
      <div className="absolute bottom-12 end-8 w-64 h-64 rounded-full opacity-20 blur-3xl bg-primary-light pointer-events-none" />

      <div className="container mx-auto px-4 text-center text-white py-16 relative z-10">
        {/* Badge */}
        <div className="mb-6">
          <span className="inline-block px-5 py-2 rounded-full text-xs sm:text-sm font-semibold mb-6 border border-accent/40 bg-accent/20 text-accent-light shadow-sm">
            {t("heroBadge")}
          </span>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold leading-tight mb-5 text-white">
            {t("heroTitleLine1")}
            <br />
            <span className="text-accent">{t("heroTitleLine2")}</span>
          </h1>
          <p className="text-sm sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed font-normal">
            {t("heroSubtitle")}
          </p>
        </div>

        {/* Search Bar with Query Preservation */}
        <HeroSearchBar
          locale={locale}
          placeholder={t("searchPlaceholder")}
          searchButtonText={t("searchButton")}
          apartmentText={t("apartment")}
          roomText={t("room")}
          bedText={t("bed")}
        />

        {/* Stats */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-white/80">
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
            <Shield size={16} className="text-sky-300" />
            <span>{t("statsSecurity")}</span>
          </span>
        </div>
      </div>
    </section>
  );
}
