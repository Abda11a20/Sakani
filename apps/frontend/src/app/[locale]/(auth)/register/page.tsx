// apps/frontend/src/app/[locale]/(auth)/register/page.tsx
import React from "react";
import { RegisterForm } from "./register-form";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";

interface RegisterPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: RegisterPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return buildPageMetadata({
    locale,
    path: "/register",
    title: `${t("register")} | Sakany`,
    description: locale === "ar" ? "إنشاء حساب جديد في منصة سكني" : "Create a new account on Sakani",
    noindex: true,
  });
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <div className="min-h-screen flex">
      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:text-start">
            <img src="/icon-192.png" alt="سكني" className="h-16 w-16 mx-auto md:mx-0 mb-6 object-contain rounded-2xl shadow-md" />
            <h1 className="text-3xl font-bold tracking-tight text-primary">
              {t("createNewAccount")}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {t("createNewAccountSubtitle")}
            </p>
          </div>
          <RegisterForm />
        </div>
      </div>

      {/* Left side - Image/Gradient */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-primary to-blue-900 justify-center items-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
        <div className="z-10 text-center max-w-lg">
          <h2 className="text-4xl font-bold mb-4 text-gold">{locale === "en" ? "Sakani" : "سكني"}</h2>
          <p className="text-lg text-blue-100">
            {t("sakaniDesc")}
          </p>
        </div>
      </div>
    </div>
  );
}
