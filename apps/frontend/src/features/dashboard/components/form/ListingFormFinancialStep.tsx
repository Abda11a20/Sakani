// apps/frontend/src/components/dashboard/form/ListingFormFinancialStep.tsx
"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { CurrencyInput, Switch } from "@/components/ui";
import type { ListingFormData, ListingFormChangeHandler } from "./listing-form.types";

interface ListingFormFinancialStepProps {
  formData: ListingFormData;
  errors: Record<string, string>;
  onChange: ListingFormChangeHandler;
}

export function ListingFormFinancialStep({
  formData,
  errors,
  onChange,
}: ListingFormFinancialStepProps) {
  return (
    <div className="space-y-5 animate-fadeIn font-cairo">
      <h2 className="text-xl font-bold flex items-center gap-2 text-text">
        <Sparkles className="text-accent" size={20} />
        <span>السعر وشروط التعاقد</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CurrencyInput
          label="سعر الإيجار الشهري"
          unit="ج.م / شهر"
          placeholder="0"
          value={formData.price}
          onChange={(e) => onChange("price", e.target.value)}
          error={errors.price}
        />

        <CurrencyInput
          label="مبلغ التأمين المسترد"
          unit="ج.م"
          placeholder="0"
          value={formData.securityDeposit}
          onChange={(e) => onChange("securityDeposit", e.target.value)}
          error={errors.securityDeposit}
        />
      </div>

      {/* Toggle Switches */}
      <div className="space-y-4 pt-2">
        <div className="p-3.5 bg-surface-secondary border border-border rounded-2xl">
          <Switch
            label="الإيجار شامل الفواتير؟"
            description="يتضمن الإيجار فواتير المياه، الغاز، الكهرباء، والإنترنت."
            checked={formData.includesBills}
            onChange={(e) => onChange("includesBills", e.target.checked)}
          />
        </div>

        <div className="p-3.5 bg-surface-secondary border border-border rounded-2xl">
          <Switch
            label="تفعيل ميزة شريك السكن؟"
            description="تمكين البحث المباشر للطلاب والشباب للسكن المشترك."
            checked={formData.roommateFeatureEnabled}
            onChange={(e) => onChange("roommateFeatureEnabled", e.target.checked)}
          />
        </div>
      </div>
    </div>
  );
}
