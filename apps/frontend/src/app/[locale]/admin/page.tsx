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
  AlertCircle,
  Archive,
  UserPlus,
  MessageCircle,
  ShieldAlert,
  Server,
  Database,
  X,
  Loader2,
  Lock,
  Mail,
  Phone,
} from "lucide-react";
import {
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
import { useDashboardSummary } from "@/features/dashboard";
import { DynamicHeaderSection } from "@/features/dashboard";
import { UrgentBannerSection } from "@/features/dashboard";
import { QuickActionsSection } from "@/features/dashboard";
import { StatsSection } from "@/features/dashboard";
import { ActivitySection } from "@/features/dashboard";

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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden font-cairo">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل</label>
            <div className="relative">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="أحمد علي"
                className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-all"
              />
              <Users size={16} className="absolute right-3 top-3 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
            <div className="relative">
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="01012345678"
                className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-all"
              />
              <Phone size={16} className="absolute right-3 top-3 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@sakani.com"
                className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-all"
              />
              <Mail size={16} className="absolute right-3 top-3 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور</label>
            <div className="relative">
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-all"
              />
              <Lock size={16} className="absolute right-3 top-3 text-slate-400" />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-60"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              <span>حفظ المسوق/المسؤول</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Admin Dashboard Page ──────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [showCreateAdmin, setShowCreateAdmin] = useState(false);

  // Queries
  const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary, isFetching: summaryFetching } = useDashboardSummary("admin");
  const { data: health, isError: healthError, refetch: refetchHealth } = useHealthCheck();

  const handleRefresh = async () => {
    await Promise.allSettled([refetchSummary(), refetchHealth()]);
  };

  const isFetchingAny = summaryFetching;
  const summaryStats = summary?.stats || {};
  const urgentItems = summary?.urgent || [];
  const quickActions = summary?.quickActions || ["MODERATE_PENDING_LISTINGS", "REVIEW_REPORTED_USERS"];

  return (
    <div className="space-y-6 font-cairo" dir={isRtl ? "rtl" : "ltr"}>
      {/* 1. Dynamic Personalized Header */}
      <DynamicHeaderSection
        userName="المدير المسؤول"
        lastUpdatedAt={summary?.lastUpdatedAt}
        onRefresh={handleRefresh}
        isRefreshing={isFetchingAny}
      />

      {/* 2. Admin Action Center Queue Banners */}
      <UrgentBannerSection items={urgentItems} />

      {/* 3. Dynamic Quick Actions (Enum-Driven) */}
      <QuickActionsSection actionKeys={quickActions} role="admin" />

      {/* 4. Platform Statistics */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">
          {isRtl ? "إحصائيات المنصة الكلية" : "Platform Statistics"}
        </h3>
        <StatsSection stats={summaryStats} role="admin" />
      </div>

      {/* 5. System Health Status Card & Add Admin Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${healthError ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">حالة السيرفر وقاعدة البيانات</h4>
              <p className="text-xs text-slate-500">
                {healthError ? "تعذر الاتصال بـ Backend API" : "جميع الأنظمة وقاعدة البيانات تعمل بنجاح (Health OK)"}
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${healthError ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
            {healthError ? "خطأ" : "نشط"}
          </span>
        </div>

        <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-bold">تسجيل مسؤول جديد (Admin)</h4>
            <p className="text-xs text-slate-400">إضافة مسؤول جديد بصلاحيات إدارة المنصة الكاملة</p>
          </div>
          <button
            onClick={() => setShowCreateAdmin(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
          >
            إضافة مسؤول
          </button>
        </div>
      </div>

      {/* 6. Recent System Events Audit Timeline */}
      <ActivitySection userRole="admin" limit={8} />

      {/* Create Admin Modal */}
      {showCreateAdmin && <CreateAdminModal onClose={() => setShowCreateAdmin(false)} />}
    </div>
  );
}
