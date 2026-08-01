// apps/frontend/src/features/community/index.ts
/**
 * Community Feature — Public API Barrel Export (Clean Architecture)
 */
export * from "./domain/repositories/community.repository";
export * from "./domain/usecases";
export * from "./infrastructure/repositories/axios-community.repository";

export const formatTimeSlot12h = (timeSlot: string, isRtl: boolean) => {
  if (!timeSlot) return "";
  const parts = timeSlot.split(":");
  if (parts.length < 2) return timeSlot;

  let hour = parseInt(parts[0], 10);
  const minute = parts[1];
  if (isNaN(hour)) return timeSlot;

  const isPm = hour >= 12;
  const periodStr = isPm
    ? (isRtl ? "م" : "PM")
    : (isRtl ? "ص" : "AM");

  hour = hour % 12;
  if (hour === 0) hour = 12;

  const hourStr = String(hour).padStart(2, "0");
  return `${hourStr}:${minute} ${periodStr}`;
};
