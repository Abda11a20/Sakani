// apps/frontend/src/app/[locale]/layout.tsx
import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Providers from "@/components/providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/toast";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import "../globals.css";

// ── Google Fonts ──
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "سكني — ابحث بثقة، اسكن بأمان",
    template: "%s | سكني",
  },
  description:
    "منصة تأجير عقارات مصرية — ابحث عن شقق وأسرة بسهولة وأمان",
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
      </head>
      <body
        className={
          isRtl
            ? "font-cairo bg-background text-foreground antialiased"
            : "font-inter bg-background text-foreground antialiased"
        }
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="sakani-theme"
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
        </ThemeProvider>
      </body>
    </html>
  );
}
