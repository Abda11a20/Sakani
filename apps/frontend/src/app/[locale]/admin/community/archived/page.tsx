// apps/frontend/src/app/[locale]/admin/community/archived/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Search,
  RefreshCw,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ShieldAlert,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminRepository } from "@/features/admin";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ArchivedPost {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "ARCHIVED" | "CANCELLED" | "BLOCKED";
  eventDate: string;
  timeSlot: string;
  maxParticipants: number;
  genderPreference: "MALES_ONLY" | "FEMALES_ONLY" | "ALL";
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  category: { id: string; nameAr: string; nameEn: string; icon: string };
  user: { id: string; name: string; email: string; avatarUrl?: string | null; role: string };
  _count: { participants: number; reports: number };
}

type TabType = "all" | "expired" | "deleted";

// ── Confirm Dialog ─────────────────────────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-cairo">
      <div className="bg-surface rounded-2xl shadow-xl border border-border max-w-sm w-full p-6 space-y-4">
        <h3 className="font-bold text-text text-sm">{title}</h3>
        <p className="text-xs text-text-secondary">{description}</p>
        <div className="flex gap-2 pt-2">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              confirmClass || "bg-primary hover:bg-primary-hover text-white"
            )}
          >
            {loading ? "جاري التنفيذ..." : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2 rounded-xl text-xs font-bold bg-surface-tertiary hover:bg-surface-secondary text-text-secondary transition-all cursor-pointer border border-border"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AdminArchivedCommunityPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [posts, setPosts] = useState<ArchivedPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 12;
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<ArchivedPost | null>(null);
  const [selectedModalPost, setSelectedModalPost] = useState<ArchivedPost | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const totalPages = Math.ceil(total / limit);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminRepository.getArchivedCommunityPosts({
        page,
        limit,
        type: activeTab,
        ...(search ? { search } : {}),
      });
      const payload = res.data ?? res;
      setPosts(payload.posts ?? res.posts ?? []);
      setTotal(payload.total ?? res.total ?? 0);
    } catch {
      setError("فشل تحميل البيانات. يرجى المحاولة مجدداً.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, activeTab, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-clear success messages
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setActionLoading(true);
    try {
      await adminRepository.restoreCommunityPost(restoreTarget.id);
      setSuccessMsg(`تمت إعادة تفعيل/استعادة فعالية "${restoreTarget.title}" بنجاح.`);
      setRestoreTarget(null);
      setSelectedModalPost(null);
      fetchData();
    } catch {
      setError("فشل استعادة الفعالية. يرجى المحاولة مجدداً.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4 font-cairo">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-3 border-slate-200">
        <h1 className="text-xl font-extrabold text-slate-900 font-cairo flex items-center gap-2">
          أرشيف الفعاليات (المنتهية والمحذوفة)
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/${locale}/admin/banned-words`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0EA5E9] hover:bg-[#0284C7] text-white transition-all shadow-sm font-cairo"
          >
            <ShieldAlert size={14} />
            إدارة الكلمات المحظورة
          </Link>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm text-slate-700 shrink-0 font-cairo"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            تحديث
          </button>
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => { setActiveTab("all"); setPage(1); }}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all font-cairo",
              activeTab === "all"
                ? "bg-[#0EA5E9] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            )}
          >
            الكل (الأرشيف الكامل)
          </button>
          <button
            onClick={() => { setActiveTab("expired"); setPage(1); }}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all font-cairo",
              activeTab === "expired"
                ? "bg-[#0EA5E9] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            )}
          >
            الفعاليات المنتهية (تلقائياً)
          </button>
          <button
            onClick={() => { setActiveTab("deleted"); setPage(1); }}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all font-cairo",
              activeTab === "deleted"
                ? "bg-[#0EA5E9] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            )}
          >
            الفعاليات المحذوفة مؤقتاً
          </button>
        </div>

        <span className="text-xs font-bold text-slate-500 font-cairo bg-slate-100 px-3 py-1 rounded-xl">
          إجمالي القسم: {total}
        </span>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold font-cairo">
          <CheckCircle2 size={14} className="shrink-0" />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold font-cairo">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 font-cairo">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            style={{ [isRtl ? "right" : "left"]: "12px" }}
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="بحث بالعنوان أو اسم الفعالية..."
            className={cn(
              "w-full h-10 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/30 transition-all font-cairo",
              isRtl ? "pr-9 pl-3" : "pl-9 pr-3"
            )}
          />
        </div>
        <button
          type="submit"
          className="px-5 h-10 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-bold transition-colors shadow-sm font-cairo"
        >
          بحث
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
            className="px-3.5 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors font-cairo"
          >
            مسح
          </button>
        )}
      </form>

      {/* 2-COLUMN STRICT GRID LAYOUT FOR CARDS */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-4 border-[#0EA5E9] border-t-transparent rounded-full" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 text-center py-16 text-slate-400 text-xs font-bold font-cairo">
          {search ? "لا توجد نتائج مطابقة للبحث" : "لا توجد فعاليات في هذا القسم حالياً"}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => setSelectedModalPost(post)}
              className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold font-cairo truncate max-w-[90px]">
                    {post.category?.icon} {isRtl ? post.category?.nameAr : post.category?.nameEn}
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold font-cairo shrink-0",
                      post.isDeleted
                        ? "bg-red-50 text-red-700 border border-red-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    )}
                  >
                    {post.isDeleted ? "محذوف" : "منتهي / مؤرشف"}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 font-cairo text-xs sm:text-sm line-clamp-1">
                  {post.title}
                </h3>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[9px] flex items-center justify-center shrink-0 font-cairo">
                    {post.user?.name?.charAt(0)}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 font-cairo truncate max-w-[75px] sm:max-w-[110px]">
                    {post.user?.name}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedModalPost(post);
                  }}
                  className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[11px] font-bold font-cairo transition-all flex items-center gap-1 shrink-0"
                >
                  <Eye size={12} />
                  التفاصيل
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2 font-cairo">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-all"
          >
            <ChevronRight size={15} className={isRtl ? "" : "rotate-180"} />
          </button>
          <span className="text-xs text-slate-600 font-bold font-cairo">
            صفحة {page} من {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-all"
          >
            <ChevronLeft size={15} className={isRtl ? "" : "rotate-180"} />
          </button>
        </div>
      )}

      {/* FULL DETAILS MODAL POPOVER */}
      {selectedModalPost && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-cairo">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100 max-h-[90vh] overflow-y-auto font-cairo">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-amber-50 text-amber-700 font-bold px-2.5 py-0.5 rounded-lg border border-amber-200">
                    {selectedModalPost.category?.icon} {isRtl ? selectedModalPost.category?.nameAr : selectedModalPost.category?.nameEn}
                  </span>
                  <span className={cn(
                    "text-xs font-bold px-2.5 py-0.5 rounded-lg",
                    selectedModalPost.isDeleted ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                  )}>
                    {selectedModalPost.isDeleted ? "محذوف مؤقتاً" : "منتهي / مؤرشف"}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 pt-1">
                  {selectedModalPost.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedModalPost(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Description */}
            <div className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase">تفاصيل الفعالية الكاملة</h4>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedModalPost.description}
              </p>
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5">
                <span className="text-slate-400 font-bold block text-[10px]">تاريخ الفعالية</span>
                <p className="font-extrabold text-slate-800">
                  {new Date(selectedModalPost.eventDate).toLocaleDateString(locale)} {selectedModalPost.timeSlot && `(${selectedModalPost.timeSlot})`}
                </p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5">
                <span className="text-slate-400 font-bold block text-[10px]">المشاركون والبلاغات</span>
                <p className="font-extrabold text-slate-800">
                  {selectedModalPost._count?.participants ?? 0} مشارك · {selectedModalPost._count?.reports ?? 0} بلاغ
                </p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5">
                <span className="text-slate-400 font-bold block text-[10px]">صاحب الفعالية</span>
                <p className="font-extrabold text-slate-800">{selectedModalPost.user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{selectedModalPost.user?.email}</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5">
                <span className="text-slate-400 font-bold block text-[10px]">حالة الفعالية</span>
                <p className="font-extrabold text-slate-800">
                  {selectedModalPost.isDeleted ? "تم الحذف المؤقت" : "انتهى الموعد التلقائي"}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRestoreTarget(selectedModalPost)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <RotateCcw size={14} />
                {selectedModalPost.isDeleted ? "استعادة الفعالية المحذوفة" : "إعادة تفعيل الفعالية"}
              </button>

              <button
                onClick={() => setSelectedModalPost(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirm Dialog */}
      <ConfirmDialog
        open={!!restoreTarget}
        title={restoreTarget?.isDeleted ? `استعادة فعالية "${restoreTarget?.title ?? ""}"` : `إعادة تفعيل فعالية "${restoreTarget?.title ?? ""}"`}
        description={
          restoreTarget?.isDeleted
            ? "ستتم استعادة الفعالية المحذوفة وإعادة تفعيلها في قسم المجتمع. هل أنت متأكد؟"
            : "ستتم إعادة تفعيل هذه الفعالية المنتهية وتغيير حالتها إلى (نشط). هل أنت متأكد؟"
        }
        confirmLabel="نعم، تنفيذ الإجراء"
        confirmClass="bg-emerald-600 hover:bg-emerald-700 text-white"
        onConfirm={handleRestore}
        onCancel={() => setRestoreTarget(null)}
        loading={actionLoading}
      />
    </div>
  );
}
