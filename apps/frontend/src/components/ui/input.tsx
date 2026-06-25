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
  ({ className, label, error, leftIcon, rightIcon, disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div
              className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-gray-500"
              style={{ direction: "ltr" }}
            >
              {leftIcon}
            </div>
          )}
          <input
            className={cn(
              "flex w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50 dark:bg-gray-900 dark:text-white dark:border-gray-700",
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

export const PasswordInput = React.forwardRef<HTMLInputElement, Omit<InputProps, "type" | "rightIcon">>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <Input
        type={showPassword ? "text" : "password"}
        className={className}
        ref={ref}
        rightIcon={
          <button
            type="button"
            className="pointer-events-auto text-gray-500 hover:text-primary transition-colors focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
        {...props}
      />
    );
  }
);
PasswordInput.displayName = "PasswordInput";
