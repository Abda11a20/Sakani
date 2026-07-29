/**
 * Sakani Design System — Tokenized Layer Stacking (z-index)
 */

export const zIndex = {
  hide: "-1",
  auto: "auto",
  base: "0",
  docked: "10",
  dropdown: "1000",
  sticky: "1100",
  banner: "1200",
  overlay: "1300",
  modal: "1400",
  popover: "1500",
  toast: "1600",
  tooltip: "1700",
} as const;

export type ZIndexTokens = typeof zIndex;
