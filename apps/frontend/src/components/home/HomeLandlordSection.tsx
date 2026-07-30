// apps/frontend/src/components/home/HomeLandlordSection.tsx
import React from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Building2, ShieldCheck, Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui";

export async function HomeLandlordSection({ locale }: { locale: string }) {
  const t = await getTranslations("home");

  return (
    <section className="py-12 md:py-16 px-4 bg-gradient-to-br from-[#0F1A2E] via-[#142E54] to-[#1B4F8A] text-white relative overflow-hidden font-cairo">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 start-1/4 w-72 h-72 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 end-1/4 w-72 h-72 rounded-full bg-primary-light/20 blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-5xl relative z-10 text-center sm:text-start">
        <div className="space-y-4 md:space-y-6">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold bg-accent/20 border border-accent/40 text-accent-light">
            {t("landlordBadge")}
          </span>

          <h2 className="text-2xl md:text-4xl font-bold leading-snug text-white max-w-2xl">
            {t("landlordTitle")}
          </h2>

          <p className="text-white/90 text-sm md:text-base leading-relaxed max-w-2xl">
            {t("landlordSubtitle")}
          </p>

          {/* Perks Cards — 2 Columns Side by Side on Mobile / 3 on Desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 max-w-3xl">
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-start">
              <div className="w-8 h-8 rounded-xl bg-accent/20 text-accent-light flex items-center justify-center mb-2">
                <Users size={18} />
              </div>
              <h3 className="font-bold text-xs md:text-sm text-white mb-0.5">{t("perk1Title")}</h3>
              <p className="text-[11px] text-white/70 leading-tight">{t("perk1Desc")}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-start">
              <div className="w-8 h-8 rounded-xl bg-status-success/20 text-emerald-300 flex items-center justify-center mb-2">
                <ShieldCheck size={18} />
              </div>
              <h3 className="font-bold text-xs md:text-sm text-white mb-0.5">{t("perk2Title")}</h3>
              <p className="text-[11px] text-white/70 leading-tight">{t("perk2Desc")}</p>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-start">
              <div className="w-8 h-8 rounded-xl bg-primary-light/20 text-sky-300 flex items-center justify-center mb-2">
                <Building2 size={18} />
              </div>
              <h3 className="font-bold text-xs md:text-sm text-white mb-0.5">{t("perk3Title")}</h3>
              <p className="text-[11px] text-white/70 leading-tight">{t("perk3Desc")}</p>
            </div>
          </div>

          {/* Action Button — Create Account CTA with full locale awareness */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
            <Link href={`/${locale}/register`}>
              <Button
                variant="accent"
                size="md"
                leftIcon={<UserPlus size={16} />}
                className="font-bold px-6"
              >
                {locale === "en" ? "Create Your Account" : "أنشئ حسابك"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
