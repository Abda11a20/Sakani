'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui';
import { TableSkeleton } from '@/features/ads/admin/components/AdsSkeleton';
import { AdsErrorBoundary } from '@/features/ads/admin/components/AdsErrorBoundary';
import { CreateCampaignDialog } from '@/features/ads/admin/components/CreateCampaignDialog';
import { EditCampaignDialog } from '@/features/ads/admin/components/EditCampaignDialog';
import { useCampaigns } from '@/features/ads/hooks/useCampaigns';
import { campaignsApi } from '@/features/ads/api/campaigns.api';
import { api } from '@/lib/api';
import {
  FolderKanban, Plus, Search, Eye, Phone,
} from 'lucide-react';
import type { Campaign, CreateCampaignPayload } from '@/features/ads/types/ads.types';

const PAGE_SIZE = 10;

export default function AdsCampaignsListPage() {
  const locale = useLocale();
  const { campaigns, isLoading, refetch } = useCampaigns();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const handleCreateCampaign = async (payload: CreateCampaignPayload) => {
    try {
      await api.post('/admin/ads/campaigns', payload);
      await refetch();
    } catch {
      alert('حدث خطأ أثناء إنشاء الحملة');
    }
  };

  const handleUpdateCampaign = async (id: string, payload: any) => {
    try {
      await campaignsApi.updateCampaign(id, payload);
      await refetch();
    } catch {
      alert('حدث خطأ أثناء تعديل بيانات الحملة');
    }
  };

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      return (
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.campaignCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.clientPhone || '').includes(searchTerm)
      );
    });
  }, [campaigns, searchTerm]);

  // Paginated campaigns (10 per page)
  const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / PAGE_SIZE));
  const paginatedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCampaigns.slice(start, start + PAGE_SIZE);
  }, [filteredCampaigns, currentPage]);

  return (
    <AdsErrorBoundary fallbackTitle="حدث خطأ في تحميل قائمة الحملات الإعلانية">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5 font-cairo" dir="rtl">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-text via-primary/80 to-primary p-5 rounded-2xl text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
              <FolderKanban size={22} className="text-accent" />
            </div>
            <h1 className="text-lg font-black text-white">جدول وسجل الحملات الإعلانية</h1>
          </div>

          <Button
            variant="accent"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => setShowCreateModal(true)}
          >
            إضافة حملة جديدة
          </Button>
        </div>

        {/* Search Toolbar */}
        <Card variant="default" className="p-3.5">
          <Input
            placeholder="بحث باسم الحملة، كود الحملة، أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            leftIcon={<Search size={16} className="text-text-tertiary" />}
          />
        </Card>

        {/* Clean Simplified Campaigns Table */}
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : (
          <Card variant="default" className="overflow-hidden border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-surface-secondary border-b border-border text-text-secondary font-bold">
                  <tr>
                    <th className="p-3.5">كود الحملة</th>
                    <th className="p-3.5">اسم الحملة والعميل</th>
                    <th className="p-3.5">رقم الهاتف</th>
                    <th className="p-3.5 text-center">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {paginatedCampaigns.length > 0 ? (
                    paginatedCampaigns.map((c) => (
                      <tr
                        key={c.id}
                        className="hover:bg-surface-secondary/50 transition-colors"
                      >
                        <td className="p-3.5 font-mono font-bold text-primary">
                          <Link href={`/${locale}/admin/ads/campaigns/${c.id}`} className="hover:underline">
                            {c.campaignCode}
                          </Link>
                        </td>
                        <td className="p-3.5">
                          <Link href={`/${locale}/admin/ads/campaigns/${c.id}`} className="block">
                            <span className="font-bold text-text hover:text-primary transition-colors block">
                              {c.name}
                            </span>
                            <span className="text-[11px] text-text-tertiary">العميل: {c.clientName}</span>
                          </Link>
                        </td>
                        <td className="p-3.5 font-mono text-text-secondary">
                          <div className="flex items-center gap-1.5">
                            <Phone size={13} className="text-text-tertiary" />
                            <span>{c.clientPhone || 'غير مدون'}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <Link href={`/${locale}/admin/ads/campaigns/${c.id}`}>
                            <Button variant="primary" size="sm" leftIcon={<Eye size={13} />}>
                              التفاصيل
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-text-tertiary">
                        لا توجد حملات إعلانية مطابقة للبحث
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </Card>
        )}

        {/* Modal Create */}
        {showCreateModal && (
          <CreateCampaignDialog
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSave={handleCreateCampaign}
          />
        )}

        {/* Modal Edit */}
        {editingCampaign && (
          <EditCampaignDialog
            isOpen={!!editingCampaign}
            campaign={editingCampaign}
            onClose={() => setEditingCampaign(null)}
            onSave={handleUpdateCampaign}
          />
        )}
      </div>
    </AdsErrorBoundary>
  );
}
