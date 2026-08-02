// apps/frontend/src/app/[locale]/dashboard/profile/page.tsx
"use client";

import React, { useState, useRef, useMemo } from "react";
import { useLocale } from "next-intl";
import { useAuthGuard } from "@/features/auth";
import {
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
  useUploadIdCard,
  useChangePassword,
  useDeleteAccount,
} from "@/features/profile";
import { useQueryClient } from "@tanstack/react-query";
import { authRepository } from "@/features/auth";

import TenantLayout from "@/components/layout/TenantLayout";
import LandlordLayout from "@/components/layout/LandlordLayout";
import { getIdentityVerificationStatus, IdentityVerificationStatus } from "@/types";
import {
  Spinner,
  Button,
  Input,
  PasswordInput,
  useToast,
  Avatar,
} from "@/components/ui";
import {
  User as UserIcon,
  Upload,
  Clock,
  AlertCircle,
  Camera,
  Mail,
  MessageSquare,
  Bell,
  Trash2,
  Laptop,
  Settings,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Calendar,
  BadgeCheck,
  Phone,
  ShieldAlert,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import {
  usePushSubscriptions,
  useSubscribePush,
  useUnsubscribePush,
  useDeleteSubscriptionDevice,
} from "@/hooks/usePushNotifications";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";

// Zod schemas getter
const getProfileSchema = (isEn: boolean) =>
  z.object({
    name: z.string().min(2, isEn ? "Name must be at least 2 characters" : "الاسم يجب أن يكون ثنائيًا على الأقل"),
  });

const getPasswordSchema = (isEn: boolean) =>
  z
    .object({
      currentPassword: z.string().min(1, isEn ? "Current password is required" : "كلمة المرور الحالية مطلوبة"),
      newPassword: z.string().min(6, isEn ? "New password must be at least 6 characters" : "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل"),
      confirmPassword: z.string().min(1, isEn ? "Password confirmation is required" : "تأكيد كلمة المرور الجديد مطلوب"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: isEn ? "Passwords do not match" : "كلمتا المرور غير متطابقتين",
      path: ["confirmPassword"],
    });

type ProfileValues = { name: string };
type PasswordValues = { currentPassword: string; newPassword: string; confirmPassword: string };

// ─── Settings Tab Type ───────────────────────────────────────────────────────
type SettingsTab = "personal" | "identity" | "security" | "notifications" | "danger";

const SETTINGS_TABS: { id: SettingsTab; labelAr: string; labelEn: string; icon: React.ReactNode; danger?: boolean }[] = [
  { id: "personal",      labelAr: "البيانات الشخصية",  labelEn: "Personal Info",           icon: <UserIcon size={15} /> },
  { id: "identity",      labelAr: "توثيق الهوية",       labelEn: "Identity Verification",  icon: <ShieldCheck size={15} /> },
  { id: "security",      labelAr: "كلمة المرور",        labelEn: "Password",               icon: <KeyRound size={15} /> },
  { id: "notifications", labelAr: "الإشعارات والـ OTP", labelEn: "Notifications & OTP",     icon: <Bell size={15} /> },
  { id: "danger",        labelAr: "حذف الحساب",         labelEn: "Delete Account",         icon: <Trash2 size={15} />, danger: true },
];

export default function ProfilePage() {
  const locale = useLocale();
  const isEn = locale === "en";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<"overview" | "settings">("overview");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("personal");

  // Telegram linking state
  const [telegramCode, setTelegramCode] = useState<string>("");
  const [, setTelegramLinked] = useState<boolean>(false);
  const [checkingLink, setCheckingLink] = useState<boolean>(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const startLinkPolling = (code: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setCheckingLink(true);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await authRepository.checkTelegramLinkStatus(code);
        if (res.linked) {
          setTelegramLinked(true);
          setCheckingLink(false);
          if (pollingRef.current) clearInterval(pollingRef.current);
          toast({
            title: isEn ? "Link Successful" : "نجاح الربط",
            description: isEn ? "Telegram account linked successfully!" : "تم ربط حساب تليجرام بنجاح!",
            type: "success",
          });
          queryClient.invalidateQueries({ queryKey: ["users", "profile"] });
          queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        }
      } catch { /* quiet poll */ }
    }, 3000);
  };

  const handleGenerateTelegramCode = async () => {
    try {
      const identifier = user?.phone || user?.email || user?.id || "";
      const res = await authRepository.generateTelegramLinkCode(identifier);
      const code = res.linkCode;
      if (code) { setTelegramCode(code); startLinkPolling(code); }
    } catch (err: any) {
      toast({
        title: isEn ? "Error" : "خطأ",
        description: err.response?.data?.message || (isEn ? "An error occurred." : "حدث خطأ."),
        type: "error",
      });
    }
  };

  const handleUnlinkTelegram = async () => {
    try {
      await authRepository.unlinkTelegram();
      setTelegramLinked(false);
      setTelegramCode("");
      if (pollingRef.current) clearInterval(pollingRef.current);
      toast({
        title: isEn ? "Unlinked Successfully" : "تم إلغاء الربط",
        description: isEn ? "Telegram account unlinked successfully." : "تم إلغاء ربط تليجرام بنجاح.",
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["users", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    } catch (err: any) {
      toast({
        title: isEn ? "Error" : "خطأ",
        description: err.response?.data?.message || (isEn ? "An error occurred." : "حدث خطأ."),
        type: "error",
      });
    }
  };

  const handleOtpChannelChange = async (channel: "EMAIL" | "TELEGRAM") => {
    if (channel === "TELEGRAM" && !user?.telegramChatId) {
      toast({
        title: isEn ? "Not Linked" : "غير مربوط",
        description: isEn ? "Please link the Telegram bot first." : "يرجى ربط البوت بتليجرام أولاً.",
        type: "error",
      });
      return;
    }
    try {
      const res = await authRepository.updateOtpChannel(channel);
      toast({
        title: isEn ? "Updated" : "تم التحديث",
        description: res.data?.message || (isEn ? "OTP receiving channel updated." : "تم تحديث قناة استقبال الرمز."),
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["users", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    } catch (err: any) {
      toast({
        title: isEn ? "Error" : "خطأ",
        description: err.response?.data?.message || (isEn ? "An error occurred." : "حدث خطأ."),
        type: "error",
      });
    }
  };

  const { user: guardUser, isLoading: isAuthLoading } = useAuthGuard({ requiredRoles: ["tenant", "landlord"] });
  const { data: userProfile, isLoading: isProfileLoading } = useProfile();

  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();
  const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useUploadAvatar();
  const { mutate: uploadIdCard, isPending: isUploadingIdCard } = useUploadIdCard();
  const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword();
  const { mutate: deleteAccount, isPending: isDeletingAccount } = useDeleteAccount();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReasonNote, setDeleteReasonNote] = useState("");

  const handleConfirmSelfDelete = () => {
    deleteAccount(deleteReasonNote, {
      onSuccess: (res: any) => {
        toast({
          title: isEn ? "Request Submitted" : "تم تقديم الطلب",
          description: res?.message || (isEn ? "Your request has been registered and entered grace period." : "تم تسجيل طلبك ودخل الحساب فترة السماح."),
          type: "success",
        });
        setShowDeleteModal(false);
      },
      onError: (err: any) => {
        toast({
          title: isEn ? "Account Status Conflict" : "تعارض في حالة الحساب",
          description: err.response?.data?.message || err.message || (isEn ? "Account deletion request failed." : "فشل طلب حذف الحساب."),
          type: "error",
        });
      },
    });
  };

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const { data: pushDevices = [] } = usePushSubscriptions();
  const { mutate: subscribeDevice, isPending: isSubscribingDevice } = useSubscribePush();
  const { mutate: unsubscribeDevice, isPending: isUnsubscribingDevice } = useUnsubscribePush();
  const { mutate: deleteDevice } = useDeleteSubscriptionDevice();

  React.useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleTogglePush = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast({
        title: isEn ? "Not Supported" : "غير مدعوم",
        description: isEn ? "Push notifications are not supported in your browser." : "إشعارات الدفع غير مدعومة في متصفحك.",
        type: "error",
      });
      return;
    }
    if (notificationPermission === "denied") {
      toast({
        title: isEn ? "Permission Denied" : "الإذن مرفوض",
        description: isEn ? "Please change notification permission settings in your browser." : "يرجى تغيير إعدادات إذن الإشعارات من المتصفح.",
        type: "error",
      });
      return;
    }
    if (notificationPermission === "granted") {
      unsubscribeDevice(undefined, {
        onSuccess: () => {
          setNotificationPermission("default");
          toast({
            title: isEn ? "Disabled" : "تم التعطيل",
            description: isEn ? "Push notifications disabled for this device." : "تم إلغاء تفعيل إشعارات الدفع على هذا الجهاز.",
            type: "success",
          });
        },
      });
    } else {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        subscribeDevice(undefined, {
          onSuccess: () => toast({
            title: isEn ? "Enabled" : "تم التفعيل",
            description: isEn ? "Push notifications enabled successfully!" : "تم تفعيل إشعارات الدفع بنجاح!",
            type: "success",
          }),
          onError: (err: any) => toast({
            title: isEn ? "Activation Error" : "خطأ التفعيل",
            description: err.message,
            type: "error",
          }),
        });
      }
    }
  };

  const handleDeleteDevice = (id: string) => {
    deleteDevice(id, {
      onSuccess: () => toast({
        title: isEn ? "Deleted" : "تم الحذف",
        description: isEn ? "Device removed." : "تمت إزالة الجهاز.",
        type: "success",
      }),
      onError: (err: any) => toast({
        title: isEn ? "Error" : "خطأ",
        description: err.message,
        type: "error",
      }),
    });
  };

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const idCardInputRef = useRef<HTMLInputElement>(null);

  const profileSchema = useMemo(() => getProfileSchema(isEn), [isEn]);
  const passwordSchema = useMemo(() => getPasswordSchema(isEn), [isEn]);

  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: userProfile ? { name: userProfile.name } : undefined,
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPasswordForm, formState: { errors: passwordErrors } } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const isLoading = isAuthLoading || isProfileLoading;
  if (isLoading || !guardUser) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const user = userProfile || guardUser;
  const Layout = user.role === "landlord" ? LandlordLayout : TenantLayout;

  const onProfileSave = (data: ProfileValues) => {
    updateProfile(data, {
      onSuccess: () => toast({
        title: isEn ? "Updated" : "تم التحديث",
        description: isEn ? "Your personal info has been saved." : "تم حفظ بياناتك الشخصية بنجاح.",
        type: "success",
      }),
      onError: (err) => toast({
        title: isEn ? "Update Failed" : "فشل التحديث",
        description: err.message,
        type: "error",
      }),
    });
  };

  const onPasswordSave = (data: PasswordValues) => {
    changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword, confirmPassword: data.confirmPassword }, {
      onSuccess: () => {
        toast({
          title: isEn ? "Password Changed" : "تم تغيير كلمة المرور",
          description: isEn ? "Password updated successfully." : "تم تحديث كلمة المرور بنجاح.",
          type: "success",
        });
        resetPasswordForm();
      },
      onError: (err: any) => toast({
        title: isEn ? "Password Change Failed" : "فشل تغيير كلمة المرور",
        description: err.friendlyMessage || err.response?.data?.message || err.message || (isEn ? "Make sure current password is correct." : "تأكد من صحة كلمة المرور الحالية."),
        type: "error",
      }),
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: isEn ? "File Too Large" : "حجم الملف كبير",
        description: isEn ? "Maximum limit is 5MB." : "الحد الأقصى 5 ميجابايت.",
        type: "error",
      });
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({
        title: isEn ? "Unsupported Format" : "صيغة غير مدعومة",
        description: isEn ? "Please select JPEG, PNG, or WEBP." : "يرجى اختيار JPEG أو PNG أو WEBP.",
        type: "error",
      });
      return;
    }
    uploadAvatar(file, {
      onSuccess: () => toast({
        title: isEn ? "Photo Uploaded" : "تم رفع الصورة",
        description: isEn ? "Your profile picture has been updated." : "تم تحديث صورتك الشخصية.",
        type: "success",
      }),
      onError: (err) => toast({
        title: isEn ? "Upload Failed" : "فشل الرفع",
        description: err.message,
        type: "error",
      }),
    });
  };

  const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: isEn ? "File Too Large" : "حجم الملف كبير",
        description: isEn ? "Maximum limit is 10MB." : "الحد الأقصى 10 ميجابايت.",
        type: "error",
      });
      return;
    }
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
      toast({
        title: isEn ? "Unsupported Format" : "صيغة غير مدعومة",
        description: isEn ? "Please select JPEG, PNG, or PDF." : "يرجى اختيار JPEG أو PNG أو PDF.",
        type: "error",
      });
      return;
    }
    uploadIdCard(file, {
      onSuccess: () => toast({
        title: isEn ? "ID Document Uploaded" : "تم رفع وثيقة الهوية",
        description: isEn ? "ID card sent to admin for review." : "تم إرسال البطاقة للأدمن للمراجعة.",
        type: "success",
      }),
      onError: (err) => toast({
        title: isEn ? "Upload Failed" : "فشل الرفع",
        description: err.message,
        type: "error",
      }),
    });
  };

  const verificationStatusCode: IdentityVerificationStatus = getIdentityVerificationStatus(user);
  const getBadgeConfig = (status: IdentityVerificationStatus) => {
    switch (status) {
      case "verified":  return {
        label: isEn ? "Officially Verified" : "موثق رسمياً",
        color: "bg-status-success/15 text-status-success border-status-success/30",
        icon: <BadgeCheck size={13} className="text-status-success" />,
        description: isEn ? "Your identity is verified — your account displays a trust badge to all parties." : "هويتك موثّقة ومعتمدة — يظهر حسابك بعلامة الثقة لدى جميع أطراف التعاملات."
      };
      case "pending":   return {
        label: isEn ? "Under Review" : "قيد المراجعة",
        color: "bg-status-warning/15 text-status-warning border-status-warning/30",
        icon: <Clock size={13} className="text-status-warning" />,
        description: isEn ? "We received your document and it is in the review queue. We will notify you once completed." : "وصلتنا وثيقتك وهي في طابور المراجعة. سنُبلّغك فور الانتهاء."
      };
      case "rejected":  return {
        label: isEn ? "Rejected" : "مرفوضة",
        color: "bg-status-danger/15 text-status-danger border-status-danger/30",
        icon: <XCircle size={13} className="text-status-danger" />,
        description: isEn ? "The submitted document was not accepted. Please re-upload a clear photo of your ID card." : "الوثيقة المُرسلة لم تُقبل. يرجى إعادة رفع صورة واضحة لبطاقة الهوية."
      };
      default:          return {
        label: isEn ? "Unverified" : "غير موثق",
        color: "bg-surface-tertiary text-text-secondary border-border",
        icon: <ShieldAlert size={13} className="text-text-tertiary" />,
        description: isEn ? "No ID document uploaded yet. Verification builds trust with other parties." : "لم يُرفع مستند هوية بعد. التوثيق يعزّز ثقة الأطراف الأخرى بك."
      };
    }
  };

  const badgeConfig = getBadgeConfig(verificationStatusCode);

  const formattedJoinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(isEn ? "en-US" : "ar-EG", { year: "numeric", month: "long", day: "numeric" })
    : "-";

  const roleLabel = isEn
    ? (user.role === "landlord" ? "Landlord" : user.role === "admin" ? "Platform Admin" : "Tenant")
    : (user.role === "landlord" ? "مؤجر عقارات" : user.role === "admin" ? "مدير المنصة" : "مستأجر");

  return (
    <Layout>
      {/* Hidden File Inputs */}
      <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/jpeg,image/png,image/webp" className="hidden" />
      <input type="file" ref={idCardInputRef} onChange={handleIdCardChange} accept="image/jpeg,image/png,application/pdf" className="hidden" />

      <div className="max-w-3xl mx-auto font-cairo">

        {/* ══════════════════════════════════════════════════════════
            VIEW 1: OVERVIEW
        ══════════════════════════════════════════════════════════ */}
        {viewMode === "overview" && (
          <div className="space-y-5">

            {/* ── Profile Hero Card ──────────────────────────────── */}
            <div className="relative bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
              {/* Subtle top accent */}
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

              <div className="p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Avatar */}
                <div className="relative shrink-0 group">
                  <Avatar src={user.avatarUrl} name={user.name} size="xl" className="border border-slate-200 shadow-sm" />
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-slate-950/50 rounded-full flex items-center justify-center z-10">
                      <Spinner size="sm" className="text-white" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center shadow-md border-2 border-white transition-transform hover:scale-110 cursor-pointer"
                  >
                    <Camera size={13} />
                  </button>
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-start space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-xl font-black text-slate-900 truncate">{user.name}</h1>
                    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border", badgeConfig.color)}>
                      {badgeConfig.icon}
                      {badgeConfig.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[12px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <UserIcon size={13} className="text-blue-500" />
                      {roleLabel}
                    </span>
                    <span className="w-px h-3.5 bg-slate-200 hidden sm:block" />
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-indigo-500" />
                      {isEn ? `Member since ${formattedJoinedDate}` : `عضو منذ ${formattedJoinedDate}`}
                    </span>
                  </div>
                </div>

                {/* Settings Button */}
                <button
                  onClick={() => setViewMode("settings")}
                  className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[12px] font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Settings size={15} />
                  {isEn ? "Account Settings" : "إعدادات الحساب"}
                </button>
              </div>
            </div>

            {/* ── Info Grid ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: isEn ? "Name" : "الاسم",                   value: user.name,                                                   icon: <UserIcon size={15} className="text-blue-500" /> },
                { label: isEn ? "Phone Number" : "رقم الجوال",      value: user.phone || "—",                                           icon: <Phone size={15} className="text-emerald-500" />, ltr: true },
                { label: isEn ? "Email" : "البريد",                  value: user.email || (isEn ? "Not Registered" : "غير مُسجَّل"),    icon: <Mail size={15} className="text-violet-500" />, ltr: true },
                { label: isEn ? "Identity Verification" : "توثيق الهوية", value: badgeConfig.label,                                      icon: <ShieldCheck size={15} className="text-amber-500" /> },
              ].map((item) => (
                <div key={item.label} className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{item.label}</p>
                    <p className={cn("text-[13px] font-bold text-slate-800 truncate", item.ltr && "dir-ltr text-start")}>
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW 2: SETTINGS
        ══════════════════════════════════════════════════════════ */}
        {viewMode === "settings" && (
          <div className="flex flex-col gap-0" style={{ height: "calc(100vh - 120px)", minHeight: 0 }}>

            {/* ── Settings Header ────────────────────────────────── */}
            <div className="flex items-center gap-3 pb-4 shrink-0">
              <button
                onClick={() => setViewMode("overview")}
                className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowRight size={15} className={cn(isEn && "rotate-180")} />
                {isEn ? "Back to Profile" : "العودة للملف الشخصي"}
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-[12px] font-bold text-slate-900">{isEn ? "Account Settings" : "إعدادات الحساب"}</span>
            </div>

            {/* ── Two-Column Layout: Sidebar + Content ─────────── */}
            <div className="flex gap-2 sm:gap-4 flex-1 min-h-0">

              {/* Sidebar Tabs */}
              <div className="w-12 sm:w-36 shrink-0 flex flex-col gap-1">
                {SETTINGS_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSettingsTab(tab.id)}
                    title={isEn ? tab.labelEn : tab.labelAr}
                    className={cn(
                      "flex items-center justify-center sm:justify-start gap-2.5 px-2 sm:px-3.5 py-2.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer w-full",
                      tab.danger
                        ? settingsTab === tab.id
                          ? "bg-rose-600 text-white shadow-sm"
                          : "text-rose-600 hover:bg-rose-50"
                        : settingsTab === tab.id
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{isEn ? tab.labelEn : tab.labelAr}</span>
                  </button>
                ))}
              </div>

              {/* Content Panel */}
              <div className="flex-1 min-w-0 overflow-y-auto rounded-2xl">

                {/* ── TAB: Personal Data ─────────────────────────── */}
                {settingsTab === "personal" && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
                    <div className="border-b border-slate-100 pb-4">
                      <h2 className="font-bold text-[15px] text-slate-900">{isEn ? "Personal Information" : "البيانات الشخصية"}</h2>
                      <p className="text-[12px] text-slate-500 mt-0.5">{isEn ? "Your name appears on contracts and viewings — make sure it is correct." : "اسمك هو ما يظهر في العقود والمعاينات — تأكد من كتابته بشكل صحيح."}</p>
                    </div>
                    <form onSubmit={handleProfileSubmit(onProfileSave)} className="space-y-4">
                      <div>
                        <label className="block text-[12px] font-bold text-slate-700 mb-1.5">{isEn ? "Full Name" : "الاسم الكامل"}</label>
                        <Input {...registerProfile("name")} error={profileErrors.name?.message} placeholder={isEn ? "e.g. John Doe" : "مثال: أحمد محمد علي"} />
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium text-slate-400 mb-1.5">{isEn ? "Phone Number" : "رقم الجوال"} <span className="font-normal text-slate-300">{isEn ? "· Contact support to change" : "· للتعديل تواصل مع الدعم"}</span></label>
                        <Input value={user.phone || ""} disabled className="bg-slate-50/60 text-slate-400 cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium text-slate-400 mb-1.5">{isEn ? "Email Address" : "البريد الإلكتروني"} <span className="font-normal text-slate-300">{isEn ? "· Contact support to change" : "· للتعديل تواصل مع الدعم"}</span></label>
                        <Input value={user.email || ""} disabled className="bg-slate-50/60 text-slate-400 cursor-not-allowed" />
                      </div>
                      <div className="pt-1">
                        <Button type="submit" loading={isUpdatingProfile} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[12px] rounded-xl">
                          {isEn ? "Save Name" : "حفظ الاسم"}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* ── TAB: Identity Verification ─────────────────── */}
                {settingsTab === "identity" && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
                    <div className="border-b border-slate-100 pb-4">
                      <h2 className="font-bold text-[15px] text-slate-900">{isEn ? "National Identity Verification" : "توثيق الهوية الوطنية"}</h2>
                      <p className="text-[12px] text-slate-500 mt-0.5">{isEn ? "Verified identity accounts get priority in rental request approvals." : "حسابات الهوية الموثّقة تحصل على أولوية في قبول طلبات الإيجار."}</p>
                    </div>

                    {/* Status Badge */}
                    <div className={cn("flex items-start gap-2.5 p-3.5 rounded-xl border text-[12px]", badgeConfig.color)}>
                      <span className="mt-0.5">{badgeConfig.icon}</span>
                      <div>
                        <p className="font-bold">{badgeConfig.label}</p>
                        <p className="opacity-80 mt-0.5 text-[11px]">{badgeConfig.description}</p>
                      </div>
                    </div>

                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center gap-3 bg-slate-50/60 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center shadow-sm">
                        <Upload size={22} />
                      </div>
                      <div>
                        <p className="font-bold text-[13px] text-slate-800">{isEn ? "Upload National ID Photo" : "رفع صورة الهوية الوطنية"}</p>
                        <p className="text-[11px] text-slate-500 mt-1">{isEn ? "Accepted Formats: JPG · PNG · PDF  ·  Max Size 10 MB" : "صيغ مقبولة: JPG · PNG · PDF &nbsp;·&nbsp; الحجم الأقصى 10 MB"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => idCardInputRef.current?.click()}
                        disabled={isUploadingIdCard}
                        className="mt-1 px-5 py-2.5 bg-slate-900 hover:bg-slate-700 text-white font-bold text-[12px] rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
                      >
                        {isUploadingIdCard ? <Spinner size="sm" className="text-white" /> : <Upload size={14} />}
                        {isUploadingIdCard ? (isEn ? "Uploading..." : "جارٍ الرفع...") : (isEn ? "Select ID File" : "اختر ملف الهوية")}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── TAB: Security / Password ───────────────────── */}
                {settingsTab === "security" && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
                    <div className="border-b border-slate-100 pb-4">
                      <h2 className="font-bold text-[15px] text-slate-900">{isEn ? "Password" : "كلمة المرور"}</h2>
                      <p className="text-[12px] text-slate-500 mt-0.5">{isEn ? "We recommend changing your password periodically to keep your account secure." : "ننصح بتغيير كلمة المرور دورياً للحفاظ على أمان حسابك."}</p>
                    </div>
                    <form onSubmit={handlePasswordSubmit(onPasswordSave)} className="space-y-4" autoComplete="off">
                      <div>
                        <label className="block text-[12px] font-bold text-slate-700 mb-1.5">{isEn ? "Current Password" : "كلمة المرور الحالية"}</label>
                        <PasswordInput {...registerPassword("currentPassword")} error={passwordErrors.currentPassword?.message} placeholder={isEn ? "Enter current password" : "أدخل كلمة المرور الحالية"} autoComplete="off" />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-slate-700 mb-1.5">{isEn ? "New Password" : "كلمة المرور الجديدة"}</label>
                        <PasswordInput {...registerPassword("newPassword")} error={passwordErrors.newPassword?.message} placeholder={isEn ? "At least 6 characters" : "6 أحرف على الأقل"} autoComplete="new-password" />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-slate-700 mb-1.5">{isEn ? "Confirm Password" : "تأكيد كلمة المرور"}</label>
                        <PasswordInput {...registerPassword("confirmPassword")} error={passwordErrors.confirmPassword?.message} placeholder={isEn ? "Re-type new password" : "أعد كتابة كلمة المرور الجديدة"} autoComplete="new-password" />
                      </div>
                      <div className="pt-1">
                        <Button type="submit" loading={isChangingPassword} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[12px] rounded-xl">
                          {isEn ? "Change Password" : "تغيير كلمة المرور"}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* ── TAB: Notifications & OTP ──────────────────── */}
                {settingsTab === "notifications" && (
                  <div className="space-y-4">
                    {/* OTP Channel */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                      <div className="border-b border-slate-100 pb-4">
                        <h2 className="font-bold text-[15px] text-slate-900">{isEn ? "Verification Code (OTP)" : "رمز التحقق (OTP)"}</h2>
                        <p className="text-[12px] text-slate-500 mt-0.5">{isEn ? "Choose where to receive your login verification code." : "اختر من أين تستقبل رمز التحقق عند كل تسجيل دخول."}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Email */}
                        <button
                          type="button"
                          onClick={() => handleOtpChannelChange("EMAIL")}
                          className={cn(
                            "p-4 rounded-xl border flex flex-col items-center gap-2.5 text-center transition-all cursor-pointer",
                            user.otpChannel === "EMAIL"
                              ? "border-blue-500 bg-blue-50 shadow-sm"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          )}
                        >
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", user.otpChannel === "EMAIL" ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500")}>
                            <Mail size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-[12px] text-slate-900">{isEn ? "Email Address" : "البريد الإلكتروني"}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{isEn ? "Code to registered email" : "رمز على بريدك المسجّل"}</p>
                          </div>
                          {user.otpChannel === "EMAIL" && <CheckCircle2 size={16} className="text-blue-600" />}
                        </button>
                        {/* Telegram */}
                        <button
                          type="button"
                          onClick={() => handleOtpChannelChange("TELEGRAM")}
                          className={cn(
                            "p-4 rounded-xl border flex flex-col items-center gap-2.5 text-center transition-all cursor-pointer",
                            user.otpChannel === "TELEGRAM"
                              ? "border-blue-500 bg-blue-50 shadow-sm"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          )}
                        >
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", user.otpChannel === "TELEGRAM" ? "bg-sky-100 text-sky-600" : "bg-slate-100 text-slate-500")}>
                            <MessageSquare size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-[12px] text-slate-900">{isEn ? "Telegram" : "تليجرام"}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{isEn ? "Code via Telegram bot" : "رمز عبر بوت تليجرام"}</p>
                          </div>
                          {user.otpChannel === "TELEGRAM" && <CheckCircle2 size={16} className="text-blue-600" />}
                        </button>
                      </div>

                      {/* Telegram Pairing */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-bold text-slate-700">{isEn ? "Link Telegram Account" : "ربط حساب تليجرام"}</span>
                          {user.telegramChatId
                            ? <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[11px]">{isEn ? "Linked ✓" : "مرتبط ✓"}</span>
                            : <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold text-[11px]">{isEn ? "Not Linked" : "غير مرتبط"}</span>}
                        </div>
                        {user.telegramChatId ? (
                          <button type="button" onClick={handleUnlinkTelegram} className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[12px] rounded-xl border border-rose-200 transition-all cursor-pointer">
                            {isEn ? "Unlink Telegram" : "فصل حساب تليجرام"}
                          </button>
                        ) : (
                          <div className="space-y-2.5">
                            <button type="button" onClick={handleGenerateTelegramCode} className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[12px] rounded-xl transition-all cursor-pointer">
                              {isEn ? "Link Telegram Account" : "ربط حساب تليجرام"}
                            </button>
                            {telegramCode && (
                              <div className="p-3 bg-white border border-sky-200 rounded-xl space-y-2">
                                <p className="text-[11px] font-medium text-slate-600">{isEn ? "Open the bot on Telegram and send this code:" : "افتح البوت على تليجرام وأرسل له هذا الكود:"}</p>
                                <div className="p-2.5 bg-slate-50 font-mono text-center font-black text-base rounded-lg tracking-widest text-slate-900 border border-slate-200">{telegramCode}</div>
                                {checkingLink && <p className="text-[11px] text-sky-600 font-bold animate-pulse text-center">{isEn ? "Waiting for confirmation from bot..." : "في انتظار التأكيد من البوت..."}</p>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Web Push */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                          <h2 className="font-bold text-[15px] text-slate-900">{isEn ? "Browser Notifications" : "إشعارات المتصفح"}</h2>
                          <p className="text-[12px] text-slate-500 mt-0.5">{isEn ? "Receive instant alerts for messages and updates directly on your device." : "استقبل تنبيهات فورية للرسائل والتحديثات على جهازك مباشرة."}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleTogglePush}
                          disabled={isSubscribingDevice || isUnsubscribingDevice}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[12px] font-bold transition-all cursor-pointer border",
                            notificationPermission === "granted"
                              ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                              : "bg-blue-600 text-white border-transparent hover:bg-blue-700"
                          )}
                        >
                          {notificationPermission === "granted" ? (isEn ? "Disable Notifications" : "إيقاف الإشعارات") : (isEn ? "Enable Notifications" : "تفعيل الإشعارات")}
                        </button>
                      </div>
                      {pushDevices.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold text-slate-400">{isEn ? "Enabled Devices" : "الأجهزة المُفعَّلة"}</p>
                          {pushDevices.map((dev: any) => (
                            <div key={dev.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                              <div className="flex items-center gap-2">
                                <Laptop size={15} className="text-slate-400" />
                                <span className="text-[12px] font-medium text-slate-700">{dev.userAgent || (isEn ? "Unknown Browser" : "متصفح غير معرَّف")}</span>
                              </div>
                              <button type="button" onClick={() => handleDeleteDevice(dev.id)} className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer" title={isEn ? "Remove" : "إزالة"}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── TAB: Danger Zone ──────────────────────────── */}
                {settingsTab === "danger" && (
                  <div className="bg-white border border-rose-200 rounded-2xl overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-rose-500 to-red-500" />
                    <div className="p-6 space-y-5">
                      <div className="p-4 bg-rose-50/60 border border-rose-100 rounded-xl space-y-3 text-[12px]">
                        <p className="font-bold text-slate-800">{isEn ? "What happens when I delete my account?" : "ماذا يحدث عند حذف حسابي؟"}</p>
                        <ul className="space-y-2 text-slate-600 text-[12px] leading-relaxed">
                          <li className="flex items-start gap-2">
                            <span className="text-rose-400 mt-1 shrink-0">•</span>
                            <span>{isEn ? "Your account enters a " : "يدخل حسابك "}<strong className="text-slate-700">{isEn ? "30-day grace period" : "فترة سماح مدتها 30 يوماً"}</strong>{isEn ? " before any final action — you can undo during this time." : " قبل أي إجراء نهائي — يمكنك التراجع خلالها."}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-rose-400 mt-1 shrink-0">•</span>
                            <span>{isEn ? "Deletion will not be allowed if you have " : "لن يُسمح بالحذف إن كانت لديك "}<strong className="text-slate-700">{isEn ? "active contracts or listings" : "عقود أو إعلانات نشطة"}</strong>{isEn ? " currently." : " حالياً."}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-rose-400 mt-1 shrink-0">•</span>
                            <span>{isEn ? "Contact the " : "تواصل مع "}<strong className="text-slate-700">{isEn ? "Support Team" : "فريق الدعم"}</strong>{isEn ? " anytime during the grace period to cancel and restore your account." : " في أي وقت خلال فترة السماح لإلغاء الطلب واستعادة الحساب."}</span>
                          </li>
                        </ul>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowDeleteModal(true)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-[12px] rounded-xl shadow-sm transition-all cursor-pointer"
                        >
                          <Trash2 size={15} />
                          {isEn ? "Delete Account" : "حذف الحساب"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>{/* end content panel */}
            </div>{/* end two-column */}
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-cairo">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle size={20} className="text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-[15px] text-slate-900">{isEn ? "Confirm Account Deletion" : "تأكيد حذف الحساب"}</h3>
                <p className="text-[11px] text-slate-500">{isEn ? "A 30-day grace period will start during which you can cancel" : "ستُفتح فترة سماح مدتها 30 يوماً يمكنك التراجع خلالها"}</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-600 leading-relaxed">
              {isEn ? "You will be logged out immediately. Your historical data and contracts will not be deleted — your account will only be temporarily suspended." : "سيتم تسجيل خروجك فوراً. بياناتك وعقودك التاريخية لن تُحذف — فقط حسابك سيُوقَف مؤقتاً."}
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1.5">{isEn ? "Deletion Reason" : "سبب الحذف"} <span className="font-normal text-slate-400">{isEn ? "(Optional)" : "(اختياري)"}</span></label>
              <textarea
                value={deleteReasonNote}
                onChange={(e) => setDeleteReasonNote(e.target.value)}
                placeholder={isEn ? "Tell us why you are leaving — your feedback helps us improve..." : "أخبرنا لماذا تغادر — رأيك يساعدنا على التحسين..."}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[12px] text-slate-800 h-20 resize-none focus:outline-none focus:border-rose-400 transition-colors"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingAccount}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                {isEn ? "Cancel" : "تراجع"}
              </button>
              <button
                type="button"
                onClick={handleConfirmSelfDelete}
                disabled={isDeletingAccount}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
              >
                {isDeletingAccount ? <Spinner size="sm" className="text-white" /> : null}
                {isDeletingAccount ? (isEn ? "Processing..." : "جارٍ المعالجة...") : (isEn ? "Yes, Delete My Account" : "نعم، احذف حسابي")}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
