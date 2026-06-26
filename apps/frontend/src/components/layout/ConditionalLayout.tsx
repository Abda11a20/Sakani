// apps/frontend/src/components/layout/ConditionalLayout.tsx
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import ChatWidget from "@/components/chat/ChatWidget";
import { useAuthStore } from "@/store/auth.store";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

/**
 * لوحة التحكم والأدمن لها تخطيطات خاصة بها.
 * هذا المكون يخفي الـ Navbar والـ Footer العاميين عند مسارات التحكم والأدمن
 * ويقوم بدمج نافذة الدعم الفني العائمة.
 */
export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  // Admin and Dashboard pages have their own layout — skip global nav/footer
  const isDashboardOrAdminRoute = pathname ? /(\/admin|\/dashboard)($|\/)/.test(pathname) : false;

  if (isDashboardOrAdminRoute) {
    return (
      <>
        {children}
        {user && user.role !== "admin" && user.role !== "super_admin" && <ChatWidget />}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      {user && user.role !== "admin" && user.role !== "super_admin" && <ChatWidget />}
    </div>
  );
}
