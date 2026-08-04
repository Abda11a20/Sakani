// apps/frontend/src/components/layout/AdminLayout.tsx
"use client";

import {
  LayoutDashboard,
  Megaphone,
  Building2,
  Users,
  ShieldBan,
  ShieldAlert,
  ClipboardList,
  FileText,
  MessageCircle,
  Compass,
  Archive,
  RotateCcw,
} from "lucide-react";
import { useLocale } from "next-intl";
import UnifiedDashboardLayout, { type DashboardMenuItem } from "./UnifiedDashboardLayout";
import { useDashboardSummary } from "@/features/dashboard";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const locale = useLocale();
  const { data: summaryData } = useDashboardSummary("admin");

  const pendingListings = Number(summaryData?.stats?.pendingListingsCount || summaryData?.stats?.pendingListings || 0);
  const pendingReports = Number(summaryData?.stats?.pendingReportsCount || summaryData?.stats?.reportsCount || 0);

  const menuItems: DashboardMenuItem[] = [
    {
      label: "لوحة التحكم",
      labelEn: "Dashboard",
      icon: LayoutDashboard,
      href: `/${locale}/admin`,
      exact: true,
    },
    {
      label: "الإعلانات التجارية (Ads)",
      labelEn: "Ad Server",
      icon: Megaphone,
      href: `/${locale}/admin/ads`,
    },
    {
      label: "مراجعة إعلانات العقارات",
      labelEn: "Review Listings",
      icon: Building2,
      href: `/${locale}/admin/listings`,
      badge: pendingListings > 0 ? pendingListings : undefined,
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
      label: "دورة حياة الحسابات",
      labelEn: "Account Lifecycle",
      icon: RotateCcw,
      href: `/${locale}/admin/account-lifecycle`,
    },
    {
      label: "البلاغات",
      labelEn: "Reports",
      icon: ShieldAlert,
      href: `/${locale}/admin/reports`,
      badge: pendingReports > 0 ? pendingReports : undefined,
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
      exact: true,
    },
    {
      label: "أرشيف الفعاليات",
      labelEn: "Archived Events",
      icon: Archive,
      href: `/${locale}/admin/community/archived`,
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
