// apps/frontend/src/app/[locale]/admin/community/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";

import {
  Flag,
  CheckCircle,
  XCircle,
  Eye,
  Ban,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { adminRepository } from "@/features/admin";
import Link from "next/link";

interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
}

interface Post {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  governorateId: string;
  cityId: string;
  genderPreference: "MALES_ONLY" | "FEMALES_ONLY" | "ALL";
  maxParticipants: number;
  eventDate: string;
  timeSlot: string;
  status: "ACTIVE" | "ARCHIVED" | "CANCELLED" | "BLOCKED";
  category: Category;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Report {
  id: string;
  postId: string;
  reporterId: string;
  reason: "SPAM" | "HARASSMENT" | "INAPPROPRIATE" | "FAKE" | "OTHER";
  details: string | null;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  createdAt: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  post: {
    id: string;
    title: string;
    description: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export default function AdminCommunityPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [activeTab, setActiveTab] = useState<"posts" | "reports">("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<{
    activities: number;
    participants: number;
    pendingReports: number;
    blockedActivities: number;
    archivedActivities: number;
    averageRating: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedModalPost, setSelectedModalPost] = useState<Post | null>(null);

  const fetchStats = async () => {
    try {
      const res = await adminRepository.getCommunityStats();
      setStats(res.data ?? res);
    } catch (err) {
      console.error("Failed to fetch admin stats", err);
    }
  };

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminRepository.getCommunityPosts({ page, limit });
      const payload = res.data ?? res;
      setPosts(payload.posts ?? res.posts ?? []);
      setTotalCount(payload.total ?? res.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch admin posts", err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminRepository.getCommunityReports({ page, limit });
      const payload = res.data ?? res;
      setReports(payload.reports ?? res.reports ?? []);
      setTotalCount(payload.total ?? res.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch admin reports", err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    setPage(1);
    fetchStats();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "posts") {
      fetchPosts();
    } else {
      fetchReports();
    }
  }, [activeTab, page, fetchPosts, fetchReports]);

  // Handle post block/unblock
  const handleUpdatePostStatus = async (postId: string, status: "ACTIVE" | "BLOCKED") => {
    setErrorMsg("");
    setSuccessMsg("");
    setActionLoading(true);

    try {
      await adminRepository.updateCommunityPostStatus(postId, status);
      setSuccessMsg(
        status === "BLOCKED"
          ? isRtl
            ? "تم حظر المنشور بنجاح."
            : "Post blocked successfully."
          : isRtl
          ? "تم إلغاء الحظر وتنشيط المنشور."
          : "Post activated successfully."
      );
      fetchPosts();
      fetchStats();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || (isRtl ? "فشل تعديل حالة المنشور." : "Failed to change post status."));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle report status update
  const handleUpdateReportStatus = async (reportId: string, status: "RESOLVED" | "DISMISSED") => {
    setErrorMsg("");
    setSuccessMsg("");
    setActionLoading(true);

    try {
      await adminRepository.resolveCommunityReport(reportId, status);
      setSuccessMsg(
        status === "RESOLVED"
          ? isRtl
            ? "تم وسم البلاغ كمحلول بنجاح."
            : "Report marked as resolved."
          : isRtl
          ? "تم رفض وإهمال البلاغ."
          : "Report dismissed."
      );
      fetchReports();
      fetchStats();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || (isRtl ? "فشل تحديث البلاغ." : "Failed to update report."));
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-4 font-cairo">
        {/* Header Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-3 border-slate-200">
          <h1 className="text-xl font-extrabold text-slate-900 font-cairo">
            {isRtl ? "إدارة وتجميع قسم المجتمع" : "Community Moderation"}
          </h1>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/${locale}/admin/community/archived`}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold font-cairo transition-all shadow-sm"
            >
              {isRtl ? "أرشيف الفعاليات" : "Events Archive"}
            </Link>
            <Link
              href={`/${locale}/admin/banned-words`}
              className="px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold font-cairo transition-all flex items-center gap-1.5 shadow-xs"
            >
              <ShieldAlert size={14} />
              {isRtl ? "إدارة الكلمات المحظورة" : "Manage Bad Words"}
            </Link>
          </div>
        </div>

        {/* Success/Error Alerts */}
        {successMsg && (
          <div className="bg-status-success/15 text-status-success p-3 rounded-xl flex items-center gap-2 text-xs font-bold font-cairo border border-status-success/30">
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-status-danger/15 text-status-danger p-3 rounded-xl flex items-center gap-2 text-xs font-bold font-cairo border border-status-danger/30">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 font-cairo">
            <div className="bg-surface p-3.5 rounded-2xl border border-border shadow-xs space-y-0.5">
              <span className="text-[10px] text-text-tertiary font-bold block uppercase font-cairo">
                {isRtl ? "إجمالي الأنشطة" : "Total Activities"}
              </span>
              <p className="text-lg font-extrabold text-text font-cairo">
                {stats.activities}
              </p>
            </div>

            <div className="bg-surface p-3.5 rounded-2xl border border-border shadow-xs space-y-0.5">
              <span className="text-[10px] text-text-tertiary font-bold block uppercase font-cairo">
                {isRtl ? "المشاركون المقبولون" : "Accepted Members"}
              </span>
              <p className="text-lg font-extrabold text-text font-cairo">
                {stats.participants}
              </p>
            </div>

            <div className={`p-3.5 rounded-2xl border shadow-xs space-y-0.5 ${
              stats.pendingReports > 0
                ? "bg-status-danger/10 border-status-danger/30 text-status-danger"
                : "bg-surface border-border text-text"
            }`}>
              <span className="text-[10px] text-text-tertiary font-bold block uppercase font-cairo">
                {isRtl ? "بلاغات معلقة" : "Pending Reports"}
              </span>
              <p className="text-lg font-extrabold font-cairo">
                {stats.pendingReports}
              </p>
            </div>

            <div className="bg-surface p-3.5 rounded-2xl border border-border shadow-xs space-y-0.5">
              <span className="text-[10px] text-text-tertiary font-bold block uppercase font-cairo">
                {isRtl ? "أنشطة محظورة" : "Blocked Posts"}
              </span>
              <p className="text-lg font-extrabold text-text font-cairo">
                {stats.blockedActivities}
              </p>
            </div>

            <div className="bg-surface p-3.5 rounded-2xl border border-border shadow-xs space-y-0.5">
              <span className="text-[10px] text-text-tertiary font-bold block uppercase font-cairo">
                {isRtl ? "أنشطة مؤرشفة" : "Archived Posts"}
              </span>
              <p className="text-lg font-extrabold text-text font-cairo">
                {stats.archivedActivities}
              </p>
            </div>

            <div className="bg-surface p-3.5 rounded-2xl border border-border shadow-xs space-y-0.5">
              <span className="text-[10px] text-text-tertiary font-bold block uppercase font-cairo">
                {isRtl ? "متوسط التقييم" : "Average Rating"}
              </span>
              <p className="text-lg font-extrabold text-slate-800 font-cairo">
                {stats.averageRating ? stats.averageRating.toFixed(1) : "0.0"} ★
              </p>
            </div>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex items-center border-b border-slate-200 gap-3 font-cairo">
          <button
            onClick={() => setActiveTab("posts")}
            className={`py-2.5 px-2 font-bold text-xs sm:text-sm font-cairo border-b-2 transition-all ${
              activeTab === "posts"
                ? "border-[#0EA5E9] text-[#0EA5E9]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {isRtl ? "منشورات الأعضاء النشطة" : "Active Posts"}
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`py-2.5 px-2 font-bold text-xs sm:text-sm font-cairo border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "reports"
                ? "border-[#0EA5E9] text-[#0EA5E9]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Flag size={14} />
            {isRtl ? "البلاغات الواردة" : "Incoming Reports"}
          </button>
        </div>

        {/* Data list view */}
        <div>
          {loading ? (
            <div className="flex justify-center items-center py-16 bg-white rounded-2xl border border-slate-200">
              <div className="animate-spin w-8 h-8 border-4 border-[#0EA5E9] border-t-transparent rounded-full" />
            </div>
          ) : activeTab === "posts" ? (
            // STRICT 2-COLUMN GRID VIEW FOR ACTIVE POST CARDS
            posts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 text-center py-16 text-slate-400 text-xs font-bold font-cairo">
                {isRtl ? "لا توجد منشورات مجتمع حالياً." : "No community posts found."}
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
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-cairo shrink-0 ${
                            post.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : post.status === "BLOCKED"
                              ? "bg-red-50 text-red-700 border border-red-100"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {post.status === "ACTIVE" && "نشط"}
                          {post.status === "BLOCKED" && "محظور"}
                          {post.status === "ARCHIVED" && "مؤرشف"}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 font-cairo text-xs sm:text-sm line-clamp-1">
                        {post.title}
                      </h4>
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
                        {isRtl ? "التفاصيل" : "Details"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // REPORTS TAB TABLE
            reports.length === 0 ? (
              <div className="text-center py-16 text-slate-400 font-cairo">
                {isRtl ? "لا توجد بلاغات واردة حالياً." : "No reports found."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-cairo font-bold">
                      <th className="px-6 py-4">{isRtl ? "المنشور ومضيفه" : "Abused Post / Host"}</th>
                      <th className="px-6 py-4">{isRtl ? "صاحب البلاغ" : "Reporter"}</th>
                      <th className="px-6 py-4">{isRtl ? "السبب والتفاصيل" : "Reason / Details"}</th>
                      <th className="px-6 py-4">{isRtl ? "الحالة" : "Status"}</th>
                      <th className="px-6 py-4 text-left">{isRtl ? "الإجراءات" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr
                        key={report.id}
                        className="border-b border-slate-100 hover:bg-slate-55"
                      >
                        <td className="px-6 py-4 space-y-1">
                          <h4 className="font-bold text-slate-900 font-cairo line-clamp-1">{report.post.title}</h4>
                          <span className="text-[10px] text-slate-400 font-cairo block">
                            {isRtl ? "بواسطة المضيف: " : "Host: "} {report.post.user.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800 font-cairo">{report.reporter.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{report.reporter.email}</p>
                        </td>
                        <td className="px-6 py-4 space-y-1">
                          <span className="inline-flex px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold font-cairo">
                            {report.reason === "SPAM" && (isRtl ? "سبام / إزعاج" : "Spam")}
                            {report.reason === "HARASSMENT" && (isRtl ? "إساءة / مضايقة" : "Harassment")}
                            {report.reason === "INAPPROPRIATE" && (isRtl ? "غير لائق أخلاقياً" : "Inappropriate")}
                            {report.reason === "FAKE" && (isRtl ? "نشاط وهمي" : "Fake")}
                            {report.reason === "OTHER" && (isRtl ? "أسباب أخرى" : "Other")}
                          </span>
                          {report.details && (
                            <p className="text-xs text-slate-500 font-cairo max-w-xs">{report.details}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 rounded text-[10px] font-bold font-cairo ${
                              report.status === "PENDING"
                                ? "bg-amber-50 text-amber-600"
                                : report.status === "RESOLVED"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {report.status === "PENDING" && (isRtl ? "قيد الانتظار" : "Pending")}
                            {report.status === "RESOLVED" && (isRtl ? "تم حله" : "Resolved")}
                            {report.status === "DISMISSED" && (isRtl ? "مرفوض / مهمل" : "Dismissed")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-left space-x-1 space-x-reverse">
                          <Link
                            href={`/${locale}/community/${report.postId}`}
                            className="inline-flex p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-all"
                            title={isRtl ? "عرض تفاصيل المنشور" : "View"}
                          >
                            <Eye size={14} />
                          </Link>
                          {report.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleUpdateReportStatus(report.id, "RESOLVED")}
                                disabled={actionLoading}
                                className="inline-flex p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs transition-all"
                                title={isRtl ? "وسم كمحلول" : "Mark Resolved"}
                              >
                                <CheckCircle size={14} />
                              </button>
                              <button
                                onClick={() => handleUpdateReportStatus(report.id, "DISMISSED")}
                                disabled={actionLoading}
                                className="inline-flex p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs transition-all"
                                title={isRtl ? "رفض البلاغ" : "Dismiss"}
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50"
              >
                <ChevronRight size={16} className={isRtl ? "" : "rotate-180"} />
              </button>
              <span className="text-xs font-semibold text-slate-700 font-cairo">
                {isRtl ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50"
              >
                <ChevronLeft size={16} className={isRtl ? "" : "rotate-180"} />
              </button>
            </div>
          )}
        </div>

        {/* DETAILS MODAL POPOVER FOR ADMIN */}
        {selectedModalPost && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100 max-h-[90vh] overflow-y-auto font-cairo">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-amber-50 text-amber-700 font-bold px-2.5 py-0.5 rounded-lg border border-amber-200">
                      {selectedModalPost.category?.icon} {isRtl ? selectedModalPost.category?.nameAr : selectedModalPost.category?.nameEn}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${
                      selectedModalPost.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}>
                      {selectedModalPost.status === "ACTIVE" ? "نشط" : "محظور"}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 pt-1">
                    {selectedModalPost.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedModalPost(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Description */}
              <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase">تفاصيل ومضمون الفعالية</h4>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedModalPost.description}
                </p>
              </div>

              {/* Event Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-400 font-bold block">تاريخ ووقت الفعالية</span>
                  <p className="font-extrabold text-slate-800">
                    {new Date(selectedModalPost.eventDate).toLocaleDateString(locale)} {selectedModalPost.timeSlot && `(الساعة ${selectedModalPost.timeSlot})`}
                  </p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-400 font-bold block">الحد الأقصى للمشاركين</span>
                  <p className="font-extrabold text-slate-800">
                    {selectedModalPost.maxParticipants ?? "غير محدد"} أفراد
                  </p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-400 font-bold block">الناشر</span>
                  <p className="font-extrabold text-slate-800">{selectedModalPost.user?.name}</p>
                  <p className="text-[10px] text-slate-400">{selectedModalPost.user?.email}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-400 font-bold block">الموقع والتاريخ</span>
                  <p className="font-extrabold text-slate-800">{selectedModalPost.governorateId}، {selectedModalPost.cityId}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <Link
                  href={`/${locale}/community/${selectedModalPost.id}`}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
                >
                  <Eye size={14} />
                  فتح الصفحة العامة
                </Link>

                {selectedModalPost.status === "ACTIVE" ? (
                  <button
                    onClick={async () => {
                      await handleUpdatePostStatus(selectedModalPost.id, "BLOCKED");
                      setSelectedModalPost(null);
                    }}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Ban size={14} />
                    حظر الفعالية
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      await handleUpdatePostStatus(selectedModalPost.id, "ACTIVE");
                      setSelectedModalPost(null);
                    }}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle size={14} />
                    تنشيط الفعالية
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
