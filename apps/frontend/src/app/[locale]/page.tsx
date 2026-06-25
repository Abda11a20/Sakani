// apps/frontend/src/app/[locale]/page.tsx
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Search,
  Shield,
  Star,
  MapPin,
  Building2,
  DoorOpen,
  BedDouble,
  CheckCircle,
  ArrowLeft,
  Users,
  TrendingUp,
  Home,
} from "lucide-react";
import { ListingCard, ListingCardSkeleton } from "@/components/listings/ListingCard";
import type { Listing, District } from "@/types";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "سكني — ابحث بثقة، اسكن بأمان" : "Sakani — Find Your Home Safely",
    description:
      locale === "ar"
        ? "أكبر منصة لتأجير الشقق والغرف والأسرة في مصر. عقارات موثقة، مؤجرين معتمدون، وتجربة آمنة."
        : "Egypt's largest rental platform for apartments, rooms and beds. Verified listings, trusted landlords.",
    keywords: ["شقة للإيجار", "غرفة للإيجار", "سكن مصر", "apartment egypt"],
  };
}

// ── API fetching ──────────────────────────────────────────────
async function getFeaturedListings(): Promise<Listing[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"}/listings?limit=6&sortBy=popular`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    // Handle both { success, data } and direct array
    return Array.isArray(json) ? json : (json?.data?.items ?? json?.data ?? json?.items ?? []);
  } catch {
    return [];
  }
}

