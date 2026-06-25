// apps/frontend/src/app/[locale]/(auth)/login/login-form.tsx
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Phone, Mail, Eye, EyeOff } from "lucide-react";
import { useLogin } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";

type LoginValues = {
  identifier: string;
  password: string;
};

function isEmail(val: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

export function LoginForm() {
  const t = useTranslations("auth");
  const { mutate: login, isPending, error } = useLogin();
  const params = useParams();
  const locale = params.locale as string;
  const [showPassword, setShowPassword] = useState(false);

  const loginSchema = z.object({
    identifier: z
      .string()
      .min(1, t("validation.required"))
      .refine(
        (val) =>
          /^01[0125][0-9]{8}$/.test(val) ||
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        t("validation.invalidPhoneOrEmail")
      ),
    password: z.string().min(6, t("validation.passwordMin")),
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const identifierValue = watch("identifier");
  const IdentifierIcon = isEmail(identifierValue) ? Mail : Phone;

  const onSubmit = (data: LoginValues) => {
    login(data);
  };

  const serverError =
    error instanceof Error ? error.message : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full max-w-md">
      {/* Server error */}
      {serverError && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {serverError}
        </div>
      )}

      {/* Identifier Field */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground/80">
          {t("phoneOrEmail")}
        </label>
        <div className="relative">
          <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <IdentifierIcon size={18} />
          </span>
          <input
            id="login-identifier"
            type="text"
            placeholder={t("phoneOrEmailPlaceholder")}
            dir="ltr"
            className={`input-field w-full ps-10 ${errors.identifier ? "border-red-500" : ""}`}
            {...register("identifier")}
          />
        </div>
        {errors.identifier && (
          <p className="text-xs text-red-500 mt-1">{errors.identifier.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground/80">
          {t("password")}
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className={`input-field w-full pe-10 ${errors.password ? "border-red-500" : ""}`}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
        )}
        <div className="flex justify-end mt-1">
          <Link
            href={`/${locale}/forgot-password`}
            className="text-sm text-primary hover:underline"
          >
            {t("forgotPassword")}
          </Link>
        </div>
      </div>

      <button
        id="login-submit-btn"
        type="submit"
        disabled={isPending}
        className="btn-primary w-full py-3 font-semibold rounded-xl mt-6 flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t("loggingIn")}
          </>
        ) : (
          t("login")
        )}
      </button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{t("or")}</span>
        </div>
      </div>

      <div className="text-center">
        <span className="text-sm text-muted-foreground me-1">{t("noAccount")}</span>
        <Link
          href={`/${locale}/register`}
          className="text-sm text-primary font-semibold hover:underline"
        >
          {t("register")}
        </Link>
      </div>
    </form>
  );
}
