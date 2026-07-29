/**
 * Sakani Design System — Tokenized Border Radius Scale
 */

export const radius = {
  none: "0px",
  sm: "0.25rem",   // 4px
  md: "0.5rem",    // 8px
  lg: "0.75rem",   // 12px (Default System Radius)
  xl: "1rem",      // 16px
  "2xl": "1.5rem", // 24px
  full: "9999px",
} as const;

export type RadiusTokens = typeof radius;
