// apps/frontend/src/components/layout/ConditionalLayout.tsx
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

/**
 * لوحة الأدمن لها Sidebar خاص بها (AdminLayout).
 * هذا المكون يخفي الـ Navbar والـ Footer العاميين عند المسارات التي تبدأ بـ /admin.
 */
export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Admin pages have their own layout — skip global nav/footer
  const isAdminRoute = pathname ? /\/admin($|\/)/.test(pathname) : false;

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
