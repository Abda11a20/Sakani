// apps/frontend/src/components/layout/Footer.tsx
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Phone, Mail } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { getWhatsAppLink } from "@/lib/whatsapp";

export const Footer: React.FC = () => {
  const t = useTranslations("footer");
  const locale = useLocale();
  const currentYear = new Date().getFullYear();

  const links = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/search`, label: t("search") },
    { href: `/${locale}/listings/new`, label: t("addListing") },
    { href: `/${locale}/how-it-works`, label: t("howItWorks") },
  ];

  return (
    <footer className="bg-[#0F1A2E] text-white border-t border-white/10 font-cairo">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Logo + description + social */}
          <div className="space-y-3">
            <div className="flex items-center gap-2" style={{ direction: "ltr" }}>
              <Image src="/icon-192.png" alt="سكني" width={32} height={32} className="object-contain rounded-lg" priority />
              <span className="font-cairo font-bold text-lg text-white">سكني</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              {t("description")}
            </p>
            <div className="flex items-center gap-3" style={{ direction: "ltr" }}>
              <a
                href="https://www.facebook.com/profile.php?id=61593097584345"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-accent hover:text-text transition-colors"
                aria-label="Facebook"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                  <path d="M22 12.06C22 6.48 17.52 2 11.94 2S2 6.48 2 12.06c0 5.03 3.69 9.2 8.51 9.94v-7.03H7.97v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.77l-.44 2.91h-2.33V22C18.31 21.26 22 17.09 22 12.06Z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-accent hover:text-text transition-colors"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                href={getWhatsAppLink("+201289631207")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-accent hover:text-text transition-colors"
                aria-label="WhatsApp"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                  <path d="M12.04 2C6.52 2 2.04 6.48 2.04 12c0 1.77.46 3.43 1.26 4.87L2 22l5.28-1.29A9.95 9.95 0 0 0 12.04 22c5.52 0 10-4.48 10-10S17.56 2 12.04 2Zm0 18.17c-1.5 0-2.97-.4-4.25-1.16l-.3-.18-3.13.76.8-3.04-.2-.31A8.11 8.11 0 0 1 3.7 12c0-4.6 3.74-8.34 8.34-8.34s8.34 3.74 8.34 8.34-3.74 8.17-8.34 8.17Zm4.57-6.23c-.25-.13-1.47-.73-1.7-.81-.23-.09-.4-.13-.57.13-.17.25-.66.81-.81.98-.15.17-.3.19-.55.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.25-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.3.38-.45.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.57-1.38-.78-1.89-.2-.49-.41-.42-.57-.43h-.48c-.17 0-.45.06-.68.32-.23.25-.89.87-.89 2.12s.91 2.46 1.04 2.63c.13.17 1.79 2.73 4.33 3.83.6.26 1.07.42 1.44.54.61.19 1.16.16 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.57.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick links */}
          <div className="space-y-3">
            <p className="font-cairo text-sm font-semibold text-white">
              {t("quickLinks")}
            </p>
            <ul className="space-y-1.5">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div className="space-y-3">
            <p className="font-cairo text-sm font-semibold text-white">
              {t("contactUs")}
            </p>
            <ul className="space-y-2">
              <li>
                <a
                  href="tel:+201289631207"
                  className="flex items-center gap-3 text-sm text-white/70 hover:text-gold transition-colors"
                  style={{ direction: "ltr" }}
                >
                  <Phone size={15} className="shrink-0 text-gold" />
                  <span>+20 128 963 1207</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:sakani.otp.app@gmail.com"
                  className="flex items-center gap-3 text-sm text-white/70 hover:text-gold transition-colors"
                  style={{ direction: "ltr" }}
                >
                  <Mail size={15} className="shrink-0 text-gold" />
                  <span>sakani.otp.app@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-white/10 pt-4 text-center">
          <p className="text-sm text-white/80">
            {t("rightsReserved", { year: currentYear })}
          </p>
        </div>
      </div>
    </footer>
  );
};
