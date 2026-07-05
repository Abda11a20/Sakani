// apps/frontend/src/components/layout/Footer.tsx
import React from "react";
import Link from "next/link";
import { Share2, Camera, MessageCircle, Phone, Mail } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

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
    <footer className="bg-[#1B3A6B] dark:bg-[#0A1628] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Logo + description + social */}
          <div className="space-y-3">
            {/* Logo */}
            <div className="flex items-center gap-2.5" style={{ direction: "ltr" }}>
              <img
                src="/icon-192.png"
                alt="سكني"
                className="h-8 w-8 object-contain rounded-lg"
              />
              <span className="font-cairo font-bold text-lg text-white">سكني</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              {t("description")}
            </p>
            <div className="flex items-center gap-3" style={{ direction: "ltr" }}>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-gold hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Share2 size={16} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-gold hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Camera size={16} />
              </a>
              <a
                href="https://wa.me/201551876606"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-gold hover:text-white transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle size={16} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick links */}
          <div className="space-y-3">
            <h3 className="font-cairo text-sm font-semibold text-white">
              {t("quickLinks")}
            </h3>
            <ul className="space-y-2">
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
            <h3 className="font-cairo text-sm font-semibold text-white">
              {t("contactUs")}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="tel:+201551876606"
                  className="flex items-center gap-3 text-sm text-white/70 hover:text-gold transition-colors"
                  style={{ direction: "ltr" }}
                >
                  <Phone size={15} className="shrink-0 text-gold" />
                  <span>+20 155 187 6606</span>
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
        <div className="mt-6 border-t border-white/10 pt-5 text-center">
          <p className="text-sm text-white/50">
            {t("rightsReserved", { year: currentYear })}
          </p>
        </div>
      </div>
    </footer>
  );
};
