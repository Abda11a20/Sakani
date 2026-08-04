'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCardsSkeleton, TableSkeleton } from './AdsSkeleton';
import { AdsErrorBoundary } from './AdsErrorBoundary';
import { AdAnalyticsDetailModal } from './AdAnalyticsDetailModal';
import { useAdsAnalytics } from '../../hooks/useAdsAnalytics';
import { Trophy, ChevronLeft } from 'lucide-react';
import type { Advertisement } from '../../types/ads.types';

export function AnalyticsTab() {
  const locale = useLocale();
  const { data: analytics, isLoading } = useAdsAnalytics();
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <StatCardsSkeleton />
        <TableSkeleton rows={3} />
      </div>
    );
  }

  const overview = analytics?.overview;
  const topPerforming = (analytics?.topPerforming || []).slice(0, 3); // Top 3 ads for clean summary

  return (
    <AdsErrorBoundary fallbackTitle="حدث خطأ في تحميل التحليلات والإحصائيات">
      <div className="space-y-5 font-cairo" dir="rtl">
        {/* Overview Stats (2x2 Grid on mobile for maximum clean look) */}
        {overview && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card variant="bordered" className="p-4 space-y-1">
              <p className="text-xs font-semibold text-text-secondary">إجمالي الحملات</p>
              <p className="text-xl sm:text-2xl font-black text-primary font-mono">{overview.totalCampaigns}</p>
            </Card>
            <Card variant="bordered" className="p-4 space-y-1">
              <p className="text-xs font-semibold text-text-secondary">إجمالي المشاهدات</p>
              <p className="text-xl sm:text-2xl font-black text-text font-mono">{overview.totalViews?.toLocaleString()}</p>
            </Card>
            <Card variant="bordered" className="p-4 space-y-1">
              <p className="text-xs font-semibold text-text-secondary">إجمالي النقرات</p>
              <p className="text-xl sm:text-2xl font-black text-text font-mono">{overview.totalClicks?.toLocaleString()}</p>
            </Card>
            <Card variant="bordered" className="p-4 space-y-1">
              <p className="text-xs font-semibold text-text-secondary">متوسط نسبة CTR</p>
              <p className="text-xl sm:text-2xl font-black text-status-success font-mono">{overview.overallCtr}</p>
            </Card>
          </div>
        )}

        {/* ── Ultra Clean Top Performing Ads Summary (Only 2 Elements Per Item -> Click to open Popup Modal) ── */}
        <Card variant="default" className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-accent" />
              <h3 className="text-sm font-bold text-text">أفضل الإعلانات أداءً (انقر للتفاصيل)</h3>
            </div>
            <Link href={`/${locale}/admin/ads/analytics`}>
              <Button variant="ghost" size="sm" className="text-xs text-primary font-bold gap-1 p-1">
                <span>التفاصيل الشاملة</span>
                <ChevronLeft size={14} />
              </Button>
            </Link>
          </div>

          <div className="space-y-2">
            {topPerforming.length > 0 ? (
              topPerforming.map((ad) => (
                <div
                  key={ad.id}
                  onClick={() => setSelectedAd(ad)}
                  className="p-3 rounded-xl border border-border bg-surface-secondary/40 flex items-center justify-between gap-3 hover:border-primary/50 cursor-pointer transition-all"
                >
                  {/* Element 1: Title & Client */}
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-xs text-text truncate">{ad.title}</h5>
                    <p className="text-[11px] text-text-tertiary truncate mt-0.5">
                      العميل: {ad.campaign?.clientName || 'غير محدد'}
                    </p>
                  </div>

                  {/* Element 2: CTR % Score */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-left font-mono">
                      <span className="text-xs font-black text-status-success block">
                        {ad.ctr}% CTR
                      </span>
                      <span className="text-[10px] text-text-tertiary">
                        {ad.viewsCount} مشاهدة
                      </span>
                    </div>
                    <Badge variant={ad.isPoorPerformance ? 'warning' : 'success'} className="shrink-0 text-[10px]">
                      {ad.isPoorPerformance ? 'ضعيف' : 'ممتاز'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 border border-dashed border-border rounded-xl">
                <p className="text-xs text-text-tertiary">لا توجد إعلانات نشطة حالياً لإظهار الأداء</p>
              </div>
            )}
          </div>
        </Card>

        {/* Modal Popup */}
        <AdAnalyticsDetailModal
          isOpen={!!selectedAd}
          ad={selectedAd}
          onClose={() => setSelectedAd(null)}
        />
      </div>
    </AdsErrorBoundary>
  );
}
