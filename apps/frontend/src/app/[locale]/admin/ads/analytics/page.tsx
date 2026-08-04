'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCardsSkeleton, TableSkeleton } from '@/features/ads/admin/components/AdsSkeleton';
import { AdsErrorBoundary } from '@/features/ads/admin/components/AdsErrorBoundary';
import { AdAnalyticsDetailModal } from '@/features/ads/admin/components/AdAnalyticsDetailModal';
import { useAdsAnalytics } from '@/features/ads/hooks/useAdsAnalytics';
import { BarChart2, Trophy, Eye, MousePointer, ChevronLeft } from 'lucide-react';
import type { Advertisement } from '@/features/ads/types/ads.types';

export default function DedicatedFullAnalyticsPage() {
  const { data: analytics, isLoading } = useAdsAnalytics();
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <StatCardsSkeleton />
        <TableSkeleton rows={6} />
      </div>
    );
  }

  const overview = analytics?.overview;
  const topPerforming = analytics?.topPerforming || [];

  return (
    <AdsErrorBoundary fallbackTitle="حدث خطأ في تحميل التقرير التفصيلي للتحليلات">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-cairo" dir="rtl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-text via-primary/80 to-primary p-6 rounded-2xl text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
              <BarChart2 size={24} className="text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">التقرير التحليلي الشامل لأداء الإعلانات</h1>
              <p className="text-xs text-white/70 mt-1">
                تصفح قائمة التحليلات النظيفة (انقر على أي إعلان لفتح النافذة المنبثقة الشاملة)
              </p>
            </div>
          </div>
        </div>

        {/* Big Overview Stats */}
        {overview && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card variant="bordered" className="p-4 sm:p-5 space-y-1">
              <p className="text-xs font-semibold text-text-secondary">إجمالي الحملات</p>
              <p className="text-xl sm:text-2xl font-black text-primary font-mono">{overview.totalCampaigns}</p>
            </Card>
            <Card variant="bordered" className="p-4 sm:p-5 space-y-1">
              <p className="text-xs font-semibold text-text-secondary">إجمالي المشاهدات</p>
              <p className="text-xl sm:text-2xl font-black text-text font-mono">{overview.totalViews?.toLocaleString()}</p>
            </Card>
            <Card variant="bordered" className="p-4 sm:p-5 space-y-1">
              <p className="text-xs font-semibold text-text-secondary">إجمالي النقرات</p>
              <p className="text-xl sm:text-2xl font-black text-text font-mono">{overview.totalClicks?.toLocaleString()}</p>
            </Card>
            <Card variant="bordered" className="p-4 sm:p-5 space-y-1">
              <p className="text-xs font-semibold text-text-secondary">متوسط نسبة CTR</p>
              <p className="text-xl sm:text-2xl font-black text-status-success font-mono">{overview.overallCtr}</p>
            </Card>
          </div>
        )}

        {/* ── Ultra Clean Responsive Analytics List Cards (NO TABLE SCROLL) ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-accent" />
            <h3 className="text-base font-bold text-text">تحليلات الإعلانات (انقر لعرض التفاصيل)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topPerforming.length > 0 ? (
              topPerforming.map((ad) => (
                <div
                  key={ad.id}
                  onClick={() => setSelectedAd(ad)}
                  className="p-4 rounded-xl border border-border bg-surface hover:border-primary cursor-pointer transition-all space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-xs text-text truncate">{ad.title}</h4>
                    <Badge variant={ad.isPoorPerformance ? 'warning' : 'success'} className="shrink-0 text-[10px]">
                      {ad.isPoorPerformance ? 'ضعيف' : 'ممتاز'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                    <span className="text-text-secondary">
                      العميل: <strong className="text-text">{ad.campaign?.clientName || '—'}</strong>
                    </span>
                    <div className="flex items-center gap-1 font-mono text-status-success font-bold">
                      <span>{ad.ctr}% CTR</span>
                      <ChevronLeft size={14} className="text-text-tertiary" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-8 text-center text-text-tertiary border border-dashed border-border rounded-xl">
                لا توجد إعلانات نشطة حالياً لإظهار التقرير
              </div>
            )}
          </div>
        </div>

        {/* Analytics Detail Modal */}
        <AdAnalyticsDetailModal
          isOpen={!!selectedAd}
          ad={selectedAd}
          onClose={() => setSelectedAd(null)}
        />
      </div>
    </AdsErrorBoundary>
  );
}
