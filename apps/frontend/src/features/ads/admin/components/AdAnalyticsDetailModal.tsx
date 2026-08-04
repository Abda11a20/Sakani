import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Eye, MousePointer, ExternalLink, AlertTriangle, CheckCircle, User, LayoutGrid } from 'lucide-react';
import type { Advertisement } from '../../types/ads.types';

interface AdAnalyticsDetailModalProps {
  isOpen: boolean;
  ad: Advertisement | null;
  onClose: () => void;
}

export function AdAnalyticsDetailModal({ isOpen, ad, onClose }: AdAnalyticsDetailModalProps) {
  if (!ad) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تفاصيل وأداء الإعلان"
      description={`تحليلات التفاعل للإعلان: ${ad.title}`}
      size="md"
    >
      <div className="space-y-4 pt-2 font-cairo" dir="rtl">
        {/* Banner with Status & Evaluation */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-secondary border border-border">
          <div className="space-y-0.5">
            <span className="text-[11px] text-text-tertiary">تقييم الأداء العام</span>
            <div className="flex items-center gap-2">
              <Badge variant={ad.isPoorPerformance ? 'warning' : 'success'}>
                {ad.isPoorPerformance ? 'أداء يحتاج تحسين' : 'أداء ممتاز'}
              </Badge>
              <Badge variant="gray" className="font-mono">{ad.status}</Badge>
            </div>
          </div>

          <div className="text-left font-mono">
            <span className="text-xs font-bold text-text-tertiary block">نسبة التفاعل CTR</span>
            <span className="text-lg font-black text-status-success">{ad.ctr || 0}%</span>
          </div>
        </div>

        {/* Core Analytics Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl border border-border bg-surface space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Eye size={15} className="text-primary" />
              <span>إجمالي المشاهدات</span>
            </div>
            <p className="text-xl font-black font-mono text-text">{ad.viewsCount ?? 0}</p>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <MousePointer size={15} className="text-accent" />
              <span>إجمالي النقرات</span>
            </div>
            <p className="text-xl font-black font-mono text-text">{ad.clicksCount ?? 0}</p>
          </div>
        </div>

        {/* Campaign & Client details */}
        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-xl bg-surface-secondary/50 border border-border flex items-center justify-between">
            <span className="text-text-secondary flex items-center gap-1.5">
              <User size={14} className="text-text-tertiary" />
              <span>العميل / الشركة:</span>
            </span>
            <strong className="text-text font-bold">{ad.campaign?.clientName || 'غير محدد'}</strong>
          </div>

          <div className="p-3 rounded-xl bg-surface-secondary/50 border border-border flex items-center justify-between">
            <span className="text-text-secondary flex items-center gap-1.5">
              <LayoutGrid size={14} className="text-text-tertiary" />
              <span>المكان الإعلاني:</span>
            </span>
            <strong className="font-mono text-primary font-bold">
              {ad.placement?.key || ad.placementKey || 'HOME_HERO'}
            </strong>
          </div>

          {ad.target?.url || ad.target?.whatsapp ? (
            <div className="p-3 rounded-xl bg-surface-secondary/50 border border-border flex items-center justify-between">
              <span className="text-text-secondary flex items-center gap-1.5">
                <ExternalLink size={14} className="text-text-tertiary" />
                <span>رابط التوجيه:</span>
              </span>
              <a
                href={ad.target.url || `https://wa.me/${ad.target.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-primary hover:underline truncate max-w-[200px]"
              >
                {ad.target.url || ad.target.whatsapp}
              </a>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>
    </Modal>
  );
}
