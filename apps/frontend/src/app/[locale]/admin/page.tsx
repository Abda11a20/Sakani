// apps/frontend/src/app/[locale]/admin/page.tsx
"use client";

import type { Metadata } from "next";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Users,
  Building2,
  Clock,
  CheckCircle2,
  ClipboardList,
  AlertCircle,
  ShieldBan,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { useAdminStats, useHealthCheck, useAdminListings, useAdminUsers } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Activity, XCircle, UserPlus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | undefined;
  icon: React.ElementType;
  color: "blue" | "green" | "amber" | "red" | "purple" | "cyan";
  href?: string;
  suffix?: string;
}

const colorMap = {
  blue: {
    bg: "bg-blue-500/10 dark:bg-blue-500/10",
    icon: "text-blue-600 dark:text-blue-400",
    ring: "bg-blue-600",
    gradient: "from-blue-500 to-blue-600",
    badge: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  },
  green: {
    bg: "bg-emerald-500/10",
    icon: "text-emerald-600 dark:text-emerald-400",
    ring: "bg-emerald-600",
    gradient: "from-emerald-500 to-emerald-600",
    badge: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  },
  amber: {
    bg: "bg-amber-500/10",
    icon: "text-amber-600 dark:text-amber-400",
    ring: "bg-amber-600",
    gradient: "from-amber-500 to-amber-600",
    badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  },
  red: {
    bg: "bg-red-500/10",
    icon: "text-red-600 dark:text-red-400",
    ring: "bg-red-600",
    gradient: "from-red-500 to-red-600",
    badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  },
  purple: {
    bg: "bg-purple-500/10",
    icon: "text-purple-600 dark:text-purple-400",
    ring: "bg-purple-600",
    gradient: "from-purple-500 to-purple-600",
    badge: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    icon: "text-cyan-600 dark:text-cyan-400",
    ring: "bg-cyan-600",
    gradient: "from-cyan-500 to-cyan-600",
    badge: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300",
  },
};

