// apps/frontend/src/app/[locale]/(auth)/login/page.tsx
import React from "react";
import { LoginForm } from "./login-form";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "auth" });
  return {
    title: `${t("login")} | Sakany`,
  };
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white dark:bg-slate-950">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:text-start">
            <img src="/logo.png" alt="سكني" className="h-16 w-auto mx-auto md:mx-0 mb-6 object-contain dark:brightness-0 dark:invert" />
            <h1 className="text-3xl font-bold tracking-tight text-primary dark:text-gold">
              أهلاً بك مجدداً
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              سجل دخولك لمتابعة عقاراتك أو البحث عن سكنك الجديد
            </p>
          </div>
          <LoginForm />
        </div>
      </div>

      {/* Left side - Image/Gradient */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-primary to-blue-900 justify-center items-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
        <div className="z-10 text-center max-w-lg">
          <h2 className="text-4xl font-bold mb-4 text-gold">سكني</h2>
          <p className="text-lg text-blue-100">
            المنصة الأولى لتأجير العقارات في مصر. نوفر لك الأمان والثقة في كل خطوة.
          </p>
        </div>
      </div>
    </div>
  );
}
