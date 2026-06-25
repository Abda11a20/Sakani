// apps/frontend/src/components/ui/avatar.tsx
import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800",
  {
    variants: {
      size: {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-14 w-14 text-base",
        xl: "h-20 w-20 text-xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null;
  name: string;
  verified?: boolean;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, name, verified, ...props }, ref) => {
    const getInitials = (name: string) => {
      const parts = name.trim().split(" ");
      if (parts.length === 0) return "?";
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    return (
      <div className="relative inline-block">
        <div ref={ref} className={cn(avatarVariants({ size }), className)} {...props}>
          {src ? (
            <img
              src={src}
              alt={name}
              className="aspect-square h-full w-full object-cover"
              onError={(e) => {
                // Fallback to initials on error
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-semibold text-gray-600 dark:text-gray-300">
              {getInitials(name)}
            </div>
          )}
        </div>
        {verified && (
          <div
            className="absolute bottom-0 end-0 flex h-1/3 w-1/3 items-center justify-center rounded-full bg-gold ring-2 ring-white dark:ring-dark-bg"
            title="Verified"
          >
            <Check className="h-2/3 w-2/3 text-white" />
          </div>
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";
