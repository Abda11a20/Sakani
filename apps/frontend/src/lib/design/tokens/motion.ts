/**
 * Sakani Design System — Motion & Animation Tokens
 */

export const motion = {
  durations: {
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
  },
  easings: {
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  },
} as const;

export type MotionTokens = typeof motion;
