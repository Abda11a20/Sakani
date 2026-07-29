// apps/frontend/src/components/ui/switch.tsx
"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, disabled, checked, id: customId, ...props }, ref) => {
    const generatedId = useId();
    const switchId = customId || generatedId;

    return (
      <div className="flex items-center justify-between gap-4 select-none">
        {(label || description) && (
          <label htmlFor={switchId} className="cursor-pointer text-sm">
            {label && <span className="font-medium text-text block">{label}</span>}
            {description && <span className="text-xs text-text-secondary block mt-0.5">{description}</span>}
          </label>
        )}
        <div className="relative inline-flex items-center">
          <input
            type="checkbox"
            id={switchId}
            ref={ref}
            checked={checked}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              "h-6 w-11 shrink-0 rounded-full border-2 border-transparent bg-border transition-colors duration-200 ease-in-out peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-checked:bg-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              className
            )}
          >
            <div
              className={cn(
                "pointer-events-none inline-block h-5 w-5 rounded-full bg-surface shadow-sm ring-0 transition duration-200 ease-in-out",
                checked ? "translate-x-5" : "translate-x-0"
              )}
            />
          </div>
        </div>
      </div>
    );
  }
);

Switch.displayName = "Switch";
