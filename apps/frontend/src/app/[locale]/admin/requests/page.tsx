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
  Phone,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ArrowDown,
  X,
  ExternalLink,
  User,
} from "lucide-react";
import { useAdminRequests } from "@/hooks/useAdmin";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { ViewingRequestStatus } from "@/types";

const statusMap: Record<ViewingRequestStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: "معلق", className: "bg-amber-100 text-amber-700", icon: Clock },
  accepted: { label: "مقبول", className: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
  approved: { label: "موافق عليه", className: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  rejected: { label: "مرفوض", className: "bg-red-100 text-red-700", icon: XCircle },
  completed: { label: "مكتمل", className: "bg-slate-100 text-slate-600", icon: CheckCircle2 },
};

export default function AdminRequestsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error } = useAdminRequests(
    page,
    15,
    statusFilter !== "all" ? statusFilter : undefined,
    debouncedSearch || undefined
  );
  const requests = data?.requests ?? [];
  const meta = data?.meta;



  return (
    <div className="space-y-6 font-cairo">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-cairo flex items-center gap-2">
            <ClipboardList className="text-blue-500" /> طلبات المعاينة
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 font-cairo">
            اضغط على أي طلب لمشاهدة تفاصيل الاتصال بين المستأجر والمالك والعقار
          </p>
        </div>
        {meta && (
          <div className="px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold font-cairo border border-blue-200">
            إجمالي الطلبات: {meta.total}
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث باسم المستأجر أو عنوان العقار..."
              className="w-full ps-9 pe-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto">
            <Filter size={14} className="text-slate-400 ms-2 me-1 shrink-0" />
            {[
              { id: "all", label: "كل الطلبات" },
              { id: "pending", label: "معلقة" },
              { id: "accepted", label: "مقبولة" },
              { id: "approved", label: "موافق عليها" },
              { id: "rejected", label: "مرفوضة" },
              { id: "completed", label: "مكتملة" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => { setStatusFilter(st.id); setPage(1); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0",
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
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>فشل في تحميل طلبات المعاينة</span>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && requests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <ClipboardList size={28} className="text-blue-500" />
          </div>
          <p className="text-lg font-bold text-slate-900">
            لا توجد طلبات معاينة
          </p>
          <p className="text-sm text-slate-500 mt-1">
            لا توجد طلبات مطابقة للبحث أو الفلتر المعتمد حالياً
          </p>
        </div>
      )}

      {/* Compact Requests List */}
      {!isLoading && !error && requests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {requests.map((req) => {
            const status = req.status as ViewingRequestStatus;
            const statusInfo = statusMap[status] ?? statusMap.pending;
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={req.id}
                onClick={() => setSelectedRequest(req)}
                className="group bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between gap-2.5"
              >
                {/* Header: Status + Date */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold",
                      statusInfo.className
                    )}
                  >
                    <StatusIcon size={12} />
                    {statusInfo.label}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar size={11} />
                    {formatDate(req.createdAt)}
                  </span>
                </div>

                {/* Main Content: Title & Tenant */}
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                    <Building2 size={13} className="text-blue-500 shrink-0" />
                    {req.listing?.title || "معاينة عقار"}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span className="truncate">المستأجر: <strong className="text-slate-700">{req.tenant?.name || "—"}</strong></span>
                    {req.listing?.price && (
                      <span className="font-bold text-emerald-600 shrink-0">{req.listing.price} ج.م</span>
                    )}
                  </div>
                </div>

                {/* Footer: View Details Hint */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-600 font-bold">
                  <span>عرض التفاصيل الكاملة</span>
                  <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.lastPage > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-40 transition-all"
          >
            {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <span className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
            {page} / {meta.lastPage}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
            disabled={page === meta.lastPage}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-40 transition-all"
          >
            {isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      )}

      {/* Full Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute top-4 left-4 p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
            >
              <X size={16} />
            </button>

            {/* Modal Title & Status */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <ClipboardList size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-cairo">
                  تفاصيل طلب المعاينة
                </h3>
                <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Calendar size={11} /> تاريخ الطلب: {formatDate(selectedRequest.createdAt)}
                </span>
              </div>
            </div>

            {/* Flow Relationship Stack */}
            <div className="space-y-2.5 pt-1">
              {/* Tenant (Applicant) */}
              <div className="flex items-center justify-between p-3 bg-blue-50/60 rounded-xl border border-blue-100/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {selectedRequest.tenant?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      طالب المعاينة (المستأجر)
                    </p>
                    <p className="text-xs font-bold text-slate-800">
                      {selectedRequest.tenant?.name || "مستأجر"}
                    </p>
                  </div>
                </div>
                {selectedRequest.tenant?.phone && (
                  <a
                    href={`tel:${selectedRequest.tenant.phone}`}
                    className="text-xs font-mono font-bold text-blue-600 hover:underline flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                  >
                    <Phone size={12} /> {selectedRequest.tenant.phone}
                  </a>
                )}
              </div>

              {/* Arrow Down */}
              <div className="flex justify-center text-slate-300">
                <ArrowDown size={16} />
              </div>

              {/* Listing */}
              {selectedRequest.listing && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">العقار المطلوب</p>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Building2 size={14} className="text-blue-500 shrink-0" />
                    {selectedRequest.listing.title}
                  </p>
                  {(selectedRequest.listing.governorate || selectedRequest.listing.price) && (
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-1 border-t border-slate-200/50">
                      <span>{selectedRequest.listing.governorate} · {selectedRequest.listing.district}</span>
                      {selectedRequest.listing.price && (
                        <span className="font-bold text-emerald-600">{selectedRequest.listing.price} ج.م</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Arrow Down */}
              <div className="flex justify-center text-slate-300">
                <ArrowDown size={16} />
              </div>

              {/* Landlord (Owner) */}
              <div className="flex items-center justify-between p-3 bg-purple-50/60 rounded-xl border border-purple-100/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {selectedRequest.listing?.landlord?.name?.charAt(0) || "L"}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                      مالك العقار (المُؤجِّر)
                    </p>
                    <p className="text-xs font-bold text-slate-800">
                      {selectedRequest.listing?.landlord?.name || "صاحب العقار"}
                    </p>
                  </div>
                </div>
                {selectedRequest.listing?.landlord?.phone && (
                  <a
                    href={`tel:${selectedRequest.listing.landlord.phone}`}
                    className="text-xs font-mono font-bold text-purple-600 hover:underline flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                  >
                    <Phone size={12} /> {selectedRequest.listing.landlord.phone}
                  </a>
                )}
              </div>
            </div>

            {/* Requested Date & Notes */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              {selectedRequest.preferredDate && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                  <Clock size={14} className="text-amber-500 shrink-0" />
                  الموعد المقترح للمعاينة: {formatDate(selectedRequest.preferredDate)}
                </div>
              )}

              {selectedRequest.message && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 leading-relaxed border border-slate-100">
                  <strong className="block text-slate-700 mb-1">ملاحظة المستأجر:</strong>
                  {selectedRequest.message}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRequest(null)}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all text-center"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


