// apps/frontend/src/app/[locale]/admin/account-lifecycle/page.tsx
"use client";

import React, { useState } from "react";

import {
  RotateCcw,
  Search,
  RefreshCcw,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  X,
  Eye,
  AlertTriangle,
  UserX,
} from "lucide-react";
import {
  useAdminAccountLifecycle,
  useRestoreAccount,
  usePurgeAccount,
} from "@/hooks/useAdmin";
import { Avatar, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";

export default function AdminAccountLifecyclePage() {
  const locale = useLocale();
  const tLife = useTranslations("admin.accountLifecycle");
  const tCommon = useTranslations("common");
  const isRtl = locale === "ar";
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"IN_GRACE_PERIOD" | "RESTORED" | "CANCELLED">("IN_GRACE_PERIOD");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Queries & Mutations
  const { data, isLoading, isError, refetch } = useAdminAccountLifecycle(
    activeTab,
    searchTerm,
    page,
    20
  );

  const restoreMutation = useRestoreAccount();
  const purgeMutation = usePurgeAccount();

  // Selected User Drawer & Purge Modal State
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [purgeTargetUser, setPurgeTargetUser] = useState<any | null>(null);
  const [confirmTypedText, setConfirmTypedText] = useState("");
  const usersList = data?.users ?? [];

  const formatDate = (d?: string) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateRemainingDays = (scheduledDate?: string) => {
    if (!scheduledDate) return 0;
    const diffMs = new Date(scheduledDate).getTime() - new Date().getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const handleRestoreUserAction = (userId: string) => {
    restoreMutation.mutate(
      { userId, reason: "تمت الاستعادة بطلب من الأدمن عبر لوحة دورة الحياة" },
      {
        onSuccess: () => {
          toast({ type: "success", description: "تم استعادة الحساب وتفعيله بنجاح مرة أخرى" });
          setSelectedUser(null);
          refetch();
        },
        onError: (err: any) => {
          toast({
            type: "error",
            description: err.response?.data?.message || "حدث خطأ أثناء استعادة الحساب.",
          });
        },
      }
    );
  };

  const handlePurgeUserAction = () => {
    if (!purgeTargetUser) return;
    if (confirmTypedText.trim().toUpperCase() !== "DELETE" && confirmTypedText.trim() !== "حذف نهائي") {
      toast({ type: "error", description: 'يرجى كتابة "DELETE" أو "حذف نهائي" للتأكيد.' });
      return;
    }

    purgeMutation.mutate(purgeTargetUser.id, {
      onSuccess: () => {
        toast({ type: "success", description: "تم تطهير وتجهيل بيانات الحساب بنجاح" });
        setPurgeTargetUser(null);
        setConfirmTypedText("");
        setSelectedUser(null);
        refetch();
      },
      onError: (err: any) => {
        toast({
          type: "error",
          description: err.response?.data?.message || "حدث خطأ أثناء التطهير.",
        });
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-3xl overflow-hidden shadow-xs font-cairo">
      {/* Top Banner */}
      <div className="bg-slate-900 p-5 flex items-center justify-between flex-wrap gap-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <UserX size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">{tLife("title")}</h1>
            <p className="text-[11px] text-white/60">{tLife("subtitle")}</p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold self-end sm:self-center"
        >
          <RefreshCcw size={15} className={isLoading ? "animate-spin" : ""} />
          <span>{tCommon("refresh")}</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="bg-surface-secondary border-b border-border p-4 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 bg-surface p-1 rounded-2xl border border-border w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab("IN_GRACE_PERIOD");
              setPage(1);
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
              activeTab === "IN_GRACE_PERIOD" ? "bg-status-warning text-white shadow-xs" : "text-text-secondary hover:text-text"
            )}
          >
            <Clock size={14} />
            <span>{tLife("inGracePeriod")}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("RESTORED");
              setPage(1);
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
              activeTab === "RESTORED" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <CheckCircle2 size={14} />
            <span>{tLife("restored")}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("CANCELLED");
              setPage(1);
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
              activeTab === "CANCELLED" ? "bg-slate-700 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <XCircle size={14} />
            <span>{tLife("cancelled")}</span>
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder={isRtl ? "بحث باسم الحساب، رقم الهاتف، أو الإيميل..." : "Search by name, phone or email..."}
            className="w-full ps-9 pe-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500 transition-all"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <Loader2 size={24} className="animate-spin mb-2 text-amber-600" />
            <span className="text-xs font-bold">{tCommon("loading")}</span>
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-rose-600 text-xs font-bold flex flex-col items-center">
            <AlertCircle size={24} className="mb-2" />
            <span>{tCommon("error")}</span>
          </div>
        ) : usersList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <RotateCcw size={24} />
            </div>
            <h4 className="font-bold text-sm text-slate-800">{tLife("emptyStateTitle")}</h4>
            <p className="text-xs max-w-sm">{tLife("emptyStateDesc")}</p>
          </div>
        ) : (
          <div className="w-full">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-4 text-start">صاحب الحساب</th>
                    <th className="py-3 px-4 text-start">التواصل</th>
                    <th className="py-3 px-4 text-start">تاريخ الطلب</th>
                    <th className="py-3 px-4 text-center">الوقت المتبقي في السماح</th>
                    <th className="py-3 px-4 text-start">الحالة الحالية</th>
                    <th className="py-3 px-4 text-end">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium bg-white">
                  {usersList.map((usr: any) => {
                    const daysLeft = calculateRemainingDays(usr.scheduledFinalDeleteAt);

                    return (
                      <tr key={usr.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar src={usr.avatarUrl} name={usr.name} size="sm" />
                            <div>
                              <h4 className="font-bold text-slate-900 truncate max-w-[150px]">{usr.name}</h4>
                              <span className="text-[10px] text-slate-400 font-semibold">{usr.role}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-slate-600 space-y-0.5">
                            <span className="block font-semibold dir-ltr text-start">{usr.phone || "-"}</span>
                            <span className="block text-[10px] text-slate-400 dir-ltr text-start">{usr.email || ""}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-500 dir-ltr text-start">
                          {formatDate(usr.deletedAt || usr.updatedAt)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {usr.deletionStatus === "IN_GRACE_PERIOD" ? (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] inline-flex items-center gap-1">
                              <Clock size={12} />
                              <span>متبقي {daysLeft} يوماً</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {usr.deletionStatus === "IN_GRACE_PERIOD" && (
                            <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                              في فترة السماح
                            </span>
                          )}
                          {usr.deletionStatus === "RESTORED" && (
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                              تمت الاستعادة
                            </span>
                          )}
                          {usr.deletionStatus === "CANCELLED" && (
                            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[11px]">
                              ملغى
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-end">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedUser(usr)}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Eye size={14} />
                              <span>التفاصيل</span>
                            </button>

                            {usr.deletionStatus === "IN_GRACE_PERIOD" && (
                              <button
                                onClick={() => handleRestoreUserAction(usr.id)}
                                disabled={restoreMutation.isPending}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs disabled:opacity-50"
                              >
                                <RotateCcw size={13} />
                                <span>استعادة</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden p-4 space-y-3">
              {usersList.map((usr: any) => {
                const daysLeft = calculateRemainingDays(usr.scheduledFinalDeleteAt);

                return (
                  <div key={usr.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar src={usr.avatarUrl} name={usr.name} size="md" />
                        <div>
                          <h4 className="font-bold text-xs text-slate-900">{usr.name}</h4>
                          <span className="text-[11px] font-semibold text-slate-500 dir-ltr">{usr.phone || "-"}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedUser(usr)}
                        className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 cursor-pointer"
                      >
                        <Eye size={16} />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      {usr.deletionStatus === "IN_GRACE_PERIOD" && (
                        <span className="text-amber-700 font-bold">متبقي {daysLeft} يوماً في السماح</span>
                      )}
                      {usr.deletionStatus === "RESTORED" && <span className="text-emerald-600 font-bold">حساب مستعاد</span>}

                      {usr.deletionStatus === "IN_GRACE_PERIOD" && (
                        <button
                          onClick={() => handleRestoreUserAction(usr.id)}
                          className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                        >
                          استعادة
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Inspection Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end font-cairo">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">تفاصيل سجل الحساب</h3>
                  <p className="text-[11px] text-slate-400">معلومات دورة الحياة وفترة السماح</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* User Identity */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
                <Avatar src={selectedUser.avatarUrl} name={selectedUser.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate mb-1">{selectedUser.name}</h4>
                  <p className="text-xs font-medium text-slate-500 dir-ltr text-start mb-1">{selectedUser.email || "لا يوجد إيميل"}</p>
                  <span className="text-xs font-semibold text-slate-600 dir-ltr text-start block">{selectedUser.phone || "لا يوجد رقم"}</span>
                </div>
              </div>

              {/* Lifecycle Audit Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                  <span className="text-slate-500 font-medium">تاريخ طلب الحذف:</span>
                  <span className="font-semibold text-slate-800 dir-ltr">{formatDate(selectedUser.deletedAt)}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                  <span className="text-slate-500 font-medium">تاريخ المعالجة النهائية المقرر:</span>
                  <span className="font-semibold text-slate-800 dir-ltr">{formatDate(selectedUser.scheduledFinalDeleteAt)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">الحالة الحالية:</span>
                  <span className="font-bold text-amber-700">{selectedUser.deletionStatus || "نشط"}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons in Drawer */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0 space-y-2">
              {selectedUser.deletionStatus === "IN_GRACE_PERIOD" && (
                <button
                  onClick={() => handleRestoreUserAction(selectedUser.id)}
                  disabled={restoreMutation.isPending}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw size={16} />
                  <span>إلغاء الحذف واستعادة الحساب الآن</span>
                </button>
              )}

              <button
                onClick={() => setPurgeTargetUser(selectedUser)}
                className="w-full py-2.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 size={15} />
                <span>تنفيذ التطهير الفوري (Purge)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Typed Confirmation Purge Modal */}
      {purgeTargetUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-cairo">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">تأكيد التطهير النهائي للحساب</h3>
                <p className="text-xs text-slate-500">عملية قاطعة غير قابلة للتراجع</p>
              </div>
            </div>

            <div className="bg-status-danger/15 border border-status-danger/30 rounded-xl p-3.5 text-xs text-status-danger space-y-1.5 leading-relaxed">
              <p className="font-bold">
                أنت على وشك تنفيذ التطهير والتجهيل العام لبيانات <span className="underline font-black">&quot;{purgeTargetUser.name}&quot;</span>.
              </p>
              <p className="text-status-danger text-[11px]">
                سيتم مسح الأصول وصورة الحساب وتعديل اسمه لـ &quot;مستخدم محذوف&quot;. لن تتم إزالة العقود التاريخية لتفادي انكسار السجلات.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-text mb-1">
                اكتب كلمة <span className="font-black text-status-danger dir-ltr">&quot;DELETE&quot;</span> للموافقة قسراً:
              </label>
              <input
                type="text"
                value={confirmTypedText}
                onChange={(e) => setConfirmTypedText(e.target.value)}
                placeholder='اكتب "DELETE" هنا...'
                className="w-full bg-surface-secondary border border-border rounded-xl p-2.5 text-xs font-bold text-text focus:outline-none focus:border-status-danger"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPurgeTargetUser(null);
                  setConfirmTypedText("");
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handlePurgeUserAction}
                disabled={purgeMutation.isPending || (confirmTypedText.trim().toUpperCase() !== "DELETE" && confirmTypedText.trim() !== "حذف نهائي")}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                {purgeMutation.isPending ? "جارٍ التطهير..." : "تأكيد التطهير الفوري"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
