// apps/frontend/src/components/layout/Footer.tsx
import React from "react";
import Link from "next/link";
import { Share2, Camera, MessageCircle, Phone, Mail, Home } from "lucide-react";

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1B3A6B] dark:bg-[#0A1628] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Column 1: Logo + description + social */}
          <div className="space-y-4">
            <div className="flex items-center gap-2" style={{ direction: "ltr" }}>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                <Home size={20} className="text-gold" />
              </span>
              <span className="font-cairo text-2xl font-bold text-white">سكني</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              ابحث بثقة، اسكن بأمان. منصة تأجير عقارات مصرية تربط المستأجرين بالملاك بكل سهولة وشفافية.
            </p>
            <div className="flex items-center gap-3" style={{ direction: "ltr" }}>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-gold hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Share2 size={18} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-gold hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Camera size={18} />
              </a>
              <a
                href="https://wa.me/201000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-gold hover:text-white transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick links */}
          <div className="space-y-4">
            <h3 className="font-cairo text-base font-semibold text-white">
              روابط سريعة
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/ar", label: "الرئيسية" },
                { href: "/ar/search", label: "البحث" },
                { href: "/ar/listings/new", label: "أضف إعلان" },
                { href: "/ar/how-it-works", label: "كيف يعمل الموقع" },
              ].map((link) => (
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
          <div className="space-y-4">
            <h3 className="font-cairo text-base font-semibold text-white">
              تواصل معنا
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="tel:+201000000000"
                  className="flex items-center gap-3 text-sm text-white/70 hover:text-gold transition-colors"
                  style={{ direction: "ltr" }}
                >
                  <Phone size={16} className="shrink-0 text-gold" />
                  <span>+20 100 000 0000</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@sakani.eg"
                  className="flex items-center gap-3 text-sm text-white/70 hover:text-gold transition-colors"
                  style={{ direction: "ltr" }}
                >
                  <Mail size={16} className="shrink-0 text-gold" />
                  <span>hello@sakani.eg</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-white/10 pt-6 text-center">
          <p className="text-sm text-white/50">
            جميع الحقوق محفوظة © {currentYear} سكني
          </p>
        </div>
      </div>
    </footer>
  );
};
