// apps/frontend/src/components/dashboard/form/ListingFormWizardHeader.tsx
"use client";

import React from "react";

interface ListingFormWizardHeaderProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

const STEPS = [
  { step: 1, label: "الموقع" },
  { step: 2, label: "المواصفات" },
  { step: 3, label: "الصور" },
  { step: 4, label: "السعر" },
];

export function ListingFormWizardHeader({ currentStep, onStepClick }: ListingFormWizardHeaderProps) {
  return (
    <div className="mb-8 select-none">
      <div className="flex justify-between items-center relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
        {STEPS.map((s) => (
          <button
            key={s.step}
            type="button"
            onClick={() => onStepClick(s.step)}
            className="flex flex-col items-center z-10 cursor-pointer group focus:outline-none"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                currentStep >= s.step
                  ? "bg-primary text-white ring-4 ring-primary/20 group-hover:scale-105"
                  : "bg-surface-tertiary text-text-tertiary group-hover:bg-surface-secondary"
              }`}
            >
              {s.step}
            </div>
            <span
              className={`text-xs font-semibold font-cairo mt-2 transition-colors ${
                currentStep >= s.step ? "text-primary font-bold" : "text-text-tertiary"
              }`}
            >
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
