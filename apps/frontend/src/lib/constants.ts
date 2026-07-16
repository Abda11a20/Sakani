// Infrastructure layer
// Not used yet.
// Will be migrated gradually.

// apps/frontend/src/lib/constants.ts

// ── LocalStorage Keys ─────────────────────────────────────────────────────────
export const TOKEN_KEY          = "sakani_token";
export const REFRESH_TOKEN_KEY  = "sakani_refresh_token";
export const WISHLIST_KEY       = "sakani_wishlist";
export const LOCALE_KEY         = "NEXT_LOCALE";
export const THEME_KEY          = "sakani-theme";
export const USER_KEY           = "sakani_user";

// ── Unit Types ────────────────────────────────────────────────────────────────
// NOTE: "room" has been permanently removed from this project.
export const UNIT_TYPE_CONFIG = {
  apartment: { labelAr: "شقة كاملة",  labelEn: "Apartment",  icon: "Building2" },
  bed:       { labelAr: "سرير",        labelEn: "Shared Bed", icon: "Bed"       },
} as const;

export type UnitTypeKey = keyof typeof UNIT_TYPE_CONFIG;

// ── Listing Statuses ──────────────────────────────────────────────────────────
export const LISTING_STATUS_CONFIG = {
  active:         { labelAr: "نشط",           labelEn: "Active",        color: "success" },
  pending_review: { labelAr: "قيد المراجعة",  labelEn: "Under Review",  color: "warning" },
  rented:         { labelAr: "مؤجر",          labelEn: "Rented",        color: "danger"  },
  paused:         { labelAr: "موقوف",         labelEn: "Paused",        color: "gray"    },
  rejected:       { labelAr: "مرفوض",         labelEn: "Rejected",      color: "danger"  },
  draft:          { labelAr: "مسودة",         labelEn: "Draft",         color: "gray"    },
} as const;

export type ListingStatusKey = keyof typeof LISTING_STATUS_CONFIG;

// ── Request Statuses ──────────────────────────────────────────────────────────
export const REQUEST_STATUS_CONFIG = {
  pending:   { labelAr: "قيد الانتظار", labelEn: "Pending",   color: "warning" },
  accepted:  { labelAr: "مقبول",        labelEn: "Accepted",  color: "success" },
  rejected:  { labelAr: "مرفوض",        labelEn: "Rejected",  color: "danger"  },
  completed: { labelAr: "مكتمل",        labelEn: "Completed", color: "info"    },
} as const;

export type RequestStatusKey = keyof typeof REQUEST_STATUS_CONFIG;

// ── Gender Targets ────────────────────────────────────────────────────────────
export const GENDER_TARGET_CONFIG = {
  male:   { labelAr: "شباب فقط",        labelEn: "Males Only"    },
  female: { labelAr: "بنات فقط",        labelEn: "Females Only"  },
  mixed:  { labelAr: "الجميع",          labelEn: "Mixed"         },
  family: { labelAr: "عائلات فقط",      labelEn: "Families Only" },
  any:    { labelAr: "الجميع / عائلات", labelEn: "All"           },
} as const;

export type GenderTargetKey = keyof typeof GENDER_TARGET_CONFIG;

// ── Amenities ─────────────────────────────────────────────────────────────────
export const AMENITIES_CONFIG = [
  { key: "wifi",     labelAr: "واي فاي",    labelEn: "WiFi",     icon: "Wifi"         },
  { key: "ac",       labelAr: "تكييف",       labelEn: "AC",       icon: "Wind"         },
  { key: "elevator", labelAr: "أسانسير",    labelEn: "Elevator", icon: "MoveVertical" },
  { key: "washer",   labelAr: "غسالة",       labelEn: "Washer",   icon: "Shirt"        },
  { key: "security", labelAr: "أمن وحراسة", labelEn: "Security", icon: "Shield"       },
  { key: "gas",      labelAr: "غاز طبيعي",  labelEn: "Gas",      icon: "Flame"        },
  { key: "parking",  labelAr: "جراج",        labelEn: "Parking",  icon: "Car"          },
  { key: "internet", labelAr: "إنترنت",      labelEn: "Internet", icon: "Globe"        },
] as const;

export type AmenityKey = (typeof AMENITIES_CONFIG)[number]["key"];

// ── Egyptian Governorates ─────────────────────────────────────────────────────
export const EGYPTIAN_GOVERNORATES = [
  "القاهرة",      "الجيزة",       "الإسكندرية",  "الدقهلية",
  "البحر الأحمر", "البحيرة",      "الفيوم",       "الغربية",
  "الإسماعيلية",  "المنوفية",     "المنيا",       "القليوبية",
  "الوادي الجديد","السويس",       "أسوان",        "أسيوط",
  "بني سويف",     "بورسعيد",      "دمياط",        "الشرقية",
  "جنوب سيناء",   "كفر الشيخ",    "مطروح",        "الأقصر",
  "قنا",           "شمال سيناء",  "سوهاج",
] as const;

export type EgyptianGovernorate = (typeof EGYPTIAN_GOVERNORATES)[number];

// ── User Roles ────────────────────────────────────────────────────────────────
export const USER_ROLE_CONFIG = {
  tenant:      { labelAr: "مستأجر",    labelEn: "Tenant",      dashboard: "/dashboard/tenant"   },
  landlord:    { labelAr: "مؤجر",      labelEn: "Landlord",    dashboard: "/dashboard/landlord" },
  admin:       { labelAr: "أدمن",      labelEn: "Admin",       dashboard: "/admin"              },
  super_admin: { labelAr: "سوبر أدمن", labelEn: "Super Admin", dashboard: "/admin"              },
  provider:    { labelAr: "مزود خدمة", labelEn: "Provider",    dashboard: "/dashboard/provider" },
} as const;

export type UserRoleKey = keyof typeof USER_ROLE_CONFIG;
