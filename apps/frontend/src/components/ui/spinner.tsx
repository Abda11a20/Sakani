// apps/frontend/src/components/ui/spinner.tsx
import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const spinnerVariants = cva(
  "inline-block animate-spin rounded-full border-solid border-current border-e-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]",
  {
    variants: {
      size: {
        sm: "h-4 w-4 border-2",
        md: "h-8 w-8 border-4",
        lg: "h-12 w-12 border-4",
      },
      color: {
        primary: "text-primary",
        white: "text-white",
        gold: "text-gold",
      },
    },
    defaultVariants: {
      size: "md",
      color: "primary",
    },
  }
);

export interface SpinnerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof spinnerVariants> {}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, color, ...props }, ref) => {
    return (
      <div
        className={cn(spinnerVariants({ size, color, className }))}
        role="status"
        ref={ref}
        {...props}
      >
        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
          Loading...
        </span>
      </div>
    );
  }
);

Spinner.displayName = "Spinner";
