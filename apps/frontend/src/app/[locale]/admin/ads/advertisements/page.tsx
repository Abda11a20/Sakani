'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Pagination } from '@/components/ui';
import { TableSkeleton } from '@/features/ads/admin/components/AdsSkeleton';
import { AdsErrorBoundary } from '@/features/ads/admin/components/AdsErrorBoundary';
import { CreateAdDialog } from '@/features/ads/admin/components/CreateAdDialog';
import { AdItemRow } from '@/features/ads/admin/components/AdItemRow';
import { useCampaigns } from '@/features/ads/hooks/useCampaigns';
import { useAdMutations } from '@/features/ads/hooks/useAdMutations';
import { campaignsApi } from '@/features/ads/api/campaigns.api';
import { api } from '@/lib/api';
import { Megaphone, Plus, Search, Filter } from 'lucide-react';
import type { Advertisement, AdStatus, CreateAdPayload } from '@/features/ads/types/ads.types';

const PAGE_SIZE = 10;

const PLACEMENTS = [
  { value: 'ALL', label: 'جميع الأماكن الإعلانية' },
  { value: 'HOME_HERO', label: 'البانر الرئيسي' },
  { value: 'SEARCH_AFTER_8', label: 'صفحة البحث' },
  { value: 'SEARCH_BOTTOM', label: 'أسفل البحث' },
  { value: 'INTERSTITIAL', label: 'الشاشة الكاملة' },
  { value: 'COMMUNITY_TOP', label: 'أعلى مجتمع سكني' },
];

export default function AllAdvertisementsPage() {
  const { campaigns, isLoading, refetch } = useCampaigns();
  const { updateStatus, workflowAction, deleteAd } = useAdMutations();

  const [showCreateAdModal, setShowCreateAdModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [placementFilter, setPlacementFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Flatten all ads across campaigns
  const allAds = useMemo(() => {
    const list: Advertisement[] = [];
    campaigns.forEach((c) => {
      (c.ads || []).forEach((ad) => {
        list.push({
          ...ad,
          campaign: { id: c.id, name: c.name, clientName: c.clientName, campaignCode: c.campaignCode },
        });
      });
    });
    return list;
  }, [campaigns]);

  // Filtered ads
  const filteredAds = useMemo(() => {
    return allAds.filter((ad) => {
      const matchSearch =
        ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ad.campaign?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchPlacement =
        placementFilter === 'ALL' ||
        ad.placementKey === placementFilter ||
        ad.placement?.key === placementFilter;

      const matchStatus = statusFilter === 'ALL' || ad.status === statusFilter;

      return matchSearch && matchPlacement && matchStatus;
    });
  }, [allAds, searchTerm, placementFilter, statusFilter]);

  // Paginated ads (10 per page)
  const totalPages = Math.max(1, Math.ceil(filteredAds.length / PAGE_SIZE));
  const paginatedAds = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAds.slice(start, start + PAGE_SIZE);
  }, [filteredAds, currentPage]);

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

  const handleSaveAdEdit = async (adId: string, payload: any) => {
    try {
      await campaignsApi.updateAd(adId, payload);
      await refetch();
    } catch {
      alert('حدث خطأ أثناء حفظ تعديلات الإعلان');
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

  return (
    <AdsErrorBoundary fallbackTitle="حدث خطأ في تحميل قائمة الإعلانات التجارية">
      <div className="p-6 max-w-7xl mx-auto space-y-6 font-cairo" dir="rtl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-text via-primary/80 to-primary p-6 rounded-2xl text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
              <Megaphone size={24} className="text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">قائمة الإعلانات</h1>
            </div>
          </div>

          <Button
            variant="accent"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => setShowCreateAdModal(true)}
          >
            إضافة إعلان
          </Button>
        </div>

        {/* Toolbar */}
        <Card variant="default" className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder="بحث ببريد أو عنوان الإعلان والحملة..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search size={16} className="text-text-tertiary" />}
            />

            <Select
              value={placementFilter}
              onValueChange={(val) => {
                setPlacementFilter(val);
                setCurrentPage(1);
              }}
              options={PLACEMENTS}
            />

            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: 'ALL', label: 'جميع الحالات' },
                { value: 'PUBLISHED', label: 'نشط ومُفعل' },
                { value: 'PAUSED', label: 'موقوف مؤقتاً' },
                { value: 'DRAFT', label: 'مسودة' },
                { value: 'UNDER_REVIEW', label: 'قيد المراجعة' },
              ]}
            />
          </div>
        </Card>

        {/* Ads List */}
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : (
          <div className="space-y-4">
            {paginatedAds.length > 0 ? (
              <div className="space-y-3">
                {paginatedAds.map((ad) => (
                  <AdItemRow
                    key={ad.id}
                    ad={ad}
                    onUpdateStatus={handleUpdateAdStatus}
                    onWorkflowAction={handleWorkflowAction}
                    onDeleteAd={handleDeleteAd}
                    onSaveAdEdit={handleSaveAdEdit}
                  />
                ))}
              </div>
            ) : (
              <Card variant="default" className="p-8 text-center text-text-tertiary border border-dashed border-border">
                لا توجد إعلانات مطابقة لخيارات الفلترة المحددة
              </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {showCreateAdModal && (
          <CreateAdDialog
            isOpen={showCreateAdModal}
            campaigns={campaigns}
            onClose={() => setShowCreateAdModal(false)}
            onSave={handleCreateAd}
          />
        )}
      </div>
    </AdsErrorBoundary>
  );
}
