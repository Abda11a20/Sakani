// apps/frontend/src/components/layout/AdminLayout.tsx
"use client";

import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldBan,
  ClipboardList,
  MessageCircle,
  Archive,
  FileText,
  Compass,
} from "lucide-react";
import { useLocale } from "next-intl";
import UnifiedDashboardLayout, { type DashboardMenuItem } from "./UnifiedDashboardLayout";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const locale = useLocale();

  const menuItems: DashboardMenuItem[] = [
    {
      label: "لوحة التحكم",
      labelEn: "Dashboard",
      icon: LayoutDashboard,
      href: `/${locale}/admin`,
      exact: true,
    },
    {
      label: "مراجعة الإعلانات",
      labelEn: "Review Listings",
      icon: Building2,
      href: `/${locale}/admin/listings`,
    },
    {
      label: "إدارة المستخدمين",
      labelEn: "Users",
      icon: Users,
      href: `/${locale}/admin/users`,
    },
    {
      label: "المحظورون",
      labelEn: "Banned",
      icon: ShieldBan,
      href: `/${locale}/admin/banned`,
    },
    {
      label: "طلبات المعاينة",
      labelEn: "View Requests",
      icon: ClipboardList,
      href: `/${locale}/admin/requests`,
    },
    {
      label: "عقود الإيجار",
      labelEn: "Rentals",
      icon: FileText,
      href: `/${locale}/admin/rentals`,
    },
    {
      label: "رسائل الدعم",
      labelEn: "Support",
      icon: MessageCircle,
      href: `/${locale}/admin/chat`,
    },
    {
      label: "إدارة المجتمع",
      labelEn: "Community Management",
      icon: Compass,
      href: `/${locale}/admin/community`,
    },
    {
      label: "إعلانات محذوفة",
      labelEn: "Deleted Ads",
      icon: Archive,
      href: `/${locale}/admin/deleted-advertisements`,
    },
  ];

  return (
    <UnifiedDashboardLayout role="admin" accentTheme="admin" menuItems={menuItems}>
      {children}
    </UnifiedDashboardLayout>
  );
}
