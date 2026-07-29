/**
 * Sakani Design System — Tokenized Elevation Shadows Scale
 */

export const shadows = {
  none: "none",
  xs: "0 1px 2px 0 rgba(27, 79, 138, 0.05)",
  sm: "0 1px 3px 0 rgba(27, 79, 138, 0.08), 0 1px 2px -1px rgba(27, 79, 138, 0.05)",
  md: "0 4px 6px -1px rgba(27, 79, 138, 0.08), 0 2px 4px -2px rgba(27, 79, 138, 0.05)",
  lg: "0 10px 15px -3px rgba(27, 79, 138, 0.08), 0 4px 6px -4px rgba(27, 79, 138, 0.05)",
  xl: "0 20px 25px -5px rgba(27, 79, 138, 0.08), 0 8px 10px -6px rgba(27, 79, 138, 0.05)",
} as const;

export type ShadowTokens = typeof shadows;
