// apps/frontend/src/components/ui/checkbox.tsx
"use client";

import React, { useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, disabled, checked, id: customId, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = customId || generatedId;

    return (
      <div className="flex items-start gap-2.5 select-none">
        <div className="relative flex items-center pt-0.5">
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            checked={checked}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              "flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border bg-surface transition-all duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-checked:bg-primary peer-checked:border-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              error && "border-status-danger",
              className
            )}
          >
            <Check className="h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
          </div>
        </div>
        {(label || description) && (
          <label htmlFor={checkboxId} className="cursor-pointer text-sm">
            {label && <span className="font-medium text-text block">{label}</span>}
            {description && <span className="text-xs text-text-secondary block mt-0.5">{description}</span>}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
