// apps/frontend/src/app/[locale]/dashboard/tenant/subscription/page.tsx
"use client";

import React, { useState } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import {
  useCurrentPlan,
  useInitiatePayment,
  useSubscriptionHistory,
  useCancelSubscription,
} from "@/hooks/useSubscription";
import TenantLayout from "@/components/layout/TenantLayout";
import {
  Card,
  CardBody,
  Spinner,
  Button,
  Badge,
  Modal,
  Input,
  useToast,
} from "@/components/ui";
import {
  CreditCard,
  Check,
  X,
  ShieldCheck,
  TrendingUp,
  History,
  Sparkles,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const billingSchema = z.object({
  billingName: z.string().min(2, "الاسم الكامل مطلوب للتسجيل"),
  billingPhone: z
    .string()
    .regex(/^01[0125][0-9]{8}$/, "الرجاء إدخال رقم هاتف مصري صحيح (مثال: 01012345678)"),
});

type BillingValues = z.infer<typeof billingSchema>;

export default function TenantSubscription() {
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuthGuard();
  
  // Queries
  const { data: planData, isLoading: isPlanLoading } = useCurrentPlan();
  const { data: history = [], isLoading: isHistoryLoading } = useSubscriptionHistory();

  // Mutations
  const { mutate: initiatePayment, isPending: isInitiating } = useInitiatePayment();
  const { mutate: cancelSubscription, isPending: isCancelling } = useCancelSubscription();

  // Modal States
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Billing Form Hook
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BillingValues>({
    resolver: zodResolver(billingSchema),
    values: user ? { billingName: user.name, billingPhone: user.phone || "" } : undefined,
  });

  const isLoading = isAuthLoading || isPlanLoading || isHistoryLoading;

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleUpgradeSubmit = (data: BillingValues) => {
    initiatePayment(
      {
        plan: "premium",
        billingName: data.billingName,
        billingPhone: data.billingPhone,
      },
      {
        onSuccess: (res) => {
          toast({
            title: "تم تهيئة بوابة الدفع",
            description: "سيتم تحويلك الآن لإتمام الدفع الآمن.",
            type: "success",
          });
          // Redirect to Paymob iframe URL
          if (res.paymentUrl) {
            window.location.href = res.paymentUrl;
          }
        },
        onError: (err) => {
          toast({
            title: "فشل تهيئة الدفع",
            description: err.message || "حدث خطأ أثناء الاتصال ببوابة الدفع.",
            type: "error",
          });
        },
      }
    );
  };

  const handleCancelSubmit = () => {
    cancelSubscription(undefined, {
      onSuccess: () => {
        toast({
          title: "تم إلغاء الاشتراك",
          description: "تم إلغاء التجديد التلقائي للاشتراك بنجاح.",
          type: "success",
        });
        setIsCancelModalOpen(false);
      },
      onError: (err) => {
        toast({
          title: "حدث خطأ",
          description: err.message || "لم نتمكن من إلغاء الاشتراك. يرجى مراجعة الدعم.",
          type: "error",
        });
      },
    });
  };

  const isPremium = planData?.plan === "premium" && planData?.status === "active";
  const isMockPremium = planData?.mock === true;

  return (
    <TenantLayout>
      <div className="space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-cairo">باقة الاشتراك</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-cairo text-sm">
            إدارة اشتراكك وعرض المميزات الحصرية ومتابعة سجل المدفوعات.
          </p>
        </div>

        {/* Current Plan Overview Card */}
        <Card className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <CardBody className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div className="space-y-3 font-cairo">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-400">الباقة الحالية:</span>
                  {isPremium ? (
                    <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold px-3 py-1 flex items-center gap-1 rounded-full text-xs">
                      <Sparkles size={12} />
                      <span>سكني الممتاز (Premium)</span>
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-3 py-1 rounded-full text-xs">
                      الباقة المجانية (Free)
                    </Badge>
                  )}
                </div>

                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {isPremium ? "أنت تتمتع بكافة مميزات سكني الممتاز" : "باقة سكني الأساسية"}
                </h3>

                {isPremium && planData?.expiresAt && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    تاريخ انتهاء الاشتراك: {new Date(planData.expiresAt).toLocaleDateString("ar-EG")}
                  </p>
                )}

                {isMockPremium && (
                  <div className="p-3 bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 rounded-2xl text-xs max-w-xl leading-relaxed">
                    ✨ <strong>الاشتراكات معطلة مؤقتاً:</strong> المنصة حالياً مجانية بالكامل. لقد تم ترقية حسابك تلقائياً لسكني الممتاز لتجربة كافة المميزات بدون رسوم.
                  </div>
                )}
              </div>

              <div className="shrink-0 flex items-center">
                {isPremium ? (
                  !isMockPremium && (
                    <Button
                      onClick={() => setIsCancelModalOpen(true)}
                      variant="outline"
                      className="border-red-500/20 hover:bg-red-50 text-red-600 dark:text-red-400 dark:hover:bg-red-950/20 font-cairo font-semibold rounded-xl px-6 py-3"
                    >
                      إلغاء الاشتراك
                    </Button>
                  )
                ) : (
                  <Button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-cairo font-bold rounded-xl px-8 py-4 shadow-md flex items-center gap-2"
                  >
                    <Sparkles size={18} />
                    <span>الترقية إلى الممتاز</span>
                  </Button>
                )}
              </div>

            </div>
          </CardBody>
        </Card>

        {/* Feature Comparison Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-cairo text-slate-800 dark:text-slate-200">
            مقارنة باقات الاشتراك الممتازة
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-cairo">
            
            {/* Free Plan Card */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl shadow-sm overflow-hidden opacity-85">
              <CardBody className="p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">باقة سكني المجانية</h3>
                  <p className="text-slate-400 text-xs mt-1">الباقة الأساسية للبحث والاستفسار</p>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-4">
                    0 <span className="text-sm font-normal text-slate-400">ج.م / شهرياً</span>
                  </div>
                </div>

                <ul className="space-y-3.5">
                  <li className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400 text-sm">
                    <Check size={16} className="text-green-500 shrink-0" />
                    <span>عرض العقارات وتفاصيلها بالكامل</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400 text-sm">
                    <Check size={16} className="text-green-500 shrink-0" />
                    <span>حفظ العقارات في المفضلة المحلية</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400 text-sm">
                    <Check size={16} className="text-green-500 shrink-0" />
                    <span>تقديم 3 طلبات معاينة نشطة كحد أقصى</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-400 text-sm line-through">
                    <X size={16} className="text-red-500 shrink-0" />
                    <span>تنبيهات بحث ذكية فورية عبر الرسائل (بحد أقصى تنبيه واحد)</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-400 text-sm line-through">
                    <X size={16} className="text-red-500 shrink-0" />
                    <span>أولوية ظهور طلباتك وتفضيلاتك لدى المؤجرين</span>
                  </li>
                </ul>
              </CardBody>
            </Card>

            {/* Premium Plan Card */}
            <Card className="border-2 border-amber-400 bg-white dark:bg-slate-900 rounded-3xl shadow-md overflow-hidden relative">
              <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-center py-1.5 text-xs font-bold font-cairo">
                الباقة الموصى بها 🔥
              </div>
              <CardBody className="p-6 pt-10 space-y-6">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-1.5">
                    <span>سكني الممتاز</span>
                    <Sparkles size={16} className="text-amber-500" />
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">المميزات الكاملة وأسرع طريقة لإيجاد سكن</p>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-4">
                    50 <span className="text-sm font-normal text-slate-400">ج.م / شهرياً</span>
                  </div>
                </div>

                <ul className="space-y-3.5">
                  <li className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400 text-sm">
                    <Check size={16} className="text-amber-500 shrink-0" />
                    <span>عدد غير محدود من طلبات المعاينة النشطة</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400 text-sm">
                    <Check size={16} className="text-amber-500 shrink-0" />
                    <span>تنبيهات بحث ذكية غير محدودة (عقارات فورية)</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400 text-sm">
                    <Check size={16} className="text-amber-500 shrink-0" />
                    <span>إشعارات فورية عبر الرسائل القصيرة SMS والبريد</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400 text-sm">
                    <Check size={16} className="text-amber-500 shrink-0" />
                    <span>شارة التوثيق والتميز لملفك الشخصي (أولوية القبول)</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400 text-sm">
                    <Check size={16} className="text-amber-500 shrink-0" />
                    <span>خصومات حصرية على خدمات النقل والتأثيث الشريكة</span>
                  </li>
                </ul>
              </CardBody>
            </Card>

          </div>
        </div>

        {/* Payments History Card */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <History size={18} className="text-slate-400" />
            <h2 className="text-xl font-bold font-cairo text-slate-800 dark:text-slate-200">
              سجل الاشتراك والمدفوعات
            </h2>
          </div>

          <Card className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm font-cairo">
            <CardBody className="p-0">
              {history.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  لا توجد عمليات دفع سابقة مسجلة على حسابك.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                        <th className="py-4 px-6 text-start">الباقة</th>
                        <th className="py-4 px-6 text-start">القيمة</th>
                        <th className="py-4 px-6 text-start">الحالة</th>
                        <th className="py-4 px-6 text-start">تاريخ البداية</th>
                        <th className="py-4 px-6 text-start">تاريخ الانتهاء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {history.map((item) => (
                        <tr key={item.id} className="text-slate-700 dark:text-slate-350 hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="py-4 px-6 font-bold text-slate-950 dark:text-slate-100">
                            {item.plan === "premium" ? "سكني الممتاز" : item.plan}
                          </td>
                          <td className="py-4 px-6 font-mono font-bold text-green-600 dark:text-green-400">
                            {item.amount / 100} ج.م
                          </td>
                          <td className="py-4 px-6">
                            {item.status === "active" ? (
                              <span className="inline-block py-1 px-2.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400">
                                نشط
                              </span>
                            ) : (
                              <span className="inline-block py-1 px-2.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                {item.status}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            {new Date(item.createdAt).toLocaleDateString("ar-EG")}
                          </td>
                          <td className="py-4 px-6">
                            {new Date(item.expiresAt).toLocaleDateString("ar-EG")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Upgrade Billing Details Modal */}
        {isUpgradeModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setIsUpgradeModalOpen(false)}
            title="إتمام ترقية الباقة لسكني الممتاز"
          >
            <form onSubmit={handleSubmit(handleUpgradeSubmit)} className="p-6 space-y-4 font-cairo">
              <div className="flex gap-2 p-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-2xl text-xs mb-2">
                <Sparkles size={16} className="shrink-0 mt-0.5" />
                <p>سعر ترقية الباقة لسكني الممتاز هو 50 جنيهاً مصرياً شهرياً فقط.</p>
              </div>

              <Input
                label="الاسم الكامل للفاتورة"
                placeholder="أدخل الاسم لبيانات الدفع"
                error={errors.billingName?.message}
                {...register("billingName")}
              />

              <Input
                label="رقم الهاتف للمدفوعات (محفظة إلكترونية أو كارت)"
                placeholder="01xxxxxxxxx"
                dir="ltr"
                error={errors.billingPhone?.message}
                {...register("billingPhone")}
              />

              <p className="text-[10px] text-slate-400 leading-normal">
                بمتابعة الدفع، سيتم توجيهك لصفحة Paymob الآمنة لتعبئة بيانات بطاقتك الائتمانية أو الدفع بواسطة فودافون كاش / المحافظ الإلكترونية.
              </p>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(false)}
                  variant="outline"
                  className="flex-1 rounded-xl py-3 border-slate-200 dark:border-slate-800"
                >
                  تراجع
                </Button>
                <Button
                  type="submit"
                  disabled={isInitiating}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl py-3"
                >
                  {isInitiating ? "جاري الاتصال بالبوابة..." : "الانتقال للدفع الآمن"}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Cancel Subscription Confirmation Modal */}
        {isCancelModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setIsCancelModalOpen(false)}
            title="تأكيد إلغاء التجديد التلقائي"
          >
            <div className="p-6 text-center space-y-4 font-cairo">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                هل أنت متأكد من إلغاء اشتراكك الممتاز؟
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                ستفقد جميع المزايا الحصرية والقدرة على استقبال تنبيهات البحث الذكي فور انتهاء فترة صلاحية باقتك الحالية.
              </p>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setIsCancelModalOpen(false)}
                  variant="outline"
                  className="flex-1 rounded-xl py-3 border-slate-200 dark:border-slate-800 font-semibold"
                >
                  تراجع
                </Button>
                <Button
                  onClick={handleCancelSubmit}
                  disabled={isCancelling}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl py-3"
                >
                  {isCancelling ? "جاري الإلغاء..." : "تأكيد إلغاء التجديد"}
                </Button>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </TenantLayout>
  );
}
