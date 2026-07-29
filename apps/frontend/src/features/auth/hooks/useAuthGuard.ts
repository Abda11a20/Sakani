// apps/frontend/src/features/auth/hooks/useAuthGuard.ts
"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useMe } from "./useAuth";
import { getDashboardPath } from "@/lib/helpers";
import type { UserRole } from "@/types";

interface AuthGuardOptions {
  role?: UserRole | UserRole[];
  requiredRoles?: UserRole[];
}

export const useAuthGuard = (options?: AuthGuardOptions) => {
  const { token, user, isHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "ar";

  const { isLoading: isMeLoading, isError } = useMe();

  const isLoading =
    !isHydrated || (!!token && !isError && (!user || isMeLoading));

  useEffect(() => {
    if (isLoading) return;

    if (!token || isError) {
      const searchParams = new URLSearchParams();
      searchParams.set("returnUrl", pathname || "");
      router.push(`/${locale}/login?${searchParams.toString()}`);
      return;
    }

    const requiredRoles: UserRole[] =
      options?.requiredRoles ??
      (options?.role
        ? Array.isArray(options.role)
          ? options.role
          : [options.role]
        : []);

    if (user && requiredRoles.length > 0) {
      const hasRequiredRole =
        requiredRoles.includes(user.role as UserRole) ||
        (requiredRoles.includes("admin") && user.role === "super_admin");

      if (!hasRequiredRole) {
        router.push(getDashboardPath(user.role as UserRole, locale));
      }
    }
  }, [
    isLoading,
    token,
    user,
    options?.role,
    options?.requiredRoles,
    router,
    locale,
    pathname,
    isError,
  ]);

  return {
    user,
    isLoading,
    isAdmin:      user?.role === "admin" || user?.role === "super_admin",
    isSuperAdmin: user?.role === "super_admin",
    isLandlord:   user?.role === "landlord",
    isTenant:     user?.role === "tenant",
  };
};

export default useAuthGuard;
