// apps/frontend/src/components/ui/input.tsx
"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, disabled, type, dir, ...props }, ref) => {
    const isLtrContent = type === "password" || type === "email" || type === "tel" || dir === "ltr";

    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            {label}
          </label>
        )}
        <div className="relative" dir={isLtrContent ? "ltr" : undefined}>
          {leftIcon && (
            <div
              className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-gray-500"
              style={{ direction: "ltr" }}
            >
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            dir={dir ?? (isLtrContent ? "ltr" : undefined)}
            className={cn(
              "flex w-full rounded-lg border bg-white ps-3 pe-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50 dark:bg-gray-900 dark:text-white dark:border-gray-700",
              error ? "border-red-500 focus-visible:ring-red-500" : "border-gray-300 dark:border-gray-700",
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
              className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none text-gray-500"
              style={{ direction: "ltr" }}
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

// ── PasswordInput ─────────────────────────────────────────────────────────────
// أيقونة العين كـ element مستقل (flex row) بحيث لا تتداخل مع النص
export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<InputProps, "type" | "rightIcon">
>(({ className, label, error, leftIcon, disabled, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex items-center gap-0 rounded-lg border bg-white dark:bg-gray-900 transition-colors focus-within:ring-2 focus-within:ring-primary",
          error
            ? "border-red-500 focus-within:ring-red-500"
            : "border-gray-300 dark:border-gray-700"
        )}
        style={{ direction: "ltr" }}
      >
        {/* أيقونة اليسار (اختيارية) */}
        {leftIcon && (
          <div className="flex items-center ps-3 text-gray-500 pointer-events-none shrink-0">
            {leftIcon}
          </div>
        )}

        {/* حقل الإدخال */}
        <input
          type={showPassword ? "text" : "password"}
          dir="ltr"
          className={cn(
            "flex-1 min-w-0 bg-transparent py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            leftIcon ? "ps-2" : "ps-3",
            error ? "placeholder:text-red-400" : "",
            className
          )}
          ref={ref}
          disabled={disabled}
          {...props}
        />

        {/* أيقونة العين - كيان مستقل على اليمين */}
        <div className="flex items-center pe-3 shrink-0">
          <button
            type="button"
            className="text-gray-400 hover:text-primary transition-colors focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* رسالة الخطأ */}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";
