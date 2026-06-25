// apps/frontend/src/app/[locale]/(auth)/reset-password/page.tsx
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

interface ResetPasswordPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ResetPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("resetPassword") };
}

export default async function ResetPasswordPage({
  params,
}: ResetPasswordPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md card p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">{t("resetPassword")}</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {t("enterOtpAndPassword")}
          </p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="reset-otp">
              {t("otp")}
            </label>
            <input
              id="reset-otp"
              type="text"
              inputMode="numeric"
              dir="ltr"
              placeholder="123456"
              className="input-field tracking-widest text-center"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="reset-new-password">
              {t("newPassword")}
            </label>
            <input
              id="reset-new-password"
              type="password"
              placeholder="••••••••"
              className="input-field"
            />
          </div>

          <button type="submit" className="btn-primary w-full mt-2">
            {t("changePassword")}
          </button>
        </form>
      </div>
    </main>
  );
}
