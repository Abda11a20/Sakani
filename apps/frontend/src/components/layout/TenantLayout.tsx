// apps/frontend/src/components/layout/TenantLayout.tsx
"use client";

import {
  LayoutDashboard,
  Heart,
  Bell,
  User,
  MessageSquare,
  History,
  FileText,
  Compass,
} from "lucide-react";
import { useLocale } from "next-intl";
import UnifiedDashboardLayout, { type DashboardMenuItem } from "./UnifiedDashboardLayout";

interface TenantLayoutProps {
  children: React.ReactNode;
}

export default function TenantLayout({ children }: TenantLayoutProps) {
  const locale = useLocale();

  const menuItems: DashboardMenuItem[] = [
    {
      label: "لوحة التحكم",
      labelEn: "Dashboard",
      icon: LayoutDashboard,
      href: `/${locale}/dashboard/tenant`,
      exact: true,
    },
    {
      label: "سجل إيجاراتي",
      labelEn: "Rental History",
      icon: History,
      href: `/${locale}/dashboard/tenant/rental-history`,
    },
    {
      label: "طلبات المعاينة",
      labelEn: "Viewing Requests",
      icon: FileText,
      href: `/${locale}/dashboard/tenant/viewing-requests`,
    },
    {
      label: "المفضلة",
      labelEn: "Wishlist",
      icon: Heart,
      href: `/${locale}/dashboard/tenant/wishlist`,
    },
    {
      label: "التنبيهات الذكية",
      labelEn: "Smart Alerts",
      icon: Bell,
      href: `/${locale}/dashboard/tenant/alerts`,
    },
    {
      label: "المجتمع",
      labelEn: "Community",
      icon: Compass,
      href: `/${locale}/community`,
    },
    {
      label: "ملفي الشخصي",
      labelEn: "Profile",
      icon: User,
      href: `/${locale}/dashboard/profile`,
    },
    {
      label: "الدعم الفني",
      labelEn: "Support Chat",
      icon: MessageSquare,
      href: `/${locale}/dashboard/support`,
    },
  ];

  return (
    <UnifiedDashboardLayout role="tenant" accentTheme="blue" menuItems={menuItems}>
      {children}
    </UnifiedDashboardLayout>
  );
}
