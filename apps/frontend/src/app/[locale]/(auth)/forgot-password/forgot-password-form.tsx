// apps/frontend/src/app/[locale]/(auth)/forgot-password/forgot-password-form.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail } from "lucide-react";
import { Button, Input, PasswordInput, useToast } from "@/components/ui";
import {
  useForgotPassword,
  useVerifyOtp,
  useResetPassword,
} from "@/hooks/useAuth";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { mutate: forgotPassword, isPending: isForgotPending } =
    useForgotPassword();
  const { mutate: verifyOtp, isPending: isVerifyPending } = useVerifyOtp();
  const { mutate: resetPassword, isPending: isResetPending } =
    useResetPassword();

  // Countdown timer for OTP
  useEffect(() => {
    if (step !== 2 || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // Step 1: Email
  const emailSchema = z.object({
    email: z.string().email({ message: "بريد إلكتروني غير صحيح" }),
  });
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const onEmailSubmit = (data: { email: string }) => {
    forgotPassword(
      { email: data.email },
      {
        onSuccess: (res) => {
          setEmail(data.email);
          setStep(2);
          setTimeLeft(600);
          if (process.env.NODE_ENV === "development" && res?.otp) {
            alert(`OTP (Dev Mode): ${res.otp}`);
          }
        },
        onError: (error: any) => {
          toast({
            title: tCommon("error"),
            description: error?.response?.data?.message || "حدث خطأ",
            type: "error",
          });
        },
      }
    );
  };

  // Step 2: OTP
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
    const newOtp = [...otp];
    pastedData.forEach((char, i) => {
      if (/^\d$/.test(char) && i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    const nextEmptyIndex = newOtp.findIndex((v) => !v);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    otpRefs.current[focusIndex]?.focus();
  };

  const onOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال الرمز المكون من 6 أرقام",
        type: "error",
      });
      return;
    }

    verifyOtp(
      { email, otp: otpCode },
      {
        onSuccess: () => {
          setStep(3);
        },
        onError: (error: any) => {
          toast({
            title: tCommon("error"),
            description: error?.response?.data?.message || "الرمز غير صحيح",
            type: "error",
          });
        },
      }
    );
  };

  const resendOtp = () => {
    forgotPassword(
      { email },
      {
        onSuccess: (res) => {
          setTimeLeft(600);
          toast({ title: tCommon("success"), description: t("otpSent"), type: "success" });
          if (process.env.NODE_ENV === "development" && res?.otp) {
            alert(`OTP (Dev Mode): ${res.otp}`);
          }
        },
      }
    );
  };

  // Step 3: Reset Password
  const resetSchema = z
    .object({
      password: z.string().min(6, { message: "كلمة المرور قصيرة جداً" }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "كلمات المرور غير متطابقة",
      path: ["confirmPassword"],
    });

  type ResetValues = z.infer<typeof resetSchema>;

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    watch: watchReset,
    formState: { errors: resetErrors },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const watchPassword = watchReset("password", "");

  const getPasswordStrength = () => {
    if (!watchPassword) return null;
    if (watchPassword.length < 6) return { label: "ضعيف", color: "bg-red-500" };
    if (
      watchPassword.length >= 8 &&
      (/[0-9]/.test(watchPassword) || /[^A-Za-z0-9]/.test(watchPassword))
    ) {
      return { label: "قوي", color: "bg-green-500" };
    }
    return { label: "متوسط", color: "bg-yellow-500" };
  };

  const strength = getPasswordStrength();

  const onResetSubmit = (data: ResetValues) => {
    resetPassword(
      { email, otp: otp.join(""), newPassword: data.password, confirmPassword: data.confirmPassword },
      {
        onSuccess: () => {
          toast({
            title: tCommon("success"),
            description: "تم تغيير كلمة المرور بنجاح",
            type: "success",
          });
          // Router push happens in hook, but let's be explicit
        },
        onError: (error: any) => {
          toast({
            title: tCommon("error"),
            description: error?.response?.data?.message || "حدث خطأ",
            type: "error",
          });
        },
      }
    );
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s, i) => (
          <React.Fragment key={s}>
            <div
              className={`w-3 h-3 rounded-full transition-colors ${
                step >= s ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"
              }`}
            />
            {i < 2 && (
              <div
                className={`h-0.5 w-12 transition-colors ${
                  step > s ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">{t("forgotPassword")}</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق
            </p>
          </div>
          <Input
            label="البريد الإلكتروني"
            placeholder="example@email.com"
            type="email"
            leftIcon={<Mail size={18} style={{ direction: "ltr" }} />}
            error={emailErrors.email?.message}
            {...registerEmail("email")}
          />
          <Button type="submit" fullWidth loading={isForgotPending}>
            إرسال الرمز
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={onOtpSubmit} className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">أدخل رمز التحقق</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              تم إرسال رمز مكون من 6 أرقام إلى <br />
              <span className="font-semibold text-foreground" dir="ltr">{email}</span>
            </p>
          </div>

          <div className="flex justify-between gap-2" dir="ltr">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => {
                  otpRefs.current[index] = el;
                }}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                onPaste={handleOtpPaste}
                className="w-12 h-14 text-center text-lg font-bold"
              />
            ))}
          </div>

          <div className="text-center text-sm font-medium">
            {timeLeft > 0 ? (
              <span className="text-muted-foreground">
                إعادة الإرسال متاح بعد: {Math.floor(timeLeft / 60)}:
                {(timeLeft % 60).toString().padStart(2, "0")}
              </span>
            ) : (
              <button
                type="button"
                onClick={resendOtp}
                className="text-primary hover:underline"
              >
                إعادة إرسال الرمز
              </button>
            )}
          </div>

          <Button type="submit" fullWidth loading={isVerifyPending}>
            تحقق
          </Button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">كلمة المرور الجديدة</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              أدخل كلمة مرور قوية لتأمين حسابك
            </p>
          </div>

          <div className="space-y-1">
            <PasswordInput
              label={t("newPassword")}
              error={resetErrors.password?.message}
              {...registerReset("password")}
            />
            {strength && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all`}
                    style={{
                      width:
                        strength.label === "ضعيف"
                          ? "33%"
                          : strength.label === "متوسط"
                          ? "66%"
                          : "100%",
                    }}
                  />
                </div>
                <span
                  className={`text-xs font-medium ${
                    strength.label === "ضعيف"
                      ? "text-red-500"
                      : strength.label === "متوسط"
                      ? "text-yellow-500"
                      : "text-green-500"
                  }`}
                >
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <PasswordInput
              label={t("confirmPassword")}
              error={resetErrors.confirmPassword?.message}
              {...registerReset("confirmPassword")}
            />
          </div>

          <Button type="submit" fullWidth loading={isResetPending}>
            تغيير كلمة المرور
          </Button>
        </form>
      )}
    </div>
  );
}
