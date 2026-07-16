// apps/frontend/src/hooks/useAuthGuard.ts
"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useMe } from "./useAuth";
import { getDashboardPath } from "@/lib/helpers";
import type { UserRole } from "@/types";

interface AuthGuardOptions {
  /**
   * backward compat — قبول دور واحد أو مصفوفة أدوار
   * مثال (الشكل القديم): useAuthGuard({ role: "tenant" })
   */
  role?: UserRole | UserRole[];
  /**
   * الشكل الجديد — مصفوفة أدوار مطلوبة
   * مثال: useAuthGuard({ requiredRoles: ["tenant", "landlord"] })
   */
  requiredRoles?: UserRole[];
}

export const useAuthGuard = (options?: AuthGuardOptions) => {
  const { token, user, isHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "ar";

  const { isLoading: isMeLoading, isError } = useMe();

  // مازال يتحمّل إذا لم يتم الهيدريشن أو إذا كان التوكن موجوداً ولم يُحمَّل المستخدم بعد
  const isLoading =
    !isHydrated || (!!token && !isError && (!user || isMeLoading));

  useEffect(() => {
    if (isLoading) return;

    // لا توكن أو خطأ في التحقق → وجّه لصفحة تسجيل الدخول مع returnUrl
    if (!token || isError) {
      const searchParams = new URLSearchParams();
      searchParams.set("returnUrl", pathname || "");
      router.push(`/${locale}/login?${searchParams.toString()}`);
      return;
    }

    // حسّب الأدوار المطلوبة من كلا الشكلين (backward compat)
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
        // super_admin يُعامَل كـ admin في جميع الصفحات
        (requiredRoles.includes("admin") && user.role === "super_admin");

      if (!hasRequiredRole) {
        // يوجّه للداشبورد الصحيح بناءً على دوره — ليس دائماً للأدمن
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
    // flags مفيدة تُغني عن التحقق اليدوي في كل مكان
    isAdmin:      user?.role === "admin" || user?.role === "super_admin",
    isSuperAdmin: user?.role === "super_admin",
    isLandlord:   user?.role === "landlord",
    isTenant:     user?.role === "tenant",
  };
};

export default useAuthGuard;
