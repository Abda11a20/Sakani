// apps/frontend/src/components/home/HomeHowItWorksSection.tsx
import React from "react";
import { getTranslations } from "next-intl/server";

export async function HomeHowItWorksSection() {
  const t = await getTranslations("home");
  const steps = [
    { emoji: "🔍", title: t("step1Title"), desc: t("step1Desc") },
    { emoji: "👀", title: t("step2Title"), desc: t("step2Desc") },
    { emoji: "🏠", title: t("step3Title"), desc: t("step3Desc") },
  ];

  return (
    <section className="py-20 px-4 bg-background font-cairo">
      <div className="container mx-auto">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full">
            {t("howBadge")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-3 text-text font-cairo">
            {t("howTitle")}
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto">
            {t("howSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <div key={i} className="relative text-center group">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 start-full w-full h-px border-t-2 border-dashed border-border z-0 -translate-y-1/2" />
              )}
              <div className="relative z-10 w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300 bg-primary/10 border border-primary/20">
                {step.emoji}
                <span className="absolute -top-2 -end-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold bg-primary">
                  {i + 1}
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2 text-text">{step.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
