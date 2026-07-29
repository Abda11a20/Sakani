// apps/frontend/src/components/dashboard/rules/admin.rules.ts

import type { QuickActionKey, FormattedQuickAction } from "../types/dashboard.types";

export function mapAdminQuickAction(
  actionKey: QuickActionKey,
  isAr: boolean = true
): FormattedQuickAction {
  switch (actionKey) {
    case "MODERATE_PENDING_LISTINGS":
      return {
        key: actionKey,
        title: isAr ? "مراجعة الإعلانات المعلقة" : "Review Pending Listings",
        description: isAr ? "فحص واعتماد الإعلانات الجديدة المقدمة من الملاك" : "Review and approve new landlord submissions",
        iconName: "FileText",
        route: "/admin/listings",
        variant: "primary",
      };

    case "REVIEW_REPORTED_USERS":
      return {
        key: actionKey,
        title: isAr ? "مراجعة البلاغات والحسابات" : "Review User Reports",
        description: isAr ? "الاطلاع على شكاوى المستخدمين وإدارة الحسابات" : "Check user complaints and account restrictions",
        iconName: "ShieldAlert",
        route: "/admin/users",
        variant: "accent",
      };

    default:
      return {
        key: actionKey,
        title: isAr ? "إجراء إداري" : "Admin Action",
        description: "",
        iconName: "ShieldAlert",
        route: "/admin",
        variant: "secondary",
      };
  }
}
