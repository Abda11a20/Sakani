// apps/frontend/src/components/ui/textarea.tsx
"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, disabled, id: customId, rows = 4, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = customId || generatedId;
    const errorId = `${textareaId}-error`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-text">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          rows={rows}
          className={cn(
            "flex w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-tertiary transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:opacity-60 resize-y min-h-[90px]",
            error ? "border-status-danger focus-visible:ring-status-danger" : "border-border hover:border-border-focus",
            className
          )}
          ref={ref}
          disabled={disabled}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1 text-xs text-status-danger">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="mt-1 text-xs text-text-secondary">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
