// apps/frontend/src/app/[locale]/admin/requests/page.tsx
"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  User,
  Phone,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAdminRequests } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";
import type { ViewingRequestStatus } from "@/types";

const statusMap: Record<ViewingRequestStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: "معلق", className: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300", icon: Clock },
  accepted: { label: "مقبول", className: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300", icon: CheckCircle2 },
  approved: { label: "موافق عليه", className: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300", icon: CheckCircle2 },
  rejected: { label: "مرفوض", className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300", icon: XCircle },
  completed: { label: "مكتمل", className: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400", icon: CheckCircle2 },
};

export default function AdminRequestsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useAdminRequests(page, 12);
  const requests = data?.requests ?? [];
  const meta = data?.meta;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-cairo">
            طلبات المعاينة
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-cairo">
            {meta ? `${meta.total} طلب إجمالي` : "جاري التحميل..."}
          </p>
        </div>
        {meta && (
          <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl text-sm font-bold font-cairo border border-blue-200 dark:border-blue-800">
            {meta.total} طلب
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 font-cairo text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>فشل في تحميل الطلبات</span>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && requests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4">
            <ClipboardList size={28} className="text-blue-500" />
          </div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white font-cairo">
            لا توجد طلبات
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo mt-1">
            لم يتم تقديم أي طلبات معاينة بعد
          </p>
        </div>
      )}

      {/* Requests Grid */}
      {!isLoading && !error && requests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {requests.map((req) => {
            const status = req.status as ViewingRequestStatus;
            const statusInfo = statusMap[status] ?? statusMap.pending;
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={req.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-cairo",
                      statusInfo.className
                    )}
                  >
                    <StatusIcon size={12} />
                    {statusInfo.label}
                  </span>
                  <span className="text-xs text-slate-400 font-cairo flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(req.createdAt)}
                  </span>
                </div>

                {/* Listing */}
                {req.listing && (
                  <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <Building2 size={15} className="text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-cairo truncate">
                        {req.listing.title}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tenant */}
                {req.tenant && (
                  <div className="flex items-center gap-2 p-2.5 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xs font-cairo shrink-0">
                      {req.tenant.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-cairo">
                        {req.tenant.name}
                      </p>
                      {req.tenant.phone && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 font-cairo">
                          <Phone size={11} /> {req.tenant.phone}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Requested Date */}
                {req.preferredDate && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-cairo">
                    <Clock size={12} />
                    موعد مقترح: {formatDate(req.preferredDate)}
                  </div>
                )}

                {/* Notes */}
                {req.message && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                    {req.message}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.lastPage > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 transition-all"
          >
            {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <span className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium font-cairo text-slate-700 dark:text-slate-300">
            {page} / {meta.lastPage}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
            disabled={page === meta.lastPage}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 transition-all"
          >
            {isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      )}
    </div>
  );
}
