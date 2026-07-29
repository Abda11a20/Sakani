/**
 * Sakani Design System — Unified Typography Scale
 */

export const typography = {
  fonts: {
    cairo: ["Cairo", "sans-serif"],
    inter: ["Inter", "sans-serif"],
  },
  scale: {
    display:  "text-4xl font-extrabold tracking-tight leading-tight", // 36px
    heading:  "text-2xl font-bold tracking-tight leading-snug",       // 24px
    title:    "text-lg font-semibold leading-snug",                   // 18px
    body:     "text-base font-normal leading-relaxed",                // 16px
    bodySm:   "text-sm font-normal leading-normal",                   // 14px
    caption:  "text-xs font-medium leading-normal",                   // 12px
    overline: "text-xs font-bold uppercase tracking-wider",           // 12px CAPS
  },
} as const;

export type TypographyTokens = typeof typography;
