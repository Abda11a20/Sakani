// apps/frontend/src/app/[locale]/(auth)/register/register-form.tsx
"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User as UserIcon, Phone, CreditCard, Home, Key, Mail } from "lucide-react";
import { Button, Input, PasswordInput, useToast } from "@/components/ui";
import { useRegister, useVerifyEmail, useResendVerification } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth.api";

type RegisterValues = {
  role: "tenant" | "landlord";
  name: string;
  email?: string;
  phone: string;
  nationalId: string;
  password: string;
  confirmPassword: string;
  otpChannel: "EMAIL" | "TELEGRAM";
  linkCode?: string;
};

export function RegisterForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const { toast } = useToast();
  const { mutate: registerMutation, isPending } = useRegister();
  const { mutate: verifyEmail, isPending: isVerifyPending } = useVerifyEmail();
  const { mutate: resendVerification, isPending: isResendPending } = useResendVerification();
  
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredPhone, setRegisteredPhone] = useState("");
  const [timeLeft, setTimeLeft] = useState(90); // 90 seconds
  
  // OTP state for Step 3
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Telegram linking state
  const [telegramCode, setTelegramCode] = useState<string>("");
  const [telegramLinked, setTelegramLinked] = useState<boolean>(false);
  const [checkingLink, setCheckingLink] = useState<boolean>(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown timer for OTP
  React.useEffect(() => {
    if (step !== 3 || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const resendOtp = () => {
    resendVerification(
      registeredEmail
        ? { email: registeredEmail }
        : { phone: registeredPhone },
      {
        onSuccess: () => {
          setTimeLeft(90);
          toast({
            title: tCommon("success"),
            description: t("validation.otpSentSuccess") || "تم إعادة إرسال الكود بنجاح",
            type: "success",
          });
        },
        onError: (err: any) => {
          toast({
            title: tCommon("error"),
            description: err?.response?.data?.message || tCommon("error"),
            type: "error",
          });
        },
      }
    );
  };

  const registerSchema = z
    .object({
      role: z.enum(["tenant", "landlord"]),
      name: z
        .string()
        .regex(/^[\u0600-\u06FFa-zA-Z\s]+$/, { message: t("validation.nameLetters") }),
      email: z
        .string()
        .optional()
        .refine((val) => !val || z.string().email().safeParse(val).success, {
          message: t("validation.invalidEmail"),
        }),
      phone: z.string().regex(/^01[0125][0-9]{8}$/, { message: t("validation.invalidPhone") }),
      nationalId: z.string().regex(/^[0-9]{14}$/, { message: t("validation.invalidNationalId") }),
      password: z.string().min(6, { message: t("validation.passwordMin") }),
      confirmPassword: z.string(),
      otpChannel: z.enum(["EMAIL", "TELEGRAM"]),
      linkCode: z.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.passwordsMismatch"),
      path: ["confirmPassword"],
    })
    .refine((data) => {
      if (data.otpChannel === "TELEGRAM" && !data.linkCode) {
        return false;
      }
      return true;
    }, {
      message: "كود ربط تليجرام مطلوب عند اختيار قناة تليجرام",
      path: ["linkCode"],
    })
    .refine((data) => {
      if (data.otpChannel === "EMAIL" && !data.email) {
        return false;
      }
      return true;
    }, {
      message: "البريد الإلكتروني مطلوب عند اختيار التفعيل عبر البريد",
      path: ["email"],
    });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "tenant",
      name: "",
      email: undefined,
      phone: "",
      nationalId: "",
      password: "",
      confirmPassword: "",
      otpChannel: "EMAIL",
      linkCode: undefined,
    },
  });

  const selectedRole = watch("role");
  const selectedOtpChannel = watch("otpChannel");

  const startLinkPolling = (code: string) => {
    stopLinkPolling();
    setCheckingLink(true);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await authApi.checkTelegramLinkStatus(code);
        if (res.data?.linked) {
          setTelegramLinked(true);
          setCheckingLink(false);
          stopLinkPolling();
          toast({
            title: tCommon("success"),
            description: "تم ربط تليجرام بنجاح! يمكنك الآن الضغط على زر التسجيل.",
            type: "success",
          });
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
      stopLinkPolling();
    };
  }, []);

  const handleOtpChannelChange = async (channel: "EMAIL" | "TELEGRAM") => {
    setValue("otpChannel", channel);
    if (channel === "TELEGRAM") {
      const emailVal = watch("email");
      const phoneVal = watch("phone");
      const identifier = emailVal || phoneVal;

      if (!identifier) {
        toast({
          title: "تنبيه",
          description: "يرجى إدخال البريد الإلكتروني أو رقم الهاتف أولاً لتوليد كود الربط.",
          type: "error",
        });
        setValue("otpChannel", "EMAIL"); // revert to email
        return;
      }

      try {
        setTelegramLinked(false);
        const res = await authApi.generateTelegramLinkCode(identifier);
        const code = res.data?.linkCode;
        if (code) {
          setTelegramCode(code);
          setValue("linkCode", code);
          startLinkPolling(code);
        }
      } catch (err: any) {
        toast({
          title: tCommon("error"),
          description: "فشل إنشاء رمز ربط تليجرام. يرجى المحاولة مرة أخرى.",
          type: "error",
        });
        setValue("otpChannel", "EMAIL"); // revert to email
      }
    } else {
      stopLinkPolling();
      setTelegramCode("");
      setValue("linkCode", "");
    }
  };

  const onSubmit = (data: RegisterValues) => {
    // Strip empty strings so optional fields are truly absent on the backend
    const payload = {
      ...data,
      email: data.email?.trim() || undefined,
      linkCode: data.linkCode?.trim() || undefined,
    };
    registerMutation(payload as RegisterValues, {
      onError: (error: any) => {
        toast({
          title: tCommon("error"),
          description: error?.response?.data?.message || tCommon("error"),
          type: "error",
        });
      },
      onSuccess: () => {
        setRegisteredEmail(data.email || "");
        setRegisteredPhone(data.phone);
        setTimeLeft(90);
        setStep(3); // Go to email verification
        toast({
          title: tCommon("success"),
          description: t("validation.registerSuccess"),
          type: "success",
        });
      },
    });
  };

  // OTP Handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
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

    verifyEmail(
      registeredEmail
        ? { email: registeredEmail, otp: otpCode }
        : { phone: registeredPhone, otp: otpCode },
      {
        onSuccess: () => {
          toast({
            title: tCommon("success"),
            description: t("validation.activateSuccess"),
            type: "success",
          });
          router.push(`/${locale}/login`);
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

  if (step === 1) {
    return (
      <div className="space-y-6 w-full max-w-md">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              setValue("role", "tenant");
              setStep(2);
            }}
            className={`p-6 border-2 rounded-xl flex flex-col items-center justify-center transition-all ${
              selectedRole === "tenant"
                ? "border-primary bg-primary/5"
                : "border-slate-200 hover:border-primary/50"
            }`}
          >
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Home className="text-primary w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg mb-2">{t("iAmTenant")}</h3>
            <p className="text-xs text-muted-foreground text-center">
              {t("iAmTenantDesc")}
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setValue("role", "landlord");
              setStep(2);
            }}
            className={`p-6 border-2 rounded-xl flex flex-col items-center justify-center transition-all ${
              selectedRole === "landlord"
                ? "border-primary bg-primary/5"
                : "border-slate-200 hover:border-primary/50"
            }`}
          >
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Key className="text-primary w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg mb-2">{t("iAmLandlord")}</h3>
            <p className="text-xs text-muted-foreground text-center">
              {t("iAmLandlordDesc")}
            </p>
          </button>
        </div>

        <div className="text-center mt-6">
          <span className="text-sm text-muted-foreground me-1">
            {t("haveAccount")}
          </span>
          <Link
            href={`/${locale}/login`}
            className="text-sm text-primary font-semibold hover:underline"
          >
            {t("login")}
          </Link>
        </div>
      </div>
    );
  }

  if (step === 3) {
    const isTelegram = selectedOtpChannel === "TELEGRAM";
    return (
      <form onSubmit={onOtpSubmit} className="space-y-6 w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">{t("activateAccount")}</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {isTelegram ? (
              <>
                تم إرسال رمز التفعيل بنجاح عبر حساب <b>Telegram</b> الخاص بك.
              </>
            ) : (
              <>
                {t("activationCodeSent")} <br />
                <span className="font-semibold text-foreground" dir="ltr">{registeredEmail}</span>
              </>
            )}
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

        <div className="flex items-center justify-center gap-2 text-sm font-medium">
          <button
            type="button"
            onClick={resendOtp}
            disabled={timeLeft > 0 || isResendPending}
            className={`font-semibold transition-all ${
              timeLeft > 0 || isResendPending
                ? "text-slate-400 cursor-not-allowed"
                : "text-primary hover:underline cursor-pointer"
            }`}
          >
            {isResendPending ? "جاري الإرسال..." : t("resendCode")}
          </button>
          {timeLeft > 0 && (
            <span className="text-muted-foreground font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs" dir="ltr">
              {`${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")}`}
            </span>
          )}
        </div>

        <Button type="submit" fullWidth loading={isVerifyPending}>
          {t("activateAccount")}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full max-w-md">
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-semibold text-primary">{t("stepOf", { step: 2, total: 2 })}</span>
        <button
          type="button"
          onClick={() => setStep(1)}
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          {tCommon("back")}
        </button>
      </div>

      <div className="space-y-1">
        <Input
          label={t("name")}
          placeholder={t("name")}
          leftIcon={<UserIcon size={18} style={{ direction: "ltr" }} />}
          error={errors.name?.message}
          {...register("name")}
        />
      </div>

      <div className="space-y-1">
        <Input
          label={`${t("email")} ${selectedOtpChannel === "EMAIL" ? "" : " (اختياري)"}`}
          placeholder="example@email.com"
          type="email"
          leftIcon={<Mail size={18} style={{ direction: "ltr" }} />}
          error={errors.email?.message}
          {...register("email")}
        />
      </div>

      <div className="space-y-1">
        <Input
          label={t("phone")}
          placeholder="01xxxxxxxxx"
          type="tel"
          leftIcon={<Phone size={18} style={{ direction: "ltr" }} />}
          error={errors.phone?.message}
          {...register("phone", {
            onChange: (e) => {
              e.target.value = e.target.value.replace(/\D/g, "");
            }
          })}
        />
      </div>

      <div className="space-y-1">
        <Input
          label={t("nationalId")}
          placeholder="14 xxxxxxxxxx"
          type="tel"
          maxLength={14}
          leftIcon={<CreditCard size={18} style={{ direction: "ltr" }} />}
          error={errors.nationalId?.message}
          {...register("nationalId", {
            onChange: (e) => {
              e.target.value = e.target.value.replace(/\D/g, "");
            }
          })}
        />
      </div>

      <div className="space-y-1">
        <PasswordInput
          label={t("password")}
          error={errors.password?.message}
          {...register("password")}
        />
      </div>

      <div className="space-y-1">
        <PasswordInput
          label={t("confirmPassword")}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
      </div>

      {/* ── قناة استقبال كود التفعيل (OTP) ── */}
      <div className="space-y-3 pt-2">
        <label className="text-sm font-semibold text-foreground block">
          كيف ترغب في تلقي رموز التحقق (OTP)؟
        </label>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleOtpChannelChange("EMAIL")}
            className={`p-3 border rounded-xl flex items-center justify-center gap-2 transition-all text-sm font-medium ${
              selectedOtpChannel === "EMAIL"
                ? "border-primary bg-primary/5 text-primary"
                : "border-slate-200 hover:border-slate-300 text-muted-foreground"
            }`}
          >
            <Mail size={16} />
            البريد الإلكتروني
          </button>

          <button
            type="button"
            onClick={() => handleOtpChannelChange("TELEGRAM")}
            className={`p-3 border rounded-xl flex items-center justify-center gap-2 transition-all text-sm font-medium ${
              selectedOtpChannel === "TELEGRAM"
                ? "border-primary bg-primary/5 text-primary"
                : "border-slate-200 hover:border-slate-300 text-muted-foreground"
            }`}
          >
            <span className="text-sky-500 font-bold">📱</span>
            تليجرام (Telegram)
          </button>
        </div>

        {selectedOtpChannel === "TELEGRAM" && telegramCode && (
          <div className="border border-sky-100 bg-sky-50/50 p-4 rounded-xl space-y-3 mt-3 animate-fadeIn">
            <h4 className="text-xs font-bold text-sky-800 flex items-center gap-1.5">
              <span>🔒</span> خطوات ربط حساب تليجرام:
            </h4>
            <ol className="text-xs text-sky-700 space-y-1.5 list-decimal list-inside pr-1">
              <li>
                افتح البوت من خلال الضغط على الزر أدناه:
                <a
                  href="https://t.me/SakaniOtp_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-primary hover:underline mx-1"
                >
                  فتح البوت 🌐
                </a>
              </li>
              <li>أرسل كود الربط التالي للبوت:</li>
            </ol>
            
            <div className="flex items-center justify-between bg-white border border-sky-200 rounded-lg p-2.5 mt-2">
              <span className="font-mono text-lg font-bold text-slate-800 tracking-wider">
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
                className="text-xs text-primary font-bold hover:underline"
              >
                نسخ الكود 📋
              </button>
            </div>

            <div className="flex items-center gap-2 mt-3 pt-1 border-t border-sky-100/50">
              {checkingLink && (
                <div className="flex items-center gap-1.5 text-xs text-sky-600">
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full" />
                  <span>في انتظار ربط تليجرام...</span>
                </div>
              )}
              {telegramLinked && (
                <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <span>✅</span> تم ربط الحساب بنجاح!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Button
        type="submit"
        fullWidth
        loading={isPending}
        disabled={selectedOtpChannel === "TELEGRAM" && !telegramLinked}
        className="mt-6"
      >
        {selectedOtpChannel === "TELEGRAM" && !telegramLinked ? "في انتظار ربط تليجرام..." : t("register")}
      </Button>
    </form>
  );
}
