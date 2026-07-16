// apps/frontend/src/components/layout/LandlordLayout.tsx
"use client";

import {
  LayoutDashboard,
  Building,
  GitPullRequest,
  Settings,
  MessageSquare,
  History,
  Megaphone,
  Compass,
} from "lucide-react";
import { useLocale } from "next-intl";
import UnifiedDashboardLayout, { type DashboardMenuItem } from "./UnifiedDashboardLayout";

interface LandlordLayoutProps {
  children: React.ReactNode;
}

export default function LandlordLayout({ children }: LandlordLayoutProps) {
  const locale = useLocale();

  const menuItems: DashboardMenuItem[] = [
    {
      label: "لوحة التحكم",
      labelEn: "Dashboard",
      icon: LayoutDashboard,
      href: `/${locale}/dashboard/landlord`,
      exact: true,
    },
    {
      label: "إدارة العقارات",
      labelEn: "My Properties",
      icon: Building,
      href: `/${locale}/dashboard/landlord/properties`,
    },
    {
      label: "إدارة الإعلانات",
      labelEn: "Advertisement Management",
      icon: Megaphone,
      href: `/${locale}/dashboard/landlord/advertisements`,
    },
    {
      label: "سجل الإيجارات",
      labelEn: "Rental History",
      icon: History,
      href: `/${locale}/dashboard/landlord/rental-history`,
    },
    {
      label: "الطلبات الواردة",
      labelEn: "Viewing Requests",
      icon: GitPullRequest,
      href: `/${locale}/dashboard/landlord/requests`,
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
      icon: Settings,
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
    <UnifiedDashboardLayout role="landlord" accentTheme="gold" menuItems={menuItems}>
      {children}
    </UnifiedDashboardLayout>
  );
}
