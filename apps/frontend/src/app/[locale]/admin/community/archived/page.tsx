// apps/frontend/src/app/[locale]/admin/community/archived/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import {
  Archive,
  Search,
  RefreshCw,
  RotateCcw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  Flag,
  Info,
  Trash2,
  Tag,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminRepository } from "@/features/admin";
import { formatDistanceToNow, type Locale } from "date-fns";
import { ar, enUS } from "date-fns/locale";

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

interface ApiResponse {
  posts: ArchivedPost[];
  total: number;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 shrink-0">
            <Info size={20} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
              confirmClass || "bg-[#0EA5E9] hover:bg-[#0284C7] text-white"
            )}
          >
            {loading ? "جاري التنفيذ..." : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ post }: { post: ArchivedPost }) {
  if (post.isDeleted) {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 flex items-center gap-1">
        <Trash2 size={10} /> حذف مؤقت
      </span>
    );
  }

  const isPast = new Date(post.eventDate) < new Date();
  if (post.status === "ARCHIVED" || isPast) {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 flex items-center gap-1">
        <Clock size={10} /> انتهت / مؤرشفة
      </span>
    );
  }

  const map: Record<string, { label: string; cls: string }> = {
    ACTIVE:    { label: "نشط",    cls: "bg-emerald-100 text-emerald-700" },
    CANCELLED: { label: "ملغي",  cls: "bg-orange-100 text-orange-700" },
    BLOCKED:   { label: "محظور", cls: "bg-red-100 text-red-700" },
  };
  const { label, cls } = map[post.status] ?? { label: post.status, cls: "bg-slate-200 text-slate-600" };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", cls)}>
      {label}
    </span>
  );
}

// ── Gender Badge ───────────────────────────────────────────────────────────────

