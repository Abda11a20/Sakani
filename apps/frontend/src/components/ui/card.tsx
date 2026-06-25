// apps/frontend/src/components/ui/card.tsx
import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-xl bg-white text-gray-950 dark:bg-dark-bg dark:text-gray-50 overflow-hidden",
  {
    variants: {
      variant: {
        default: "shadow-sm border border-gray-200 dark:border-gray-800",
        elevated: "shadow-md hover:shadow-lg transition-shadow border border-transparent dark:border-gray-800",
        bordered: "border-2 border-gray-200 dark:border-gray-800",
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

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant, className }))} {...props} />
  )
);
Card.displayName = "Card";

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
      className={cn("flex flex-col space-y-1.5", cardSectionVariants({ padding, className }))}
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
      className={cn("flex items-center", cardSectionVariants({ padding, className }))}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";
