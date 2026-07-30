/**
 * Sakany Design System — Semantic Color Tokens
 * Single Source of Truth for system brand colors.
 */

export const colors = {
  // Brand Primary
  primary: {
    DEFAULT: "#1B4F8A",
    hover: "#1A3A6B",
    active: "#142E54",
    light: "#2E6BC4",
  },
  // Accent Gold
  accent: {
    DEFAULT: "#D4A847",
    hover: "#C49535",
    active: "#B38426",
    light: "#E8C06A",
  },
  // Surface Fills
  surface: {
    DEFAULT: "#FFFFFF",
    secondary: "#F8F9FC",
    tertiary: "#EDF0F7",
    elevated: "#FFFFFF",
  },
  // Typography Colors
  text: {
    DEFAULT: "#0F1A2E",
    secondary: "#64748B",
    tertiary: "#94A3B8",
    inverse: "#FFFFFF",
  },
  // Component Borders & Dividers
  border: {
    DEFAULT: "#E2E8F0",
    divider: "#F1F5F9",
    focus: "#1B4F8A",
  },
  // Feedback Fills
  status: {
    success: "#16A34A",
    warning: "#D97706",
    danger: "#DC2626",
    info: "#2563EB",
  },
} as const;

export type ColorTokens = typeof colors;
