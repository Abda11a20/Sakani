'use client';

import React from 'react';
import { PlacementsTab } from '@/features/ads/admin/components/PlacementsTab';
import { AdsErrorBoundary } from '@/features/ads/admin/components/AdsErrorBoundary';
import { Card } from '@/components/ui/card';
import { Layers } from 'lucide-react';

export default function AdsPlacementsPage() {
  return (
    <AdsErrorBoundary fallbackTitle="حدث خطأ في تحميل إدارة الأماكن الإعلانية">
      <div className="p-6 max-w-7xl mx-auto space-y-6 font-cairo" dir="rtl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-text via-primary/80 to-primary p-6 rounded-2xl text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
              <Layers size={24} className="text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">إدارة وتفعيل الأماكن الإعلانية</h1>
              <p className="text-xs text-white/70 mt-1">
                التحكم المباشر في تفعيل أو تعطيل الأماكن الإعلانية الخمس الموزعة بتطبيق سكني
              </p>
            </div>
          </div>
        </div>

        <Card variant="default" className="p-6">
          <PlacementsTab />
        </Card>
      </div>
    </AdsErrorBoundary>
  );
}
