// apps/frontend/src/components/dashboard/rules/tenant.rules.ts

import type { QuickActionKey, FormattedQuickAction } from "../types/dashboard.types";

export function mapTenantQuickAction(
  actionKey: QuickActionKey,
  isAr: boolean = true
): FormattedQuickAction {
  switch (actionKey) {
    // ── Dynamic state-based actions (from backend) ─────────────
    case "SEARCH_HOUSING":
      return {
        key: actionKey,
        title: isAr ? "البحث عن سكن" : "Search Housing",
        description: isAr ? "تصفح الشقق والأسرة المتاحة" : "Browse available units",
        iconName: "Search",
        route: "/listings",
        variant: "primary",
      };

    case "CONFIRM_VIEWING_APPOINTMENT":
      return {
        key: actionKey,
        title: isAr ? "تأكيد موعد المعاينة" : "Confirm Appointment",
        description: isAr ? "تواصل مع المالك لتأكيد الموعد" : "Confirm viewing date",
        iconName: "CheckCircle2",
        route: "/dashboard/tenant/viewing-requests",
        variant: "accent",
      };

    case "CREATE_SMART_ALERT":
      return {
        key: actionKey,
        title: isAr ? "تنبيه ذكي جديد" : "Create Smart Alert",
        description: isAr ? "استلم تنبيهاً حين يتوفر سكن مناسب" : "Get notified on matching listings",
        iconName: "Bell",
        route: "/dashboard/tenant",
        variant: "accent",
      };

    // ── Always-visible static shortcuts ────────────────────────
    case "VIEW_MY_REQUESTS":
      return {
        key: actionKey,
        title: isAr ? "طلباتي" : "My Requests",
        description: isAr ? "طلبات المعاينة المرسلة" : "Sent viewing requests",
        iconName: "ClipboardList",
        route: "/dashboard/tenant/viewing-requests",
        variant: "secondary",
      };

    case "VIEW_RENTAL_HISTORY":
      return {
        key: actionKey,
        title: isAr ? "سجل إيجاراتي" : "Rental History",
        description: isAr ? "عقودي السابقة والحالية" : "My lease history",
        iconName: "History",
        route: "/dashboard/tenant/rental-history",
        variant: "secondary",
      };

    default:
      return {
        key: actionKey,
        title: isAr ? "إجراء سريع" : "Quick Action",
        description: "",
        iconName: "Search",
        route: "/listings",
        variant: "secondary",
      };
  }
}
