// apps/frontend/src/app/[locale]/(auth)/restore-account/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { RefreshCw, Lock, Mail, Phone, ArrowRight, Clock, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import { Spinner } from "@/components/ui/spinner";
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/lib/constants";
import { getDashboardPath } from "@/lib/helpers";
import type { UserRole } from "@/types";

function RestoreAccountForm() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const isRtl = locale === "ar";

  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);

  const initialIdentifier =
    searchParams.get("identifier") || searchParams.get("phone") || searchParams.get("email") || "";
  const remainingDays = searchParams.get("remainingDays") || "30";

  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (initialIdentifier && !identifier) {
      setIdentifier(initialIdentifier);
    }
  }, [initialIdentifier, identifier]);

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim() || !password) {
      toast({
        title: isRtl ? "بيانات ناقصة" : "Missing Fields",
        description: isRtl ? "يرجى إدخال البريد/الهاتف وكلمة المرور." : "Please enter your identifier and password.",
        variant: "error",
      });
      return;
    }

    setIsRestoring(true);
    try {
      const res = await api.post("/auth/restore-account", {
        identifier: identifier.trim(),
        password,
      });

      const responseData = res.data?.data || res.data || {};
      const { accessToken, refreshToken, user } = responseData;

      if (accessToken && user) {
        setToken(accessToken);
        setUser(user);

        if (typeof window !== "undefined") {
          localStorage.setItem(TOKEN_KEY, accessToken);
          if (refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
          }
        }

        toast({
          title: isRtl ? "تم استعادة الحساب بنجاح" : "Account Restored Successfully",
          description: isRtl ? "تم إلغاء جدولة الحذف وتنشيط حسابك بنجاح. مرحباً بك مجدداً!" : "Welcome back! Your account has been reactivated.",
          variant: "success",
        });

        const dashboardPath = getDashboardPath((user.role || "tenant") as UserRole, locale);
        if (typeof window !== "undefined") {
          window.location.href = dashboardPath;
        } else {
          router.push(dashboardPath);
        }
      }
    } catch (err: any) {
      toast({
        title: isRtl ? "فشل استعادة الحساب" : "Restoration Failed",
        description: err.response?.data?.message || err.message || (isRtl ? "حدث خطأ غير متوقع" : "Unexpected error"),
        variant: "error",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-200 font-cairo"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-9 shadow-2xl border border-slate-200/80 space-y-6 transition-all duration-300">

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-blue-600/15 via-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center border border-blue-200/70 shadow-md shadow-blue-500/10">
            <RefreshCw className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isRtl ? "تنشيط الحساب" : "Account Reactivation"}
            </h1>
          </div>
        </div>

        {/* Simplified Days Remaining Alert */}
        <div className="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-700 shadow-sm">
          <Clock className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            {isRtl
              ? `متبقي ${remainingDays} يوماً لحذف الحساب نهائياً`
              : `${remainingDays} days left until permanent account deletion`}
          </span>
        </div>


        {/* Form Container */}
        <form onSubmit={handleRestore} className="space-y-4 pt-1">

          {/* Identifier Input */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground/80">
              {isRtl ? "رقم الهاتف أو البريد الإلكتروني" : "Phone or Email"}
            </label>
            <div className="relative" dir="ltr">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true">
                {identifier.includes("@") ? <Mail size={18} /> : <Phone size={18} />}
              </span>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={isRtl ? "01016864615 أو user@email.com" : "e.g. 01012345678 or user@email.com"}
                dir="ltr"
                className="input-field w-full ps-10 pe-4"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground/80">
              {isRtl ? "كلمة المرور" : "Password"}
            </label>
            <div className="relative" dir="ltr">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true">
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                className="input-field w-full ps-10 pe-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={isRestoring}
              className="btn-primary w-full py-3.5 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md"
            >
              {isRestoring ? (
                <Spinner size="sm" />
              ) : (
                <RefreshCw className="w-4 h-4 shrink-0" />
              )}
              <span>
                {isRestoring
                  ? (isRtl ? "جارٍ التنشيط والمعالجة..." : "Reactivating Account...")
                  : (isRtl ? "إعادة تنشيط الحساب الآن" : "Reactivate Account Now")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => router.push(`/${locale}/login`)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground font-semibold py-2 inline-flex flex-row items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowRight className={`w-4 h-4 text-muted-foreground ${isRtl ? "" : "rotate-180"}`} />
              <span>{isRtl ? "العودة لتسجيل الدخول" : "Back to Login"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RestoreAccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 font-cairo text-xs text-slate-400">Loading...</div>}>
      <RestoreAccountForm />
    </Suspense>
  );
}
