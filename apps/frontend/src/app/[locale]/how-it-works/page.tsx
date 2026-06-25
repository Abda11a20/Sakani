// apps/frontend/src/app/[locale]/how-it-works/page.tsx
import React from "react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { 
  Search, 
  Building,
  PlusCircle, 
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { Button, Card, CardBody, CardHeader } from "@/components/ui";

interface HowItWorksProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HowItWorksProps) {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "كيف يعمل سكني — دليل الاستخدام" : "How Sakani Works — Guide",
    description: locale === "ar" 
      ? "تعرف على خطوات استخدام منصة سكني للطلاب والشباب والملاك لتسهيل عملية الإيجار بأمان" 
      : "Learn how to use Sakani platform for tenants and landlords to rent properties safely",
  };
}

export default async function HowItWorksPage({ params }: HowItWorksProps) {
  const { locale } = await params;
  const t = await getTranslations("howItWorksPage");
  const isRtl = locale === "ar";

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#0D1828]">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden flex items-center justify-center">
        {/* Background gradient */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: "linear-gradient(135deg, #0F1A2E 0%, #1B4F8A 50%, #0F1A2E 100%)",
          }}
        />
        {/* Decorative blur elements */}
        <div className="absolute top-10 start-10 w-72 h-72 rounded-full opacity-10 bg-amber-500 blur-2xl -z-10" />
        <div className="absolute bottom-10 end-10 w-72 h-72 rounded-full opacity-10 bg-blue-500 blur-2xl -z-10" />

        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-black font-cairo mb-4 leading-tight">
            {t("title")}
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed font-cairo">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Guide Content */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl mx-auto">
          {/* Tenant Card */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#112240] shadow-xl rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="p-8 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-blue-500/5">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Search size={28} />
              </div>
              <h2 className="text-2xl font-bold font-cairo text-slate-900 dark:text-slate-100">
                {t("forTenants")}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo mt-1">
                {t("forTenantsSubtitle")}
              </p>
            </CardHeader>
            <CardBody className="p-8 space-y-8">
              {/* Tenant Step 1 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold font-sans">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 dark:text-slate-100 font-cairo text-base">
                    {t("tenantStep1Title")}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed font-cairo">
                    {t("tenantStep1Desc")}
                  </p>
                </div>
              </div>

              {/* Tenant Step 2 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold font-sans">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 dark:text-slate-100 font-cairo text-base">
                    {t("tenantStep2Title")}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed font-cairo">
                    {t("tenantStep2Desc")}
                  </p>
                </div>
              </div>

              {/* Tenant Step 3 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold font-sans">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 dark:text-slate-100 font-cairo text-base">
                    {t("tenantStep3Title")}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed font-cairo">
                    {t("tenantStep3Desc")}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Landlord Card */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#112240] shadow-xl rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="p-8 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-amber-500/5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                <Building size={28} />
              </div>
              <h2 className="text-2xl font-bold font-cairo text-slate-900 dark:text-slate-100">
                {t("forLandlords")}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo mt-1">
                {t("forLandlordsSubtitle")}
              </p>
            </CardHeader>
            <CardBody className="p-8 space-y-8">
              {/* Landlord Step 1 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 font-bold font-sans">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 dark:text-slate-100 font-cairo text-base">
                    {t("landlordStep1Title")}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed font-cairo">
                    {t("landlordStep1Desc")}
                  </p>
                </div>
              </div>

              {/* Landlord Step 2 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 font-bold font-sans">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 dark:text-slate-100 font-cairo text-base">
                    {t("landlordStep2Title")}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed font-cairo">
                    {t("landlordStep2Desc")}
                  </p>
                </div>
              </div>

              {/* Landlord Step 3 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 font-bold font-sans">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 dark:text-slate-100 font-cairo text-base">
                    {t("landlordStep3Title")}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed font-cairo">
                    {t("landlordStep3Desc")}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-100/70 dark:bg-[#112240]/40 py-16 border-t border-slate-200/50 dark:border-slate-800/80">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-950 dark:text-slate-100 font-cairo">
            {t("ctaTitle")}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-3 font-cairo text-sm leading-relaxed max-w-xl mx-auto">
            {t("ctaSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
            <Link href={`/${locale}/search`}>
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold font-cairo rounded-2xl py-6 px-8 flex items-center justify-center gap-2">
                <span>{t("ctaTenantBtn")}</span>
                {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </Button>
            </Link>
            <Link href={`/${locale}/dashboard/landlord/listings/add`}>
              <Button variant="outline" className="w-full sm:w-auto border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-bold font-cairo rounded-2xl py-6 px-8 flex items-center justify-center gap-2">
                <span>{t("ctaLandlordBtn")}</span>
                <PlusCircle size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
