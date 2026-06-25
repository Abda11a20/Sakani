// apps/frontend/src/app/[locale]/admin/users/page.tsx
"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import {
  Users, Shield, ShieldOff, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  AlertCircle, Loader2, UserCheck, UserX, Crown, Search, Ban, X, Eye,
  Phone, Mail, IdCard, Trash2, UserPlus, Lock,
} from "lucide-react";
import {
  useAdminUsers, useVerifyUser, useToggleUserStatus,
  useUpdateUserRole, useAdminDeleteUser, useBanUser, useIdCardUrl, useRegisterAdmin,
  type RegisterAdminPayload,
} from "@/hooks/useAdmin";
import { useAuthStore } from "@/store/auth.store";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { User } from "@/types";
import Image from "next/image";

// ── Brand color role badges ───────────────────────────────────────────────────
const roleBadge: Record<string, { label: string; className: string }> = {
  tenant: { label: "مستأجر", className: "bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-[#2E6BC4]/20 dark:text-[#7BAEE8]" },
  landlord: { label: "مُعلِن", className: "bg-[#D4A847]/15 text-[#C49535] dark:bg-[#D4A847]/20 dark:text-[#E8C06A]" },
  admin: { label: "أدمن", className: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" },
  super_admin: { label: "سوبر أدمن", className: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" },
};

// ── ID Card Viewer ────────────────────────────────────────────────────────────
function IdCardViewer({ userId, onClose }: { userId: string, onClose: () => void }) {
  const { data, isLoading, error } = useIdCardUrl(userId, true);
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
            <IdCard size={20} className="text-[#D4A847]" /> بطاقة الهوية
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-auto flex items-center justify-center min-h-[300px] bg-slate-50 dark:bg-slate-900/50 relative">
          {isLoading ? (
            <div className="flex flex-col items-center text-[#D4A847] gap-3">
              <Loader2 size={32} className="animate-spin" />
              <p className="text-sm font-cairo font-medium text-slate-600">جاري جلب الرابط الآمن...</p>
            </div>
          ) : error || !data?.url ? (
            <div className="flex flex-col items-center text-red-500 gap-2">
              <AlertCircle size={32} />
              <p className="text-sm font-cairo text-slate-600">فشل في تحميل الصورة أو أنها غير متوفرة</p>
            </div>
          ) : (
            <div className="relative w-full h-[400px]">
              <Image src={data.url} alt="ID Card" fill className="object-contain" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Create Admin Modal ────────────────────────────────────────────────────────
function CreateAdminModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const { mutate: registerAdmin, isPending } = useRegisterAdmin();
  const [form, setForm] = useState<RegisterAdminPayload>({
    name: "", phone: "", email: "", password: "",
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D4A847]/20 flex items-center justify-center">
              <UserPlus size={18} className="text-[#D4A847]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-cairo">إضافة مسؤول جديد</h3>
              <p className="text-xs text-slate-400 font-cairo">يتم إنشاؤه بصلاحيات Admin</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo uppercase">الاسم</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="محمد أحمد"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-cairo focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo uppercase">البريد الإلكتروني</label>
            <div className="relative">
              <Mail size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="admin@sakany.com"
                className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-cairo focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]" dir="ltr" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo uppercase">رقم الهاتف</label>
            <div className="relative">
              <Phone size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="01xxxxxxxxx"
                className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-cairo focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]" dir="ltr" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo uppercase">كلمة المرور</label>
            <div className="relative">
              <Lock size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="8 أحرف على الأقل"
                className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-cairo focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold font-cairo text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #1B4F8A 0%, #2E6BC4 100%)" }}
            >
              {isPending ? <><Loader2 size={16} className="animate-spin" /> جاري الإنشاء...</> : <><UserPlus size={16} /> إنشاء الحساب</>}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold font-cairo bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.role === "super_admin";

  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");
  const [isVerifiedFilter, setIsVerifiedFilter] = useState<string>("all");

  const [roleModal, setRoleModal] = useState<{ id: string; name: string; currentRole: string } | null>(null);
  const [newRole, setNewRole] = useState<string>("tenant");
  const [banModal, setBanModal] = useState<{ id: string; name: string; phone?: string; nationalId?: string } | null>(null);
  const [banReason, setBanReason] = useState("");

  const [selectedUser, setSelectedUser] = useState<Omit<User, "nationalIdEnc"> | null>(null);
  const [idCardViewer, setIdCardViewer] = useState<string | null>(null);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);

  const { data, isLoading, error } = useAdminUsers(page, 10, roleFilter, searchQuery, isActiveFilter, isVerifiedFilter);
  const verifyMutation = useVerifyUser();
  const toggleMutation = useToggleUserStatus();
  const roleMutation = useUpdateUserRole();
  const deleteMutation = useAdminDeleteUser();
  const banMutation = useBanUser();

  const handleVerify = async (id: string) => {
    try {
      await verifyMutation.mutateAsync(id);
      toast({ type: "success", description: "تم التحقق من المستخدم بنجاح" });
    } catch {
      toast({ type: "error", description: "فشل في التحقق من المستخدم" });
    }
  };

  const handleToggle = async (id: string, name: string) => {
    try {
      await toggleMutation.mutateAsync(id);
      toast({ type: "success", description: `تم تغيير حالة ${name}` });
    } catch {
      toast({ type: "error", description: "فشل في تغيير الحالة" });
    }
  };

  const handleRoleUpdate = async () => {
    if (!roleModal) return;
    try {
      await roleMutation.mutateAsync({
        userId: roleModal.id,
        payload: { role: newRole as "tenant" | "landlord" | "admin" },
      });
      toast({ type: "success", description: `تم تغيير دور ${roleModal.name}` });
      setRoleModal(null);
    } catch {
      toast({ type: "error", description: "فشل في تغيير الدور" });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف مستخدم "${name}" نهائياً؟`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ type: "success", description: `تم حذف ${name}` });
      setSelectedUser(null);
    } catch {
      toast({ type: "error", description: "فشل في حذف المستخدم" });
    }
  };

  const handleBan = async () => {
    if (!banModal) return;
    if (!banReason.trim()) {
      toast({ type: "error", description: "الرجاء إدخال سبب الحظر" });
      return;
    }
    try {
      await banMutation.mutateAsync({
        nationalIdHash: banModal.nationalId || undefined,
        phone: banModal.phone || undefined,
        reason: banReason,
      });
      toast({ type: "success", description: `تم حظر ${banModal.name} بنجاح` });
      setBanModal(null);
      setBanReason("");
      setSelectedUser(null);
    } catch {
      toast({ type: "error", description: "فشل في حظر المستخدم" });
    }
  };

  const users = data?.users ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6 relative overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-cairo">
            إدارة المستخدمين
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-cairo">
            {meta ? `${meta.total} مستخدم` : "جاري التحميل..."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Create Admin Button — super_admin only */}
          {isSuperAdmin && (
            <button
              onClick={() => setShowCreateAdmin(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold font-cairo text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}
            >
              <UserPlus size={16} className="text-[#D4A847]" />
              إضافة مسؤول
            </button>
          )}

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الهاتف أو البريد..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="ps-9 pe-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-cairo focus:outline-none focus:ring-2 focus:ring-[#1B4F8A] min-w-[250px]"
            />
          </div>

          {/* Filters */}
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-cairo focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
          >
            <option value="all">جميع الأدوار</option>
            <option value="tenant">مستأجر</option>
            <option value="landlord">مُعلِن</option>
            <option value="admin">أدمن</option>
          </select>
          <select
            value={isActiveFilter}
            onChange={(e) => { setIsActiveFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-cairo focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
          >
            <option value="all">الحالة: الكل</option>
            <option value="true">نشط</option>
            <option value="false">موقوف</option>
          </select>
          <select
            value={isVerifiedFilter}
            onChange={(e) => { setIsVerifiedFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-cairo focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
          >
            <option value="all">التحقق: الكل</option>
            <option value="true">محقق</option>
            <option value="false">غير محقق</option>
          </select>
        </div>
      </div>

      {/* States */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-[#1B4F8A]" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 font-cairo text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>فشل في تحميل المستخدمين</span>
        </div>
      )}

      {/* Users Table */}
      {!isLoading && !error && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users size={32} className="text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-cairo">لا يوجد مستخدمون مطابقون</p>
            </div>
          ) : (
            <div className="min-w-[800px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                    <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">المستخدم</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">الدور</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">الحالة</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">الإجراءات السريعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {users.map((user) => {
                    const badge = roleBadge[user.role] ?? roleBadge.tenant;
                    const isActive = (user as Record<string, unknown>).isActive !== false;
                    const isVerified = user.emailVerifiedAt !== null;

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm font-cairo shrink-0"
                              style={{ background: "linear-gradient(135deg, #1B4F8A 0%, #2E6BC4 100%)" }}>
                              {user.name?.charAt(0)}
                            </div>
                            <div>
                              <p
                                className="text-sm font-semibold text-slate-900 dark:text-white font-cairo hover:text-[#1B4F8A] dark:hover:text-[#7BAEE8] cursor-pointer transition-colors"
                                onClick={() => setSelectedUser(user)}
                              >
                                {user.name}
                              </p>
                              <p className="text-xs text-slate-400 font-cairo">{user.email ?? user.phone ?? "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-0.5 rounded-lg text-xs font-bold font-cairo", badge.className)}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {isActive ? (
                              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-cairo font-medium" title="حساب نشط">
                                <CheckCircle2 size={13} /> نشط
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-cairo font-medium" title="حساب موقوف">
                                <XCircle size={13} /> موقوف
                              </span>
                            )}
                            {isVerified ? (
                              <span className="flex items-center gap-1 text-xs text-[#1B4F8A] dark:text-[#7BAEE8] font-cairo font-medium" title="البريد محقق">
                                <Shield size={13} /> محقق
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-red-500 font-cairo font-medium" title="غير محقق">
                                <ShieldOff size={13} /> غير محقق
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="px-2 py-1.5 rounded-lg text-xs font-bold font-cairo bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#1B4F8A] hover:text-white dark:hover:bg-[#1B4F8A] transition-all flex items-center gap-1"
                            >
                              <Eye size={13} /> التفاصيل
                            </button>
                            <button
                              onClick={() => setBanModal({ id: user.id, name: user.name, phone: user.phone, nationalId: (user as any).nationalId })}
                              disabled={banMutation.isPending || user.role === "super_admin"}
                              className="px-2 py-1.5 rounded-lg text-xs font-bold font-cairo bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center gap-1 disabled:opacity-50"
                            >
                              <Ban size={13} /> حظر
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.lastPage > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 disabled:opacity-40 transition-all"
          >
            {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <span className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium font-cairo text-slate-700 dark:text-slate-300">
            {page} / {meta.lastPage}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
            disabled={page === meta.lastPage}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 disabled:opacity-40 transition-all"
          >
            {isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      )}

      {/* User Details Drawer */}
      {selectedUser && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelectedUser(null)} />
          <div className={cn(
            "fixed top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 border-s border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 transform",
            isRtl ? "left-0 translate-x-0" : "right-0 translate-x-0"
          )}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
                <UserCheck size={20} className="text-[#1B4F8A]" /> تفاصيل المستخدم
              </h3>
              <button onClick={() => setSelectedUser(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl font-cairo shadow-md"
                  style={{ background: "linear-gradient(135deg, #1B4F8A 0%, #2E6BC4 100%)" }}>
                  {selectedUser.name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white font-cairo">{selectedUser.name}</h2>
                  <span className={cn("inline-block mt-1 px-2.5 py-0.5 rounded-lg text-xs font-bold font-cairo", roleBadge[selectedUser.role]?.className || roleBadge.tenant.className)}>
                    {roleBadge[selectedUser.role]?.label}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-3 border border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 font-cairo uppercase mb-2">معلومات الاتصال</h4>
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 font-cairo">{selectedUser.email || "غير متوفر"}</span>
                  {selectedUser.emailVerifiedAt && <Shield size={14} className="text-[#1B4F8A] ms-auto" />}
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 font-cairo" dir="ltr">{selectedUser.phone || "غير متوفر"}</span>
                </div>
                {(selectedUser as any).nationalId && (
                  <div className="flex items-center gap-3">
                    <IdCard size={16} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 font-cairo" dir="ltr">{(selectedUser as any).nationalId}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 font-cairo uppercase mb-2">إجراءات الإدارة</h4>

                {selectedUser.role === 'landlord' && (
                  <button
                    onClick={() => setIdCardViewer(selectedUser.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold font-cairo bg-[#D4A847]/10 dark:bg-[#D4A847]/20 text-[#C49535] dark:text-[#E8C06A] hover:bg-[#D4A847]/20 transition-colors border border-[#D4A847]/30 mb-2"
                  >
                    <IdCard size={16} /> عرض بطاقة الهوية
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {!(selectedUser.emailVerifiedAt) && (
                    <button
                      onClick={() => handleVerify(selectedUser.id)}
                      disabled={verifyMutation.isPending}
                      className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold font-cairo bg-[#1B4F8A]/10 text-[#1B4F8A] hover:bg-[#1B4F8A]/20 dark:text-[#7BAEE8] transition-colors"
                    >
                      <UserCheck size={14} /> توثيق الحساب
                    </button>
                  )}
                  <button
                    onClick={() => handleToggle(selectedUser.id, selectedUser.name)}
                    disabled={toggleMutation.isPending}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold font-cairo bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                  >
                    {(selectedUser as any).isActive !== false ? <><UserX size={14} /> إيقاف مؤقت</> : <><UserCheck size={14} /> تفعيل</>}
                  </button>
                  {selectedUser.role !== "super_admin" && isSuperAdmin && (
                    <button
                      onClick={() => {
                        setRoleModal({ id: selectedUser.id, name: selectedUser.name, currentRole: selectedUser.role });
                        setNewRole(selectedUser.role);
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold font-cairo bg-[#D4A847]/10 text-[#C49535] hover:bg-[#D4A847]/20 dark:text-[#E8C06A] transition-colors"
                    >
                      <Crown size={14} /> تغيير الدور
                    </button>
                  )}
                  <button
                    onClick={() => setBanModal({ id: selectedUser.id, name: selectedUser.name, phone: selectedUser.phone, nationalId: (selectedUser as any).nationalId })}
                    disabled={selectedUser.role === "super_admin"}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold font-cairo bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <Ban size={14} /> حظر
                  </button>
                  {selectedUser.role !== "super_admin" && (
                    <button
                      onClick={() => handleDelete(selectedUser.id, selectedUser.name)}
                      disabled={deleteMutation.isPending}
                      className="col-span-2 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold font-cairo bg-white border border-red-200 text-red-500 hover:bg-red-50 transition-colors mt-2"
                    >
                      <Trash2 size={14} /> حذف المستخدم نهائياً
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Role Change Modal */}
      {roleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-cairo">تغيير دور المستخدم</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo">{roleModal.name}</p>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-cairo focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
            >
              <option value="tenant">مستأجر</option>
              <option value="landlord">مُعلِن</option>
              <option value="admin">أدمن</option>
            </select>
            <div className="flex gap-3">
              <button
                onClick={handleRoleUpdate}
                disabled={roleMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium font-cairo text-white transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #1B4F8A 0%, #2E6BC4 100%)" }}
              >
                {roleMutation.isPending ? "جاري الحفظ..." : "حفظ"}
              </button>
              <button
                onClick={() => setRoleModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium font-cairo bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {banModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-lg font-bold text-red-600 font-cairo flex items-center gap-2">
              <Ban size={20} /> حظر المستخدم
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-cairo">
              سيتم حظر المستخدم <b>{banModal.name}</b> وإضافته إلى القائمة السوداء.
            </p>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
              {banModal.nationalId && (
                <div className="flex items-center justify-between text-sm font-cairo">
                  <span className="text-slate-500">الرقم القومي:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{banModal.nationalId}</span>
                </div>
              )}
              {banModal.phone && (
                <div className="flex items-center justify-between text-sm font-cairo">
                  <span className="text-slate-500">رقم الهاتف:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200" dir="ltr">{banModal.phone}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 font-cairo mb-1.5">
                سبب الحظر (إجباري) <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="أدخل سبب الحظر بوضوح..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white font-cairo placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleBan}
                disabled={banMutation.isPending || !banReason.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium font-cairo bg-red-500 hover:bg-red-600 text-white transition-all disabled:opacity-60"
              >
                {banMutation.isPending ? "جاري الحظر..." : "تأكيد الحظر"}
              </button>
              <button
                onClick={() => { setBanModal(null); setBanReason(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium font-cairo bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ID Card Viewer */}
      {idCardViewer && (
        <IdCardViewer userId={idCardViewer} onClose={() => setIdCardViewer(null)} />
      )}

      {/* Create Admin Modal */}
      {showCreateAdmin && (
        <CreateAdminModal onClose={() => setShowCreateAdmin(false)} />
      )}
    </div>
  );
}
