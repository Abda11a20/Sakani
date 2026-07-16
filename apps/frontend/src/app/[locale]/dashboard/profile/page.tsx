// apps/frontend/src/app/[locale]/dashboard/profile/page.tsx
"use client";

import React, { useState, useRef } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import {
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
  useUploadIdCard,
  useChangePassword,
} from "@/hooks/useProfile";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth.api";
import TenantLayout from "@/components/layout/TenantLayout";
import LandlordLayout from "@/components/layout/LandlordLayout";
import { getIdentityVerificationStatus } from "@/types";
import {
  Card,
  CardBody,
  Spinner,
  Button,
  Badge,
  Input,
  PasswordInput,
  useToast,
} from "@/components/ui";
import {
  User as UserIcon,
  Lock,
  Upload,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  Camera,
  FileText,
  Mail,
  MessageSquare,
  Bell,
  Trash2,
  Laptop,
  Smartphone,
  Tablet,
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

// Zod schemas
const profileSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون ثنائيًا على الأقل"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
    newPassword: z.string().min(6, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل"),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور الجديد مطلوب"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Telegram linking state for settings page
  const [telegramCode, setTelegramCode] = useState<string>("");
  const [telegramLinked, setTelegramLinked] = useState<boolean>(false);
  const [checkingLink, setCheckingLink] = useState<boolean>(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const startLinkPolling = (code: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setCheckingLink(true);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await authApi.checkTelegramLinkStatus(code);
        if (res.data?.linked) {
          setTelegramLinked(true);
          setCheckingLink(false);
          if (pollingRef.current) clearInterval(pollingRef.current);
          toast({
            title: "نجاح",
            description: "تم ربط حساب تليجرام بنجاح! يمكنك الآن تفعيل قناة تليجرام لتلقي الرموز.",
            type: "success",
          });
          queryClient.invalidateQueries({ queryKey: ["users", "profile"] });
          queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        }
      } catch (err) {
        // ignore errors
      }
    }, 3000);
  };

  const stopLinkPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setCheckingLink(false);
  };

  React.useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleGenerateLinkCode = async () => {
    const activeUser = userProfile || guardUser;
    const identifier = activeUser?.email || activeUser?.phone;
    if (!identifier) {
      toast({
        title: "خطأ",
        description: "البريد الإلكتروني أو رقم الهاتف غير متوفر لربط الحساب.",
        type: "error",
      });
      return;
    }

    try {
      setTelegramLinked(false);
      const res = await authApi.generateTelegramLinkCode(identifier);
      const code = res.data?.linkCode;
      if (code) {
        setTelegramCode(code);
        startLinkPolling(code);
      }
    } catch (err) {
      toast({
        title: "خطأ",
        description: "فشل إنشاء رمز ربط تليجرام. يرجى المحاولة مرة أخرى.",
        type: "error",
      });
    }
  };

  const handleToggleOtpChannel = async (channel: "EMAIL" | "TELEGRAM") => {
    const activeUser = userProfile || guardUser;
    if (channel === "TELEGRAM" && !activeUser?.telegramChatId) {
      toast({
        title: "تنبيه",
        description: "يرجى ربط حساب تليجرام أولاً قبل تعيينه كقناة استقبال.",
        type: "error",
      });
      return;
    }

    try {
      const res = await authApi.updateOtpChannel(channel);
      toast({
        title: "نجاح",
        description: res.data?.message || "تم تحديث قناة استقبال الرمز بنجاح.",
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["users", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    } catch (err: any) {
      toast({
        title: "خطأ",
        description: err.response?.data?.message || "حدث خطأ أثناء تحديث قناة استقبال الرمز.",
        type: "error",
      });
    }
  };

  // Guard role options: none (shared)
  const { user: guardUser, isLoading: isAuthLoading } = useAuthGuard({ requiredRoles: ["tenant", "landlord"] });
  
  // React Query Profile Data
  const { data: userProfile, isLoading: isProfileLoading } = useProfile();
  
  // Mutations
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();
  const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useUploadAvatar();
  const { mutate: uploadIdCard, isPending: isUploadingIdCard } = useUploadIdCard();
  const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword();

  // Web Push Queries & Mutations
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const { data: pushDevices = [], isLoading: isLoadingPushDevices } = usePushSubscriptions();
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
        title: "غير مدعوم",
        description: "إشعارات الدفع غير مدعومة في متصفحك الحالي.",
        type: "error",
      });
      return;
    }

    if (notificationPermission === "denied") {
      toast({
        title: "الإذن مرفوض",
        description: "يرجى تغيير إعدادات إذن الإشعارات للموقع من المتصفح يدوياً لتفعيلها.",
        type: "error",
      });
      return;
    }

    if (notificationPermission === "granted") {
      unsubscribeDevice(undefined, {
        onSuccess: () => {
          setNotificationPermission("default");
          toast({
            title: "تم التعطيل",
            description: "تم إلغاء تفعيل إشعارات الدفع على هذا الجهاز بنجاح.",
            type: "success",
          });
        },
        onError: (err: any) => {
          toast({
            title: "خطأ",
            description: err.message || "حدث خطأ أثناء تعطيل إشعارات الدفع.",
            type: "error",
          });
        }
      });
    } else {
      try {
        const result = await Notification.requestPermission();
        setNotificationPermission(result);
        if (result === "granted") {
          subscribeDevice(undefined, {
            onSuccess: () => {
              toast({
                title: "تم التفعيل",
                description: "تم تفعيل إشعارات الدفع على هذا الجهاز بنجاح.",
                type: "success",
              });
            },
            onError: (err: any) => {
              toast({
                title: "خطأ",
                description: err.message || "حدث خطأ أثناء الاشتراك بإشعارات الدفع.",
                type: "error",
              });
            }
          });
        } else {
          toast({
            title: "تم الرفض",
            description: "لم يتم تفعيل الإشعارات بسبب رفض طلب الإذن.",
            type: "error",
          });
        }
      } catch (err: any) {
        toast({
          title: "خطأ",
          description: err.message || "حدث خطأ أثناء طلب إذن الإشعارات.",
          type: "error",
        });
      }
    }
  };

  const handleDeleteDevice = (id: string) => {
    deleteDevice(id, {
      onSuccess: () => {
        toast({
          title: "تم الحذف",
          description: "تمت إزالة الجهاز من قائمة الاشتراكات بنجاح.",
          type: "success",
        });
      },
      onError: (err: any) => {
        toast({
          title: "خطأ",
          description: err.message || "حدث خطأ أثناء محاولة حذف الجهاز.",
          type: "error",
        });
      }
    });
  };

  // File Inputs Refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const idCardInputRef = useRef<HTMLInputElement>(null);

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: userProfile ? { name: userProfile.name } : undefined,
  });

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordValues>({
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

  // Choose display user from guard or synced profile
  const user = userProfile || guardUser;

  // Decide which Layout to wrap with dynamically
  const Layout = user.role === "landlord" ? LandlordLayout : TenantLayout;

  const onProfileSave = (data: ProfileValues) => {
    updateProfile(data, {
      onSuccess: () => {
        toast({
          title: "تم تحديث الملف الشخصي",
          description: "تم حفظ بياناتك الشخصية الجديدة بنجاح.",
          type: "success",
        });
      },
      onError: (err) => {
        toast({
          title: "فشل التحديث",
          description: err.message || "حدث خطأ أثناء تحديث الملف الشخصي.",
          type: "error",
        });
      },
    });
  };

  const onPasswordSave = (data: PasswordValues) => {
    changePassword(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      },
      {
        onSuccess: () => {
          toast({
            title: "تم تغيير كلمة المرور",
            description: "تم تحديث كلمة المرور الخاصة بك بنجاح.",
            type: "success",
          });
          resetPasswordForm();
        },
        onError: (err) => {
          toast({
            title: "فشل تغيير كلمة المرور",
            description: err.message || "تأكد من صحة كلمة المرور الحالية.",
            type: "error",
          });
        },
      }
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "حجم الملف كبير جداً",
        description: "الحد الأقصى لحجم الصورة الشخصية هو 2 ميجابايت.",
        type: "error",
      });
      return;
    }

    // Validate type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({
        title: "صيغة غير مدعومة",
        description: "يرجى اختيار صورة بصيغة JPEG أو PNG أو WEBP.",
        type: "error",
      });
      return;
    }

    uploadAvatar(file, {
      onSuccess: () => {
        toast({
          title: "تم رفع الصورة",
          description: "تم تحديث صورتك الشخصية بنجاح.",
          type: "success",
        });
      },
      onError: (err) => {
        toast({
          title: "فشل الرفع",
          description: err.message || "حدث خطأ أثناء رفع الصورة الشخصية.",
          type: "error",
        });
      },
    });
  };

  const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "حجم الملف كبير جداً",
        description: "الحد الأقصى لحجم البطاقة الشخصية هو 10 ميجابايت.",
        type: "error",
      });
      return;
    }

    // Validate type
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
      toast({
        title: "صيغة غير مدعومة",
        description: "يرجى اختيار مستند بصيغة JPEG أو PNG أو PDF.",
        type: "error",
      });
      return;
    }

    uploadIdCard(file, {
      onSuccess: () => {
        toast({
          title: "تم رفع وثيقة الهوية",
          description: "تم إرسال بطاقة الهوية الوطنية للأدمن بنجاح للمراجعة والتوثيق.",
          type: "success",
        });
      },
      onError: (err) => {
        toast({
          title: "فشل الرفع",
          description: err.message || "حدث خطأ أثناء رفع وثيقة الهوية.",
          type: "error",
        });
      },
    });
  };

  // Helper to extract initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("");
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-cairo">الملف الشخصي</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-cairo text-sm">
            إدارة إعدادات حسابك الشخصي، وتوثيق هويتك، وحماية كلمتك المرور.
          </p>
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1 & 2: Profile Details and Identity Verification */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card: Basic Info */}
            <Card className="border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <CardBody className="p-6 md:p-8 space-y-8 font-cairo">
                
                {/* Avatar Section */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500/20 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 relative">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-slate-500 dark:text-slate-400">
                          {getInitials(user.name)}
                        </span>
                      )}

                      {/* Upload Loading Overlay */}
                      {isUploadingAvatar && (
                        <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                          <Spinner size="sm" className="text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Trigger Input Button */}
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-transform hover:scale-105 border border-white dark:border-slate-900"
                    >
                      <Camera size={14} />
                    </button>
                    
                    <input
                      type="file"
                      ref={avatarInputRef}
                      onChange={handleAvatarChange}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                    />
                  </div>

                  <div className="space-y-1 text-center sm:text-start flex-1">
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                        {user.name}
                      </h3>
                      {(() => {
                        const status = getIdentityVerificationStatus(user);
                        if (status === 'verified') {
                          return (
                            <Badge className="bg-green-500 text-white font-bold text-[10px] font-cairo flex items-center gap-1 rounded-full px-2 py-0.5">
                              <CheckCircle size={10} />
                              <span>موثق الهوية</span>
                            </Badge>
                          );
                        }
                        if (status === 'pending') {
                          return (
                            <Badge className="bg-amber-500 text-white font-bold text-[10px] font-cairo flex items-center gap-1 rounded-full px-2 py-0.5">
                              <Clock size={10} />
                              <span>قيد مراجعة الهوية</span>
                            </Badge>
                          );
                        }
                        if (status === 'rejected') {
                          return (
                            <Badge className="bg-red-500 text-white font-bold text-[10px] font-cairo flex items-center gap-1 rounded-full px-2 py-0.5">
                              <AlertCircle size={10} />
                              <span>مرفوض الهوية</span>
                            </Badge>
                          );
                        }
                        return (
                          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[10px] font-cairo rounded-full px-2 py-0.5">
                            غير موثق
                          </Badge>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-slate-400">
                      الدور: {user.role === "landlord" ? "مؤجر عقارات" : "مستأجر"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      عضو منذ: {new Date(user.createdAt).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleProfileSubmit(onProfileSave)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="الاسم الكامل"
                      placeholder="أدخل اسمك كما بالبطاقة"
                      error={profileErrors.name?.message}
                      leftIcon={<UserIcon size={18} />}
                      {...registerProfile("name")}
                    />

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        رقم الهاتف (لا يمكن تغييره)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={user.phone || ""}
                        className="flex w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/80 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-75"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        البريد الإلكتروني (لا يمكن تغييره)
                      </label>
                      <input
                        type="email"
                        disabled
                        value={user.email || ""}
                        className="flex w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/80 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-75"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-2 px-6"
                    >
                      {isUpdatingProfile ? "جاري الحفظ..." : "حفظ البيانات الشخصية"}
                    </Button>
                  </div>
                </form>

              </CardBody>
            </Card>

            {/* Card: Verification & National ID Upload */}
            <Card className="border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <CardBody className="p-6 md:p-8 space-y-6 font-cairo">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      توثيق الحساب (الهوية الوطنية)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      توثيق هويتك يزيد من مصداقيتك لدى المستأجرين والمؤجرين في المنصة.
                    </p>
                  </div>
                </div>

                {/* ID Status Banner */}
                {(() => {
                  const status = getIdentityVerificationStatus(user);
                  if (status === 'verified') {
                    return (
                      <div className="flex items-start gap-3 p-4 bg-green-500/10 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-2xl border border-green-500/20">
                        <CheckCircle size={20} className="shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-sm">حسابك موثق بالكامل</h4>
                          <p className="text-xs mt-1 opacity-90 leading-relaxed">
                            لقد تمت مراجعة بطاقة الهوية الوطنية وتوثيق حسابك بنجاح. تظهر شارة التوثيق الآن بجوار اسمك للمستخدمين الآخرين.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  if (status === 'pending') {
                    return (
                      <div className="flex items-start gap-3 p-4 bg-amber-500/10 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-2xl border border-amber-500/20">
                        <Clock size={20} className="shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-sm">مستنداتك قيد المراجعة</h4>
                          <p className="text-xs mt-1 opacity-90 leading-relaxed">
                            تم استلام صورة بطاقة الهوية الخاصة بك بنجاح. يقوم فريق العمل بمراجعتها الآن وسيتم تحديث حالة حسابك خلال 24 ساعة.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  if (status === 'rejected') {
                    return (
                      <div className="flex items-start gap-3 p-4 bg-red-500/10 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-2xl border border-red-500/20">
                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-sm">مستندات الهوية مرفوضة</h4>
                          <p className="text-xs mt-1 opacity-90 leading-relaxed">
                            لقد تم رفض مستندات الهوية الخاصة بك من قبل فريق المراجعة. يرجى رفع صورة واضحة وصحيحة لبطاقة الرقم القومي أو الهوية الوطنية لإعادة مراجعتها وتفعيل التوثيق.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-start gap-3 p-4 bg-blue-500/5 text-blue-700 dark:text-blue-400 rounded-2xl border border-blue-500/10">
                      <AlertCircle size={20} className="shrink-0 mt-0.5 text-blue-600" />
                      <div>
                        <h4 className="font-bold text-sm">مستندات الهوية مطلوبة</h4>
                        <p className="text-xs mt-1 opacity-90 leading-relaxed">
                          الرجاء رفع صورة واضحة لبطاقة الرقم القومي الخاصة بك (صيغة JPEG أو PNG أو ملف PDF). تأكد من ظهور البيانات كاملة حتى يتم التوثيق بسرعة.
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Upload Form */}
                {getIdentityVerificationStatus(user) !== 'verified' && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        صورة بطاقة الهوية الوطنية أو الرقم القومي
                      </label>
                      
                      <div
                        onClick={() => !isUploadingIdCard && idCardInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                          isUploadingIdCard
                            ? "bg-slate-50 dark:bg-slate-900 border-slate-300 opacity-60 pointer-events-none"
                            : "border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850/50 hover:border-blue-500"
                        }`}
                      >
                        {isUploadingIdCard ? (
                          <Spinner size="md" className="mx-auto text-blue-600" />
                        ) : (
                          <Upload size={32} className="mx-auto text-slate-400" />
                        )}
                        <div>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {user.nationalIdEnc ? "رفع بطاقة بديلة" : "اضغط لرفع المستند"}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            صيغ مدعومة: JPG, PNG, PDF (أقصى حجم: 10 ميجابايت)
                          </p>
                        </div>
                      </div>

                      <input
                        type="file"
                        ref={idCardInputRef}
                        onChange={handleIdCardChange}
                        accept="image/jpeg,image/png,application/pdf"
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Column 3: Change Password */}
          <div>
            <Card className="border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <CardBody className="p-6 md:p-8 space-y-6 font-cairo">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      تغيير كلمة المرور
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      تحديث كلمة المرور بانتظام يعزز أمان حسابك.
                    </p>
                  </div>
                </div>

                <form onSubmit={handlePasswordSubmit(onPasswordSave)} className="space-y-4">
                  <PasswordInput
                    label="كلمة المرور الحالية"
                    placeholder="••••••••"
                    error={passwordErrors.currentPassword?.message}
                    {...registerPassword("currentPassword")}
                  />

                  <PasswordInput
                    label="كلمة المرور الجديدة"
                    placeholder="••••••••"
                    error={passwordErrors.newPassword?.message}
                    {...registerPassword("newPassword")}
                  />

                  <PasswordInput
                    label="تأكيد كلمة المرور الجديدة"
                    placeholder="••••••••"
                    error={passwordErrors.confirmPassword?.message}
                    {...registerPassword("confirmPassword")}
                  />

                  <Button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full btn-primary font-bold rounded-xl py-3 mt-4"
                  >
                    {isChangingPassword ? "جاري التغيير..." : "تحديث كلمة المرور"}
                  </Button>
                </form>
              </CardBody>
            </Card>

            {/* Card: OTP Channel Preferences */}
            <Card className="border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden mt-6">
              <CardBody className="p-6 md:p-8 space-y-6 font-cairo">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      قناة استقبال رمز التحقق (OTP)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      تحديد الوسيلة المفضلة لتلقي أكواد التحقق عند تسجيل الدخول أو تغيير كلمة المرور.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleOtpChannel("EMAIL")}
                      className={`p-3.5 border rounded-2xl flex items-center justify-between transition-all text-sm font-medium ${
                        user.otpChannel === "EMAIL"
                          ? "border-primary bg-primary/5 text-primary font-bold"
                          : "border-slate-200 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Mail size={18} />
                        البريد الإلكتروني
                      </span>
                      {user.otpChannel === "EMAIL" && <span className="text-xs font-bold bg-primary/20 text-primary px-2.5 py-0.5 rounded-full">نشط</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleOtpChannel("TELEGRAM")}
                      className={`p-3.5 border rounded-2xl flex items-center justify-between transition-all text-sm font-medium ${
                        user.otpChannel === "TELEGRAM"
                          ? "border-primary bg-primary/5 text-primary font-bold"
                          : "border-slate-200 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-sky-500 font-bold text-lg">📱</span>
                        تليجرام (Telegram)
                      </span>
                      {user.otpChannel === "TELEGRAM" && <span className="text-xs font-bold bg-primary/20 text-primary px-2.5 py-0.5 rounded-full">نشط</span>}
                    </button>
                  </div>

                  {/* Telegram Link Box */}
                  <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        حالة ربط تليجرام:
                      </span>
                      {user.telegramChatId ? (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          مربوط ✅
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          غير مربوط
                        </span>
                      )}
                    </div>

                    {!user.telegramChatId ? (
                      <div className="space-y-3 pt-1">
                        <Button
                          type="button"
                          onClick={handleGenerateLinkCode}
                          disabled={checkingLink}
                          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl py-2 text-xs flex items-center justify-center gap-1.5"
                        >
                          {checkingLink ? "جاري ربط البوت..." : "ربط حساب تليجرام 🔗"}
                        </Button>

                        {telegramCode && (
                          <div className="border border-sky-100 bg-sky-50/80 p-3.5 rounded-xl space-y-2 mt-2">
                            <ol className="text-[11px] text-sky-700 space-y-1 list-decimal list-inside">
                              <li>
                                افتح البوت:
                                <a
                                  href="https://t.me/SakaniOtp_bot"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-bold text-primary hover:underline mx-1"
                                >
                                  t.me/SakaniOtp_bot
                                </a>
                              </li>
                              <li>أرسل له هذا الكود:</li>
                            </ol>
                            
                            <div className="flex items-center justify-between bg-white border border-sky-200 rounded-lg p-2 mt-1">
                              <span className="font-mono text-base font-bold text-slate-800 tracking-wider">
                                {telegramCode}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(telegramCode);
                                  toast({
                                    title: "تم النسخ",
                                    description: "تم نسخ كود الربط إلى الحافظة.",
                                    type: "success",
                                  });
                                }}
                                className="text-[10px] text-primary font-bold hover:underline"
                              >
                                نسخ
                              </button>
                            </div>
                            {checkingLink && (
                              <div className="flex items-center gap-1 text-[10px] text-sky-600">
                                <span className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
                                <span>في انتظار ربط تليجرام...</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1 text-center">
                        <p className="text-[11px] text-slate-450 leading-relaxed">
                          حسابك مربوط بالبوت بنجاح. إذا كنت ترغب في إلغاء الربط، أرسل <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-red-600 font-bold">/unlink</code> مباشرة إلى البوت.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Card: Web Push Notifications Settings */}
            <Card className="border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden mt-6">
              <CardBody className="p-6 md:p-8 space-y-6 font-cairo">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-650 dark:text-rose-450 flex items-center justify-center shrink-0">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      إشعارات المتصفح (Web Push)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      تلقي تنبيهات منبثقة مباشرة على أجهزتك للدردشة وتحديثات الحساب الهامة.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Toggle Button */}
                  <div className="flex items-center justify-between p-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="space-y-0.5">
                      <span className="text-sm font-bold text-slate-850 dark:text-slate-200 block">
                        إشعارات هذا الجهاز
                      </span>
                      <span className="text-xs text-slate-500">
                        {notificationPermission === "granted"
                          ? "مفعلة على هذا المتصفح"
                          : notificationPermission === "denied"
                          ? "مرفوضة (تحتاج تعديل من إعدادات المتصفح)"
                          : "غير نشطة حالياً"}
                      </span>
                    </div>
                    
                    <button
                      type="button"
                      disabled={isSubscribingDevice || isUnsubscribingDevice}
                      onClick={handleTogglePush}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notificationPermission === "granted" ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notificationPermission === "granted" ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Permission Alert for Denied Status */}
                  {notificationPermission === "denied" && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-2xl border border-amber-500/20 text-xs leading-relaxed">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <div>
                        <strong>تم رفض إذن الإشعارات:</strong> يرجى الضغط على علامة القفل بجوار رابط الموقع في شريط العنوان بالمتصفح وتغيير إذن الإشعارات إلى "سماح" لتتمكن من تشغيل الخدمة.
                      </div>
                    </div>
                  )}

                  {/* Registered Devices List */}
                  {pushDevices.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        الأجهزة المسجلة النشطة ({pushDevices.length})
                      </span>
                      
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {pushDevices.map((device) => {
                          const isDesktop = device.deviceName?.toLowerCase().includes("pc") || device.deviceName?.toLowerCase().includes("mac");
                          return (
                            <div
                              key={device.id}
                              className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/40 text-xs"
                            >
                              <div className="flex items-center gap-3">
                                <div className="text-slate-400">
                                  {isDesktop ? <Laptop size={16} /> : <Smartphone size={16} />}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                    {device.deviceName} ({device.browser})
                                  </span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    آخر نشاط: {device.lastUsedAt ? new Date(device.lastUsedAt).toLocaleDateString() : "غير مستخدم بعد"}
                                  </span>
                                </div>
                              </div>
                              
                              <button
                                type="button"
                                onClick={() => handleDeleteDevice(device.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                                title="إلغاء تسجيل هذا الجهاز"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

        </div>
      </div>
    </Layout>
  );
}
