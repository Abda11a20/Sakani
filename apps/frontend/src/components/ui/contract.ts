/**
 * Sakani Design System — Atomic UI Contract Standard
 * Defines unified Variant, Size, Status, and Compound component standards across all UI primitives.
 */

export type UIComponentVariant = "primary" | "secondary" | "accent" | "outline" | "ghost" | "danger" | "success";
export type UIComponentSize = "sm" | "md" | "lg";
export type UIComponentStatus = "default" | "success" | "warning" | "danger" | "info";

export interface BaseUIProps {
  className?: string;
  children?: React.ReactNode;
}
