// apps/frontend/src/components/dashboard/rules/landlord.rules.ts

import type { QuickActionKey, FormattedQuickAction } from "../types/dashboard.types";

export function mapLandlordQuickAction(
  actionKey: QuickActionKey,
  isAr: boolean = true
): FormattedQuickAction {
  switch (actionKey) {
    // ── Dynamic state-based actions (from backend) ─────────────
    case "CREATE_FIRST_LISTING":
      return {
        key: actionKey,
        title: isAr ? "أنشئ أول إعلان" : "Create First Listing",
        description: isAr ? "ابدأ بنشر وحدتك أو أسرّتك المتاحة" : "Start listing your property",
        iconName: "Plus",
        route: "/dashboard/landlord/listings/add",
        variant: "primary",
      };

    case "CREATE_NEW_LISTING":
      return {
        key: actionKey,
        title: isAr ? "إضافة إعلان جديد" : "Add New Listing",
        description: isAr ? "نشر وحدة أو سرير إضافي" : "Publish a new property",
        iconName: "Plus",
        route: "/dashboard/landlord/listings/add",
        variant: "primary",
      };

    case "REVIEW_PENDING_REQUESTS":
      return {
        key: actionKey,
        title: isAr ? "مراجعة الطلبات" : "Review Requests",
        description: isAr ? "طلبات معاينة بانتظار ردك" : "Requests awaiting your response",
        iconName: "UserCheck",
        route: "/dashboard/landlord/requests",
        variant: "accent",
      };

    case "RENEW_EXPIRING_CONTRACT":
      return {
        key: actionKey,
        title: isAr ? "تجديد العقد" : "Renew Contract",
        description: isAr ? "عقد على وشك الانتهاء" : "Contract expiring soon",
        iconName: "RefreshCw",
        route: "/dashboard/landlord/rental-history",
        variant: "accent",
      };

    // ── Always-visible static shortcuts ────────────────────────
    case "MANAGE_LISTINGS":
      return {
        key: actionKey,
        title: isAr ? "إدارة الإعلانات" : "Manage Listings",
        description: isAr ? "كل إعلاناتك في مكان واحد" : "All your listings",
        iconName: "Building2",
        route: "/dashboard/landlord/advertisements",
        variant: "secondary",
      };

    case "MANAGE_CONTRACTS":
      return {
        key: actionKey,
        title: isAr ? "إدارة العقود" : "Manage Contracts",
        description: isAr ? "عقود الإيجار النشطة والمنتهية" : "Active & expired leases",
        iconName: "FileText",
        route: "/dashboard/landlord/rental-history",
        variant: "secondary",
      };

    case "VIEW_REQUESTS":
      return {
        key: actionKey,
        title: isAr ? "الطلبات الواردة" : "Incoming Requests",
        description: isAr ? "طلبات المعاينة والاستفسارات" : "Viewing requests & inquiries",
        iconName: "ClipboardList",
        route: "/dashboard/landlord/requests",
        variant: "secondary",
      };

    case "VIEW_RENTAL_HISTORY":
      return {
        key: actionKey,
        title: isAr ? "سجل الإيجارات" : "Rental History",
        description: isAr ? "العقود المكتملة والأرشيف" : "Completed contracts",
        iconName: "History",
        route: "/dashboard/landlord/rental-history",
        variant: "secondary",
      };

    default:
      return {
        key: actionKey,
        title: isAr ? "إجراء سريع" : "Quick Action",
        description: "",
        iconName: "Plus",
        route: "/dashboard/landlord",
        variant: "secondary",
      };
  }
}