function GenderBadge({ gender }: { gender: ArchivedPost["genderPreference"] }) {
  const map: Record<string, { label: string; cls: string }> = {
    MALES_ONLY:   { label: "رجال فقط",   cls: "bg-blue-100 text-blue-700" },
    FEMALES_ONLY: { label: "نساء فقط",   cls: "bg-pink-100 text-pink-700" },
    ALL:          { label: "الجميع",      cls: "bg-purple-100 text-purple-700" },
  };
  const { label, cls } = map[gender] ?? { label: gender, cls: "bg-slate-200 text-slate-600" };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", cls)}>
      {label}
    </span>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AdminArchivedCommunityPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const dateFnsLocale = isRtl ? ar : enUS;

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
      setPosts(res.data.posts ?? []);
      setTotal(res.data.total ?? 0);
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
      fetchData();
    } catch {
      setError("فشل استعادة الفعالية. يرجى المحاولة مجدداً.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 font-cairo flex items-center gap-2">
            <Archive className="text-amber-500" size={26} />
            أرشيف الفعاليات (المنتهية والمحذوفة)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-cairo">
            استعراض الفعاليات التي انتهى موعدها أو تم حذفها مؤقتاً مع إمكانية استعادتها
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm text-slate-700 shrink-0"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          تحديث
        </button>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => { setActiveTab("all"); setPage(1); }}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
            activeTab === "all"
              ? "bg-[#0EA5E9] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          )}
        >
          <Archive size={14} />
          الكل (الأرشيف الكامل)
        </button>
        <button
          onClick={() => { setActiveTab("expired"); setPage(1); }}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
            activeTab === "expired"
              ? "bg-[#0EA5E9] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          )}
        >
          <Clock size={14} />
          الفعاليات المنتهية (تلقائياً)
        </button>
        <button
          onClick={() => { setActiveTab("deleted"); setPage(1); }}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
            activeTab === "deleted"
              ? "bg-[#0EA5E9] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          )}
        >
          <Trash2 size={14} />
          الفعاليات المحذوفة (Soft Deleted)
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-xl bg-amber-100">
            <Archive size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500">إجمالي نتائج القسم الحالي</p>
            <p className="text-xl font-extrabold text-slate-900">{total}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm col-span-2">
          <div className="p-2.5 rounded-xl bg-blue-100">
            <Info size={18} className="text-blue-600" />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            تتضمن هذه الصفحة جميع الفعاليات التي <span className="font-bold text-amber-600">انتهى تاريخها</span> أو تم <span className="font-bold text-red-500">حذفها مؤقتاً</span>. يمكنك الاستعادة وإعادة التفعيل بضغطة زر.
          </p>
        </div>
      </div>

      {/* Success / Error Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
          <CheckCircle2 size={14} className="shrink-0" />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
          <Info size={14} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            style={{ [isRtl ? "right" : "left"]: "12px" }}
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="بحث بالعنوان أو الوصف أو اسم صاحب الفعالية..."
            className={cn(
              "w-full py-2.5 text-sm rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all",
              isRtl ? "pr-9 pl-4" : "pl-9 pr-4"
            )}
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-sm font-bold transition-colors shadow-sm"
        >
          بحث
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold transition-colors"
          >
            مسح
          </button>
        )}
      </form>

      {/* Posts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={28} className="animate-spin text-amber-500" />
            <p className="text-sm text-slate-400 font-cairo">جاري التحميل...</p>
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="p-5 rounded-2xl bg-slate-100">
            <Archive size={40} className="text-slate-400" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-700 font-cairo">
              {search ? "لا توجد نتائج مطابقة للبحث" : "لا توجد فعاليات في هذا القسم حالياً"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {search ? "جرّب كلمات بحث مختلفة" : "ستظهر هنا الفعاليات عندما تنتهي أو يتم حذفها مؤقتاً"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isRtl={isRtl}
              dateFnsLocale={dateFnsLocale}
              onRestore={() => setRestoreTarget(post)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-all"
          >
            <ChevronRight size={16} className={isRtl ? "" : "rotate-180"} />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = i + 1;
              if (totalPages > 5) {
                if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                    page === p
                      ? "bg-[#0EA5E9] text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-all"
          >
            <ChevronLeft size={16} className={isRtl ? "" : "rotate-180"} />
          </button>

          <span className="text-xs text-slate-500 ms-2 font-cairo">
            صفحة {page} من {totalPages} · الإجمالي: {total}
          </span>
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
        confirmClass="bg-emerald-500 hover:bg-emerald-600 text-white"
        onConfirm={handleRestore}
        onCancel={() => setRestoreTarget(null)}
        loading={actionLoading}
      />
    </div>
  );
}

// ── Post Card ──────────────────────────────────────────────────────────────────

function PostCard({
  post,
  isRtl,
  dateFnsLocale,
  onRestore,
}: {
  post: ArchivedPost;
  isRtl: boolean;
  dateFnsLocale: Locale;
  onRestore: () => void;
}) {
  const isPast = new Date(post.eventDate) < new Date();
  const timeAgo = formatDistanceToNow(new Date(post.updatedAt), {
    addSuffix: true,
    locale: dateFnsLocale,
  });

  const eventDateStr = new Date(post.eventDate).toLocaleDateString(
    isRtl ? "ar-EG" : "en-US",
    { year: "numeric", month: "short", day: "numeric" }
  );

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all duration-200 flex flex-col overflow-hidden">

      {/* Card Top — Status Strip */}
      <div className={cn(
        "h-1.5",
        post.isDeleted
          ? "bg-gradient-to-r from-red-500 to-rose-400"
          : "bg-gradient-to-r from-[#38BDF8] to-[#0284C7]"
      )} />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate font-cairo leading-snug">
              {post.title}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <Tag size={10} />
              {post.category?.nameAr ?? "—"}
            </p>
          </div>
          <StatusBadge post={post} />
        </div>

        {/* Description */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {post.description}
        </p>

        {/* Meta info */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-amber-500 shrink-0" />
            <span>{eventDateStr}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={12} className="text-blue-500 shrink-0" />
            <span>{post._count?.participants ?? 0} مشارك</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flag size={12} className="text-red-500 shrink-0" />
            <span>{post._count?.reports ?? 0} بلاغ</span>
          </div>
          <GenderBadge gender={post.genderPreference} />
        </div>

        {/* Owner */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#38BDF8] to-[#0284C7] text-white font-bold text-xs flex items-center justify-center shrink-0">
            {post.user?.name?.charAt(0) ?? "U"}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-700 truncate">{post.user?.name}</p>
            <p className="text-[10px] text-slate-400 truncate">{post.user?.email}</p>
          </div>
        </div>

        {/* Reason / Status note */}
        <p className="text-[10px] text-slate-400 flex items-center gap-1">
          {post.isDeleted ? (
            <>
              <Trash2 size={10} className="text-red-400 shrink-0" />
              تم الحذف المؤقت {timeAgo}
            </>
          ) : isPast ? (
            <>
              <Clock size={10} className="text-amber-500 shrink-0" />
              انتهى موعد الفعالية ({eventDateStr})
            </>
          ) : (
            <>
              <Archive size={10} className="text-slate-400 shrink-0" />
              تحديث {timeAgo}
            </>
          )}
        </p>

        {/* Actions */}
        <div className="mt-auto pt-2">
          <button
            onClick={onRestore}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold transition-all"
          >
            <RotateCcw size={13} />
            {post.isDeleted ? "استعادة الفعالية المحذوفة" : "إعادة تفعيل الفعالية"}
          </button>
        </div>
      </div>
    </div>
  );
}
