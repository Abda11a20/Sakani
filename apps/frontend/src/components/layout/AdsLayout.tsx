'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Megaphone, LayoutDashboard, Bug,
  FolderKanban, Layers, CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/store/auth.store';

interface AdsLayoutProps {
  children: React.ReactNode;
}

export default function AdsLayout({ children }: AdsLayoutProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  const isSuperAdmin = user?.role === 'super_admin';

  const navItems = [
    {
      label: 'لوحة التحكم والتحليلات',
      href: `/${locale}/admin/ads`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: 'إدارة الحملات',
      href: `/${locale}/admin/ads/campaigns`,
      icon: FolderKanban,
      exact: false,
    },
    {
      label: 'قائمة الإعلانات',
      href: `/${locale}/admin/ads/advertisements`,
      icon: Megaphone,
      exact: false,
    },
    {
      label: 'الأماكن الإعلانية',
      href: `/${locale}/admin/ads/placements`,
      icon: Layers,
      exact: false,
    },
    {
      label: 'الفواتير والمالية',
      href: `/${locale}/admin/ads/billing`,
      icon: CreditCard,
      exact: false,
    },
    ...(isSuperAdmin
      ? [
          {
            label: 'التشخيص والمحاكاة (خارجي)',
            href: `/${locale}/admin/ads/debug`,
            icon: Bug,
            exact: false,
          },
        ]
      : []),
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div
      className="w-full flex-1 flex flex-col min-h-screen"
      style={{ background: '#F8F9FC', fontFamily: "'Cairo', 'Inter', sans-serif", direction: 'rtl' }}
    >
      {/* ── Sub Navigation Tabs Bar ── */}
      <div className="bg-white border-b border-border shadow-2xs sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between overflow-x-auto gap-2">
          <div className="flex items-center gap-1 py-1 overflow-x-auto">
            {navItems.map((item) => {
              const active = isActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap',
                    active
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-text-secondary hover:text-text hover:bg-surface-secondary',
                  )}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0 py-2">
            <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-status-success/10 text-status-success border border-status-success/20">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
              نظام الإعلانات فعّال
            </span>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
