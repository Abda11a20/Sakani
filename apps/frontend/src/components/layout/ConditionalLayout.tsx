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
 * لوحة التحكم والأدمن لها تخطيطات خاصة بها.
 * هذا المكون يخفي الـ Navbar والـ Footer العاميين عند مسارات التحكم والأدمن.
 */
export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Admin and Dashboard pages have their own layout — skip global nav/footer
  const isDashboardOrAdminRoute = pathname ? /(\/admin|\/dashboard)($|\/)/.test(pathname) : false;

  if (isDashboardOrAdminRoute) {
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
