// apps/frontend/src/components/ui/button.tsx
"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary/90",
        secondary: "bg-gold text-white hover:bg-gold/90",
        outline: "border-2 border-primary text-primary hover:bg-primary/10",
        ghost: "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200",
        danger: "bg-red-600 text-white hover:bg-red-700",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-6 text-base",
        lg: "h-14 px-8 text-lg",
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
          <span className="me-2" style={{ direction: "ltr" }}>
            <Spinner size="sm" color={variant === "outline" || variant === "ghost" ? "primary" : "white"} />
          </span>
        )}
        {!loading && leftIcon && (
          <span className="me-2 inline-flex items-center" style={{ direction: "ltr" }}>
            {leftIcon}
          </span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="ms-2 inline-flex items-center" style={{ direction: "ltr" }}>
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
