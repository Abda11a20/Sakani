// apps/frontend/src/components/ui/card.tsx
import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-xl bg-surface text-text overflow-hidden transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border border-border shadow-xs hover:shadow-sm",
        elevated: "shadow-md hover:shadow-lg border border-border/50",
        bordered: "border-2 border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const CardRoot = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant, className }))} {...props} />
  )
);
CardRoot.displayName = "Card";

const cardSectionVariants = cva("", {
  variants: {
    padding: {
      none: "p-0",
      sm: "p-3",
      md: "p-5",
      lg: "p-8",
    },
  },
  defaultVariants: {
    padding: "md",
  },
});

export interface CardSectionProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardSectionVariants> {}

export const CardHeader = React.forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 border-b border-divider", cardSectionVariants({ padding, className }))}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

export const CardBody = React.forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, padding, ...props }, ref) => (
    <div ref={ref} className={cn(cardSectionVariants({ padding, className }))} {...props} />
  )
);
CardBody.displayName = "CardBody";

export const CardFooter = React.forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center border-t border-divider", cardSectionVariants({ padding, className }))}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

// Compound Component Pattern Attachment
export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});
