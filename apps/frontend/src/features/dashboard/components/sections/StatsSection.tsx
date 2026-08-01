// apps/frontend/src/components/dashboard/sections/StatsSection.tsx
// Palette: Gold #D4A847 · Rose #C9637A · Warm cream (neutral)

import React from "react";
import { useLocale } from "next-intl";
import { KPIStatCard } from "../cards/KPIStatCard";
import {
  BedDouble, Building2, ClipboardList, Eye,
  Bell, FileText, Users, ShieldAlert, Home, CheckCircle2,
  ShieldBan, UserCheck, Shield, Archive,
} from "lucide-react";

interface StatsSectionProps {
  stats: Record<string, any>;
  role: "landlord" | "tenant" | "admin";
}

export const StatsSection: React.FC<StatsSectionProps> = ({ stats = {}, role }) => {
  const locale = useLocale();
  const isAr = locale === "ar";
  const pre = `/${locale}`;

  // ── Landlord ──────────────────────────────────────────────────
  if (role === "landlord") {
    const listings = stats.activeListings ?? 0;
    const occupied = stats.occupiedUnits ?? 0;
    const pending = stats.pendingRequests ?? 0;
    const views = stats.totalViews ?? 0;

    return (
      <div className="grid grid-cols-2 gap-2.5">
        <KPIStatCard
          title={isAr ? "الإعلانات النشطة" : "Active Listings"}
          value={listings}
          context={listings === 0
            ? (isAr ? "لا إعلانات بعد" : "No listings yet")
            : (isAr ? "إعلان منشور" : "published")}
          icon={Building2}
          colorTheme="gold"
          route={`${pre}/dashboard/landlord/advertisements`}
        />
        <KPIStatCard
          title={isAr ? "الوحدات/الأسرّة المؤجرة" : "Occupied Units"}
          value={occupied}
          context={occupied === 0
            ? (isAr ? "لا وحدات مؤجرة" : "None rented")
            : (isAr ? "وحدة محجوزة" : "occupied")}
          icon={BedDouble}
          colorTheme="gold"
          route={`${pre}/dashboard/landlord/rental-history`}
        />
        <KPIStatCard
          title={isAr ? "طلبات المعاينة المعلقة" : "Pending Requests"}
          value={pending}
          context={pending === 0
            ? (isAr ? "لا طلبات جديدة" : "No new requests")
            : (isAr ? "ينتظر ردك الآن" : "awaiting response")}
          icon={ClipboardList}
          colorTheme={pending > 0 ? "rose" : "warm"}
          route={`${pre}/dashboard/landlord/requests`}
        />
        <KPIStatCard
          title={isAr ? "إجمالي المشاهدات" : "Total Views"}
          value={views}
          context={isAr ? "آخر 30 يوم" : "Last 30 days"}
          icon={Eye}
          colorTheme="warm"
        />
      </div>
    );
  }

  // ── Tenant ────────────────────────────────────────────────────
  if (role === "tenant") {
    const requests = stats.activeRequests ?? 0;
    const alerts = stats.activeAlerts ?? 0;
    const contracts = stats.activeContracts ?? 0;
    const completed = stats.completedRentals ?? 0;

    return (
      <div className="grid grid-cols-2 gap-2.5">
        <KPIStatCard
          title={isAr ? "طلبات المعاينة" : "Viewing Requests"}
          value={requests}
          context={requests === 0
            ? (isAr ? "لم تُرسل طلبات بعد" : "No requests yet")
            : (isAr ? "طلب نشط" : "active")}
          icon={ClipboardList}
          colorTheme="gold"
          route={`${pre}/dashboard/tenant/viewing-requests`}
        />
        <KPIStatCard
          title={isAr ? "تنبيهات البحث" : "Search Alerts"}
          value={alerts}
          context={alerts === 0
            ? (isAr ? "أنشئ تنبيهاً" : "Create an alert")
            : (isAr ? "تنبيه ذكي نشط" : "active alert")}
          icon={Bell}
          colorTheme={alerts > 0 ? "rose" : "warm"}
        />
        <KPIStatCard
          title={isAr ? "العقود النشطة" : "Active Leases"}
          value={contracts}
          context={contracts === 0
            ? (isAr ? "لا عقود نشطة" : "No active leases")
            : (isAr ? "عقد ساري" : "lease active")}
          icon={Home}
          colorTheme="gold"
          route={`${pre}/dashboard/tenant/rental-history`}
        />
        <KPIStatCard
          title={isAr ? "إيجارات مكتملة" : "Completed Rentals"}
          value={completed}
          context={isAr ? "سجلك السكني الكامل" : "Full rental history"}
          icon={CheckCircle2}
          colorTheme="warm"
          route={`${pre}/dashboard/tenant/rental-history`}
        />
      </div>
    );
  }

  // ── Admin (Full Real KPIs Grid) ──────────────────────────────
  const totalUsers = stats.totalUsers ?? 0;
  const activeUsers = stats.activeUsers ?? 0;
  const bannedUsers = stats.bannedUsers ?? 0;
  const tenantsCount = stats.tenantsCount ?? 0;
  const landlordsCount = stats.landlordsCount ?? 0;
  const adminsCount = (stats.adminsCount ?? 0) + (stats.superAdminsCount ?? 0);
  const totalList = stats.totalListings ?? 0;
  const activeList = stats.activeListings ?? 0;
  const pendingList = stats.pendingListings ?? 0;
  const deletedList = stats.deletedListings ?? 0;
  const contracts = stats.activeContracts ?? 0;
  const pendingRequests = stats.pendingViewingRequests ?? 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      <KPIStatCard
        title={isAr ? "إجمالي المستخدمين" : "Total Users"}
        value={totalUsers}
        context={isAr ? "مستخدم مسجل" : "registered users"}
        icon={Users}
        colorTheme="gold"
        route={`${pre}/admin/users`}
      />
      <KPIStatCard
        title={isAr ? "المستخدمون النشطون" : "Active Users"}
        value={activeUsers}
        context={isAr ? "حساب موثوق ونشط" : "active accounts"}
        icon={UserCheck}
        colorTheme="gold"
        route={`${pre}/admin/users`}
      />
      <KPIStatCard
        title={isAr ? "المستخدمون المحظورون" : "Banned Users"}
        value={bannedUsers}
        context={bannedUsers > 0 ? (isAr ? "في القائمة السوداء" : "in blacklist") : (isAr ? "لا حظر حالياً" : "none")}
        icon={ShieldBan}
        colorTheme={bannedUsers > 0 ? "rose" : "warm"}
        route={`${pre}/admin/banned`}
      />
      <KPIStatCard
        title={isAr ? "المستأجرون" : "Tenants"}
        value={tenantsCount}
        context={isAr ? "حساب مستأجر" : "tenants"}
        icon={Users}
        colorTheme="warm"
        route={`${pre}/admin/users`}
      />
      <KPIStatCard
        title={isAr ? "الملاك / المؤجرون" : "Landlords"}
        value={landlordsCount}
        context={isAr ? "حساب مؤجر" : "landlords"}
        icon={Building2}
        colorTheme="warm"
        route={`${pre}/admin/users`}
      />
      <KPIStatCard
        title={isAr ? "المشرفون والإدارة" : "Admins & Staff"}
        value={adminsCount}
        context={isAr ? "صلاحيات إدارية" : "staff accounts"}
        icon={Shield}
        colorTheme="gold"
        route={`${pre}/admin/users`}
      />
      <KPIStatCard
        title={isAr ? "إجمالي العقارات" : "Total Listings"}
        value={totalList}
        context={isAr ? "إعلان في النظام" : "total listings"}
        icon={Building2}
        colorTheme="gold"
        route={`${pre}/admin/listings`}
      />
      <KPIStatCard
        title={isAr ? "الإعلانات النشطة" : "Active Listings"}
        value={activeList}
        context={isAr ? "منشور ومتاح حالياً" : "active & public"}
        icon={Building2}
        colorTheme="gold"
        route={`${pre}/admin/listings`}
      />
      <KPIStatCard
        title={isAr ? "بانتظار المراجعة" : "Pending Review"}
        value={pendingList}
        context={pendingList > 0 ? (isAr ? "يتطلب اعتمادك" : "needs approval") : (isAr ? "لا معلقات" : "all clear")}
        icon={ShieldAlert}
        colorTheme={pendingList > 0 ? "rose" : "warm"}
        route={`${pre}/admin/listings`}
      />
      <KPIStatCard
        title={isAr ? "الإعلانات المحذوفة" : "Deleted Listings"}
        value={deletedList}
        context={isAr ? "سجل الأرشيف" : "archived ads"}
        icon={Archive}
        colorTheme="warm"
        route={`${pre}/admin/deleted-advertisements`}
      />
      <KPIStatCard
        title={isAr ? "العقود النشطة" : "Active Contracts"}
        value={contracts}
        context={isAr ? "عقد إيجار ساري" : "active leases"}
        icon={FileText}
        colorTheme="gold"
        route={`${pre}/admin/rentals`}
      />
      <KPIStatCard
        title={isAr ? "طلبات المعاينة" : "Viewing Requests"}
        value={pendingRequests}
        context={isAr ? "طلب معاينة معلق" : "pending requests"}
        icon={ClipboardList}
        colorTheme={pendingRequests > 0 ? "rose" : "warm"}
        route={`${pre}/admin/requests`}
      />
    </div>
  );
};
