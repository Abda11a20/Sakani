// apps/frontend/src/hooks/useAuthGuard.ts
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useMe } from "./useAuth";

interface AuthGuardOptions {
  role?: "tenant" | "landlord" | "admin" | "super_admin";
}

export const useAuthGuard = (options?: AuthGuardOptions) => {
  const { token, user, isHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "ar";

  const { isLoading: isMeLoading, isError } = useMe();

  const isLoading = !isHydrated || (!!token && !isError && (!user || isMeLoading));

  useEffect(() => {
    if (isLoading) return;

    if (!token || isError) {
      const searchParams = new URLSearchParams();
      searchParams.set("returnUrl", pathname || "");
      router.push(`/${locale}/login?${searchParams.toString()}`);
      return;
    }

    const hasRequiredRole = !options?.role || user?.role === options.role || (options.role === "admin" && user?.role === "super_admin");
    if (user && !hasRequiredRole) {
      if (user.role === "tenant") {
        router.push(`/${locale}/dashboard/tenant`);
      } else if (user.role === "landlord") {
        router.push(`/${locale}/dashboard/landlord`);
      } else {
        router.push(`/${locale}/admin`);
      }
    }
  }, [isLoading, token, user, options?.role, router, locale, pathname, isError]);

  return { user, isLoading };
};
