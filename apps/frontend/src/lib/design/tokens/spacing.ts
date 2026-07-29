/**
 * Sakani Design System — Tokenized Spacing Scale
 */

export const spacing = {
  "space-xs": "0.25rem", // 4px
  "space-sm": "0.5rem",  // 8px
  "space-md": "1rem",    // 16px
  "space-lg": "1.5rem",  // 24px
  "space-xl": "2.5rem",  // 40px
  "space-2xl": "4rem",   // 64px
} as const;

export type SpacingTokens = typeof spacing;