function StatCard({ title, value, icon: Icon, color, href, suffix }: StatCardProps) {
  const c = colorMap[color];

  const card = (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 group",
        href && "cursor-pointer hover:-translate-y-0.5"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", c.bg)}>
          <Icon size={20} className={c.icon} />
        </div>
        {href && (
          <ArrowUpRight
            size={16}
            className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors"
          />
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white font-cairo mb-0.5">
          {value !== undefined ? value.toLocaleString("ar-EG") : "—"}
          {suffix && <span className="text-base font-normal text-slate-500 ms-1">{suffix}</span>}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo">{title}</p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{card}</Link>;
  }
  return card;
}

function HealthCheckWidget() {
  const { data, isLoading, isError } = useHealthCheck();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", 
          isError || data?.status === 'error' ? "bg-red-50 dark:bg-red-900/20 text-red-600" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
        )}>
          <Activity size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-cairo">حالة النظام</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo">
            {isLoading ? "جاري الفحص..." : isError || data?.status === 'error' ? "يوجد مشكلة في الاتصال" : "الأنظمة تعمل بكفاءة"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs font-cairo">
        {data && data.status !== 'error' && (
          <div className="flex flex-col items-end">
            <span className="text-slate-500">زمن الاستجابة</span>
            <span className="font-bold text-slate-900 dark:text-white">{data.latency}ms</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          {isLoading ? (
            <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
          ) : isError || data?.status === 'error' ? (
            <XCircle size={16} className="text-red-500" />
          ) : (
            <CheckCircle2 size={16} className="text-emerald-500" />
          )}
          <span className={cn("font-medium", isError || data?.status === 'error' ? "text-red-600" : "text-emerald-600")}>
            {isLoading ? "فحص" : isError || data?.status === 'error' ? "غير متصل" : "متصل"}
          </span>
        </div>
      </div>
    </div>
  );
}

function ActivityFeed() {
  const { data: listingsData, isLoading: listingsLoading } = useAdminListings(1, 5, "pending_review");
  const { data: usersData, isLoading: usersLoading } = useAdminUsers(1, 5);

  const activities = [
    ...(listingsData?.listings?.map(l => ({
      id: l.id,
      type: 'listing',
      title: `إعلان جديد: ${l.title}`,
      date: new Date(l.createdAt),
      icon: Clock,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10"
    })) || []),
    ...(usersData?.users?.map(u => ({
      id: u.id,
      type: 'user',
      title: `مستخدم جديد: ${u.name}`,
      date: new Date(u.createdAt),
      icon: UserPlus,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10"
    })) || [])
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-white font-cairo">أحدث النشاطات</h3>
      </div>
      <div className="p-2 flex-1">
        {listingsLoading || usersLoading ? (
          <div className="p-4 text-center text-sm text-slate-500 font-cairo">جاري التحميل...</div>
        ) : activities.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500 font-cairo">لا يوجد نشاطات حديثة</div>
        ) : (
          <div className="space-y-1">
            {activities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.type + activity.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", activity.color)}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white font-cairo truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-slate-500 font-cairo mt-0.5">
                      {formatDistanceToNow(activity.date, { addSuffix: true, locale: ar })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const locale = useLocale();
  const { data: stats, isLoading, error, refetch, isFetching } = useAdminStats();

  const quickLinks = [
    {
      title: "مراجعة الإعلانات المعلقة",
      description: "الإعلانات التي تنتظر الموافقة",
      href: `/${locale}/admin/listings`,
      icon: Building2,
      color: "amber" as const,
      count: stats?.pendingListings,
    },
    {
      title: "إدارة المستخدمين",
      description: "عرض وتعديل حسابات المستخدمين",
      href: `/${locale}/admin/users`,
      icon: Users,
      color: "blue" as const,
      count: stats?.totalUsers,
    },
    {
      title: "المستخدمون المحظورون",
      description: "إدارة قائمة الحظر",
      href: `/${locale}/admin/banned`,
      icon: ShieldBan,
      color: "red" as const,
      count: stats?.bannedUsers,
    },
    {
      title: "طلبات المعاينة",
      description: "متابعة طلبات المعاينة",
      href: `/${locale}/admin/requests`,
      icon: ClipboardList,
      color: "green" as const,
      count: stats?.pendingRequests,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-cairo">
            لوحة الإحصائيات
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-cairo">
            نظرة عامة على النظام
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-cairo disabled:opacity-60"
        >
          <RefreshCw size={15} className={cn(isFetching && "animate-spin")} />
          تحديث
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 font-cairo text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>فشل في تحميل الإحصائيات. تحقق من الاتصال بالخادم.</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المستخدمين"
          value={stats?.totalUsers}
          icon={Users}
          color="blue"
          href={`/${locale}/admin/users`}
        />
        <StatCard
          title="إجمالي الإعلانات"
          value={stats?.totalListings}
          icon={Building2}
          color="purple"
        />
        <StatCard
          title="إعلانات نشطة"
          value={stats?.activeListings}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="تحت المراجعة"
          value={stats?.pendingListings}
          icon={Clock}
          color="amber"
          href={`/${locale}/admin/listings`}
        />
        <StatCard
          title="إجمالي الطلبات"
          value={stats?.totalRequests}
          icon={ClipboardList}
          color="cyan"
          href={`/${locale}/admin/requests`}
        />
        <StatCard
          title="طلبات معلقة"
          value={stats?.pendingRequests}
          icon={AlertCircle}
          color="amber"
        />
        <StatCard
          title="محظورون"
          value={stats?.bannedUsers}
          icon={ShieldBan}
          color="red"
          href={`/${locale}/admin/banned`}
        />
        <StatCard
          title="معدل القبول"
          value={
            stats?.totalListings && stats.totalListings > 0
              ? Math.round((stats.activeListings / stats.totalListings) * 100)
              : 0
          }
          icon={TrendingUp}
          color="green"
          suffix="%"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Quick Links & Health) */}
        <div className="lg:col-span-2 space-y-6">
          <HealthCheckWidget />
          
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-cairo mb-3">
              روابط سريعة
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                const c = colorMap[link.color];
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", c.bg)}>
                      <Icon size={20} className={c.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white font-cairo">
                        {link.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo">
                        {link.description}
                      </p>
                    </div>
                    {link.count !== undefined && (
                      <span className={cn("px-2 py-0.5 rounded-lg text-xs font-bold font-cairo shrink-0", c.badge)}>
                        {link.count}
                      </span>
                    )}
                    <ArrowUpRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 shrink-0 transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (Activity Feed) */}
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
