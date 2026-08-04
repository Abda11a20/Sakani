'use client';

import React, { useState } from 'react';
import { TableSkeleton } from './AdsSkeleton';
import { AdsErrorBoundary } from './AdsErrorBoundary';
import { CampaignToolbar } from './CampaignToolbar';
import { CampaignCardAccordion } from './CampaignCardAccordion';
import { CampaignEmptyState } from './CampaignEmptyState';
import { useCampaigns } from '../../hooks/useCampaigns';
import { useAdMutations } from '../../hooks/useAdMutations';
import type { AdStatus } from '../../types/ads.types';

interface CampaignsTabProps {
  onOpenCreateAd: (campaignId?: string) => void;
}

export function CampaignsTab({ onOpenCreateAd }: CampaignsTabProps) {
  const { campaigns, isLoading } = useCampaigns();
  const { updateStatus, workflowAction, deleteAd } = useAdMutations();
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((p) => ({ ...p, [id]: !p[id] }));
  };

  const handleUpdateStatus = async (adId: string, status: AdStatus) => {
    try {
      await updateStatus({ adId, status });
    } catch {
      alert('حدث خطأ أثناء تغيير حالة الإعلان');
    }
  };

  const handleWorkflow = async (adId: string, action: 'submit-review' | 'approve' | 'publish') => {
    try {
      await workflowAction({ adId, action });
    } catch {
      alert('حدث خطأ أثناء تحديث الإعلان');
    }
  };

  const handleDelete = async (adId: string) => {
    if (!confirm('هل أنت تأكد من حذف هذا الإعلان؟')) return;
    try {
      await deleteAd(adId);
    } catch {
      alert('حدث خطأ أثناء حذف الإعلان');
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={4} />;
  }

  return (
    <AdsErrorBoundary fallbackTitle="حدث خطأ في تحميل قائمة الحملات والإعلانات">
      <div className="space-y-4 font-cairo">
        <CampaignToolbar onOpenCreateAd={() => onOpenCreateAd()} />

        {campaigns.length > 0 ? (
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <CampaignCardAccordion
                key={campaign.id}
                campaign={campaign}
                isExpanded={Boolean(expandedIds[campaign.id])}
                onToggleExpand={toggleExpand}
                onOpenCreateAd={(cid) => onOpenCreateAd(cid)}
                onUpdateStatus={handleUpdateStatus}
                onWorkflowAction={handleWorkflow}
                onDeleteAd={handleDelete}
              />
            ))}
          </div>
        ) : (
          <CampaignEmptyState />
        )}
      </div>
    </AdsErrorBoundary>
  );
}
