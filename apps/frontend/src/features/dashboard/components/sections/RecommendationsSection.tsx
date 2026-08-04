import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, TrendingUp, Camera, Eye, RefreshCw } from "lucide-react";
import type { Recommendation } from "../types/dashboard.types";
import { useLocale, useTranslations } from "next-intl";

function getIcon(type: string): React.ElementType {
  const t = (type ?? "").toLowerCase();
  if (t.includes("photo") || t.includes("صور")) return Camera;
  if (t.includes("view") || t.includes("مشاهد")) return Eye;
  if (t.includes("renew") || t.includes("expir") || t.includes("تجديد")) return RefreshCw;
  return TrendingUp;
}

function getPriorityMeta(priority: number, tRec: any) {
  if (priority >= 3)
    return { stars: "⭐⭐⭐", label: tRec("urgentTip"), iconBg: "#C9637A", color: "#C9637A", cardBg: "#FFF1F3", border: "#FECDD3" };
  if (priority === 2)
    return { stars: "⭐⭐", label: tRec("importantTip"), iconBg: "#C9637A", color: "#C9637A", cardBg: "#FFF1F3", border: "#FECDD3" };
  return { stars: "⭐", label: tRec("todaysTip"), iconBg: "#D4A847", color: "#C49535", cardBg: "#FFFBEB", border: "#FDE68A" };
}

function getLocalizedRecommendation(rec: Recommendation, isAr: boolean): { title: string; description: string } {
  if (isAr) return { title: rec.title, description: rec.description };
  switch (rec.type) {
    case "ONBOARDING":
      return {
        title: "Create your first listing on Sakani",
        description: "Start posting your apartments or beds available for rent to attract tenants easily.",
      };
    case "OPTIMIZATION":
      return {
        title: "Optimize your listing for more views",
        description: "Your listing receives few views. We recommend adding high-quality photos and clearer details.",
      };
    case "ALERT":
      return {
        title: "Enable smart housing alerts",
        description: "Set your governorate and budget to receive instant notifications when matching stays are listed.",
      };
    default:
      return { title: rec.title, description: rec.description };
  }
}

export const RecommendationsSection: React.FC<{ items: Recommendation[] }> = ({ items }) => {
  const locale = useLocale();
  const isAr = locale === "ar";
  const tRec = useTranslations("dashboard.landlord.recommendations");
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-cairo">
        ✨ {tRec("title")}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((rec) => {
          const Icon = getIcon(rec.type);
          const meta = getPriorityMeta(rec.priority, tRec);
          const localized = getLocalizedRecommendation(rec, isAr);

          return (
            <div
              key={rec.id}
              className="flex items-start gap-3 p-3.5 rounded-xl border hover:shadow-sm transition-all"
              style={{ background: meta.cardBg, borderColor: meta.border }}
            >
              {/* Icon */}
              <div
                className="p-2 rounded-lg shrink-0 text-white shadow-xs"
                style={{ background: meta.iconBg }}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                {/* Priority badge */}
                <p
                  className="text-[10px] font-black uppercase tracking-wider leading-none"
                  style={{ color: meta.color }}
                >
                  {meta.stars} {meta.label}
                </p>

                {/* Title */}
                <h4 className="text-sm font-bold text-slate-900 leading-snug font-cairo">
                  {localized.title}
                </h4>

                {/* Reason = description */}
                <p className="text-[11px] text-slate-600 leading-relaxed font-cairo line-clamp-3">
                  {localized.description}
                </p>

                {/* CTA — filled button */}
                {rec.route && (
                  <Link
                    href={rec.route}
                    className="inline-flex items-center gap-1.5 mt-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all hover:opacity-90 shadow-xs"
                    style={{ background: meta.iconBg, color: meta.iconBg === "#D4A847" ? "#0f1a2e" : "#ffffff" }}
                  >
                    {tRec("takeAction")}
                    <Arrow className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
