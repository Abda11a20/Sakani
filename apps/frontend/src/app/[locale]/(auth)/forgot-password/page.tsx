// apps/frontend/src/app/[locale]/(auth)/forgot-password/page.tsx
import React from "react";
import { ForgotPasswordForm } from "./forgot-password-form";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";

interface ForgotPasswordPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ForgotPasswordPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return buildPageMetadata({
    locale,
    path: "/forgot-password",
    title: `${t("resetPassword")} | Sakany`,
    description: locale === "ar" ? "استعادة كلمة المرور في منصة سكني" : "Reset password on Sakani",
    noindex: true,
  });
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
