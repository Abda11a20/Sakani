// apps/frontend/src/components/ui/otp-input.tsx
"use client";

import React, { useRef, useEffect } from "react";
import { Input } from "./input";

export interface OtpInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = true,
  className = "",
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;

    const pastedText = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pastedText) return;

    const digits = pastedText.slice(0, length).split("");
    const newOtp = Array(length).fill("");
    digits.forEach((digit, i) => {
      if (i < length) newOtp[i] = digit;
    });

    onChange(newOtp);

    const nextEmptyIndex = newOtp.findIndex((v) => !v);
    const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const rawVal = e.target.value;
    const digits = rawVal.replace(/\D/g, "");

    if (!digits) {
      const newOtp = [...value];
      newOtp[index] = "";
      onChange(newOtp);
      return;
    }

    if (digits.length > 1) {
      const newOtp = [...value];
      const sliced = digits.slice(0, length - index);
      for (let i = 0; i < sliced.length; i++) {
        if (index + i < length) {
          newOtp[index + i] = sliced[i];
        }
      }
      onChange(newOtp);
      const nextIndex = Math.min(index + sliced.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...value];
    newOtp[index] = digits[0];
    onChange(newOtp);

    if (digits[0] && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "Backspace") {
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleFocus = (index: number) => {
    inputRefs.current[index]?.select();
  };

  return (
    <div
      className={`flex justify-center gap-1.5 sm:gap-2 max-w-full overflow-hidden ${className}`}
      dir="ltr"
    >
      {Array.from({ length }).map((_, index) => (
        <div key={index} className="w-10 h-12 sm:w-12 sm:h-14 flex-shrink-0">
          <Input
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="tel"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={length}
            disabled={disabled}
            value={value[index] || ""}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(index)}
            aria-label={`OTP Digit ${index + 1}`}
            className="w-full h-full text-center text-lg font-bold p-0 border-2 focus:border-primary transition-all"
          />
        </div>
      ))}
    </div>
  );
}
