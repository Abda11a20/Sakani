// apps/frontend/src/components/dashboard/rules/shared.rules.ts

import { formatDistanceToNow } from "date-fns";
import { arSA, enUS } from "date-fns/locale";

export function getGreetingText(userName: string = "", isAr: boolean = true): { greeting: string; statusSubtitle: string } {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? (isAr ? "صباح الخير" : "Good morning") : (isAr ? "مساء الخير" : "Good evening");
  const name = userName ? `، ${userName}` : "";

  return {
    greeting: `${timeOfDay}${name} 👋`,
    statusSubtitle: isAr ? "نظرة عامة سريعة على حسابك وإجراءاتك اليوم" : "A quick overview of your account and daily actions",
  };
}

export function formatLastUpdated(isoString?: string, isAr: boolean = true): string {
  if (!isoString) return "";
  try {
    const timeAgo = formatDistanceToNow(new Date(isoString), {
      addSuffix: true,
      locale: isAr ? arSA : enUS,
    });
    return isAr ? `آخر تحديث ${timeAgo}` : `Updated ${timeAgo}`;
  } catch {
    return "";
  }
}
