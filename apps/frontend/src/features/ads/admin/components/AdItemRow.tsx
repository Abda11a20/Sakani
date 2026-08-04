'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EditAdDialog } from './EditAdDialog';
import {
  ImageIcon, Play, Pause, Send, ShieldCheck, Trash2, ExternalLink, Edit3, Film,
} from 'lucide-react';
import { campaignsApi } from '../../api/campaigns.api';
import type { Advertisement, AdStatus } from '../../types/ads.types';

interface AdItemRowProps {
  ad: Advertisement;
  onUpdateStatus: (adId: string, status: AdStatus) => Promise<void>;
  onWorkflowAction: (adId: string, action: 'submit-review' | 'approve' | 'publish') => Promise<void>;
  onDeleteAd: (adId: string) => Promise<void>;
  onSaveAdEdit?: (adId: string, payload: any) => Promise<void>;
}

function StatusBadge({ status }: { status: AdStatus }) {
  const map: Record<AdStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold' | 'gray' }> = {
    DRAFT:        { label: 'مسودة',           variant: 'gray' },
    UNDER_REVIEW: { label: 'قيد المراجعة',    variant: 'warning' },
    APPROVED:     { label: 'تمت الموافقة',     variant: 'info' },
    PUBLISHED:    { label: 'نشط ومُفعل',       variant: 'success' },
    PAUSED:       { label: 'موقوف مؤقتاً',    variant: 'warning' },
    ARCHIVED:     { label: 'مؤرشف',          variant: 'gray' },
  };
  const cfg = map[status] || { label: status, variant: 'default' };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function AdItemRow({
  ad, onUpdateStatus, onWorkflowAction, onDeleteAd, onSaveAdEdit,
}: AdItemRowProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [imgError, setImgError] = useState(false);

  const media = ad.mediaItems?.[0];
  const isVideo = media?.type === 'VIDEO';

  return (
    <>
      <div className="bg-surface p-4 rounded-xl border border-border hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-cairo shadow-2xs">
        {/* Clickable Info Area */}
        <div
          onClick={() => setShowEditModal(true)}
          className="flex items-center gap-3.5 min-w-0 cursor-pointer flex-1"
        >
          {media?.url && !imgError ? (
            isVideo ? (
              <div className="w-16 h-16 rounded-xl bg-text shrink-0 relative overflow-hidden flex items-center justify-center border border-border">
                <Film size={20} className="text-white/70" />
              </div>
            ) : (
              <img
                src={media.url}
                alt={ad.title}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-16 h-16 rounded-xl object-cover border border-border shrink-0 bg-surface-tertiary"
              />
            )
          ) : (
            <div className="w-16 h-16 rounded-xl bg-surface-tertiary border border-border flex items-center justify-center shrink-0">
              <ImageIcon size={20} className="text-text-tertiary" />
            </div>
          )}

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h5 className="font-bold text-sm text-text truncate hover:text-primary transition-colors">
                {ad.title}
              </h5>
              <StatusBadge status={ad.status} />
            </div>

            <p className="text-xs text-text-secondary">
              المكان:&nbsp;
              <strong className="font-mono text-primary px-1.5 py-0.5 rounded bg-primary/10">
                {ad.placement?.key || ad.placementKey || 'HOME_HERO'}
              </strong>
              &nbsp;|&nbsp;مشاهدات: <strong>{ad.viewsCount ?? 0}</strong>
              &nbsp;|&nbsp;نقرات: <strong>{ad.clicksCount ?? 0}</strong>
            </p>

            {ad.target?.url || ad.target?.whatsapp ? (
              <a
                href={ad.target.url || `https://wa.me/${ad.target.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] text-primary font-mono hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink size={10} />
                {ad.target.url || ad.target.whatsapp}
              </a>
            ) : null}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit3 size={13} />}
            onClick={() => setShowEditModal(true)}
          >
            تعديل
          </Button>

          {ad.status !== 'PUBLISHED' && (
            <Button
              variant="success"
              size="sm"
              leftIcon={<Play size={12} />}
              onClick={() => onWorkflowAction(ad.id, 'publish')}
            >
              تفعيل
            </Button>
          )}
          {ad.status === 'PUBLISHED' && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Pause size={12} />}
              onClick={() => onUpdateStatus(ad.id, 'PAUSED')}
            >
              إيقاف
            </Button>
          )}
          {ad.status === 'DRAFT' && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Send size={12} />}
              onClick={() => onWorkflowAction(ad.id, 'submit-review')}
            >
              مراجعة
            </Button>
          )}
          {ad.status === 'UNDER_REVIEW' && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ShieldCheck size={12} />}
              onClick={() => onWorkflowAction(ad.id, 'approve')}
            >
              موافقة
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-status-danger hover:bg-status-danger/10"
            onClick={() => onDeleteAd(ad.id)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditAdDialog
          isOpen={showEditModal}
          ad={ad}
          onClose={() => setShowEditModal(false)}
          onSave={async (adId, payload) => {
            if (onSaveAdEdit) {
              await onSaveAdEdit(adId, payload);
            } else {
              await campaignsApi.updateAd(adId, payload);
              await onUpdateStatus(adId, payload.status || ad.status);
            }
          }}
        />
      )}
    </>
  );
}
