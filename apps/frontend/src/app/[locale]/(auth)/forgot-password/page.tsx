// apps/frontend/src/app/[locale]/(auth)/forgot-password/page.tsx
import React from "react";
import { ForgotPasswordForm } from "./forgot-password-form";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "auth" });
  return {
    title: `${t("resetPassword")} | Sakany`,
  };
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-100 dark:border-slate-800">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
