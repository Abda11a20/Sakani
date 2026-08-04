import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { LayoutGrid, CheckSquare, Square, Upload, Link as LinkIcon, X, Sliders } from 'lucide-react';
import type { Advertisement } from '../../types/ads.types';
import { compressImageFile } from '@/lib/image-compressor';

interface EditAdDialogProps {
  isOpen: boolean;
  ad: Advertisement;
  onClose: () => void;
  onSave: (adId: string, payload: any) => Promise<void>;
}

const PLACEMENTS = [
  { value: 'HOME_HERO',       label: 'البانر الرئيسي' },
  { value: 'SEARCH_AFTER_8', label: 'صفحة البحث' },
  { value: 'SEARCH_BOTTOM',  label: 'أسفل البحث' },
  { value: 'INTERSTITIAL',   label: 'الشاشة الكاملة' },
  { value: 'POPUP',          label: 'إعلان منبثق (Popup)' },
  { value: 'COMMUNITY_TOP',  label: 'أعلى مجتمع سكني' },
];

export function EditAdDialog({
  isOpen, ad, onClose, onSave,
}: EditAdDialogProps) {
  const [saving, setSaving] = useState(false);
  const [uploadMode, setUploadMode] = useState<'FILE' | 'URL'>('FILE');
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>(
    ad.placementKey ? [ad.placementKey] : ad.placement?.key ? [ad.placement.key] : ['HOME_HERO']
  );

  const initialTarget = ad.target;
  const initialTargetType = initialTarget?.type || 'WHATSAPP';
  let initialTargetVal = '';
  if (initialTargetType === 'WHATSAPP') initialTargetVal = initialTarget?.whatsapp || '';
  else if (initialTargetType === 'PHONE') initialTargetVal = initialTarget?.phone || '';
  else if (initialTargetType === 'EMAIL') initialTargetVal = initialTarget?.email || '';
  else initialTargetVal = initialTarget?.url || '';

  const cleanInitialTitle = ad.title?.replace(/\s*\([A-Z0-9_]+\)$/gi, '') || '';

  const [form, setForm] = useState({
    title: cleanInitialTitle,
    category: ad.category || 'REAL_ESTATE',
    displayType: ad.displayType || 'BANNER',
    status: ad.status || 'PUBLISHED',
    targetType: initialTargetType,
    targetValue: initialTargetVal,
    mediaUrl: ad.mediaItems?.[0]?.url || '',
    mediaType: (ad.mediaItems?.[0]?.type as any) || 'IMAGE',
    caption: ad.mediaItems?.[0]?.caption || '',
    isSkippable: ad.isSkippable ?? true,
    isClosable: ad.isClosable ?? true,
    skipSeconds: ad.skipSeconds ?? 5,
    perUserFrequency: ad.perUserFrequency || 'EVERY_12_HOURS',
    maxDisplayPerSession: ad.maxDisplayPerSession ?? 1,
  });

  useEffect(() => {
    const cleanTitle = ad.title?.replace(/\s*\([A-Z0-9_]+\)$/gi, '') || '';
    const key = ad.placementKey || ad.placement?.key || 'HOME_HERO';
    setSelectedPlacements([key]);

    const target = ad.target;
    const type = target?.type || 'WHATSAPP';
    let val = '';
    if (type === 'WHATSAPP') val = target?.whatsapp || '';
    else if (type === 'PHONE') val = target?.phone || '';
    else if (type === 'EMAIL') val = target?.email || '';
    else val = target?.url || '';

    setForm({
      title: cleanTitle,
      category: ad.category || 'REAL_ESTATE',
      displayType: ad.displayType || 'BANNER',
      status: ad.status || 'PUBLISHED',
      targetType: type as any,
      targetValue: val,
      mediaUrl: ad.mediaItems?.[0]?.url || '',
      mediaType: (ad.mediaItems?.[0]?.type as any) || 'IMAGE',
      caption: ad.mediaItems?.[0]?.caption || '',
      isSkippable: ad.isSkippable ?? true,
      isClosable: ad.isClosable ?? true,
      skipSeconds: ad.skipSeconds ?? 5,
      perUserFrequency: ad.perUserFrequency || 'EVERY_12_HOURS',
      maxDisplayPerSession: ad.maxDisplayPerSession ?? 1,
    });
  }, [ad]);

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const togglePlacement = (key: string) => {
    setSelectedPlacements((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev;
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');

    if (isVideo) {
      if (file.size > 10 * 1024 * 1024) {
        alert('حجم الفيديو الإعلاني كبير جداً. يرجى اختيار فيديو بحجم 10 ميجابايت كحد أقصى.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setForm((p) => ({
            ...p,
            mediaUrl: event.target!.result as string,
            mediaType: 'VIDEO',
          }));
        }
      };
      reader.readAsDataURL(file);
    } else {
      try {
        const compressedUrl = await compressImageFile(file, 1200, 1200, 0.82);
        setForm((p) => ({
          ...p,
          mediaUrl: compressedUrl,
          mediaType: 'IMAGE',
        }));
      } catch {
        alert('حدث خطأ أثناء معالجة الصورة');
      }
    }
  };

  const normalizeTargetValue = (type: string, val: string): string => {
    if (!val) return '';
    const trimmed = val.trim();
    if (type === 'WHATSAPP') {
      const digits = trimmed.replace(/\D/g, '');
      if (digits.startsWith('01') && digits.length === 11) {
        return `20${digits.substring(1)}`;
      }
      if (digits.startsWith('1') && digits.length === 10) {
        return `20${digits}`;
      }
      return digits;
    }
    if (type === 'EMAIL') return trimmed.toLowerCase();
    if (type === 'EXTERNAL_URL') {
      if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return `https://${trimmed}`;
      }
    }
    return trimmed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('يرجى إدخال عنوان الإعلان');
      return;
    }
    if (!form.mediaUrl.trim()) {
      alert('يرجى اختيار وسائط للإعلان (صورة أو فيديو)');
      return;
    }

    setSaving(true);
    try {
      const cleanTargetValue = normalizeTargetValue(form.targetType, form.targetValue);
      const targetPayload: any = { type: form.targetType };
      if (form.targetType === 'WHATSAPP') targetPayload.whatsapp = cleanTargetValue;
      else if (form.targetType === 'EXTERNAL_URL') targetPayload.url = cleanTargetValue;
      else if (form.targetType === 'PHONE') targetPayload.phone = cleanTargetValue;
      else if (form.targetType === 'EMAIL') targetPayload.email = cleanTargetValue;
      else targetPayload.url = cleanTargetValue;

      const placementKey = selectedPlacements[0];
      const resolvedDisplayType = placementKey === 'INTERSTITIAL'
        ? 'FULLSCREEN'
        : placementKey === 'POPUP'
        ? 'POPUP'
        : 'BANNER';

      await onSave(ad.id, {
        title: form.title,
        placementKey,
        category: form.category,
        displayType: resolvedDisplayType,
        status: form.status,
        target: targetPayload,
        isSkippable: form.isSkippable,
        isClosable: form.isClosable,
        skipSeconds: form.skipSeconds,
        perUserFrequency: form.perUserFrequency,
        maxDisplayPerSession: form.maxDisplayPerSession,
        mediaItems: [
          {
            url: form.mediaUrl,
            type: form.mediaType,
            caption: form.caption || form.title,
          },
        ],
      });
      onClose();
    } catch {
      alert('حدث خطأ أثناء حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  };

  const hasOverlayPlacement = selectedPlacements.some((p) => p === 'INTERSTITIAL' || p === 'POPUP');

  const getTargetLabelAndPlaceholder = () => {
    switch (form.targetType) {
      case 'WHATSAPP':
        return { label: 'رقم الواتساب *', placeholder: 'مثال: 01016864615 (يتحول تلقائياً لـ 201...)' };
      case 'PHONE':
        return { label: 'رقم الهاتف *', placeholder: 'مثال: 01016864615' };
      case 'EMAIL':
        return { label: 'البريد الإلكتروني *', placeholder: 'name@company.com' };
      default:
        return { label: 'رابط التوجيه (URL) *', placeholder: 'https://example.com' };
    }
  };

  const targetConfig = getTargetLabelAndPlaceholder();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تعديل الإعلان"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 pt-1 font-cairo text-right" dir="rtl">
        <Input
          label="عنوان الإعلان *"
          placeholder="عنوان الإعلان"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          required
        />

        {/* ── Placement Selection ── */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-text-secondary flex items-center gap-1">
            <LayoutGrid size={14} className="text-primary" />
            <span>الأماكن الإعلانية *</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-surface-secondary p-3 rounded-xl border border-border">
            {PLACEMENTS.map((p) => {
              const isChecked = selectedPlacements.includes(p.value);
              return (
                <div
                  key={p.value}
                  onClick={() => togglePlacement(p.value)}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-primary/10 border-primary text-primary font-bold'
                      : 'bg-surface border-border text-text hover:bg-surface-tertiary'
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare size={15} className="text-primary shrink-0" />
                  ) : (
                    <Square size={15} className="text-text-tertiary shrink-0" />
                  )}
                  <span className="text-xs">{p.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Advanced Overlay & Skip Controls (Shown when Interstitial or Popup is selected) ── */}
        {hasOverlayPlacement && (
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary border-b border-primary/10 pb-2">
              <Sliders size={15} />
              <span>إعدادات التخطي والإغلاق للإعلان المنبثق والشاشة الكاملة</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="إمكانية التخطي من المستخدم"
                value={form.isSkippable ? 'true' : 'false'}
                onValueChange={(val) => set('isSkippable', val === 'true')}
                options={[
                  { value: 'true', label: 'نعم (يظهر زر التخطي)' },
                  { value: 'false', label: 'لا (بدون تخطي)' },
                ]}
              />

              {form.isSkippable && (
                <Input
                  label="التخطي بعد كم ثانية؟"
                  type="number"
                  min={1}
                  max={30}
                  value={form.skipSeconds}
                  onChange={(e) => set('skipSeconds', parseInt(e.target.value, 10) || 5)}
                />
              )}

              <Select
                label="السماح بالإغلاق الفوري (زر ✕)"
                value={form.isClosable ? 'true' : 'false'}
                onValueChange={(val) => set('isClosable', val === 'true')}
                options={[
                  { value: 'true', label: 'نعم (إغلاق فوري)' },
                  { value: 'false', label: 'لا' },
                ]}
              />

              <Select
                label="معدل تكرار الظهور للمستخدم"
                value={form.perUserFrequency}
                onValueChange={(val) => set('perUserFrequency', val)}
                options={[
                  { value: 'EVERY_12_HOURS', label: 'مرة كل 12 ساعة' },
                  { value: 'DAILY', label: 'مرة يومياً (24 ساعة)' },
                  { value: 'EVERY_VISIT', label: 'ظهور دائم (عند كل زيارة)' },
                ]}
              />
            </div>
          </div>
        )}

        {/* ── Media Upload Section ── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-text-secondary">
              الوسائط *
            </label>
            <div className="flex items-center gap-1 bg-surface-secondary p-1 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setUploadMode('FILE')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold transition-all ${
                  uploadMode === 'FILE'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                <Upload size={12} />
                رفع ملف
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('URL')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold transition-all ${
                  uploadMode === 'URL'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                <LinkIcon size={12} />
                رابط
              </button>
            </div>
          </div>

          {uploadMode === 'FILE' ? (
            <div className="border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 rounded-xl p-3.5 text-center cursor-pointer transition-colors relative">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center gap-1">
                <Upload size={18} className="text-primary" />
                <p className="text-xs font-bold text-text">اختر ملفاً لرفعه (صورة أو فيديو)</p>
              </div>
            </div>
          ) : (
            <Input
              label="رابط الصورة أو الفيديو *"
              placeholder="https://..."
              value={form.mediaUrl}
              onChange={(e) => set('mediaUrl', e.target.value)}
            />
          )}

          {/* Compact Media Preview */}
          {form.mediaUrl && form.mediaUrl.trim() !== '' && (
            <div className="relative p-2 rounded-xl border border-border bg-surface-secondary flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-16 h-12 rounded-lg overflow-hidden border border-border shrink-0 bg-background flex items-center justify-center">
                  {form.mediaType === 'VIDEO' ? (
                    <video src={form.mediaUrl} className="w-full h-full object-cover" />
                  ) : (
                    <img
                      src={form.mediaUrl}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 text-xs">
                  <span className="font-bold text-text block truncate">تم تحميل الوسائط بنجاح</span>
                  <span className="text-[10px] text-text-tertiary font-mono uppercase">{form.mediaType}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => set('mediaUrl', '')}
                className="p-1 rounded-lg hover:bg-surface-tertiary text-text-tertiary hover:text-status-danger transition-colors"
                title="إزالة الوسائط"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="تصنيف النشاط"
            value={form.category}
            onValueChange={(val) => set('category', val)}
            options={[
              { value: 'REAL_ESTATE',  label: 'عقارات وتشطيبات' },
              { value: 'FURNITURE',    label: 'ديكور وأثاث' },
              { value: 'RESTAURANTS',  label: 'مطاعم وكافيهات' },
              { value: 'BANKS',        label: 'بنوك وخدمات مالية' },
              { value: 'SERVICES',     label: 'خدمات وصيانة' },
              { value: 'MEDICAL',      label: 'رعاية صحية وطبية' },
            ]}
          />
          <Select
            label="حالة الإعلان"
            value={form.status}
            onValueChange={(val) => set('status', val)}
            options={[
              { value: 'PUBLISHED', label: 'نشط' },
              { value: 'DRAFT', label: 'مسودة' },
              { value: 'UNDER_REVIEW', label: 'قيد المراجعة' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="نوع التوجيه"
            value={form.targetType}
            onValueChange={(val) => set('targetType', val)}
            options={[
              { value: 'WHATSAPP', label: 'واتساب' },
              { value: 'EXTERNAL_URL', label: 'رابط خارجي' },
              { value: 'PHONE', label: 'اتصال' },
              { value: 'EMAIL', label: 'بريد' },
            ]}
          />
          <Input
            label={targetConfig.label}
            placeholder={targetConfig.placeholder}
            value={form.targetValue}
            onChange={(e) => set('targetValue', e.target.value)}
          />
        </div>

        <div className="pt-3 flex justify-end gap-2 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={saving}>
            حفظ التعديلات
          </Button>
        </div>
      </form>
    </Modal>
  );
}
