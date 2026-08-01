// apps/frontend/src/app/[locale]/admin/reports/page.tsx
"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useAdminReports, useResolveReport } from "@/hooks/useAdmin";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const reasonMap: Record<string, { label: string; color: string }> = {
  SPAM: { label: "محتوى مزعج (Spam)", color: "text-amber-600 bg-amber-50" },
  HARASSMENT: { label: "إساءة / مضايقة", color: "text-red-600 bg-red-50" },
  INAPPROPRIATE: { label: "محتوى غير لائق", color: "text-purple-600 bg-purple-50" },
  FAKE: { label: "معلومات كاذبة / وهمية", color: "text-blue-600 bg-blue-50" },
  OTHER: { label: "سبب آخر", color: "text-slate-600 bg-slate-50" },
};

const statusMap: Record<string, { label: string; className: string }> = {
  PENDING: { label: "قيد الانتظار", className: "bg-status-warning/15 text-status-warning border border-status-warning/30" },
  RESOLVED: { label: "تم الحل", className: "bg-status-success/15 text-status-success border border-status-success/30" },
  DISMISSED: { label: "مرفوض", className: "bg-surface-tertiary text-text-secondary border border-border" },
};

export default function AdminReportsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { toast } = useToast();
  const [page, setPage] = useState(1);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  void setReasonFilter;
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useAdminReports(page, 10);
  const resolveMutation = useResolveReport();

  const reports = data?.reports ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.ceil(total / 10) || 1;

  const handleResolve = async (id: string, status: "RESOLVED" | "DISMISSED") => {
    try {
      await resolveMutation.mutateAsync({ id, status });
      toast({
        type: "success",
        description: status === "RESOLVED" ? "تم حل البلاغ بنجاح" : "تم رفض البلاغ وتجاهله",
      });
    } catch {
      toast({ type: "error", description: "فشل في تحديث حالة البلاغ" });
    }
  };



  // Client filtering for fast response
  const filteredReports = reports.filter((rep) => {
    if (statusFilter !== "all" && rep.status !== statusFilter) return false;
    if (reasonFilter !== "all" && rep.reason !== reasonFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const reporterName = rep.reporter?.name?.toLowerCase() ?? "";
      const postTitle = rep.post?.title?.toLowerCase() ?? "";
      const details = rep.details?.toLowerCase() ?? "";
      return reporterName.includes(q) || postTitle.includes(q) || details.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 font-cairo">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <ShieldAlert size={24} className="text-status-danger" />
            بلاغات المجتمع والمستخدمين
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            مراجعة البلاغات المقدمة ضد المنشورات والمحتوى المخالف
          </p>
        </div>
        <div className="px-3.5 py-1.5 bg-status-danger/15 text-status-danger rounded-xl text-sm font-bold border border-status-danger/30">
          إجمالي البلاغات: {total}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث باسم المُبلّغ أو عنوان المنشور أو التفاصيل..."
              className="w-full ps-9 pe-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <Filter size={14} className="text-slate-400 ms-2 me-1" />
            {[
              { id: "all", label: "كل الحالات" },
              { id: "PENDING", label: "معلقة" },
              { id: "RESOLVED", label: "تم الحل" },
              { id: "DISMISSED", label: "مرفوضة" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  statusFilter === st.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-red-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>فشل في تحميل البلاغات</span>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && filteredReports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <p className="text-base font-bold text-slate-800">
            لا توجد بلاغات حالياً
          </p>
          <p className="text-xs text-slate-400 mt-1">
            جميع البلاغات جرى التعامل معها أو لا تتوفر بلاغات مطابقة للفلتر
          </p>
        </div>
      )}

      {/* Reports Cards */}
      {!isLoading && !error && filteredReports.length > 0 && (
        <div className="space-y-4">
          {filteredReports.map((rep) => {
            const reasonInfo = reasonMap[rep.reason] ?? reasonMap.OTHER;
            const statusInfo = statusMap[rep.status] ?? statusMap.PENDING;
            const isPending = rep.status === "PENDING";

            return (
              <div
                key={rep.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold", reasonInfo.color)}>
                      {reasonInfo.label}
                    </span>
                    <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold", statusInfo.className)}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={12} />
                    {formatDate(rep.createdAt)}
                  </span>
                </div>

                {/* Parties Involved */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  {/* Reporter */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                      <User size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium">المُبلِّغ (صاحب البلاغ):</p>
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {rep.reporter?.name || "مستخدم غير معروف"}
                      </p>
                    </div>
                  </div>

                  {/* Reported User */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                      <User size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium">صاحب المنشور المُبلَّغ عنه:</p>
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {rep.post?.user?.name || "غير محدد"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reported Content */}
                {rep.post && (
                  <div className="p-3 bg-red-50/40 border border-red-100 rounded-xl space-y-1">
                    <p className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                      <FileText size={14} /> المنشور المُبلَّغ عنه: {rep.post.title}
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {rep.post.description}
                    </p>
                  </div>
                )}

                {/* Details */}
                {rep.details && (
                  <div className="text-xs text-slate-600 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700">تفاصيل البلاغ: </span>
                    {rep.details}
                  </div>
                )}

                {/* Actions */}
                {isPending && (
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleResolve(rep.id, "RESOLVED")}
                      disabled={resolveMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle2 size={14} /> تأكيد وحل البلاغ
                    </button>
                    <button
                      onClick={() => handleResolve(rep.id, "DISMISSED")}
                      disabled={resolveMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all disabled:opacity-50"
                    >
                      <XCircle size={14} /> رفض وتجاهل البلاغ
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-40 transition-all"
          >
            {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <span className="text-sm font-bold text-slate-700 px-3">
            {page} / {lastPage}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            disabled={page === lastPage}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-40 transition-all"
          >
            {isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      )}
    </div>
  );
}
