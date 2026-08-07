// apps/frontend/src/app/[locale]/layout.tsx
import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Script from "next/script";
import Providers from "@/components/providers";

import { Toaster } from "@/components/ui/toast";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import { SeoSchemas } from "@/components/seo/seo-schemas";
import "../globals.css";


// ── Google Fonts ──
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  // Avoid a late font swap changing text height and shifting the page layout.
  display: "optional",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  // Keep first paint stable when the font is not immediately available.
  display: "optional",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://sakanieg.vercel.app"
  ),
  title: {
    default: "سكني — ابحث بثقة، اسكن بأمان",
    template: "%s | سكني",
  },
  description:
    "سكني — منصة مصرية لتأجير الشقق والغرف والأسِرّة. ابحث عن شقة مفروشة أو سكن طلابي أو سكن مشترك في مصر بثقة وأمان.",
  keywords: ["تأجير", "شقق", "عقارات", "مصر", "سكن", "إيجار", "sakani", "rent Egypt"],
  authors: [{ name: "سكني" }],
  manifest: "/manifest.json",
  themeColor: "#1B4F8A",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/icon-192.png",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  openGraph: {
    type: "website",
    siteName: "سكني — Sakani",
    title: "سكني — ابحث بثقة، اسكن بأمان",
    description: "منصة تأجير عقارات مصرية — ابحث عن شقق وأسرة بسهولة وأمان",
    locale: "ar_EG",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "سكني — منصة تأجير عقارات مصرية",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "سكني — ابحث بثقة، اسكن بأمان",
    description: "منصة تأجير عقارات مصرية — ابحث عن شقق وأسرة بسهولة وأمان",
    images: ["/og-image.png"],
  },
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // تحقق من صحة الـ locale
  if (!routing.locales.includes(locale as "ar" | "en")) {
    notFound();
  }

  const isRtl = locale === "ar";
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={isRtl ? "rtl" : "ltr"}
      className={`${cairo.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <SeoSchemas locale={locale} />
        {/* Resource Hints & Early Connections */}

        <link rel="preconnect" href="https://sakani-backend-production.up.railway.app" />
        <link rel="dns-prefetch" href="https://sakani-backend-production.up.railway.app" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="سكني" />

        {/* Service Worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.warn('SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
        {/* Google Analytics 4 (GA4) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID || "G-H11PK0TB95"}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID || "G-H11PK0TB95"}');
          `}
        </Script>
        {/* Microsoft Clarity */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID || "xxv6e1fn77"}");
          `}
        </Script>
      </head>
      <body
        className={
          isRtl
            ? "font-cairo bg-background text-foreground antialiased"
            : "font-inter bg-background text-foreground antialiased"
        }
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>
            <Toaster>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
            </Toaster>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
