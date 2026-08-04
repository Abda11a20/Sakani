import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CreditCard } from 'lucide-react';
import type { Campaign, CreateCampaignPayload } from '../../types/ads.types';

interface EditCampaignDialogProps {
  isOpen: boolean;
  campaign: Campaign;
  onClose: () => void;
  onSave: (campaignId: string, payload: Partial<CreateCampaignPayload>) => Promise<void>;
}

const CATEGORIES = [
  { value: 'REAL_ESTATE', label: 'عقارات وتشطيبات' },
  { value: 'FURNITURE',   label: 'ديكور وأثاث' },
  { value: 'RESTAURANTS', label: 'مطاعم وكافيهات' },
  { value: 'BANKS',       label: 'بنوك وخدمات مالية' },
  { value: 'SERVICES',    label: 'خدمات وصيانة' },
  { value: 'MEDICAL',     label: 'رعاية صحية وطبية' },
  { value: 'EDUCATION',   label: 'تعليم وتدريب' },
  { value: 'OTHER',       label: 'أنشطة أخرى' },
];

const CAMPAIGN_STATUSES = [
  { value: 'PUBLISHED', label: 'نشطة (مفعلة للعرض)' },
  { value: 'PAUSED',    label: 'موقوفة (مؤقتاً)' },
  { value: 'DRAFT',     label: 'مسودة' },
];

const PAYMENT_METHODS = [
  { value: 'CASH',          label: 'نقدي (Cash)' },
  { value: 'BANK_TRANSFER', label: 'تحويل بنكي / إنستا باي' },
  { value: 'VODAFONE_CASH', label: 'فودافون كاش' },
  { value: 'CREDIT_CARD',   label: 'بطاقة ائتمان' },
  { value: 'OTHER',         label: 'طريقة أخرى' },
];

export function EditCampaignDialog({
  isOpen, campaign, onClose, onSave,
}: EditCampaignDialogProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: campaign.name || '',
    clientName: campaign.clientName || '',
    clientPhone: campaign.clientPhone || '',
    clientEmail: campaign.clientEmail || '',
    status: (campaign.status as any) || 'PUBLISHED',
    category: (campaign.category as any) || 'REAL_ESTATE',
    budget: campaign.budget ? String(campaign.budget) : '',
    price: campaign.price ? String(campaign.price) : '',
    currency: campaign.currency || 'EGP',
    isPaid: campaign.isPaid ?? false,
    paymentMethod: campaign.paymentMethod || 'CASH',
    startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
    notes: campaign.notes || '',
  });

  useEffect(() => {
    setForm({
      name: campaign.name || '',
      clientName: campaign.clientName || '',
      clientPhone: campaign.clientPhone || '',
      clientEmail: campaign.clientEmail || '',
      status: (campaign.status as any) || 'PUBLISHED',
      category: (campaign.category as any) || 'REAL_ESTATE',
      budget: campaign.budget ? String(campaign.budget) : '',
      price: campaign.price ? String(campaign.price) : '',
      currency: campaign.currency || 'EGP',
      isPaid: campaign.isPaid ?? false,
      paymentMethod: campaign.paymentMethod || 'CASH',
      startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
      notes: campaign.notes || '',
    });
  }, [campaign]);

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.clientName || !form.startDate) {
      alert('يرجى تعبئة الحقول المطلوبة');
      return;
    }
    setSaving(true);
    try {
      await onSave(campaign.id, {
        name: form.name,
        clientName: form.clientName,
        clientPhone: form.clientPhone,
        clientEmail: form.clientEmail,
        status: form.status as any,
        category: form.category,
        budget: Number(form.budget) || 0,
        price: Number(form.price) || 0,
        currency: form.currency,
        isPaid: form.isPaid,
        paymentMethod: form.paymentMethod as any,
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        notes: form.notes,
      });
      onClose();
    } catch {
      alert('حدث خطأ أثناء تعديل بيانات الحملة');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تعديل الحملة الإعلانية"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 pt-1 font-cairo" dir="rtl">
        <Input
          label="اسم الحملة *"
          placeholder="مثال: عروض الصيف"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="اسم العميل *"
            placeholder="اسم العميل"
            value={form.clientName}
            onChange={(e) => set('clientName', e.target.value)}
            required
          />
          <Input
            label="الهاتف"
            placeholder="010..."
            value={form.clientPhone}
            onChange={(e) => set('clientPhone', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="حالة الحملة *"
            value={form.status}
            onValueChange={(val) => set('status', val)}
            options={CAMPAIGN_STATUSES}
          />
          <Select
            label="تصنيف النشاط"
            value={form.category}
            onValueChange={(val) => set('category', val)}
            options={CATEGORIES}
          />
        </div>

        {/* ── Dates Section ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface-secondary p-3 rounded-xl border border-border">
          <Input
            label="تاريخ بدء الحملة *"
            type="date"
            value={form.startDate}
            onChange={(e) => set('startDate', e.target.value)}
            required
          />
          <Input
            label="تاريخ انتهاء الحملة"
            type="date"
            value={form.endDate}
            onChange={(e) => set('endDate', e.target.value)}
          />
        </div>

        {/* ── Pricing & Payment ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="الميزانية (EGP)"
            type="number"
            placeholder="15000"
            value={form.budget}
            onChange={(e) => set('budget', e.target.value)}
          />
          <Select
            label="طريقة الدفع"
            value={form.paymentMethod}
            onValueChange={(val) => set('paymentMethod', val)}
            options={PAYMENT_METHODS}
          />
        </div>

        {/* ── Is Paid Switch ── */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface-secondary">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-primary" />
            <span className="text-xs font-bold text-text">حالة الدفع (مدفوعة)</span>
          </div>
          <Switch
            checked={!!form.isPaid}
            onCheckedChange={(checked) => set('isPaid', checked)}
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            حفظ التعديلات
          </Button>
        </div>
      </form>
    </Modal>
  );
}
