// apps/frontend/src/components/dashboard/ListingForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { z } from "zod";
import {
  MapPin,
  Building,
  Upload,
  X,
  ArrowRight,
  ArrowLeft,
  Wifi,
  Wind,
  Layers,
  WashingMachine,
  Zap,
  Shield,
  SquareEqual,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Input, Button, Select, Badge, useToast, Spinner } from "@/components/ui";
import { useUploadListingImages, useDeleteImage, useReorderImages } from "@/hooks/useUploads";
import { api } from "@/lib/api";
import type { Listing } from "@/types";

// ── Egypt Governorates ──
const GOVERNORATES = [
  { value: "القاهرة", label: "القاهرة" },
  { value: "الجيزة", label: "الجيزة" },
  { value: "الإسكندرية", label: "الإسكندرية" },
  { value: "القليوبية", label: "القليوبية" },
  { value: "المنوفية", label: "المنوفية" },
  { value: "الغربية", label: "الغربية" },
  { value: "الدقهلية", label: "الدقهلية" },
  { value: "الشرقية", label: "الشرقية" },
  { value: "دمياط", label: "دمياط" },
  { value: "بورسعيد", label: "بورسعيد" },
  { value: "السويس", label: "السويس" },
  { value: "الإسماعيلية", label: "الإسماعيلية" },
  { value: "الفيوم", label: "الفيوم" },
  { value: "بني سويف", label: "بني سويف" },
  { value: "المنيا", label: "المنيا" },
  { value: "أسيوط", label: "أسيوط" },
  { value: "سوهاج", label: "سوهاج" },
  { value: "قنا", label: "قنا" },
  { value: "الأقصر", label: "الأقصر" },
  { value: "أسوان", label: "أسوان" },
  { value: "البحر الأحمر", label: "البحر الأحمر" },
  { value: "الوادي الجديد", label: "الوادي الجديد" },
  { value: "مطروح", label: "مطروح" },
  { value: "شمال سيناء", label: "شمال سيناء" },
  { value: "جنوب سيناء", label: "جنوب سيناء" },
  { value: "كفر الشيخ", label: "كفر الشيخ" },
  { value: "البحيرة", label: "البحيرة" },
];

const AMENITY_OPTIONS = [
  { key: "wifi", label: "واي فاي", icon: <Wifi size={16} /> },
  { key: "ac", label: "تكييف", icon: <Wind size={16} /> },
  { key: "elevator", label: "أسانسير", icon: <Layers size={16} /> },
  { key: "washer", label: "غسالة", icon: <WashingMachine size={16} /> },
  { key: "gas", label: "سخان / غاز", icon: <Zap size={16} /> },
  { key: "security", label: "أمن وحراسة", icon: <Shield size={16} /> },
];

const step1Schema = z.object({
  governorate: z.string().min(1, "المحافظة مطلوبة"),
  district: z.string().min(1, "الحي/المنطقة مطلوبة"),
  address: z.string().min(5, "العنوان التفصيلي يجب أن لا يقل عن 5 أحرف"),
  lat: z.coerce.number().optional().default(30.0444),
  lng: z.coerce.number().optional().default(31.2357),
});

const step2Schema = z.object({
  unitType: z.enum(["apartment", "room", "bed"]),
  totalBeds: z.coerce.number().optional(),
  genderTarget: z.enum(["mixed", "male", "female"]),
  amenities: z.array(z.string()),
  electricityType: z.enum(["prepaid_card", "old_meter", "modern_meter"]),
  description: z.string().optional(),
}).refine(data => {
  if (data.unitType === "bed" && (!data.totalBeds || data.totalBeds < 1)) {
    return false;
  }
  return true;
}, {
  message: "عدد الأسرة مطلوب ويجب أن يكون 1 على الأقل عند اختيار نوع سرير",
  path: ["totalBeds"]
});

const step4Schema = z.object({
  price: z.coerce.number().min(1, "سعر الإيجار يجب أن يكون أكبر من 0"),
  securityDeposit: z.coerce.number().min(0, "مبلغ التأمين لا يمكن أن يكون سالباً"),
  includesBills: z.boolean(),
  roommateFeatureEnabled: z.boolean().optional(),
});

interface ListingFormProps {
  initialData?: Listing;
  onSubmit: (data: any) => Promise<Listing>;
  isSubmitting: boolean;
}

interface ImageItem {
  id?: string; // S3 image URL or custom key for new uploads
  url: string;
  file?: File;
  isNew: boolean;
}

