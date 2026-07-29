// apps/frontend/src/components/dashboard/form/ListingFormSpecsStep.tsx
"use client";

import React from "react";
import {
  Building,
  Home,
  Wifi,
  Wind,
  ArrowUpDown,
  WashingMachine,
  Tv,
  Flame,
  Zap,
  Droplets,
  Filter,
  Shield,
  Car,
} from "lucide-react";
import { Input, Textarea, Button, Card } from "@/components/ui";
import { AMENITIES_CONFIG, ELECTRICITY_TYPE_CONFIG } from "@/lib/constants";
import type { ListingFormData, ListingFormChangeHandler } from "./listing-form.types";

const AMENITY_ICON_MAP: Record<string, React.ReactNode> = {
  wifi:         <Wifi size={16} />,
  ac:           <Wind size={16} />,
  elevator:     <ArrowUpDown size={16} />,
  washer:       <WashingMachine size={16} />,
  tv:           <Tv size={16} />,
  fan:          <Wind size={16} />,
  stove:        <Flame size={16} />,
  fridge:       <Zap size={16} />,
  water_heater: <Droplets size={16} />,
  water_filter: <Filter size={16} />,
  natural_gas:  <Flame size={16} />,
  security:     <Shield size={16} />,
  balcony:      <Home size={16} />,
  parking:      <Car size={16} />,
};

const AMENITY_OPTIONS = AMENITIES_CONFIG.map((a) => ({
  key: a.key,
  label: a.labelAr,
  icon: AMENITY_ICON_MAP[a.key] ?? <Zap size={16} />,
}));

interface ListingFormSpecsStepProps {
  formData: ListingFormData;
  errors: Record<string, string>;
  onChange: ListingFormChangeHandler;
  onToggleAmenity: (amenityKey: string) => void;
  onFurnishedChange: (isFurnished: boolean) => void;
}

export function ListingFormSpecsStep({
  formData,
  errors,
  onChange,
  onToggleAmenity,
  onFurnishedChange,
}: ListingFormSpecsStepProps) {
  return (
    <div className="space-y-5 animate-fadeIn font-cairo">
      <h2 className="text-xl font-bold flex items-center gap-2 text-text">
        <Building className="text-accent" size={20} />
        <span>مواصفات الوحدة</span>
      </h2>

      {/* Unit Type Cards */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text">نوع الوحدة</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { value: "apartment", label: "شقة كاملة", desc: "تأجير الشقة بالكامل للمستأجر" },
            { value: "bed", label: "سرير", desc: "سرير في سكن مشترك" },
          ].map((type) => (
            <Card
              key={type.value}
              onClick={() => onChange("unitType", type.value)}
              className={`p-4 cursor-pointer transition-all duration-200 flex flex-col items-center text-center space-y-2 select-none border-2 ${
                formData.unitType === type.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-border-focus"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  formData.unitType === type.value
                    ? "bg-primary text-white"
                    : "bg-surface-tertiary text-text-secondary"
                }`}
              >
                <Building size={20} />
              </div>
              <span className="font-bold text-sm text-text">
                {type.label}
              </span>
              <span className="text-xs text-text-secondary">{type.desc}</span>
            </Card>
          ))}
        </div>
      </div>

      {/* Furnishing Status */}
      {formData.unitType === "apartment" && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-text flex items-center gap-1.5">
            <Home size={16} className="text-accent" />
            <span>حالة الفرش</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: true, label: "مفروشة 🛋️", desc: "تشتمل على الأثاث والأجهزة" },
              { value: false, label: "فارغة / غير مفروشة 🚪", desc: "بدون أثاث (عقارات فارغة)" },
            ].map((item) => (
              <Button
                key={String(item.value)}
                type="button"
                variant={formData.isFurnished === item.value ? "primary" : "outline"}
                onClick={() => onFurnishedChange(item.value)}
                className="h-auto py-3.5 flex flex-col items-center text-center space-y-1 rounded-2xl"
              >
                <span className="text-xs font-bold">{item.label}</span>
                <span className="text-[10px] opacity-80">{item.desc}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Total Beds */}
      {formData.unitType === "bed" && (
        <Input
          type="number"
          min={1}
          label="عدد الأسرة الإجمالي"
          placeholder="أدخل عدد الأسرة الكلي"
          value={formData.totalBeds}
          onChange={(e) => onChange("totalBeds", e.target.value)}
          error={errors.totalBeds}
        />
      )}

      {/* Target Gender */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text">
          الفئة المستهدفة
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "mixed", label: "الجميع / عائلات" },
            { value: "male", label: "شباب فقط" },
            { value: "female", label: "بنات فقط" },
          ].map((gender) => (
            <Button
              key={gender.value}
              type="button"
              variant={formData.genderTarget === gender.value ? "primary" : "outline"}
              size="sm"
              onClick={() => onChange("genderTarget", gender.value)}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold"
            >
              {gender.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-text">
            المميزات المتاحة
          </label>
          {formData.unitType === "apartment" && formData.isFurnished === false && (
            <span className="text-[11px] text-accent font-semibold">
              🚪 تظهر المرافق الإنشائية فقط للعقارات الفارغة
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {AMENITY_OPTIONS.filter((opt) => {
            const APPLIANCE_KEYS = ["ac", "washer", "tv", "fan", "stove", "fridge", "water_heater"];
            if (formData.unitType === "apartment" && formData.isFurnished === false) {
              return !APPLIANCE_KEYS.includes(opt.key);
            }
            return true;
          }).map((opt) => {
            const isChecked = formData.amenities.includes(opt.key);
            return (
              <Card
                key={opt.key}
                onClick={() => onToggleAmenity(opt.key)}
                className={`p-3 border flex flex-row items-center gap-2.5 cursor-pointer select-none transition-all rounded-xl ${
                  isChecked
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border text-text-secondary hover:bg-surface-secondary"
                }`}
              >
                <span className={isChecked ? "text-primary" : "text-text-tertiary"}>{opt.icon}</span>
                <span className="text-xs">{opt.label}</span>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Electricity Meter Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text">
          نوع عداد الكهرباء
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(ELECTRICITY_TYPE_CONFIG) as [string, { labelAr: string }][]).map(
            ([value, cfg]) => (
              <Button
                key={value}
                type="button"
                variant={formData.electricityType === value ? "primary" : "outline"}
                size="md"
                onClick={() => onChange("electricityType", value)}
                leftIcon={
                  <Zap
                    size={14}
                    className={formData.electricityType === value ? "text-white" : "text-text-tertiary"}
                  />
                }
                className="py-3 px-4 rounded-xl text-xs font-bold justify-start"
              >
                {cfg.labelAr}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Description Textarea */}
      <Textarea
        label="الوصف والتفاصيل الإضافية"
        placeholder="اكتب وصفاً مفصلاً للعقار ومحيطه والقواعد العامة..."
        value={formData.description}
        onChange={(e) => onChange("description", e.target.value)}
        rows={4}
      />
    </div>
  );
}
