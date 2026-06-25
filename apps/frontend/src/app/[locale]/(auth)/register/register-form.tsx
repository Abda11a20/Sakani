// apps/frontend/src/app/[locale]/(auth)/register/register-form.tsx
"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User as UserIcon, Phone, CreditCard, Home, Key, Mail } from "lucide-react";
import { Button, Input, PasswordInput, useToast } from "@/components/ui";
import { useRegister, useVerifyEmail } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type RegisterValues = {
  role: "tenant" | "landlord";
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  password: string;
  confirmPassword: string;
};

export function RegisterForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const { toast } = useToast();
  const { mutate: registerMutation, isPending } = useRegister();
  const { mutate: verifyEmail, isPending: isVerifyPending } = useVerifyEmail();
  
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [registeredEmail, setRegisteredEmail] = useState("");
  
  // OTP state for Step 3
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const registerSchema = z
    .object({
      role: z.enum(["tenant", "landlord"]),
      name: z
        .string()
        .regex(/^[\u0600-\u06FFa-zA-Z\s]+$/, { message: t("validation.nameLetters") }),
      email: z.string().email({ message: t("validation.invalidEmail") }),
      phone: z.string().regex(/^01[0125][0-9]{8}$/, { message: t("validation.invalidPhone") }),
      nationalId: z.string().regex(/^[0-9]{14}$/, { message: t("validation.invalidNationalId") }),
      password: z.string().min(6, { message: t("validation.passwordMin") }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.passwordsMismatch"),
      path: ["confirmPassword"],
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
      email: "",
      phone: "",
      nationalId: "",
      password: "",
      confirmPassword: "",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = (data: RegisterValues) => {
    registerMutation(data, {
      onError: (error: any) => {
        toast({
          title: tCommon("error"),
          description: error?.response?.data?.message || tCommon("error"),
          type: "error",
        });
      },
      onSuccess: () => {
        setRegisteredEmail(data.email);
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
      { email: registeredEmail, otp: otpCode },
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
    return (
      <form onSubmit={onOtpSubmit} className="space-y-6 w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">{t("activateAccount")}</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {t("activationCodeSent")} <br />
            <span className="font-semibold text-foreground" dir="ltr">{registeredEmail}</span>
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
          label={t("email")}
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
          {...register("phone")}
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
          {...register("nationalId")}
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

      <Button type="submit" fullWidth loading={isPending} className="mt-6">
        {t("register")}
      </Button>
    </form>
  );
}
