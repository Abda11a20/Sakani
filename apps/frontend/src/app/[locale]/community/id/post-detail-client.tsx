// apps/frontend/src/app/[locale]/community/[id]/post-detail-client.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Star,
  CheckCircle,
  X,
  MessageSquare,
  UserCheck,
  Flag,
  Trash2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { api } from "@/lib/api";

interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
}

interface Participant {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "LEFT" | "EXPIRED";
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    communityRatingAvg: number;
  };
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
    avatarUrl: string | null;
    role: string;
    communityRatingAvg: number;
    communityReviewsCount: number;
  };
  participants: Participant[];
}

export function CommunityPostDetailClient({
  locale,
  initialPost,
}: {
  locale: string;
  initialPost: Post;
}) {
  const router = useRouter();
  const isRtl = locale === "ar";
  const { user, token } = useAuthStore();
  const isAuthenticated = !!token;

  const [post, setPost] = useState<Post>(initialPost);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Report Modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<"SPAM" | "HARASSMENT" | "INAPPROPRIATE" | "FAKE" | "OTHER">("SPAM");
  const [reportDetails, setReportDetails] = useState("");

  // Rate Modal state
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [rateValue, setRateValue] = useState(5);

  const isHost = user?.id === post.user.id;
  const myParticipantRecord = post.participants.find((p) => p.user.id === user?.id);
  const isAccepted = myParticipantRecord?.status === "ACCEPTED";
  const isPending = myParticipantRecord?.status === "PENDING";

  const acceptedParticipants = post.participants.filter((p) => p.status === "ACCEPTED");
  const acceptedCount = acceptedParticipants.length;
  const isFull = acceptedCount >= post.maxParticipants;

  // Refresh post details
  const refreshPost = async () => {
    try {
      const res = await api.get(`/community/${post.id}`);
      setPost(res.data.data ?? res.data);
    } catch (err) {
      console.error("Failed to refresh post", err);
    }
  };

  // Join activity
  const handleJoin = async () => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    setActionLoading(true);

    try {
      await api.post(`/community/${post.id}/join`);
      setSuccessMsg(isRtl ? "تم إرسال طلب الانضمام للمضيف بنجاح!" : "Join request sent successfully!");
      await refreshPost();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || (isRtl ? "فشل إرسال طلب الانضمام." : "Failed to send request."));
    } finally {
      setActionLoading(false);
    }
  };

  // Leave activity
  const handleLeave = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setActionLoading(true);

    try {
      await api.post(`/community/${post.id}/leave`);
      setSuccessMsg(isRtl ? "لقد غادرت النشاط بنجاح." : "You have left the activity successfully.");
      await refreshPost();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || (isRtl ? "فشل مغادرة النشاط." : "Failed to leave activity."));
    } finally {
      setActionLoading(false);
    }
  };

  // Host: accept/reject participant
  const handleParticipantResponse = async (participantId: string, status: "ACCEPTED" | "REJECTED") => {
    setErrorMsg("");
    setSuccessMsg("");
    setActionLoading(true);

    try {
      await api.patch(`/community/participants/${participantId}`, { status });
      setSuccessMsg(
        status === "ACCEPTED"
          ? isRtl
            ? "تم قبول العضو بنجاح!"
            : "Participant accepted successfully!"
          : isRtl
          ? "تم رفض العضو."
          : "Participant rejected."
      );
      await refreshPost();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || (isRtl ? "فشل تحديث حالة العضو." : "Failed to update participant."));
    } finally {
      setActionLoading(false);
    }
  };

  // Host: cancel activity
  const handleCancelPost = async () => {
    if (!confirm(isRtl ? "هل أنت متأكد من إلغاء هذا النشاط؟" : "Are you sure you want to cancel this activity?")) return;
    setErrorMsg("");
    setSuccessMsg("");
    setActionLoading(true);

    try {
      await api.post(`/community/${post.id}/cancel`);
      setSuccessMsg(isRtl ? "تم إلغاء النشاط بنجاح." : "Activity cancelled successfully.");
      await refreshPost();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || (isRtl ? "فشل إلغاء النشاط." : "Failed to cancel activity."));
    } finally {
      setActionLoading(false);
    }
  };

  // Host: delete activity (Soft delete)
  const handleDeletePost = async () => {
    if (!confirm(isRtl ? "هل أنت متأكد من حذف هذا النشاط؟" : "Are you sure you want to delete this activity?")) return;
    setErrorMsg("");
    setSuccessMsg("");
    setActionLoading(true);

    try {
      await api.delete(`/community/${post.id}`);
      alert(isRtl ? "تم حذف النشاط بنجاح." : "Activity deleted successfully.");
      router.push(`/${locale}/community`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || (isRtl ? "فشل حذف النشاط." : "Failed to delete activity."));
      setActionLoading(false);
    }
  };

  // Report post
  const handleReportPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await api.post(`/community/${post.id}/report`, {
        reason: reportReason,
        details: reportDetails,
      });
      setSuccessMsg(isRtl ? "تم تقديم البلاغ بنجاح وسيقوم المشرفين بمراجعته." : "Report submitted successfully.");
      setReportModalOpen(false);
      setReportDetails("");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || (isRtl ? "فشل تقديم البلاغ." : "Failed to submit report."));
    }
  };

  // Rate host
  const handleRateHost = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await api.post(`/community/${post.id}/rate`, {
        rating: Number(rateValue),
      });
      setSuccessMsg(isRtl ? "شكراً لتقييمك للمضيف!" : "Thank you for rating the host!");
      setRateModalOpen(false);
      await refreshPost();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || (isRtl ? "فشل إرسال التقييم." : "Failed to submit rating."));
    }
  };

  // Open Chat
  const handleOpenChat = async () => {
    setActionLoading(true);
    try {
      const res = await api.post("/chat/conversations/private", {
        userId: post.user.id,
      });
      router.push(`/${locale}/dashboard/support?conversationId=${res.data.id}`);
    } catch (err) {
      console.error("Failed to start chat", err);
      setErrorMsg(isRtl ? "فشل بدء المحادثة مع المضيف." : "Failed to start conversation with host.");
    } finally {
      setActionLoading(false);
    }
  };

  const isExpired = new Date(post.eventDate) <= new Date() || post.status === "ARCHIVED";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link */}
        <button
          onClick={() => router.push(`/${locale}/community`)}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm font-bold font-cairo transition-all"
        >
          <ArrowRight size={16} className={isRtl ? "" : "rotate-180"} />
          <span>{isRtl ? "العودة لقسم المجتمع" : "Back to Community"}</span>
        </button>

        {/* Messages Alert Block */}
        {successMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold font-cairo border border-emerald-100 dark:border-emerald-900/50">
            <CheckCircle size={20} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold font-cairo border border-red-100 dark:border-red-900/50">
            <AlertCircle size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Details Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Top badges */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3.5 py-1.5 rounded-xl text-xs font-bold font-cairo border border-blue-100/50 dark:border-blue-900/50">
              <span>{post.category.icon}</span>
              <span>{isRtl ? post.category.nameAr : post.category.nameEn}</span>
            </span>

            {/* Statuses */}
            <div className="flex gap-2">
              <span
                className={`inline-flex px-3 py-1 rounded-xl text-xs font-bold font-cairo ${
                  post.status === "ACTIVE"
                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"
                    : post.status === "ARCHIVED"
                    ? "bg-slate-100 dark:bg-slate-700 text-slate-500"
                    : "bg-red-50 dark:bg-red-900/30 text-red-600"
                }`}
              >
                {post.status === "ACTIVE" && (isRtl ? "نشط ومتاح" : "Active")}
                {post.status === "ARCHIVED" && (isRtl ? "نشاط منتهي / مؤرشف" : "Archived")}
                {post.status === "CANCELLED" && (isRtl ? "تم إلغاء النشاط" : "Cancelled")}
                {post.status === "BLOCKED" && (isRtl ? "محظور من الإدارة" : "Blocked by Admin")}
              </span>

              <span className="inline-flex bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-xl text-xs font-semibold font-cairo text-slate-600 dark:text-slate-300">
                {isRtl ? "الجنس المطلوب: " : "Gender: "}
                {post.genderPreference === "ALL" && (isRtl ? "الجميع" : "All")}
                {post.genderPreference === "MALES_ONLY" && (isRtl ? "ذكور فقط" : "Males Only")}
                {post.genderPreference === "FEMALES_ONLY" && (isRtl ? "إناث فقط" : "Females Only")}
              </span>
            </div>
          </div>

          {/* Title & Desc */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white font-cairo">
              {post.title}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-cairo whitespace-pre-wrap leading-relaxed">
              {post.description}
            </p>
          </div>

          {/* Activity Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase font-cairo">
                {isRtl ? "الموقع الجغرافي" : "Location"}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 font-cairo">
                <MapPin size={14} className="text-blue-500" />
                {post.governorateId}، {post.cityId}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase font-cairo">
                {isRtl ? "تاريخ الفعالية" : "Event Date"}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 font-cairo">
                <Calendar size={14} className="text-blue-500" />
                {new Date(post.eventDate).toLocaleDateString(locale)}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase font-cairo">
                {isRtl ? "توقيت التجمع" : "Time Slot"}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 font-cairo">
                <Clock size={14} className="text-blue-500" />
                {post.timeSlot}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase font-cairo">
                {isRtl ? "المشاركون المقبولون" : "Accepted Slots"}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 font-cairo">
                <Users size={14} className="text-blue-500" />
                {acceptedCount} / {post.maxParticipants}
              </span>
            </div>
          </div>

          {/* Host details box */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-700 pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center">
                {post.user.avatarUrl ? (
                  <img src={post.user.avatarUrl} alt="" className="object-cover w-full h-full" />
                ) : (
                  <span className="text-sm font-bold text-slate-500">{post.user.name[0]}</span>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold font-cairo">{isRtl ? "منظم النشاط والمضيف" : "Host & Organizer"}</p>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white font-cairo">{post.user.name}</h4>
                <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-0.5">
                  <Star size={12} fill="currentColor" />
                  <span>{post.user.communityRatingAvg ? post.user.communityRatingAvg.toFixed(1) : "0.0"}</span>
                  <span className="text-slate-400">({post.user.communityReviewsCount} {isRtl ? "تقييمات" : "reviews"})</span>
                </div>
              </div>
            </div>

            {/* Interaction buttons */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
              {!isHost && isAuthenticated && (
                <button
                  onClick={() => setReportModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-500 dark:text-slate-300 font-cairo transition-all"
                >
                  <Flag size={14} />
                  {isRtl ? "إبلاغ" : "Report"}
                </button>
              )}

              {/* Host actions */}
              {isHost && post.status === "ACTIVE" && (
                <>
                  <button
                    onClick={handleCancelPost}
                    disabled={actionLoading}
                    className="px-4 py-2 border border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-xl text-xs font-bold font-cairo transition-all"
                  >
                    {isRtl ? "إلغاء النشاط" : "Cancel Activity"}
                  </button>
                  <button
                    onClick={handleDeletePost}
                    disabled={actionLoading}
                    className="flex items-center gap-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold font-cairo transition-all"
                  >
                    <Trash2 size={14} />
                    {isRtl ? "حذف نهائي" : "Delete"}
                  </button>
                </>
              )}

              {/* Guest / User actions */}
              {!isHost && (
                <>
                  {!myParticipantRecord && post.status === "ACTIVE" && (
                    <button
                      onClick={handleJoin}
                      disabled={actionLoading || isFull}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-500 rounded-xl text-xs font-bold font-cairo transition-all shadow-md shadow-blue-600/10"
                    >
                      {isFull ? (isRtl ? "مكتمل العدد" : "Full") : (isRtl ? "طلب انضمام للنشاط" : "Request to Join")}
                    </button>
                  )}

                  {isPending && (
                    <span className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs font-bold font-cairo">
                      {isRtl ? "طلبك قيد المراجعة" : "Pending Host Approval"}
                    </span>
                  )}

                  {isAccepted && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleOpenChat}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-cairo transition-all shadow-md shadow-emerald-600/10"
                      >
                        <MessageSquare size={14} />
                        {isRtl ? "بدء محادثة ثنائية" : "Start Chat"}
                      </button>

                      {!isExpired && (
                        <button
                          onClick={handleLeave}
                          disabled={actionLoading}
                          className="px-3 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-xs font-bold font-cairo transition-all"
                        >
                          {isRtl ? "مغادرة" : "Leave"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Rating available after expiration or archive */}
                  {isAccepted && isExpired && (
                    <button
                      onClick={() => setRateModalOpen(true)}
                      className="flex items-center gap-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-xs font-bold font-cairo transition-all shadow-md shadow-amber-500/10"
                    >
                      <Star size={14} fill="currentColor" />
                      {isRtl ? "تقييم المضيف" : "Rate Host"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Host Management Console: View join requests */}
        {isHost && post.status === "ACTIVE" && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white font-cairo flex items-center gap-2">
              <UserCheck size={18} className="text-blue-500" />
              {isRtl ? "طلبات الانضمام الواردة" : "Join Requests"}
            </h3>

            {post.participants.filter((p) => p.status === "PENDING").length === 0 ? (
              <p className="text-xs text-slate-400 font-cairo text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                {isRtl ? "لا توجد طلبات انضمام معلقة حالياً." : "No pending requests at the moment."}
              </p>
            ) : (
              <div className="space-y-3">
                {post.participants
                  .filter((p) => p.status === "PENDING")
                  .map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-500">
                          {participant.user.avatarUrl ? (
                            <img src={participant.user.avatarUrl} alt="" className="object-cover w-full h-full" />
                          ) : (
                            participant.user.name[0]
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white font-cairo">
                            {participant.user.name}
                          </h4>
                          <span className="text-[10px] text-amber-500 flex items-center gap-0.5 font-bold font-cairo">
                            <Star size={10} fill="currentColor" />
                            {participant.user.communityRatingAvg ? participant.user.communityRatingAvg.toFixed(1) : "0.0"}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleParticipantResponse(participant.id, "ACCEPTED")}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold font-cairo transition-all"
                        >
                          {isRtl ? "قبول" : "Accept"}
                        </button>
                        <button
                          onClick={() => handleParticipantResponse(participant.id, "REJECTED")}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 rounded-lg text-xs font-bold font-cairo transition-all"
                        >
                          {isRtl ? "رفض" : "Reject"}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Accepted Participants List */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white font-cairo flex items-center gap-2">
            <Users size={18} className="text-blue-500" />
            {isRtl ? "المشاركون المقبولون" : "Participants List"}
          </h3>

          {acceptedCount === 0 ? (
            <p className="text-xs text-slate-400 font-cairo text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              {isRtl ? "لا يوجد مشاركون مقبولون بعد." : "No accepted participants yet."}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {acceptedParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-2.5 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-slate-500">
                    {participant.user.avatarUrl ? (
                      <img src={participant.user.avatarUrl} alt="" className="object-cover w-full h-full" />
                    ) : (
                      participant.user.name[0]
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate font-cairo">
                      {participant.user.name}
                    </h4>
                    <span className="text-[10px] text-amber-500 flex items-center gap-0.5 font-bold">
                      <Star size={8} fill="currentColor" />
                      {participant.user.communityRatingAvg ? participant.user.communityRatingAvg.toFixed(1) : "0.0"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* REPORT MODAL */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
                <ShieldAlert size={18} className="text-red-500" />
                {isRtl ? "تقديم بلاغ عن محتوى غير لائق" : "Submit Abuse Report"}
              </h3>
              <button
                onClick={() => setReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReportPost} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">
                  {isRtl ? "سبب البلاغ" : "Report Reason"}
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white font-cairo"
                >
                  <option value="SPAM">{isRtl ? "محتوى عشوائي / مزعج (Spam)" : "Spam"}</option>
                  <option value="HARASSMENT">{isRtl ? "إساءة أو مضايقة (Harassment)" : "Harassment"}</option>
                  <option value="INAPPROPRIATE">{isRtl ? "محتوى غير لائق أخلاقياً" : "Inappropriate Content"}</option>
                  <option value="FAKE">{isRtl ? "نشاط وهمي أو كاذب" : "Fake Activity"}</option>
                  <option value="OTHER">{isRtl ? "أسباب أخرى..." : "Other..."}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-cairo">
                  {isRtl ? "التفاصيل" : "Abuse Details"} {reportReason === "OTHER" && "*"}
                </label>
                <textarea
                  placeholder={isRtl ? "وضح الأسباب بالتفصيل لمساعدة الإدارة..." : "Abuse details..."}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={3}
                  required={reportReason === "OTHER"}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white font-cairo"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all text-sm font-cairo"
              >
                {isRtl ? "إرسال البلاغ فوراً" : "Submit Report"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RATE MODAL */}
      {rateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
                <Star size={18} className="text-amber-500" />
                {isRtl ? "تقييم منظم الفعالية" : "Rate Organizer"}
              </h3>
              <button
                onClick={() => setRateModalOpen(false)}
                className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRateHost} className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo text-center leading-relaxed">
                {isRtl
                  ? "كيف كانت تجربتك مع هذا المضيف؟ يرجى تحديد تقييم بالنجوم من 1 (سيء) إلى 5 (ممتاز)."
                  : "How was your coliving gathering with this host? Leave a star rating from 1 to 5."}
              </p>

              <div className="flex justify-center gap-2 py-3 text-amber-500">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRateValue(val)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      size={36}
                      fill={val <= rateValue ? "currentColor" : "none"}
                      stroke="currentColor"
                    />
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-sm font-cairo"
              >
                {isRtl ? "تقديم التقييم" : "Submit Rating"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
