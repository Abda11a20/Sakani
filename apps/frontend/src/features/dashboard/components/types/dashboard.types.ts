// apps/frontend/src/components/dashboard/types/dashboard.types.ts

export type QuickActionKey =
  // Landlord — dynamic (from backend)
  | "CREATE_FIRST_LISTING"
  | "CREATE_NEW_LISTING"
  | "REVIEW_PENDING_REQUESTS"
  | "RENEW_EXPIRING_CONTRACT"
  // Landlord — always visible shortcuts
  | "MANAGE_LISTINGS"
  | "MANAGE_CONTRACTS"
  | "VIEW_REQUESTS"
  | "VIEW_RENTAL_HISTORY"
  // Tenant — dynamic
  | "SEARCH_HOUSING"
  | "CREATE_SMART_ALERT"
  | "CONFIRM_VIEWING_APPOINTMENT"
  | "VIEW_MY_REQUESTS"
  // Admin — dynamic
  | "MODERATE_PENDING_LISTINGS"
  | "REVIEW_REPORTED_USERS";

export interface UrgentItem {
  id: string;
  type:
    | "CONTRACT_EXPIRING"
    | "VIEWING_REQUEST_PENDING"
    | "LISTING_UNAPPROVED"
    | "LISTING_PAUSED"
    | "REQUEST_ACCEPTED";
  title: string;
  description: string;
  severity: "high" | "medium" | "info";
  entityId?: string;
  route?: string;
}

export interface Recommendation {
  id: string;
  priority: number;
  type: string;
  title: string;
  description: string;
  route: string;
  dismissable: boolean;
}

export interface DashboardSummaryResponse {
  stats: Record<string, any>;
  urgent: UrgentItem[];
  recommendations: Recommendation[];
  quickActions: QuickActionKey[];
  lastUpdatedAt: string;
}

export interface FormattedQuickAction {
  key: QuickActionKey;
  title: string;
  description: string;
  iconName:
    | "Plus"
    | "FileText"
    | "UserCheck"
    | "Search"
    | "Bell"
    | "CheckCircle2"
    | "ShieldAlert"
    | "Building2"
    | "ClipboardList"
    | "History"
    | "RefreshCw"
    | "Home";
  route: string;
  /** primary = brand-blue filled | accent = gold filled | secondary = white outlined */
  variant: "primary" | "secondary" | "accent";
}