async function getPopularDistricts(): Promise<District[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"}/search/popular-districts`,
      { next: { revalidate: 600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : (json?.data ?? []);
  } catch {
    return [];
  }
}

// ── Hero Section ─────────────────────────────────────────────
function HeroSection({ locale }: { locale: string }) {
  return (
    <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: "linear-gradient(135deg, #0F1A2E 0%, #1B4F8A 45%, #0F1A2E 100%)",
        }}
      />
      {/* Decorative circles */}
      <div
        className="absolute top-16 start-8 w-80 h-80 rounded-full opacity-[0.07] -z-10 blur-xl"
        style={{ background: "#D4A847" }}
      />
      <div
        className="absolute bottom-16 end-8 w-64 h-64 rounded-full opacity-[0.07] -z-10 blur-xl"
        style={{ background: "#4A90D9" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04] -z-10"
        style={{ background: "radial-gradient(circle, #4A90D9, transparent)" }}
      />

      <div className="container mx-auto px-4 text-center text-white py-20">
        {/* Badge */}
        <div className="mb-6">
          <span
            className="inline-block px-5 py-2 rounded-full text-sm font-semibold mb-6 border"
            style={{
              background: "rgba(212, 168, 71, 0.15)",
              borderColor: "rgba(212, 168, 71, 0.3)",
              color: "#E8C06A",
            }}
          >
            🏠 منصة تأجير العقارات الأولى في مصر
          </span>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-5 font-cairo">
            ابحث بثقة
            <br />
            <span style={{ color: "#D4A847" }}>اسكن بأمان</span>
          </h1>
          <p className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
            أكبر منصة لتأجير الشقق والغرف والأسرة في مصر — عقارات موثقة ومراجعة لضمان تجربتك
          </p>
        </div>

        {/* Search Bar */}
        <div className="mt-10 max-w-2xl mx-auto">
          <div
            className="rounded-2xl p-2 shadow-2xl border"
            style={{
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(16px)",
              borderColor: "rgba(255,255,255,0.15)",
            }}
          >
            <div className="flex items-center gap-2">
              {/* Quick type tabs */}
              <div className="hidden sm:flex gap-1 ps-1">
                {[
                  { label: "شقة", icon: Building2 },
                  { label: "غرفة", icon: DoorOpen },
                  { label: "سرير", icon: BedDouble },
                ].map(({ label, icon: Icon }) => (
                  <span
                    key={label}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-white/60 cursor-pointer hover:bg-white/10 transition-colors whitespace-nowrap"
                  >
                    <Icon size={13} />
                    {label}
                  </span>
                ))}
              </div>

              <div className="flex-1 flex items-center gap-2 px-3">
                <Search size={18} className="text-white/40 shrink-0" />
                <input
                  id="hero-search"
                  type="text"
                  placeholder="ابحث في المنطقة أو المدينة..."
                  className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm"
                />
              </div>

              <Link
                href={`/${locale}/search`}
                id="hero-search-btn"
                className="shrink-0 px-6 py-3 rounded-xl text-sm font-bold text-[#0F1A2E] transition-all hover:opacity-90 active:scale-95"
                style={{ background: "#D4A847" }}
              >
                بحث
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
          <span className="flex items-center gap-2">
            <Building2 size={16} className="text-yellow-400" />
            <span>+1000 إعلان</span>
          </span>
          <span className="w-px h-4 bg-white/20 hidden sm:block" />
          <span className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />
            <span>مؤجرون موثقون</span>
          </span>
          <span className="w-px h-4 bg-white/20 hidden sm:block" />
          <span className="flex items-center gap-2">
            <Shield size={16} className="text-blue-400" />
            <span>بيئة آمنة</span>
          </span>
        </div>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    {
      emoji: "🔍",
      title: "ابحث",
      desc: "استخدم الفلاتر للعثور على السكن المناسب بسعر يناسب ميزانيتك",
      color: "#1B4F8A",
    },
    {
      emoji: "👀",
      title: "استعرض التفاصيل",
      desc: "شاهد الصور الحقيقية وقرأ التفاصيل الكاملة وتواصل مع المؤجر",
      color: "#D4A847",
    },
    {
      emoji: "🏠",
      title: "اسكن بأمان",
      desc: "انتقل لسكنك الجديد بثقة كاملة مع ضمان سكني",
      color: "#22C55E",
    },
  ];

  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full">
            كيف يعمل سكني؟
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-3 text-foreground font-cairo">
            3 خطوات بسيطة للسكن المثالي
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            نجعل عملية إيجاد السكن أسهل وأأمن — من البحث حتى الانتقال
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <div key={i} className="relative text-center group">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 start-full w-full h-px border-t-2 border-dashed border-border z-0 -translate-y-1/2" />
              )}
              <div
                className="relative z-10 w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300"
                style={{ background: `${step.color}18`, border: `1px solid ${step.color}30` }}
              >
                {step.emoji}
                <span
                  className="absolute -top-2 -end-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: step.color }}
                >
                  {i + 1}
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Featured Listings ─────────────────────────────────────────
function FeaturedListingsSection({
  listings,
  locale,
}: {
  listings: Listing[];
  locale: string;
}) {
  return (
    <section className="py-20 px-4" style={{ background: "var(--card)" }}>
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <span className="text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full">
              ⭐ مميزة
            </span>
            <h2 className="text-3xl font-bold mt-3 text-foreground font-cairo">
              إعلانات مميزة
            </h2>
          </div>
          <Link
            href={`/${locale}/search`}
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
          >
            عرض الكل
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link
            href={`/${locale}/search`}
            className="inline-flex items-center gap-2 btn-primary px-8 py-3 text-base font-semibold rounded-xl"
          >
            <Search size={18} />
            تصفح كل الإعلانات
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Popular Districts ─────────────────────────────────────────
function PopularDistrictsSection({
  districts,
  locale,
}: {
  districts: District[];
  locale: string;
}) {
  const fallbackDistricts: District[] = [
    { name: "المنصورة", governorate: "الدقهلية", count: 85 },
    { name: "مدينة نصر", governorate: "القاهرة", count: 120 },
    { name: "الإسكندرية", governorate: "الإسكندرية", count: 95 },
    { name: "الشيخ زايد", governorate: "الجيزة", count: 60 },
    { name: "الزقازيق", governorate: "الشرقية", count: 45 },
    { name: "أسيوط", governorate: "أسيوط", count: 40 },
  ];

  const displayDistricts = districts.length > 0 ? districts : fallbackDistricts;

  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full">
            📍 المناطق
          </span>
          <h2 className="text-3xl font-bold mt-4 mb-3 text-foreground font-cairo">
            المناطق الأكثر طلباً
          </h2>
          <p className="text-muted-foreground">
            اكتشف أفضل المناطق وأكثرها طلباً من المستأجرين
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {displayDistricts.slice(0, 6).map((district, i) => (
            <Link
              key={i}
              href={`/${locale}/search?district=${encodeURIComponent(district.name)}&governorate=${encodeURIComponent(district.governorate)}`}
              className="group flex flex-col items-center text-center p-5 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <MapPin size={22} className="text-primary" />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">{district.name}</h3>
              <p className="text-xs text-muted-foreground mb-2">{district.governorate}</p>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {district.count} إعلان
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Landlord CTA ──────────────────────────────────────────────
function LandlordSection({ locale }: { locale: string }) {
  const perks = [
    { icon: TrendingUp, title: "وصول أوسع", desc: "آلاف الباحثين عن سكن يصلون لإعلانك يومياً" },
    { icon: Shield, title: "مؤجرون موثقون", desc: "نميّزك بشارة التوثيق لزيادة ثقة المستأجرين" },
    { icon: Star, title: "مجاناً في البداية", desc: "انشر أول إعلان مجاناً واستفد من كل المزايا" },
  ];

  return (
    <section
      className="py-20 px-4"
      style={{ background: "linear-gradient(135deg, #0F1A2E 0%, #1B4F8A 100%)" }}
    >
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <span
            className="text-sm font-semibold px-4 py-1.5 rounded-full"
            style={{ background: "rgba(212,168,71,0.2)", color: "#E8C06A" }}
          >
            للمؤجرين
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-3 text-white font-cairo">
            هل أنت مؤجر؟
          </h2>
          <p className="text-white/70 max-w-lg mx-auto">
            أضف إعلانك الآن وابدأ في الوصول لآلاف المستأجرين الباحثين عن سكن في منطقتك
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
          {perks.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center p-6 rounded-2xl border"
              style={{
                background: "rgba(255,255,255,0.06)",
                borderColor: "rgba(255,255,255,0.1)",
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(212,168,71,0.15)" }}
              >
                <Icon size={24} style={{ color: "#D4A847" }} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-white/60">{desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={`/${locale}/register?role=landlord`}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-bold transition-all hover:opacity-90 active:scale-95"
            style={{ background: "#D4A847", color: "#0F1A2E" }}
          >
            <Home size={18} />
            أضف إعلانك الآن
          </Link>
          <Link
            href={`/${locale}/search`}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-white border border-white/20 hover:bg-white/10 transition-colors"
          >
            استعرض الإعلانات
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ─────────────────────────────────────────────────
function CtaSection({ locale }: { locale: string }) {
  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-3xl text-center">
        <div
          className="rounded-3xl p-12 border"
          style={{
            background: "linear-gradient(135deg, rgba(27,79,138,0.1) 0%, rgba(212,168,71,0.05) 100%)",
            borderColor: "rgba(27,79,138,0.2)",
          }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground font-cairo">
            ابدأ رحلتك الآن 🚀
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            انضم لآلاف المستخدمين الذين وجدوا سكنهم المثالي عبر سكني
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/${locale}/register`}
              className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-bold"
            >
              <Users size={18} />
              إنشاء حساب مجاني
            </Link>
            <Link
              href={`/${locale}/search`}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
            >
              <Search size={18} />
              تصفح الإعلانات
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  const [featuredListings, popularDistricts] = await Promise.all([
    getFeaturedListings(),
    getPopularDistricts(),
  ]);

  return (
    <main>
      <HeroSection locale={locale} />
      <HowItWorksSection />
      <FeaturedListingsSection listings={featuredListings} locale={locale} />
      <PopularDistrictsSection districts={popularDistricts} locale={locale} />
      <LandlordSection locale={locale} />
      <CtaSection locale={locale} />
    </main>
  );
}
