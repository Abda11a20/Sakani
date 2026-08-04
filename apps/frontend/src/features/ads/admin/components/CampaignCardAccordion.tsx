'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdItemRow } from './AdItemRow';
import { ChevronDown, ChevronUp, Plus, User, Phone, Layers, CreditCard } from 'lucide-react';
import type { Campaign, AdStatus } from '../../types/ads.types';

interface CampaignCardAccordionProps {
  campaign: Campaign;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onOpenCreateAd: (campaignId: string) => void;
  onUpdateStatus: (adId: string, status: AdStatus) => Promise<void>;
  onWorkflowAction: (adId: string, action: 'submit-review' | 'approve' | 'publish') => Promise<void>;
  onDeleteAd: (adId: string) => Promise<void>;
}

export function CampaignCardAccordion({
  campaign,
  isExpanded,
  onToggleExpand,
  onOpenCreateAd,
  onUpdateStatus,
  onWorkflowAction,
  onDeleteAd,
}: CampaignCardAccordionProps) {
  const adsList = campaign.ads || [];

  return (
    <Card variant="default" className="overflow-hidden font-cairo border border-border shadow-sm hover:shadow-md transition-all">
      {/* Campaign Header Row */}
      <div
        onClick={() => onToggleExpand(campaign.id)}
        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer bg-surface hover:bg-surface-secondary/50 transition-colors"
      >
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-xl bg-surface-secondary border border-border text-primary shrink-0">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {campaign.campaignCode}
              </span>
              <h4 className="font-bold text-base text-text">{campaign.name}</h4>
            </div>

            <div className="flex items-center gap-4 text-xs text-text-secondary flex-wrap">
              <span className="flex items-center gap-1">
                <User size={13} className="text-text-tertiary" />
                <span>العميل: <strong className="text-text">{campaign.clientName}</strong></span>
              </span>
              {campaign.clientPhone && (
                <span className="flex items-center gap-1">
                  <Phone size={13} className="text-text-tertiary" />
                  <span className="font-mono">{campaign.clientPhone}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Badges & Action */}
        <div className="flex items-center gap-2.5 flex-wrap sm:shrink-0 justify-end">
          <Badge variant={campaign.isPaid ? 'success' : 'danger'}>
            <CreditCard size={12} className="inline ms-1" />
            {campaign.isPaid ? 'مدفوع' : 'غير مدفوع'}
          </Badge>
          
          <Badge variant="gray">
            <Layers size={12} className="inline ms-1" />
            {adsList.length} إعلانات
          </Badge>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              onOpenCreateAd(campaign.id);
            }}
          >
            إضافة إعلان
          </Button>
        </div>
      </div>

      {/* Expanded Ads List */}
      {isExpanded && (
        <div className="border-t border-border bg-surface-secondary/60 p-4 sm:p-5 space-y-3">
          {adsList.length > 0 ? (
            adsList.map((ad) => (
              <AdItemRow
                key={ad.id}
                ad={ad}
                onUpdateStatus={onUpdateStatus}
                onWorkflowAction={onWorkflowAction}
                onDeleteAd={onDeleteAd}
              />
            ))
          ) : (
            <div className="text-center py-6 border border-dashed border-border rounded-xl bg-surface">
              <p className="text-xs text-text-tertiary">لا توجد إعلانات مضافة بعد لهذه الحملة</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-primary font-bold text-xs"
                onClick={() => onOpenCreateAd(campaign.id)}
              >
                + إضافة أول إعلان الآن
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
