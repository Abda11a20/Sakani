// apps/frontend/src/components/ui/button.tsx
"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-active shadow-sm",
        secondary: "bg-surface-tertiary text-text hover:bg-border active:bg-border-divider",
        accent: "bg-accent text-text hover:bg-accent-hover active:bg-accent-active shadow-sm",
        outline: "border border-border bg-surface text-text hover:bg-surface-secondary hover:border-primary/50",
        ghost: "hover:bg-surface-secondary text-text-secondary hover:text-text",
        danger: "bg-status-danger text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
        success: "bg-status-success text-white hover:bg-green-700 active:bg-green-800 shadow-sm",
      },
      size: {
        sm: "h-9 px-3 text-xs gap-1.5",
        md: "h-11 px-5 text-sm gap-2",
        lg: "h-13 px-7 text-base gap-2.5",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, fullWidth, loading, leftIcon, rightIcon, children, disabled, ...props },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="shrink-0">
            <Spinner size="sm" color={variant === "outline" || variant === "ghost" ? "primary" : "white"} />
          </span>
        )}
        {!loading && leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>}
        <span>{children}</span>
        {!loading && rightIcon && <span className="inline-flex shrink-0 items-center">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
