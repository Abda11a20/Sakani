// apps/frontend/src/app/[locale]/admin/community/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Compass,
  Flag,
  CheckCircle,
  XCircle,
  Eye,
  Ban,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
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

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/community/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch admin stats", err);
    }
  };

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/community/posts", {
        params: { page, limit },
      });
      setPosts(res.data.posts);
      setTotalCount(res.data.total);
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
      const res = await api.get("/admin/community/reports", {
        params: { page, limit },
      });
      setReports(res.data.reports);
      setTotalCount(res.data.total);
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
      await api.patch(`/admin/community/posts/${postId}/status`, { status });
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
      await api.patch(`/admin/community/reports/${reportId}/resolve`, { status });
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
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
              <Compass className="text-amber-500" />
              {isRtl ? "رقابة وإشراف قسم المجتمع" : "Community Moderation Panel"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-cairo">
              {isRtl
                ? "إدارة منشورات المجتمع المنشورة بواسطة الأعضاء ومراجعة البلاغات الواردة فوراً للحد من إساءة الاستخدام."
                : "Manage community posts published by members and review incoming abuse reports."}
            </p>
          </div>
        </div>

        {/* Success/Error Alerts */}
        {successMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-2 text-sm font-semibold font-cairo border border-emerald-100 dark:border-emerald-900/50">
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-2 text-sm font-semibold font-cairo border border-red-100 dark:border-red-900/50">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase font-cairo">
                {isRtl ? "إجمالي الأنشطة" : "Total Activities"}
              </span>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-sans">
                {stats.activities}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase font-cairo">
                {isRtl ? "المشاركون المقبولون" : "Accepted Members"}
              </span>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-sans">
                {stats.participants}
              </p>
            </div>

            <div className={`p-4 rounded-2xl border shadow-sm space-y-1 ${
              stats.pendingReports > 0
                ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            }`}>
              <span className="text-[10px] text-slate-400 font-bold block uppercase font-cairo">
                {isRtl ? "بلاغات معلقة" : "Pending Reports"}
              </span>
              <p className="text-xl sm:text-2xl font-extrabold font-sans">
                {stats.pendingReports}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase font-cairo">
                {isRtl ? "أنشطة محظورة" : "Blocked Posts"}
              </span>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-sans">
                {stats.blockedActivities}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase font-cairo">
                {isRtl ? "أنشطة مؤرشفة" : "Archived Posts"}
              </span>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-sans">
                {stats.archivedActivities}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase font-cairo">
                {isRtl ? "متوسط التقييم" : "Average Rating"}
              </span>
              <p className="text-xl sm:text-2xl font-extrabold text-amber-500 font-sans flex items-center gap-1">
                {stats.averageRating ? stats.averageRating.toFixed(1) : "0.0"} ★
              </p>
            </div>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1">
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-6 py-3 font-bold text-sm font-cairo border-b-2 transition-all ${
              activeTab === "posts"
                ? "border-amber-500 text-amber-500"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {isRtl ? "منشورات الأعضاء" : "Community Posts"}
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-6 py-3 font-bold text-sm font-cairo border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "reports"
                ? "border-amber-500 text-amber-500"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Flag size={14} />
            {isRtl ? "البلاغات الواردة" : "Incoming Reports"}
          </button>
        </div>

        {/* Data list table view */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
            </div>
          ) : activeTab === "posts" ? (
            // POSTS TAB TABLE
            posts.length === 0 ? (
              <div className="text-center py-16 text-slate-400 font-cairo">
                {isRtl ? "لا توجد منشورات مجتمع حالياً." : "No community posts found."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-cairo font-bold">
                      <th className="px-6 py-4">{isRtl ? "العنوان والتصنيف" : "Title / Cat"}</th>
                      <th className="px-6 py-4">{isRtl ? "الناشر" : "Publisher"}</th>
                      <th className="px-6 py-4">{isRtl ? "الموقع والتاريخ" : "Location / Date"}</th>
                      <th className="px-6 py-4">{isRtl ? "الحالة" : "Status"}</th>
                      <th className="px-6 py-4 text-left">{isRtl ? "الإجراءات" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr
                        key={post.id}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-slate-850"
                      >
                        <td className="px-6 py-4 space-y-1">
                          <h4 className="font-bold text-slate-900 dark:text-white font-cairo line-clamp-1">{post.title}</h4>
                          <span className="inline-flex gap-1 text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-semibold font-cairo">
                            {post.category.icon} {isRtl ? post.category.nameAr : post.category.nameEn}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 font-cairo">{post.user.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{post.user.email}</p>
                        </td>
                        <td className="px-6 py-4 space-y-0.5 text-slate-600 dark:text-slate-300 font-cairo">
                          <p>{post.governorateId}، {post.cityId}</p>
                          <p className="text-[10px] font-sans text-slate-400">{new Date(post.eventDate).toLocaleDateString(locale)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 rounded text-[10px] font-bold font-cairo ${
                              post.status === "ACTIVE"
                                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
                                : post.status === "BLOCKED"
                                ? "bg-red-50 dark:bg-red-950/30 text-red-600"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                            }`}
                          >
                            {post.status === "ACTIVE" && (isRtl ? "متاح" : "Active")}
                            {post.status === "ARCHIVED" && (isRtl ? "مؤرشف" : "Archived")}
                            {post.status === "CANCELLED" && (isRtl ? "ملغى" : "Cancelled")}
                            {post.status === "BLOCKED" && (isRtl ? "محظور" : "Blocked")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-left space-x-1 space-x-reverse">
                          <Link
                            href={`/${locale}/community/${post.id}`}
                            className="inline-flex p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 rounded-lg text-xs transition-all"
                            title={isRtl ? "عرض النشاط" : "View"}
                          >
                            <Eye size={14} />
                          </Link>
                          {post.status === "ACTIVE" ? (
                            <button
                              onClick={() => handleUpdatePostStatus(post.id, "BLOCKED")}
                              disabled={actionLoading}
                              className="inline-flex p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs transition-all"
                              title={isRtl ? "حظر المنشور" : "Block"}
                            >
                              <Ban size={14} />
                            </button>
                          ) : post.status === "BLOCKED" ? (
                            <button
                              onClick={() => handleUpdatePostStatus(post.id, "ACTIVE")}
                              disabled={actionLoading}
                              className="inline-flex p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs transition-all"
                              title={isRtl ? "إلغاء الحظر وتنشيط" : "Unblock"}
                            >
                              <CheckCircle size={14} />
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-cairo font-bold">
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
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-slate-850"
                      >
                        <td className="px-6 py-4 space-y-1">
                          <h4 className="font-bold text-slate-900 dark:text-white font-cairo line-clamp-1">{report.post.title}</h4>
                          <span className="text-[10px] text-slate-400 font-cairo block">
                            {isRtl ? "بواسطة المضيف: " : "Host: "} {report.post.user.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 font-cairo">{report.reporter.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{report.reporter.email}</p>
                        </td>
                        <td className="px-6 py-4 space-y-1">
                          <span className="inline-flex px-2 py-0.5 bg-red-50 dark:bg-red-950/20 text-red-600 rounded text-[10px] font-bold font-cairo">
                            {report.reason === "SPAM" && (isRtl ? "سبام / إزعاج" : "Spam")}
                            {report.reason === "HARASSMENT" && (isRtl ? "إساءة / مضايقة" : "Harassment")}
                            {report.reason === "INAPPROPRIATE" && (isRtl ? "غير لائق أخلاقياً" : "Inappropriate")}
                            {report.reason === "FAKE" && (isRtl ? "نشاط وهمي" : "Fake")}
                            {report.reason === "OTHER" && (isRtl ? "أسباب أخرى" : "Other")}
                          </span>
                          {report.details && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo max-w-xs">{report.details}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 rounded text-[10px] font-bold font-cairo ${
                              report.status === "PENDING"
                                ? "bg-amber-50 dark:bg-amber-955/30 text-amber-600"
                                : report.status === "RESOLVED"
                                ? "bg-emerald-50 dark:bg-emerald-955/30 text-emerald-600"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-500"
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
                            className="inline-flex p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 rounded-lg text-xs transition-all"
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
            <div className="flex justify-center items-center gap-2 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                <ChevronRight size={16} className={isRtl ? "" : "rotate-180"} />
              </button>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-cairo">
                {isRtl ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                <ChevronLeft size={16} className={isRtl ? "" : "rotate-180"} />
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
