'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { TableSkeleton } from './AdsSkeleton';
import { AdsErrorBoundary } from './AdsErrorBoundary';
import { useAdsAnalytics } from '../../hooks/useAdsAnalytics';
import { useAdMutations } from '../../hooks/useAdMutations';

export function PlacementsTab() {
  const { data: analytics, isLoading } = useAdsAnalytics();
  const { togglePlacement } = useAdMutations();

  if (isLoading) {
    return <TableSkeleton rows={4} />;
  }

  const placements = analytics?.placementConfigs || [];

  const handleToggle = async (key: string, currentEnabled: boolean) => {
    try {
      await togglePlacement({ key, enabled: !currentEnabled });
    } catch {
      alert('حدث خطأ أثناء تعديل المكان الإعلاني');
    }
  };

  return (
    <AdsErrorBoundary fallbackTitle="حدث خطأ في تحميل الأماكن الإعلانية">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-cairo">
        {placements.length > 0 ? (
          placements.map((p) => (
            <Card key={p.id} variant="default" className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="primary" className="font-mono text-[10px]">
                  {p.key}
                </Badge>
                <Switch
                  checked={p.enabled}
                  onChange={() => handleToggle(p.key, p.enabled)}
                />
              </div>
              <h4 className="font-bold text-sm text-text">{p.name}</h4>
              <p className="text-xs text-text-secondary leading-relaxed">{p.description}</p>
              <div className="flex items-center gap-1.5 pt-1">
                <Badge variant={p.enabled ? 'success' : 'gray'}>
                  {p.enabled ? '● مُفعّل' : '○ معطّل'}
                </Badge>
              </div>
            </Card>
          ))
        ) : (
          <p className="text-text-tertiary text-xs col-span-full text-center py-8">
            لا توجد أماكن إعلانية مضافة
          </p>
        )}
      </div>
    </AdsErrorBoundary>
  );
}
