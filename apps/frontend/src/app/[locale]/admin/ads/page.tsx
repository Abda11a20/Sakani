import type { Metadata } from 'next';
import { AdsAdminFeatureView, AdsErrorBoundary } from '@/features/ads/admin';

export const metadata: Metadata = {
  title: 'إدارة الإعلانات والحملات التجارية | سكني',
  description: 'لوحة التحكم المركزية لإدارة الإعلانات التجارية والأماكن الإعلانية والتحليلات',
  robots: { index: false, follow: false },
};

export default function AdminAdsDashboardPage() {
  return (
    <div className="w-full space-y-6">
      <AdsErrorBoundary fallbackTitle="حدث خطأ في لوحة تحكم الإعلانات">
        <AdsAdminFeatureView />
      </AdsErrorBoundary>
    </div>
  );
}