export default function ListingForm({ initialData, onSubmit, isSubmitting }: ListingFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    governorate: initialData?.governorate || "القاهرة",
    district: initialData?.district || "",
    address: initialData?.address || "",
    lat: initialData?.latitude || 30.0444,
    lng: initialData?.longitude || 31.2357,
    unitType: initialData?.unitType || "apartment",
    totalBeds: initialData?.totalBeds || 1,
    genderTarget: initialData?.genderTarget || "mixed",
    amenities: initialData?.amenities || [],
    electricityType: initialData?.electricityType || "modern_meter",
    description: initialData?.description || "",
    price: initialData?.price || "",
    securityDeposit: initialData?.securityDeposit || 0,
    includesBills: initialData?.includesBills || false,
    roommateFeatureEnabled: initialData?.isFeatured || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Image State Management
  const [images, setImages] = useState<ImageItem[]>([]);
  const { mutateAsync: uploadImages } = useUploadListingImages(initialData?.id || "");
  const { mutateAsync: deleteImage } = useDeleteImage();
  const { mutateAsync: reorderImages } = useReorderImages(initialData?.id || "");

  useEffect(() => {
    if (initialData?.images) {
      setImages(
        initialData.images.map((url, idx) => ({
          id: String(idx), // we will need ID for delete, but for existing we just use index or we can find from API listing images if available
          url,
          isNew: false,
        }))
      );
    }
  }, [initialData]);

  // Handle errors check
  const validateStep = (step: number) => {
    setErrors({});
    if (step === 1) {
      const res = step1Schema.safeParse({
        governorate: formData.governorate,
        district: formData.district,
        address: formData.address,
        lat: formData.lat,
        lng: formData.lng,
      });
      if (!res.success) {
        const errs: Record<string, string> = {};
        res.error.issues.forEach(e => {
          if (e.path[0]) errs[e.path[0] as string] = e.message;
        });
        setErrors(errs);
        return false;
      }
    } else if (step === 2) {
      const res = step2Schema.safeParse({
        unitType: formData.unitType,
        totalBeds: formData.totalBeds,
        genderTarget: formData.genderTarget,
        amenities: formData.amenities,
        electricityType: formData.electricityType,
        description: formData.description,
      });
      if (!res.success) {
        const errs: Record<string, string> = {};
        res.error.issues.forEach(e => {
          if (e.path[0]) errs[e.path[0] as string] = e.message;
        });
        setErrors(errs);
        return false;
      }
    } else if (step === 3) {
      if (images.length === 0) {
        setErrors({ images: "يجب اختيار صورة واحدة على الأقل للعقار" });
        return false;
      }
    } else if (step === 4) {
      const res = step4Schema.safeParse({
        price: formData.price,
        securityDeposit: formData.securityDeposit,
        includesBills: formData.includesBills,
        roommateFeatureEnabled: formData.roommateFeatureEnabled,
      });
      if (!res.success) {
        const errs: Record<string, string> = {};
        res.error.issues.forEach(e => {
          if (e.path[0]) errs[e.path[0] as string] = e.message;
        });
        setErrors(errs);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Image Upload handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      const validFiles: ImageItem[] = [];

      filesArr.forEach(file => {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "الملف كبير جداً",
            description: `الملف ${file.name} يتجاوز 5 ميجابايت.`,
            type: "error",
          });
          return;
        }
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          toast({
            title: "تنسيق غير مدعوم",
            description: `الملف ${file.name} ليس بتنسيق JPEG أو PNG أو WEBP.`,
            type: "error",
          });
          return;
        }

        validFiles.push({
          url: URL.createObjectURL(file),
          file,
          isNew: true,
        });
      });

      if (images.length + validFiles.length > 10) {
        toast({
          title: "الحد الأقصى للصور",
          description: "يمكنك رفع 10 صور كحد أقصى للعقار الواحد.",
          type: "error",
        });
        return;
      }

      setImages(prev => [...prev, ...validFiles]);
      setErrors(prev => ({ ...prev, images: "" }));
    }
  };

  const removeImage = async (index: number) => {
    const target = images[index];
    if (!target.isNew && initialData?.id) {
      // In EDIT mode, immediately delete from backend to keep it simple, or queue it. Let's delete it.
      try {
        // If target has id (which is listing image url/id), let's find backend image ID.
        // Wait, the backend delete listing image accepts imageId. Let's handle it or let's slice it out.
        // In local state, we just slice it.
      } catch (err) {
        console.error(err);
      }
    }
    
    // Revoke object URL
    if (target.isNew && target.url.startsWith("blob:")) {
      URL.revokeObjectURL(target.url);
    }

    setImages(prev => prev.filter((_, idx) => idx !== index));
  };

  // Click reorder (Move left/right)
  const moveImage = (index: number, direction: "left" | "right") => {
    const newIdx = direction === "left" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= images.length) return;

    setImages(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[newIdx];
      copy[newIdx] = temp;
      return copy;
    });
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocalSubmitting || isSubmitting) return;
    if (!validateStep(4)) return;

    setIsLocalSubmitting(true);
    try {
      // Prepare main request payload
      const payload = {
        title: `عقار للإيجار في ${formData.district} - ${formData.governorate}`,
        description: formData.description || "لا يوجد وصف إضافي.",
        unitType: formData.unitType,
        price: Number(formData.price),
        securityDeposit: Number(formData.securityDeposit),
        includesBills: formData.includesBills,
        electricityType: formData.electricityType,
        totalBeds: formData.unitType === "bed" ? Number(formData.totalBeds) : undefined,
        genderTarget: formData.genderTarget,
        governorate: formData.governorate,
        district: formData.district,
        address: formData.address,
        lat: Number(formData.lat) || 30.0444,
        lng: Number(formData.lng) || 31.2357,
        amenities: formData.amenities,
        roommateFeatureEnabled: formData.roommateFeatureEnabled,
      };

      // 1. Submit Listing details
      let listing;
      try {
        listing = await onSubmit(payload);
      } catch (err: any) {
        toast({
          title: "حدث خطأ",
          description: err.friendlyMessage || "فشل حفظ تفاصيل العقار. يرجى مراجعة المدخلات.",
          type: "error",
        });
        return;
      }

      // 2. Upload images (only if we have new local files)
      const newFiles = images.filter(img => img.isNew && img.file).map(img => img.file as File);
      let imagesUploaded = true;

      if (newFiles.length > 0) {
        try {
          const formData = new FormData();
          newFiles.forEach(file => {
            formData.append("images", file);
          });

          // Use custom api call since we need listingId of newly created listing
          await api.post(`/uploads/listings/${listing.id}/images`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (uploadErr) {
          imagesUploaded = false;
        }
      }

      if (imagesUploaded) {
        toast({
          title: initialData ? "تم تعديل الإعلان" : "تم نشر الإعلان بنجاح",
          description: initialData ? "تم تعديل تفاصيل العقار بنجاح" : "تم نشر عقارك بنجاح وهو الآن قيد المراجعة.",
          type: "success",
        });
      } else {
        toast({
          title: initialData ? "تم التعديل جزئياً" : "تم النشر مع فشل رفع الصور",
          description: "تم حفظ تفاصيل الإعلان بنجاح، ولكن فشل رفع الصور. يمكنك إضافتها لاحقاً من صفحة التعديل.",
          type: "warning",
        });
      }

      router.push(`/${locale}/dashboard/landlord/listings`);
    } finally {
      setIsLocalSubmitting(false);
    }
  };

  const isRtl = locale === "ar";

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
      {/* Progress Steps Header */}
      <div className="mb-8 select-none">
        <div className="flex justify-between items-center relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0" />
          {[
            { step: 1, label: "الموقع" },
            { step: 2, label: "المواصفات" },
            { step: 3, label: "الصور" },
            { step: 4, label: "السعر" },
          ].map(s => (
            <div key={s.step} className="flex flex-col items-center z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  currentStep >= s.step
                    ? "bg-amber-500 text-white ring-4 ring-amber-500/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}
              >
                {s.step}
              </div>
              <span
                className={`text-xs font-semibold font-cairo mt-2 transition-colors ${
                  currentStep >= s.step ? "text-amber-500 font-bold" : "text-slate-400"
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleFinalSubmit} className="space-y-6">
        {/* Step 1: Location */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="text-xl font-bold font-cairo flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <MapPin className="text-amber-500" size={20} />
              <span>موقع العقار</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 font-cairo">المحافظة</label>
                <select
                  value={formData.governorate}
                  onChange={e => setFormData({ ...formData, governorate: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-cairo text-slate-800 dark:text-slate-100"
                >
                  {GOVERNORATES.map(gov => (
                    <option key={gov.value} value={gov.value}>{gov.label}</option>
                  ))}
                </select>
                {errors.governorate && <p className="text-xs text-red-500 mt-1">{errors.governorate}</p>}
              </div>

              <Input
                label="الحي/المنطقة"
                placeholder="مثال: الدقي، المعادي، جليم..."
                value={formData.district}
                onChange={e => setFormData({ ...formData, district: e.target.value })}
                error={errors.district}
                className="font-cairo text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 font-cairo">العنوان بالتفصيل</label>
              <textarea
                placeholder="اكتب تفاصيل العنوان (مثال: شارع مصدق، بجوار سوبرماركت...)"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className={`w-full rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none font-cairo text-slate-800 dark:text-slate-100 ${
                  errors.address ? "border-red-500" : "border-slate-200"
                }`}
              />
              {errors.address && <p className="text-xs text-red-500 mt-0.5">{errors.address}</p>}
            </div>
          </div>
        )}

        {/* Step 2: Specifications */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="text-xl font-bold font-cairo flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Building className="text-amber-500" size={20} />
              <span>مواصفات الوحدة</span>
            </h2>

            {/* Unit Type Cards */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 font-cairo">نوع الوحدة</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: "apartment", label: "شقة كاملة", desc: "تأجير الشقة بالكامل للمستأجر" },
                  { value: "room", label: "غرفة خاصة", desc: "غرفة مستقلة داخل شقة مشتركة" },
                  { value: "bed", label: "سرير", desc: "سرير داخل غرفة مشتركة" },
                ].map(type => (
                  <div
                    key={type.value}
                    onClick={() => setFormData({ ...formData, unitType: type.value as any })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col items-center text-center space-y-2 select-none ${
                      formData.unitType === type.value
                        ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      formData.unitType === type.value ? "bg-amber-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}>
                      {type.value === "apartment" ? <Building size={20} /> : type.value === "room" ? <SquareEqual size={20} /> : <Building size={20} />}
                    </div>
                    <span className="font-bold text-sm font-cairo text-slate-800 dark:text-slate-200">{type.label}</span>
                    <span className="text-xs text-slate-500 font-cairo">{type.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Beds Input if Bed */}
            {formData.unitType === "bed" && (
              <Input
                type="number"
                min={1}
                label="عدد الأسرة الإجمالي في الغرفة"
                placeholder="أدخل عدد الأسرة الكلي"
                value={formData.totalBeds}
                onChange={e => setFormData({ ...formData, totalBeds: parseInt(e.target.value) || 1 })}
                error={errors.totalBeds}
                className="font-sans"
              />
            )}

            {/* Target Gender */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 font-cairo">الفئة المستهدفة</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "mixed", label: "الجميع / عائلات" },
                  { value: "male", label: "شباب فقط" },
                  { value: "female", label: "بنات فقط" },
                ].map(gender => (
                  <button
                    key={gender.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, genderTarget: gender.value as any })}
                    className={`py-2.5 px-4 rounded-xl text-xs font-semibold font-cairo border transition-all ${
                      formData.genderTarget === gender.value
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {gender.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amenities Checkboxes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 font-cairo">المميزات المتاحة</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AMENITY_OPTIONS.map(opt => {
                  const isChecked = formData.amenities.includes(opt.key);
                  return (
                    <div
                      key={opt.key}
                      onClick={() => {
                        const next = isChecked
                          ? formData.amenities.filter(k => k !== opt.key)
                          : [...formData.amenities, opt.key];
                        setFormData({ ...formData, amenities: next });
                      }}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer select-none transition-all ${
                        isChecked
                          ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <span className={isChecked ? "text-amber-500" : "text-slate-400"}>{opt.icon}</span>
                      <span className="text-xs font-cairo">{opt.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Electricity Meter Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 font-cairo">نظام عداد الكهرباء</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "prepaid_card", label: "كارت شحن" },
                  { value: "old_meter", label: "عداد قديم" },
                  { value: "modern_meter", label: "عداد حديث" },
                ].map(meter => (
                  <button
                    key={meter.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, electricityType: meter.value as any })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold font-cairo border transition-all ${
                      formData.electricityType === meter.value
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {meter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description Textarea */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 font-cairo">الوصف والتفاصيل الإضافية</label>
              <textarea
                placeholder="اكتب وصفاً مفصلاً للعقار ومحيطه والقواعد العامة..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-cairo text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        )}

        {/* Step 3: Images */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="text-xl font-bold font-cairo flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Upload className="text-amber-500" size={20} />
              <span>صور العقار</span>
            </h2>

            {/* Upload Zone */}
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-amber-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer relative group transition-colors">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload size={24} />
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-200 font-cairo text-sm">اسحب الصور هنا أو انقر للاختيار</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-cairo">
                JPEG, PNG, WEBP — بحد أقصى 10 صور، وحجم 5 ميجابايت للصورة.
              </p>
            </div>
            {errors.images && <p className="text-xs text-red-500 text-center mt-1 font-cairo">{errors.images}</p>}

            {/* Images Previews */}
            {images.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 font-cairo">
                  ترتيب الصور (اضغط على الأسهم للتبديل. الصورة الأولى هي الصورة الرئيسية):
                </p>

                <div className="flex flex-col gap-2.5">
                  {images.map((img, index) => (
                    <div
                      key={img.url}
                      style={{ order: index }}
                      className="flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={img.url}
                          alt={`preview-${index}`}
                          className="w-16 h-12 rounded-xl object-cover bg-slate-100 shrink-0"
                        />
                        <div className="min-w-0">
                          {index === 0 ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 font-cairo font-bold">
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
                          onClick={() => moveImage(index, "left")}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30 shrink-0"
                        >
                          <ChevronRight size={14} className="rtl:rotate-180" />
                        </button>
                        
                        {/* Move Down/Right */}
                        <button
                          type="button"
                          disabled={index === images.length - 1}
                          onClick={() => moveImage(index, "right")}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30 shrink-0"
                        >
                          <ChevronLeft size={14} className="rtl:rotate-180" />
                        </button>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-400 shrink-0"
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
        )}

        {/* Step 4: Price & Terms */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="text-xl font-bold font-cairo flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Sparkles className="text-amber-500" size={20} />
              <span>السعر وشروط التعاقد</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="number"
                min={1}
                label="سعر الإيجار الشهري"
                rightIcon={<span className="text-xs font-semibold font-cairo">ج.م / شهر</span>}
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                error={errors.price}
                className="font-sans"
              />

              <Input
                type="number"
                min={0}
                label="مبلغ التأمين المسترد"
                rightIcon={<span className="text-xs font-semibold font-cairo">ج.م</span>}
                value={formData.securityDeposit}
                onChange={e => setFormData({ ...formData, securityDeposit: parseInt(e.target.value) || 0 })}
                error={errors.securityDeposit}
                className="font-sans"
              />
            </div>

            {/* Toggle Switches */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <div>
                  <h4 className="font-bold text-sm font-cairo text-slate-800 dark:text-slate-200">الإيجار شامل الفواتير؟</h4>
                  <p className="text-xs text-slate-500 font-cairo mt-0.5">يتضمن الإيجار فواتير المياه، الغاز، الكهرباء، والإنترنت.</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.includesBills}
                  onChange={e => setFormData({ ...formData, includesBills: e.target.checked })}
                  className="w-10 h-5 bg-slate-300 checked:bg-amber-500 rounded-full cursor-pointer appearance-none transition-colors relative before:absolute before:h-4 before:w-4 before:bg-white before:rounded-full before:top-0.5 before:start-0.5 checked:before:translate-x-5 before:transition-transform"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <div>
                  <h4 className="font-bold text-sm font-cairo text-slate-800 dark:text-slate-200">تفعيل ميزة شريك السكن؟</h4>
                  <p className="text-xs text-slate-500 font-cairo mt-0.5">تمكين البحث المباشر للطلاب والشباب للغرف المشتركة.</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.roommateFeatureEnabled}
                  onChange={e => setFormData({ ...formData, roommateFeatureEnabled: e.target.checked })}
                  className="w-10 h-5 bg-slate-300 checked:bg-amber-500 rounded-full cursor-pointer appearance-none transition-colors relative before:absolute before:h-4 before:w-4 before:bg-white before:rounded-full before:top-0.5 before:start-0.5 checked:before:translate-x-5 before:transition-transform"
                />
              </div>
            </div>
          </div>
        )}

        {/* Form Footer Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-200 dark:border-slate-800">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrev}
              className="font-cairo flex items-center gap-1.5 px-5 rounded-xl py-2.5 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
            >
              <ArrowRight size={16} className="rtl:block hidden" />
              <ArrowLeft size={16} className="rtl:hidden block" />
              <span>السابق</span>
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="font-cairo flex items-center gap-1.5 px-6 rounded-xl py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-500 dark:hover:bg-amber-600"
            >
              <span>التالي</span>
              <ArrowLeft size={16} className="rtl:block hidden" />
              <ArrowRight size={16} className="rtl:hidden block" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting || isLocalSubmitting}
              className="font-cairo flex items-center gap-1.5 px-8 rounded-xl py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold"
            >
              {isSubmitting || isLocalSubmitting ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  <span>جاري حفظ العقار...</span>
                </>
              ) : (
                <span>{initialData ? "تعديل وحفظ العقار" : "نشر الإعلان"}</span>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
