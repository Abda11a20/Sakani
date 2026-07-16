// apps/frontend/src/app/[locale]/(auth)/forgot-password/forgot-password-form.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Phone } from "lucide-react";
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
  const [channel, setChannel] = useState<"EMAIL" | "TELEGRAM">("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState(90); // 90 seconds

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
    email: z.string().email({ message: t("validation.invalidEmail") }),
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
      { email: data.email, channel: "EMAIL" },
      {
        onSuccess: (res: any) => {
          setEmail(res?.email || data.email);
          setStep(2);
          setTimeLeft(90);
          if (process.env.NODE_ENV === "development" && res?.otp) {
            alert(`OTP (Dev Mode): ${res.otp}`);
          }
        },
        onError: (error: any) => {
          toast({
            title: tCommon("error"),
            description: error?.response?.data?.message || tCommon("error"),
            type: "error",
          });
        },
      }
    );
  };

  // Step 1: Telegram Phone
  const phoneSchema = z.object({
    phone: z.string().regex(/^01[0125][0-9]{8}$/, { message: t("validation.invalidPhone") }),
  });
  const {
    register: registerPhone,
    handleSubmit: handlePhoneSubmit,
    formState: { errors: phoneErrors },
  } = useForm({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  const onPhoneSubmit = (data: { phone: string }) => {
    forgotPassword(
      { phone: data.phone, channel: "TELEGRAM" },
      {
        onSuccess: (res: any) => {
          setEmail(res?.email || "");
          setStep(2);
          setTimeLeft(90);
          if (process.env.NODE_ENV === "development" && res?.otp) {
            alert(`OTP (Dev Mode): ${res.otp}`);
          }
        },
        onError: (error: any) => {
          toast({
            title: tCommon("error"),
            description: error?.response?.data?.message || tCommon("error"),
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
        title: tCommon("error"),
        description: t("validation.enter6Digits"),
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
            description: error?.response?.data?.message || t("validation.otpIncorrect"),
            type: "error",
          });
        },
      }
    );
  };

  const resendOtp = () => {
    forgotPassword(
      { email, channel },
      {
        onSuccess: (res: any) => {
          setTimeLeft(90);
          toast({ title: tCommon("success"), description: t("validation.otpSentSuccess"), type: "success" });
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
      password: z.string().min(6, { message: t("validation.passwordMin") }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.passwordsMismatch"),
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
    if (watchPassword.length < 6) return { label: t("weak"), color: "bg-red-500" };
    if (
      watchPassword.length >= 8 &&
      (/[0-9]/.test(watchPassword) || /[^A-Za-z0-9]/.test(watchPassword))
    ) {
      return { label: t("strong"), color: "bg-green-500" };
    }
    return { label: t("medium"), color: "bg-yellow-500" };
  };

  const strength = getPasswordStrength();

  const onResetSubmit = (data: ResetValues) => {
    resetPassword(
      { email, otp: otp.join(""), newPassword: data.password, confirmPassword: data.confirmPassword },
      {
        onSuccess: () => {
          toast({
            title: tCommon("success"),
            description: t("validation.passwordChangeSuccess"),
            type: "success",
          });
        },
        onError: (error: any) => {
          toast({
            title: tCommon("error"),
            description: error?.response?.data?.message || tCommon("error"),
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
        <div className="space-y-5 animate-fadeIn">
          <div className="text-center mb-5">
            <h2 className="text-2xl font-bold font-cairo">{t("forgotPassword")}</h2>
            <p className="text-muted-foreground mt-2 text-sm font-cairo">
              اختر وسيلة استلام رمز التحقق لإعادة تعيين كلمة المرور
            </p>
          </div>

          {/* Cards Selection */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              type="button"
              onClick={() => setChannel("EMAIL")}
              className={`p-5 border-2 rounded-2xl flex flex-col items-center justify-center transition-all ${
                channel === "EMAIL"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-slate-200 dark:border-slate-800 hover:border-primary/50 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900"
              }`}
            >
              <div className={`p-3 rounded-full mb-3 ${channel === "EMAIL" ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                <Mail className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm font-cairo">البريد الإلكتروني</h4>
              <p className="text-[10px] text-muted-foreground text-center mt-1 font-cairo">
                إرسال الرمز للبريد
              </p>
            </button>

            <button
              type="button"
              onClick={() => setChannel("TELEGRAM")}
              className={`p-5 border-2 rounded-2xl flex flex-col items-center justify-center transition-all ${
                channel === "TELEGRAM"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-slate-200 dark:border-slate-800 hover:border-primary/50 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900"
              }`}
            >
              <div className={`p-3 rounded-full mb-3 ${channel === "TELEGRAM" ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15.75-.8 3.51-1.13 4.96-.14.61-.36.81-.58.83-.48.04-.84-.32-1.31-.63-.73-.48-1.14-.78-1.85-1.25-.82-.54-.29-.84.18-1.33.12-.13 2.27-2.08 2.31-2.26.01-.02.01-.13-.05-.18-.07-.05-.17-.03-.24-.02-.1.02-1.74 1.1-4.91 3.24-.46.32-.88.48-1.26.47-.42-.01-1.24-.24-1.84-.43-.74-.24-1.33-.37-1.28-.79.03-.22.33-.45.9-.69 3.51-1.53 5.86-2.54 7.03-3.03 3.35-1.38 4.05-1.62 4.5-.12.01.07.03.25-.03.54z"/>
                </svg>
              </div>
              <h4 className="font-bold text-sm font-cairo">تليجرام (Telegram)</h4>
              <p className="text-[10px] text-muted-foreground text-center mt-1 font-cairo">
                إرسال الرمز للبوت
              </p>
            </button>
          </div>

          <form onSubmit={channel === "EMAIL" ? handleEmailSubmit(onEmailSubmit) : handlePhoneSubmit(onPhoneSubmit)} className="space-y-4">
            {channel === "EMAIL" ? (
              <Input
                label={t("email")}
                placeholder="example@email.com"
                type="email"
                leftIcon={<Mail size={18} style={{ direction: "ltr" }} />}
                error={emailErrors.email?.message}
                {...registerEmail("email")}
              />
            ) : (
              <Input
                label={t("phone")}
                placeholder="01xxxxxxxxx"
                type="tel"
                leftIcon={<Phone size={18} style={{ direction: "ltr" }} />}
                error={phoneErrors.phone?.message}
                {...registerPhone("phone", {
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/\D/g, "");
                  }
                })}
              />
            )}
            <Button type="submit" fullWidth loading={isForgotPending}>
              {t("sendCode")}
            </Button>
          </form>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={onOtpSubmit} className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">{t("enterOtp")}</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              تم إرسال رمز التحقق الخاص بك إلى وسيلة الاستقبال المفضلة لديك (البريد الإلكتروني أو تليجرام).
            </p>
          </div>

          <div className="flex justify-center gap-1 sm:gap-2 max-w-full overflow-hidden" dir="ltr">
            {otp.map((digit, index) => (
              <div key={index} className="w-9 h-11 sm:w-12 sm:h-14 flex-shrink-0">
                <Input
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
                  className="w-full h-full text-center text-lg font-bold p-0"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <button
              type="button"
              onClick={resendOtp}
              disabled={timeLeft > 0}
              className={`font-semibold transition-all ${
                timeLeft > 0
                  ? "text-slate-400 cursor-not-allowed"
                  : "text-primary hover:underline cursor-pointer"
              }`}
            >
              {t("resendCode")}
            </button>
            {timeLeft > 0 && (
              <span className="text-muted-foreground font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs" dir="ltr">
                {`${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")}`}
              </span>
            )}
          </div>

          <Button type="submit" fullWidth loading={isVerifyPending}>
            {t("verify")}
          </Button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">{t("newPassword")}</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {t("enterNewPassword")}
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
                        strength.label === t("weak")
                          ? "33%"
                          : strength.label === t("medium")
                          ? "66%"
                          : "100%",
                    }}
                  />
                </div>
                <span
                  className={`text-xs font-medium ${
                    strength.label === t("weak")
                      ? "text-red-500"
                      : strength.label === t("medium")
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
            {t("changePasswordBtn")}
          </Button>
        </form>
      )}
    </div>
  );
}
