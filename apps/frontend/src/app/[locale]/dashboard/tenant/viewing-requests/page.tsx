// apps/frontend/src/app/[locale]/dashboard/tenant/viewing-requests/page.tsx
"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Inbox,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTenantRequests, useCancelRequest } from "@/hooks/useRequests";
import { useToast } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/lib/utils";
import type { ViewingRequest, ViewingRequestStatus } from "@/types";

// ── Status display helpers ──────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  ViewingRequestStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "قيد الانتظار",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    icon: <AlertCircle size={13} />,
  },
  accepted: {
    label: "مقبول",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    icon: <CheckCircle2 size={13} />,
  },
  approved: {
    label: "مقبول",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    icon: <CheckCircle2 size={13} />,
  },
  rejected: {
    label: "مرفوض",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    icon: <XCircle size={13} />,
  },
  completed: {
    label: "مكتمل",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    icon: <CheckCircle2 size={13} />,
  },
};

const ARABIC_MONTHS = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

function formatArabicDate(isoDate: string) {
  const d = new Date(isoDate);
  return `${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatArabicTime(isoDate: string) {
  const d = new Date(isoDate);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const period = h < 12 ? "ص" : "م";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m} ${period}`;
}

// ── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({ request }: { request: ViewingRequest }) {
  const { toast } = useToast();
  const cancelRequest = useCancelRequest();
  const status = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.pending;
  const [confirming, setConfirming] = useState(false);

  const handleCancel = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    try {
      await cancelRequest.mutateAsync(request.id);
      toast({ title: "تم إلغاء الطلب", description: "تم إلغاء طلب المعاينة بنجاح.", type: "success" });
    } catch {
      toast({ title: "فشل إلغاء الطلب", description: "حاول مرة أخرى.", type: "error" });
    } finally {
      setConfirming(false);
    }
  };

  const listing = request.listing;
  const thumb =
    listing && Array.isArray((listing as any).images) && (listing as any).images.length > 0
      ? getImageUrl((listing as any).images[0])
      : null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row">
        {/* Thumbnail */}
        <div className="sm:w-36 h-32 sm:h-auto shrink-0 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
          {thumb ? (
            <img src={thumb} alt={listing?.title ?? ""} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
              <Building2 size={32} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent sm:bg-none" />
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-3">
          {/* Title + status */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2">
                {listing?.title ?? "إعلان غير متاح"}
              </h3>
              {listing && (
                <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  <MapPin size={11} className="text-[#1B4F8A] shrink-0" />
                  <span className="truncate">{(listing as any).address ?? listing.title}</span>
                </div>
              )}
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${status.color}`}
            >
              {status.icon}
              {status.label}
            </span>
          </div>

          {/* Date + time */}
          <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} className="text-[#1B4F8A]" />
              {formatArabicDate(request.preferredDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={13} className="text-[#1B4F8A]" />
              {formatArabicTime(request.preferredDate)}
            </span>
          </div>

          {/* Created at */}
          <p className="text-[11px] text-slate-400">
            تم الطلب بتاريخ: {formatArabicDate(request.createdAt)}
          </p>

          {/* Cancel action (pending only) */}
          {request.status === "pending" && (
            <button
              onClick={handleCancel}
              disabled={cancelRequest.isPending}
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-all ${
                confirming
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
              }`}
            >
              {cancelRequest.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Trash2 size={12} />
              )}
              {confirming ? "اضغط مرة أخرى للتأكيد" : "إلغاء الطلب"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TenantViewingRequestsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useTenantRequests(page);

  const items = data?.items ?? [];
  const totalPages = data?.pages ?? 1;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 font-cairo" dir="rtl">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar size={22} className="text-[#1B4F8A]" />
          طلبات المعاينة
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          تتبّع جميع طلبات المعاينة التي أرسلتها للمؤجرين
        </p>
      </div>

      {/* Summary stats */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              { status: "pending" as ViewingRequestStatus, label: "قيد الانتظار" },
              { status: "accepted" as ViewingRequestStatus, label: "مقبولة" },
              { status: "rejected" as ViewingRequestStatus, label: "مرفوضة" },
              { status: "completed" as ViewingRequestStatus, label: "مكتملة" },
            ] as { status: ViewingRequestStatus; label: string }[]
          ).map(({ status, label }) => {
            const count = items.filter(
              (r) => r.status === status || (status === "accepted" && r.status === "approved")
            ).length;
            const cfg = STATUS_CONFIG[status];
            return (
              <div
                key={status}
                className={`rounded-xl p-3 text-center ${cfg.color} border border-current/10`}
              >
                <p className="text-xl font-extrabold">{count}</p>
                <p className="text-[11px] font-semibold mt-0.5">{label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={28} className="animate-spin" />
        </div>
      ) : isError ? (
        <div className="text-center py-16 text-red-500 dark:text-red-400">
          <XCircle size={32} className="mx-auto mb-2" />
          <p className="font-semibold text-sm">فشل في تحميل الطلبات. حاول مجدداً.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 space-y-3 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <Inbox size={40} className="mx-auto opacity-40" />
          <p className="font-bold text-sm text-slate-600 dark:text-slate-400">لا توجد طلبات معاينة بعد</p>
          <p className="text-xs">تصفّح الإعلانات وابعث طلب معاينة لأي عقار يعجبك</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
