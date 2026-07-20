// apps/frontend/src/app/[locale]/admin/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Users,
  Building2,
  Clock,
  CheckCircle2,
  ClipboardList,
  AlertCircle,
  ArrowUpRight,
  RefreshCw,
  Archive,
  Activity,
  XCircle,
  UserPlus,
  MessageCircle,
  ShieldAlert,
  Server,
  Database,
  Sparkles,
  X,
  Loader2,
  Lock,
  Mail,
  Phone,
} from "lucide-react";
import {
  useAdminStats,
  useHealthCheck,
  useAdminListings,
  useAdminUsers,
  useAdminRequests,
  useRegisterAdmin,
  type RegisterAdminPayload,
} from "@/hooks/useAdmin";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Spinner } from "@/components/ui/spinner";

// ── Stat Card Component ──────────────────────────────────────────────────────

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
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    icon: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-100 dark:bg-blue-900/30 text-blue-750 dark:text-blue-300",
    hoverBg: "hover:border-blue-300 dark:hover:border-blue-800",
  },
  green: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    icon: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-750 dark:text-emerald-300",
    hoverBg: "hover:border-emerald-300 dark:hover:border-emerald-800",
  },
  amber: {
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    icon: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-750 dark:text-amber-300",
    hoverBg: "hover:border-amber-300 dark:hover:border-amber-800",
  },
  red: {
    bg: "bg-red-500/10 dark:bg-red-500/20",
    icon: "text-red-600 dark:text-red-400",
    badge: "bg-red-100 dark:bg-red-900/30 text-red-750 dark:text-red-300",
    hoverBg: "hover:border-red-300 dark:hover:border-red-800",
  },
  purple: {
    bg: "bg-purple-500/10 dark:bg-purple-500/20",
    icon: "text-purple-600 dark:text-purple-400",
    badge: "bg-purple-100 dark:bg-purple-900/30 text-purple-750 dark:text-purple-300",
    hoverBg: "hover:border-purple-300 dark:hover:border-purple-800",
  },
  cyan: {
    bg: "bg-cyan-500/10 dark:bg-cyan-500/20",
    icon: "text-cyan-600 dark:text-cyan-400",
    badge: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-750 dark:text-cyan-300",
    hoverBg: "hover:border-cyan-300 dark:hover:border-cyan-800",
  },
};

function StatCard({ title, value, icon: Icon, color, href, suffix }: StatCardProps) {
  const c = colorMap[color];

  const card = (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-200 group flex items-center justify-between",
        c.hoverBg,
        href && "cursor-pointer hover:shadow-md hover:-translate-y-0.5"
      )}
    >
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-cairo">
          {title}
        </p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white font-sans tracking-tight">
          {value !== undefined ? value.toLocaleString("en-US") : "—"}
          {suffix && <span className="text-sm font-medium text-slate-450 ms-0.5">{suffix}</span>}
        </p>
      </div>
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-250 group-hover:scale-105", c.bg)}>
        <Icon size={22} className={c.icon} />
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{card}</Link>;
  }
  return card;
}

// ── Create Admin Modal Component ─────────────────────────────────────────────

function CreateAdminModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const { mutate: registerAdmin, isPending } = useRegisterAdmin();
  const [form, setForm] = useState<RegisterAdminPayload>({
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email || !form.password) {
      toast({ type: "error", description: "يرجى تعبئة جميع الحقول" });
      return;
    }
    if (form.password.length < 8) {
      toast({ type: "error", description: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" });
      return;
    }
    registerAdmin(form, {
      onSuccess: () => {
        toast({ type: "success", description: "تم إنشاء حساب الأدمن بنجاح" });
        onClose();
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "فشل في إنشاء الحساب";
        toast({ type: "error", description: msg });
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden font-cairo">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <UserPlus size={18} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">إضافة مسؤول جديد</h3>
              <p className="text-xs text-slate-400">يتم إنشاؤه بصلاحيات Admin</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">الاسم</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="محمد أحمد"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">البريد الإلكتروني</label>
            <div className="relative">
              <Mail size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="admin@sakany.com"
                className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]" dir="ltr" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">رقم الهاتف</label>
            <div className="relative">
              <Phone size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="01xxxxxxxxx"
                className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]" dir="ltr" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">كلمة المرور</label>
            <div className="relative">
              <Lock size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="8 أحرف على الأقل"
                className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #1B4F8A 0%, #2E6BC4 100%)" }}
            >
              {isPending ? <><Loader2 size={16} className="animate-spin" /> جاري الإنشاء...</> : <><UserPlus size={16} /> إنشاء الحساب</>}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-750 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page Redesign ────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const dateLocale = isRtl ? ar : enUS;

  const [showCreateAdmin, setShowCreateAdmin] = useState(false);

  // Queries
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats, isFetching: statsFetching } = useAdminStats();
  const { data: health, isError: healthError, refetch: refetchHealth } = useHealthCheck();
  
  // Platform overview queries
  const { data: listingsData, isLoading: listingsLoading, refetch: refetchListings } = useAdminListings(1, 5);
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useAdminUsers(1, 5);
  const { refetch: refetchRequests } = useAdminRequests(1, 5);

  const handleRefresh = async () => {
    await Promise.allSettled([
      refetchStats(),
      refetchHealth(),
      refetchListings(),
      refetchUsers(),
      refetchRequests(),
    ]);
  };

  const isFetchingAny = statsFetching;

  // Hero Stats List (6 metrics strictly using existing stats endpoints)
  const heroStats = [
    { title: "إجمالي المستخدمين", value: stats?.totalUsers, icon: Users, color: "blue" as const, href: `/${locale}/admin/users` },
    { title: "إجمالي الإعلانات", value: stats?.totalListings, icon: Building2, color: "purple" as const },
    { title: "الإعلانات النشطة", value: stats?.activeListings, icon: CheckCircle2, color: "green" as const },
    { title: "الإعلانات المؤرشفة", value: stats?.archivedListings, icon: Archive, color: "red" as const, href: `/${locale}/admin/deleted-advertisements` },
    { title: "تحت المراجعة", value: stats?.pendingListings, icon: Clock, color: "amber" as const, href: `/${locale}/admin/listings` },
    { title: "طلبات معلقة", value: stats?.pendingRequests, icon: AlertCircle, color: "cyan" as const, href: `/${locale}/admin/requests` },
  ];

  // Quick Actions Config (navigation only to existing pages)
  const quickActions = [
    { title: "مراجعة الإعلانات", desc: "الإعلانات المعلقة قيد المراجعة", href: `/${locale}/admin/listings`, icon: Building2, color: "amber" },
    { title: "توثيق الهويات", desc: "مراجعة وثائق الهوية للمستخدمين", href: `/${locale}/admin/users`, icon: Users, color: "blue" },
    { title: "إعلانات مؤرشفة", desc: "سجل الإعلانات المحذوفة والأرشيف", href: `/${locale}/admin/deleted-advertisements`, icon: Archive, color: "red" },
    { title: "إدارة المستخدمين", desc: "تعديل حسابات وأدوار الأعضاء", href: `/${locale}/admin/users`, icon: UserPlus, color: "purple" },
    { title: "طلبات المعاينة", desc: "جدولة مواعيد المعاينة ومتابعتها", href: `/${locale}/admin/requests`, icon: ClipboardList, color: "green" },
    { title: "رسائل الدعم", desc: "شات الدعم الفني المباشر للمنصة", href: `/${locale}/admin/chat`, icon: MessageCircle, color: "cyan" },
  ];

  // Recent Activity merging (Sorted by date)
  const activities = [
    ...(listingsData?.listings?.slice(0, 5).map((l) => ({
      id: l.id,
      type: "listing",
      title: `إعلان جديد: ${l.title}`,
      date: new Date(l.createdAt),
      icon: Clock,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10",
    })) || []),
    ...(usersData?.users?.slice(0, 5).map((u) => ({
      id: u.id,
      type: "user",
      title: `مستخدم جديد: ${u.name}`,
      date: new Date(u.createdAt),
      icon: UserPlus,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
    })) || []),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 font-cairo" dir={isRtl ? "rtl" : "ltr"}>
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            مركز التحكم والإدارة
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            اللوحة الإدارية للتحكم بالمنصة ومتابعة المؤشرات الرئيسية
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isFetchingAny}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-60 shadow-sm"
        >
          <RefreshCw size={15} className={cn(isFetchingAny && "animate-spin")} />
          <span>تحديث البيانات</span>
        </button>
      </div>

      {/* ── Error Notification ────────────────────────────────────────────────── */}
      {statsError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          <ShieldAlert size={18} className="shrink-0" />
          <span>فشل تحميل الإحصائيات الفورية. يرجى التحقق من اتصال قاعدة البيانات.</span>
        </div>
      )}

      {/* ── SECTION 1: HERO STATS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {heroStats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            href={stat.href}
          />
        ))}
      </div>

      {/* ── Two-Column Main Layout Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: 2/3 width on Large screen */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECTION 2: QUICK ACTIONS */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={16} className="text-[#D4A847]" />
              الوصول السريع والمهام
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {quickActions.map((act) => {
                const Icon = act.icon;
                const c = colorMap[act.color as keyof typeof colorMap] || colorMap.blue;
                return (
                  <Link
                    key={act.title}
                    href={act.href}
                    className="flex flex-col p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mb-3", c.bg)}>
                      <Icon size={18} className={c.icon} />
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5 flex items-center justify-between">
                      {act.title}
                      <ArrowUpRight size={14} className="text-slate-350 dark:text-slate-600 group-hover:text-slate-500 shrink-0 transition-colors" />
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                      {act.desc}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: PLATFORM OVERVIEW */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                نظرة شاملة على المنصة
              </h2>
            </div>
            
            <div className="p-5 space-y-6">
              {/* Tab 1: Newest Listings */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">أحدث الإعلانات المضافة</h3>
                {listingsLoading ? (
                  <div className="flex items-center justify-center py-6"><Spinner size="sm" /></div>
                ) : !listingsData?.listings?.length ? (
                  <p className="text-xs text-slate-500 text-center py-4">لا توجد إعلانات مسجلة</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-450 dark:text-slate-500">
                          <th className="py-2 text-start font-semibold">العنوان</th>
                          <th className="py-2 text-start font-semibold">الموقع</th>
                          <th className="py-2 text-start font-semibold">السعر</th>
                          <th className="py-2 text-start font-semibold">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-350">
                        {listingsData.listings.slice(0, 5).map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                            <td className="py-2 font-medium text-slate-900 dark:text-white max-w-[150px] truncate">{l.title}</td>
                            <td className="py-2">{l.governorate} · {l.district}</td>
                            <td className="py-2">{l.price.toLocaleString()} ج.م</td>
                            <td className="py-2">
                              <span className={cn(
                                "px-2 py-0.5 rounded-lg font-semibold font-cairo shrink-0 text-[10px]",
                                l.status === "active" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" :
                                l.status === "pending_review" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" :
                                "bg-slate-100 dark:bg-slate-800 text-slate-650"
                              )}>
                                {l.status === "active" ? "نشط" : l.status === "pending_review" ? "قيد المراجعة" : "أخرى"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Tab 2: Newest Users */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">أحدث المستخدمين المسجلين</h3>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-6"><Spinner size="sm" /></div>
                ) : !usersData?.users?.length ? (
                  <p className="text-xs text-slate-500 text-center py-4">لا يوجد مستخدمون حالياً</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-450 dark:text-slate-500">
                          <th className="py-2 text-start font-semibold">المستخدم</th>
                          <th className="py-2 text-center font-semibold">الهاتف</th>
                          <th className="py-2 text-center font-semibold">الدور</th>
                          <th className="py-2 text-center font-semibold">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-350">
                        {usersData.users.slice(0, 5).map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                            <td className="py-2 font-medium text-slate-900 dark:text-white">{u.name}</td>
                            <td className="py-2 text-center" dir="ltr">{u.phone}</td>
                            <td className="py-2 text-center">
                              <span className={cn(
                                "px-2 py-0.5 rounded-lg text-[10px] font-bold font-cairo inline-block",
                                u.role === "landlord" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                              )}>
                                {u.role === "landlord" ? "مُعلن" : "مستأجر"}
                              </span>
                            </td>
                            <td className="py-2 text-center text-slate-500">
                              {u.isActive ? "نشط" : "موقوف"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: 1/3 width on Large screen */}
        <div className="space-y-6">
          
          {/* SECTION 5: SYSTEM STATUS */}
          {health && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <Server size={15} className="text-emerald-500" />
                حالة الاتصال والخدمات
              </h3>
              <div className="space-y-2">
                {/* API Status */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">بوابة الـ API الرئيسي</span>
                  <span className="flex items-center gap-1.5">
                    {healthError ? (
                      <>
                        <XCircle size={14} className="text-red-500" />
                        <span className="font-bold text-red-650">غير متصل</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span className="font-bold text-emerald-650">متصل ({health.latency}ms)</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Database Connection */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Database size={13} className="text-slate-400" />
                    قاعدة البيانات السحابية
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350">
                    {statsLoading ? "..." : statsError ? "خطأ اتصال" : "نشطة"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: RECENT ACTIVITY */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Activity size={16} className="text-blue-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">تغذية النشاطات الأخيرة</h3>
            </div>
            <div className="p-3">
              {listingsLoading || usersLoading ? (
                <div className="p-4 text-center text-xs text-slate-450"><Spinner size="sm" /></div>
              ) : activities.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-450">لا يوجد نشاطات حديثة</div>
              ) : (
                <div className="relative border-s border-slate-100 dark:border-slate-800 ms-3 space-y-4 py-1">
                  {activities.map((act) => {
                    const Icon = act.icon;
                    return (
                      <div key={act.id} className="relative ps-5">
                        {/* Dot indicator */}
                        <div className={cn("absolute -start-3 top-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white dark:border-slate-900", act.color)}>
                          <Icon size={12} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                            {act.title}
                          </p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-sans mt-0.5">
                            {formatDistanceToNow(act.date, { addSuffix: true, locale: dateLocale })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 6: ADMIN SHORTCUTS */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">إجراءات واختصارات سريعة</h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowCreateAdmin(true)}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <UserPlus size={15} />
                <span>تسجيل مسؤول (Admin) جديد</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ── Create Admin Modal Render ────────────────────────────────────────── */}
      {showCreateAdmin && (
        <CreateAdminModal onClose={() => setShowCreateAdmin(false)} />
      )}
    </div>
  );
}
