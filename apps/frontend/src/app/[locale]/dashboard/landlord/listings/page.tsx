// apps/frontend/src/app/[locale]/dashboard/landlord/listings/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Spinner } from "@/components/ui/spinner";

export default function LandlordListingsRedirect() {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    router.replace(`/${locale}/dashboard/landlord/advertisements`);
  }, [router, locale]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  );
}