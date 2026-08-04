// apps/frontend/src/app/[locale]/admin/ads/layout.tsx
import type { Metadata } from 'next';
import AdsLayout from '@/components/layout/AdsLayout';

export const metadata: Metadata = {
  title: 'Ad Server — نظام الإعلانات التجارية',
  description: 'لوحة تحكم الإعلانات التجارية المستقلة',
  robots: { index: false, follow: false },
};

export default function AdsRootLayout({ children }: { children: React.ReactNode }) {
  return <AdsLayout>{children}</AdsLayout>;
}
