'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/features/ads/admin/components/AdsSkeleton';
import { AdsErrorBoundary } from '@/features/ads/admin/components/AdsErrorBoundary';
import { CreateAdDialog } from '@/features/ads/admin/components/CreateAdDialog';
import { EditCampaignDialog } from '@/features/ads/admin/components/EditCampaignDialog';
import { AdItemRow } from '@/features/ads/admin/components/AdItemRow';
import { useCampaigns } from '@/features/ads/hooks/useCampaigns';
import { useAdMutations } from '@/features/ads/hooks/useAdMutations';
import { campaignsApi } from '@/features/ads/api/campaigns.api';
import { api } from '@/lib/api';
import {
  Plus, ChevronRight, User, Phone, Calendar, CreditCard, Megaphone, Edit3, Trash2,
} from 'lucide-react';
import type { AdStatus, CreateAdPayload } from '@/features/ads/types/ads.types';

export default function CampaignDetailPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const { campaigns, isLoading, refetch } = useCampaigns();
  const { updateStatus, workflowAction, deleteAd } = useAdMutations();

  const [showCreateAdModal, setShowCreateAdModal] = useState(false);
  const [showEditCampaignModal, setShowEditCampaignModal] = useState(false);

  const campaign = campaigns.find((c) => c.id === campaignId);
  const adsList = campaign?.ads || [];

  const handleUpdateCampaign = async (id: string, payload: any) => {
    try {
      await campaignsApi.updateCampaign(id, payload);
      await refetch();
    } catch {
      alert('حدث خطأ أثناء تعديل بيانات الحملة');
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaign) return;
    if (!confirm(`هل أنت تأكد من حذف الحملة (${campaign.name}) وسلة إعلاناتها؟`)) return;
    try {
      await campaignsApi.deleteCampaign(campaign.id);
      router.push(`/${locale}/admin/ads/campaigns`);
    } catch {
      alert('حدث خطأ أثناء حذف الحملة');
    }
  };

  const handleCreateAd = async (payload: CreateAdPayload) => {
    try {
      await api.post('/admin/ads', payload);
      await refetch();
    } catch {
      alert('حدث خطأ أثناء إضافة الإعلان');
    }
  };

  const handleUpdateAdStatus = async (adId: string, status: AdStatus) => {
    try {
      await updateStatus({ adId, status });
      await refetch();
    } catch {
      alert('حدث خطأ أثناء تحديث حالة الإعلان');
    }
  };

  const handleWorkflowAction = async (adId: string, action: 'submit-review' | 'approve' | 'publish') => {
    try {
      await workflowAction({ adId, action });
      await refetch();
    } catch {
      alert('حدث خطأ أثناء تنفيذ الإجراء على الإعلان');
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (!confirm('هل أنت تأكد من حذف هذا الإعلان؟')) return;
    try {
      await deleteAd(adId);
      await refetch();
    } catch {
      alert('حدث خطأ أثناء حذف الإعلان');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <TableSkeleton rows={4} />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center space-y-4 font-cairo" dir="rtl">
        <h2 className="text-lg font-bold text-text">الحملة غير متوفرة أو تم حذفها</h2>
        <Link href={`/${locale}/admin/ads/campaigns`}>
          <Button variant="outline" size="sm">
            العودة لجدول الحملات
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <AdsErrorBoundary fallbackTitle="حدث خطأ في تحميل تفاصيل الحملة الإعلانية">
      <div className="p-6 max-w-7xl mx-auto space-y-6 font-cairo" dir="rtl">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Link href={`/${locale}/admin/ads/campaigns`} className="hover:text-primary transition-colors">
              جدول الحملات
            </Link>
            <ChevronRight size={14} />
            <span className="font-bold text-text">{campaign.name}</span>
          </div>

          {/* Edit & Delete Campaign Buttons */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditCampaignModal(true)}
              title="تعديل الحملة"
            >
              <Edit3 size={15} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-status-danger hover:bg-status-danger/10"
              onClick={handleDeleteCampaign}
              title="حذف الحملة"
            >
              <Trash2 size={15} />
            </Button>
          </div>
        </div>

        {/* Campaign Header Details Card */}
        <Card variant="default" className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {campaign.campaignCode}
                </span>
                <h1 className="text-xl font-black text-text">{campaign.name}</h1>
              </div>
              <p className="text-xs text-text-secondary">
                تاريخ الإنشاء: {campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString('ar-EG') : '—'}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge variant={campaign.status === 'PUBLISHED' ? 'success' : campaign.status === 'PAUSED' ? 'warning' : 'gray'}>
                {campaign.status === 'PUBLISHED' ? 'نشطة (مفعلة للعرض)' : campaign.status === 'PAUSED' ? 'موقوفة' : 'مسودة'}
              </Badge>
              <Badge variant={campaign.isPaid ? 'success' : 'danger'}>
                {campaign.isPaid ? 'مدفوعة' : 'غير مدفوعة'}
              </Badge>

              {campaign.status !== 'PUBLISHED' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateCampaign(campaign.id, { status: 'PUBLISHED' as any })}
                  className="text-status-success border-status-success/30 hover:bg-status-success/10 text-xs font-bold"
                >
                  تنشيط ونشر الحملة الآن
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => setShowCreateAdModal(true)}
              >
                إضافة إعلان للحملة
              </Button>
            </div>
          </div>

          {/* Client & Pricing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-surface-secondary space-y-1">
              <span className="text-text-tertiary flex items-center gap-1">
                <User size={13} /> اسم العميل
              </span>
              <p className="font-bold text-text">{campaign.clientName}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-secondary space-y-1">
              <span className="text-text-tertiary flex items-center gap-1">
                <Phone size={13} /> هاتف العميل
              </span>
              <p className="font-bold font-mono text-text">{campaign.clientPhone || 'غير مدون'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-secondary space-y-1">
              <span className="text-text-tertiary flex items-center gap-1">
                <Calendar size={13} /> تاريخ الفاعلية
              </span>
              <p className="font-bold font-mono text-text">
                {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString('ar-EG') : '—'}
                &nbsp;إلى&nbsp;
                {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString('ar-EG') : 'مفتوح'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-secondary space-y-1">
              <span className="text-text-tertiary flex items-center gap-1">
                <CreditCard size={13} /> الميزانية الكلية
              </span>
              <p className="font-bold font-mono text-text">
                {campaign.budget ? `${campaign.budget} EGP` : 'غير محددة'}
              </p>
            </div>
          </div>
        </Card>

        {/* ── Campaign Ads Section ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-text flex items-center gap-2">
              <Megaphone size={18} className="text-primary" />
              <span>إعلانات الحملة ({adsList.length})</span>
            </h3>
          </div>

          {adsList.length > 0 ? (
            <div className="space-y-3">
              {adsList.map((ad) => (
                <AdItemRow
                  key={ad.id}
                  ad={ad}
                  onUpdateStatus={handleUpdateAdStatus}
                  onWorkflowAction={handleWorkflowAction}
                  onDeleteAd={handleDeleteAd}
                />
              ))}
            </div>
          ) : (
            <Card variant="default" className="p-8 text-center space-y-3 border border-dashed border-border">
              <p className="text-xs text-text-tertiary">لا توجد إعلانات مضافة لهذه الحملة بعد</p>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => setShowCreateAdModal(true)}
              >
                إضافة أول إعلان الآن
              </Button>
            </Card>
          )}
        </div>

        {/* Create Ad Modal */}
        {showCreateAdModal && (
          <CreateAdDialog
            isOpen={showCreateAdModal}
            campaigns={campaigns}
            defaultCampaignId={campaign.id}
            onClose={() => setShowCreateAdModal(false)}
            onSave={handleCreateAd}
          />
        )}

        {/* Edit Campaign Modal */}
        {showEditCampaignModal && (
          <EditCampaignDialog
            isOpen={showEditCampaignModal}
            campaign={campaign}
            onClose={() => setShowEditCampaignModal(false)}
            onSave={handleUpdateCampaign}
          />
        )}
      </div>
    </AdsErrorBoundary>
  );
}
