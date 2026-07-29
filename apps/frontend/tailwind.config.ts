// apps/frontend/tailwind.config.ts
import type { Config } from "tailwindcss";
import { colors, spacing, radius, shadows, zIndex, breakpoints } from "./src/lib/design/tokens";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        cairo: ["Cairo", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        // CSS Variable mapped base tokens
        background: "var(--color-surface-secondary)",
        foreground: "var(--color-text)",
        card: "var(--color-surface)",
        border: "var(--color-border)",
        muted: "var(--color-text-secondary)",

        // Semantic Token Palette (Backward compatible & Forward facing)
        primary: {
          DEFAULT: colors.primary.DEFAULT,
          dark: colors.primary.hover,
          light: colors.primary.light,
          hover: colors.primary.hover,
          active: colors.primary.active,
        },
        gold: {
          DEFAULT: colors.accent.DEFAULT,
          dark: colors.accent.hover,
          light: colors.accent.light,
        },
        accent: {
          DEFAULT: colors.accent.DEFAULT,
          hover: colors.accent.hover,
          active: colors.accent.active,
          light: colors.accent.light,
        },
        surface: {
          DEFAULT: colors.surface.DEFAULT,
          secondary: colors.surface.secondary,
          tertiary: colors.surface.tertiary,
          elevated: colors.surface.elevated,
        },
        text: {
          DEFAULT: colors.text.DEFAULT,
          secondary: colors.text.secondary,
          tertiary: colors.text.tertiary,
          inverse: colors.text.inverse,
        },
        divider: colors.border.divider,
        status: {
          success: colors.status.success,
          warning: colors.status.warning,
          danger: colors.status.danger,
          info: colors.status.info,
        },
        "sakani-dark": colors.text.DEFAULT,
        "sakani-light": colors.surface.secondary,
      },
      spacing: {
        ...spacing,
      },
      borderRadius: {
        ...radius,
      },
      boxShadow: {
        ...shadows,
      },
      zIndex: {
        ...zIndex,
      },
      screens: {
        ...breakpoints,
      },
    },
  },
  plugins: [],
};

export default config;
