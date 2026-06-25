// apps/frontend/src/app/[locale]/admin/layout.tsx
import type { ReactNode } from "react";
import AdminLayout from "@/components/layout/AdminLayout";

interface AdminRouteLayoutProps {
  children: ReactNode;
}

export default function AdminRouteLayout({ children }: AdminRouteLayoutProps) {
  return <AdminLayout>{children}</AdminLayout>;
}
