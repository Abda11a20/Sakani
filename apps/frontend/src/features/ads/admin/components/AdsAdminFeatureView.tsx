'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdsErrorBoundary } from './AdsErrorBoundary';
import { AnalyticsTab } from './AnalyticsTab';
import { useAdsAnalytics } from '../../hooks/useAdsAnalytics';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { Megaphone, FolderKanban, Layers, CreditCard, Bug, Power } from 'lucide-react';

export function AdsAdminFeatureView() {
  const locale = useLocale();
  const { data: analytics, toggleSetting } = useAdsAnalytics();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === 'super_admin';

  const globalEnabled =
    analytics?.systemSettings?.find((s) => s.key === 'adsEnabled')?.value ?? true;

  const handleToggleGlobal = async () => {
    try {
      await toggleSetting({ key: 'adsEnabled', value: !globalEnabled });
    } catch {
      alert('حدث خطأ أثناء تعديل إعداد تفعيل الإعلانات');
    }
  };

  return (
    <AdsErrorBoundary fallbackTitle="حدث خطأ في تحميل لوحة تحكم الإعلانات">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5 font-cairo" dir="rtl">
        {/* ── Top Header Banner ── */}
        <Card variant="elevated" className="overflow-hidden bg-gradient-to-r from-text via-primary/85 to-primary">
          <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center shrink-0">
                <Megaphone size={24} className="text-accent" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-white">لوحة تحليلات وأداء الإعلانات</h1>
                <p className="text-xs text-white/70 mt-0.5">
                  تتبع الأداء المالي والمشاهدات ونسب النقر ومتابعة الحملات التجارية النشطة
                </p>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleToggleGlobal}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  globalEnabled
                    ? 'bg-status-success/20 border-status-success/40 text-white'
                    : 'bg-status-danger/20 border-status-danger/40 text-white'
                }`}
              >
                <Power size={14} className={globalEnabled ? 'text-status-success' : 'text-status-danger'} />
                <span>المحرك العام: {globalEnabled ? 'مُفعل' : 'معطل'}</span>
              </button>

              {isSuperAdmin && (
                <Link href={`/${locale}/admin/ads/debug`}>
                  <Button variant="accent" size="sm" leftIcon={<Bug size={14} />}>
                    محاكاة المحرك
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>

        {/* ── Quick Navigation Cards (ALWAYS 2 COLUMNS) ── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Link href={`/${locale}/admin/ads/campaigns`}>
            <Card variant="default" className="p-3.5 sm:p-4 flex items-center justify-between hover:border-primary transition-all cursor-pointer h-full">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                  <FolderKanban size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-text truncate">إدارة الحملات</h4>
                  <p className="text-[10px] sm:text-[11px] text-text-secondary truncate">جدول الحملات والعملاء</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href={`/${locale}/admin/ads/advertisements`}>
            <Card variant="default" className="p-3.5 sm:p-4 flex items-center justify-between hover:border-primary transition-all cursor-pointer h-full">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Megaphone size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-text truncate">قائمة الإعلانات</h4>
                  <p className="text-[10px] sm:text-[11px] text-text-secondary truncate">الأماكن والتوجيهات</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href={`/${locale}/admin/ads/placements`}>
            <Card variant="default" className="p-3.5 sm:p-4 flex items-center justify-between hover:border-primary transition-all cursor-pointer h-full">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Layers size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-text truncate">الأماكن الإعلانية</h4>
                  <p className="text-[10px] sm:text-[11px] text-text-secondary truncate">إدارة الـ Placements</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href={`/${locale}/admin/ads/billing`}>
            <Card variant="default" className="p-3.5 sm:p-4 flex items-center justify-between hover:border-primary transition-all cursor-pointer h-full">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                  <CreditCard size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-text truncate">الفواتير والمالية</h4>
                  <p className="text-[10px] sm:text-[11px] text-text-secondary truncate">مستحقات `isPaid`</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* ── Main Analytics View ── */}
        <AnalyticsTab />
      </div>
    </AdsErrorBoundary>
  );
}
