// apps/frontend/src/components/dashboard/form/ListingFormImagesStep.tsx
"use client";

import React from "react";
import { Upload, X, ChevronRight, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui";
import type { ListingFormImageItem } from "./listing-form.types";

interface ListingFormImagesStepProps {
  images: ListingFormImageItem[];
  error?: string;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onMoveImage: (index: number, direction: "left" | "right") => void;
}

export function ListingFormImagesStep({
  images,
  error,
  onImageChange,
  onRemoveImage,
  onMoveImage,
}: ListingFormImagesStepProps) {
  return (
    <div className="space-y-5 animate-fadeIn">
      <h2 className="text-xl font-bold font-cairo flex items-center gap-2 text-slate-800">
        <Upload className="text-amber-500" size={20} />
        <span>صور العقار</span>
      </h2>

      {/* Upload Zone */}
      <div className="border-2 border-dashed border-slate-200 hover:border-[#0EA5E9] rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer relative group transition-colors">
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={onImageChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        <div className="w-14 h-14 bg-[#0EA5E9]/10 text-amber-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Upload size={24} />
        </div>
        <p className="font-bold text-slate-700 font-cairo text-sm">
          اسحب الصور هنا أو انقر للاختيار
        </p>
        <p className="text-xs text-slate-400 mt-1 font-cairo">
          JPEG, PNG, WEBP — بحد أقصى 10 صور، وحجم 5 ميجابايت للصورة.
        </p>
      </div>
      {error && <p className="text-xs text-red-500 text-center mt-1 font-cairo">{error}</p>}

      {/* Images Previews */}
      {images.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-400 font-cairo">
            ترتيب الصور (اضغط على الأسهم للتبديل. الصورة الأولى هي الصورة الرئيسية):
          </p>

          <div className="flex flex-col gap-2.5">
            {images.map((img, index) => (
              <div
                key={img.url}
                style={{ order: index }}
                className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={img.url}
                    alt={`preview-${index}`}
                    className="w-16 h-12 rounded-xl object-cover bg-slate-100 shrink-0"
                  />
                  <div className="min-w-0">
                    {index === 0 ? (
                      <Badge className="bg-green-100 text-green-800 font-cairo font-bold">
                        الصورة الرئيسية
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400 font-cairo">صورة فرعية {index}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Move Up/Left */}
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => onMoveImage(index, "left")}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 disabled:opacity-30 shrink-0"
                  >
                    <ChevronRight size={14} className="rtl:rotate-180" />
                  </button>

                  {/* Move Down/Right */}
                  <button
                    type="button"
                    disabled={index === images.length - 1}
                    onClick={() => onMoveImage(index, "right")}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 disabled:opacity-30 shrink-0"
                  >
                    <ChevronLeft size={14} className="rtl:rotate-180" />
                  </button>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => onRemoveImage(index)}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
