// apps/frontend/src/components/ui/input.tsx
"use client";

import React, { useState, useId } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, disabled, type, dir, id: customId, ...props }, ref) => {
    const generatedId = useId();
    const inputId = customId || generatedId;
    const errorId = `${inputId}-error`;

    const isLtrContent = type === "password" || type === "email" || type === "tel" || dir === "ltr";

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative" dir={isLtrContent ? "ltr" : undefined}>
          {leftIcon && (
            <div
              className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-text-tertiary"
              style={{ direction: "ltr" }}
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            dir={dir ?? (isLtrContent ? "ltr" : undefined)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "flex w-full rounded-lg border bg-surface text-text placeholder:text-text-tertiary ps-3 pe-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-surface-tertiary disabled:opacity-50",
              error ? "border-status-danger focus-visible:ring-status-danger" : "border-border",
              leftIcon ? "ps-10" : "",
              rightIcon ? "pe-10" : "",
              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          />
          {rightIcon && (
            <div
              className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none text-text-tertiary"
              style={{ direction: "ltr" }}
              aria-hidden="true"
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1 text-sm text-status-danger">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// ── PasswordInput ─────────────────────────────────────────────────────────────
export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<InputProps, "type" | "rightIcon">
>(({ className, label, error, leftIcon, disabled, id: customId, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const generatedId = useId();
  const inputId = customId || generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex items-center gap-0 rounded-lg border bg-surface transition-colors focus-within:ring-2 focus-within:ring-primary",
          error
            ? "border-status-danger focus-within:ring-status-danger"
            : "border-border"
        )}
      >
        {leftIcon && (
          <div className="flex items-center ps-3 text-text-tertiary pointer-events-none shrink-0" aria-hidden="true">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          type={showPassword ? "text" : "password"}
          dir="ltr"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "flex-1 min-w-0 bg-transparent py-2 text-sm text-text placeholder:text-text-tertiary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 text-start ps-3 pe-2",
            className
          )}
          ref={ref}
          disabled={disabled}
          {...props}
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          aria-pressed={showPassword}
          className="pe-3 ps-2 text-text-tertiary hover:text-text-secondary focus:outline-none shrink-0"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-sm text-status-danger">
          {error}
        </p>
      )}
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

// ── CurrencyInput ─────────────────────────────────────────────────────────────
export interface CurrencyInputProps extends Omit<InputProps, "value"> {
  value?: number | string;
  currencySymbol?: string;
  unit?: string;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      className,
      label,
      error,
      value,
      onChange,
      currencySymbol,
      unit = "ج.م",
      disabled,
      id: customId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = customId || generatedId;
    const errorId = `${inputId}-error`;

    const symbol = currencySymbol || unit;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-text-secondary font-cairo">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            type="number"
            value={value ?? ""}
            onChange={onChange}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "flex w-full rounded-lg border bg-surface text-text placeholder:text-text-tertiary ps-3 pe-16 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-surface-tertiary disabled:opacity-50",
              error ? "border-status-danger focus-visible:ring-status-danger" : "border-border",
              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          />
          <div
            className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none text-xs font-semibold text-text-tertiary font-cairo"
            aria-hidden="true"
          >
            {symbol}
          </div>
        </div>
        {error && (
          <p id={errorId} className="mt-1 text-sm text-status-danger font-cairo">
            {error}
          </p>
        )}
      </div>
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";
