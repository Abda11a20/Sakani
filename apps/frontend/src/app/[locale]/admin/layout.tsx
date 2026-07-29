// apps/frontend/src/app/[locale]/admin/layout.tsx
import type { Metadata } from "next";
import AdminLayout from "@/components/layout/AdminLayout";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
