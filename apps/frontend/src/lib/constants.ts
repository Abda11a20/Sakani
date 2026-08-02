// Infrastructure layer
// Not used yet.
// Will be migrated gradually.

// apps/frontend/src/lib/constants.ts

// ── LocalStorage Keys ─────────────────────────────────────────────────────────
export const TOKEN_KEY = "sakani_token";
export const REFRESH_TOKEN_KEY = "sakani_refresh_token";
export const WISHLIST_KEY = "sakani_wishlist";
export const LOCALE_KEY = "NEXT_LOCALE";
export const THEME_KEY = "sakani-theme";
export const USER_KEY = "sakani_user";

// ── Unit Types ────────────────────────────────────────────────────────────────
// NOTE: "room" has been permanently removed from this project.
export const UNIT_TYPE_CONFIG = {
  apartment: { labelAr: "شقة كاملة", labelEn: "Apartment", icon: "Building2" },
  bed: { labelAr: "سرير", labelEn: "Shared Bed", icon: "Bed" },
} as const;

export type UnitTypeKey = keyof typeof UNIT_TYPE_CONFIG;

// ── Listing Statuses ──────────────────────────────────────────────────────────
export const LISTING_STATUS_CONFIG = {
  active: { labelAr: "نشط", labelEn: "Active", color: "success" },
  pending_review: { labelAr: "قيد المراجعة", labelEn: "Under Review", color: "warning" },
  rented: { labelAr: "مؤجر", labelEn: "Rented", color: "danger" },
  paused: { labelAr: "موقوف", labelEn: "Paused", color: "gray" },
  rejected: { labelAr: "مرفوض", labelEn: "Rejected", color: "danger" },
  draft: { labelAr: "مسودة", labelEn: "Draft", color: "gray" },
} as const;

export type ListingStatusKey = keyof typeof LISTING_STATUS_CONFIG;

// ── Request Statuses ──────────────────────────────────────────────────────────
export const REQUEST_STATUS_CONFIG = {
  pending: { labelAr: "قيد الانتظار", labelEn: "Pending", color: "warning" },
  accepted: { labelAr: "مقبول", labelEn: "Accepted", color: "success" },
  rejected: { labelAr: "مرفوض", labelEn: "Rejected", color: "danger" },
  completed: { labelAr: "مكتمل", labelEn: "Completed", color: "info" },
} as const;

export type RequestStatusKey = keyof typeof REQUEST_STATUS_CONFIG;

// ── Gender Targets ────────────────────────────────────────────────────────────
export const GENDER_TARGET_CONFIG = {
  male: { labelAr: "شباب فقط", labelEn: "Males Only" },
  female: { labelAr: "بنات فقط", labelEn: "Females Only" },
  mixed: { labelAr: "الجميع", labelEn: "Mixed" },
  family: { labelAr: "عائلات فقط", labelEn: "Families Only" },
  any: { labelAr: "الجميع / عائلات", labelEn: "All" },
} as const;

export type GenderTargetKey = keyof typeof GENDER_TARGET_CONFIG;

// ── Amenities ─────────────────────────────────────────────────────────────────
export const AMENITIES_CONFIG = [
  { key: "wifi", labelAr: "واي فاي / إنترنت", labelEn: "Wi-Fi", icon: "Wifi" },
  { key: "ac", labelAr: "تكييف", labelEn: "AC", icon: "Wind" },
  { key: "elevator", labelAr: "أسانسير", labelEn: "Elevator", icon: "ArrowUpDown" },
  { key: "washer", labelAr: "غسالة ملابس", labelEn: "Washer", icon: "WashingMachine" },
  { key: "tv", labelAr: "شاشة تلفزيون", labelEn: "TV Screen", icon: "Tv" },
  { key: "fan", labelAr: "مراوح", labelEn: "Fans", icon: "Wind" },
  { key: "stove", labelAr: "بوتاجاز", labelEn: "Stove / Cooker", icon: "Flame" },
  { key: "fridge", labelAr: "ثلاجة", labelEn: "Refrigerator", icon: "Refrigerator" },
  { key: "water_heater", labelAr: "سخان مياه", labelEn: "Water Heater", icon: "Droplets" },
  { key: "natural_gas", labelAr: "غاز طبيعي", labelEn: "Natural Gas", icon: "Flame" },
  { key: "security", labelAr: "أمن وحراسة", labelEn: "Security", icon: "Shield" },
] as const;

export type AmenityKey = (typeof AMENITIES_CONFIG)[number]["key"];

// ── Electricity Types ─────────────────────────────────────────────────────────
// Only two valid types for the Egyptian market (modern_meter has been removed)
export const ELECTRICITY_TYPE_CONFIG = {
  prepaid_card: { labelAr: "عداد كارت شحن", labelEn: "Prepaid Card Meter" },
  old_meter: { labelAr: "عداد قديم (فاتورة)", labelEn: "Old Meter (Bill)" },
} as const;

export type ElectricityTypeKey = keyof typeof ELECTRICITY_TYPE_CONFIG;

// ── Egyptian Governorates ─────────────────────────────────────────────────────
export const EGYPTIAN_GOVERNORATES = [
  "الإسكندرية", "الإسماعيلية", "الأقصر", "البحر الأحمر",
  "البحيرة", "الجيزة", "الدقهلية", "السويس",
  "الشرقية", "الغربية", "الفيوم", "القاهرة",
  "القليوبية", "المنوفية", "المنيا", "الوادي الجديد",
  "أسوان", "أسيوط", "بني سويف", "بورسعيد",
  "جنوب سيناء", "دمياط", "سوهاج", "شمال سيناء",
  "قنا", "كفر الشيخ", "مطروح",
] as const;

export type EgyptianGovernorate = (typeof EGYPTIAN_GOVERNORATES)[number];

// ── Official Egyptian Districts & Cities per Governorate ─────────────────────
export const EGYPTIAN_DISTRICTS: Record<string, string[]> = {
  "القاهرة": [
    "مدينة نصر", "المعادي", "مصر الجديدة", "التجمع الخامس", "التجمع الأول",
    "التجمع الثالث", "الزمالك", "وسط البلد", "الدقي", "حلوان", "الشروق", "بدر",
    "مدينتي", "الرحاب", "المقطم", "العباسية", "عين شمس", "المرج", "الزيتون",
    "حدائق القبة", "روض الفرج", "شبرا مصر", "مصر القديمة", "السيدة زينب",
    "العاصمة الإدارية الجديدة", "15 مايو", "التبين", "البساتين", "دار السلام"
  ],
  "الجيزة": [
    "الدقي", "المهندسين", "6 أكتوبر", "الشيخ زايد", "الهرم", "فيصل",
    "العجوزة", "إمبابة", "العمرانية", "البحر الأعظم", "حدائق الأهرام",
    "حدائق أكتوبر", "أكتوبر الجديدة", "البدرشين", "الصف", "العياط", "أوسيم", "كرداسة"
  ],
  "الإسكندرية": [
    "سموحة", "ميامي", "سيدي بشر", "المنتزه", "جليم", "ستانلي",
    "رشدي", "لوران", "العجمي", "الإبراهيمية", "الشاطبي", "محرم بك",
    "العامريات", "برج العرب", "برج العرب الجديدة", "محطة الرمل", "كامب شيزار"
  ],
  "الشرقية": [
    "العاشر من رمضان", "الزقازيق", "بلبيس", "منيا القمح", "فاقوس",
    "أبو حماد", "ديرب نجم", "الحسينية", "أبو كبير", "ههيا", "الصالحية الجديدة",
    "كفر صقر", "أولاد صقر", "مشتول السوق"
  ],
  "الدقهلية": [
    "المنصورة", "طلخا", "ميت غمر", "دكرنس", "السنبلاوين",
    "بلقاس", "شربين", "المنزلة", "جمصة", "المنصورة الجديدة", "ميت سلسيل", "نبروه"
  ],
  "القليوبية": [
    "بنها", "شبرا الخيمة", "العبور", "العبور الجديدة", "الخانكة", "قليوب",
    "قناطر الخيرية", "طوخ", "شبين القناطر", "كفر شكر", "قها"
  ],
  "الغربية": [
    "طنطا", "المحلة الكبرى", "زفتى", "كفر الزيات", "بسيون", "سمنود", "قطور", "السنطة"
  ],
  "المنوفية": [
    "شبين الكوم", "مدينة السادات", "منوف", "أشمون", "قويسنا", "تلا", "الشهداء", "الباجور", "بركة السبع"
  ],
  "البحيرة": [
    "دمنهور", "كفر الدوار", "إيتاي البارود", "أبو حمص", "رشيد", "كوم حمادة", "وادي النطرون", "أبو المطامير", "الدلنجات"
  ],
  "كفر الشيخ": [
    "كفر الشيخ", "دسوق", "بلطيم", "مطوبس", "سيدي سالم", "فوه", "بيلا", "الحامول", "قلين"
  ],
  "الفيوم": [
    "الفيوم", "الفيوم الجديدة", "سنورس", "إطسا", "طامية", "أبشواي", "يوسف الصديق"
  ],
  "بني سويف": [
    "بني سويف", "بني سويف الجديدة", "الواسطى", "ناصر", "ببا", "الفشن", "إهناسيا", "سمسطا"
  ],
  "المنيا": [
    "المنيا الجديدة", "المنيا", "بني مزار", "ملوي", "سمالوط",
    "مغاغة", "أبو قرقاص", "مطاي", "دير مواس", "العدوة"
  ],
  "أسيوط": [
    "أسيوط", "أسيوط الجديدة", "ناصر الجديد", "ديروط", "القوصية", "منفلوط", "أبنوب", "أبو تيج", "البداري"
  ],
  "سوهاج": [
    "سوهاج", "سوهاج الجديدة", "أخميم", "جرجا", "طهطا", "طما", "البلينا", "المراغة", "جهينة"
  ],
  "قنا": [
    "قنا", "قنا الجديدة", "غرب قنا", "نجع حمادي", "قوص", "دشنا", "فرشوط", "أبو تشت", "نقادة"
  ],
  "الأقصر": [
    "الأقصر", "الأقصر الجديدة", "طيبة الجديدة", "إسنا", "أرمنت", "القرنة", "البياضية"
  ],
  "أسوان": [
    "أسوان", "أسوان الجديدة", "كوم أمبو", "إدفو", "نصر النوبة", "دراو"
  ],
  "البحر الأحمر": [
    "الغردقة", "الجونة", "سهل حشيش", "سفاجا", "القصير", "مرسى علم", "رأس غارب"
  ],
  "جنوب سيناء": [
    "شرم الشيخ", "دهب", "نويبع", "رأس سدر", "طور سيناء", "طابا", "سانت كاترين"
  ],
  "شمال سيناء": [
    "العريش", "بئر العبد", "الشيخ زويد", "رفح"
  ],
  "السويس": [
    "السويس", "العين السخنة", "حي الأربعين", "حي السويس", "حي فيصل", "حي عتاقة"
  ],
  "الإسماعيلية": [
    "الإسماعيلية", "فايد", "القنطرة شرق", "القنطرة غرب", "أبو صوير", "التل الكبير"
  ],
  "بورسعيد": [
    "بورفؤاد", "حي الشرق", "حي العرب", "حي المناخ", "حي الزهور", "حي الضواحي", "سلام مصر"
  ],
  "دمياط": [
    "دمياط", "دمياط الجديدة", "رأس البر", "فارسكور", "الزرقا", "كفر سعد", "كفر البطيخ"
  ],
  "مطروح": [
    "مرسى مطروح", "العلمين", "العلمين الجديدة", "الضبعة", "سيوة", "الحمام", "سيدي براني"
  ],
  "الوادي الجديد": [
    "الخارجة", "الداخلة", "الفرافرة", "باريس", "بلاط"
  ],
};

// Helper: Normalize Arabic characters for flexible fuzzy search
export function normalizeArabicText(str: string): string {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .replace(/[أإآآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u0652]/g, "");
}

// ── User Roles ────────────────────────────────────────────────────────────────
export const USER_ROLE_CONFIG = {
  tenant: { labelAr: "مستأجر", labelEn: "Tenant", dashboard: "/dashboard/tenant" },
  landlord: { labelAr: "مؤجر", labelEn: "Landlord", dashboard: "/dashboard/landlord" },
  admin: { labelAr: "أدمن", labelEn: "Admin", dashboard: "/admin" },
  super_admin: { labelAr: "سوبر أدمن", labelEn: "Super Admin", dashboard: "/admin" },
  provider: { labelAr: "مزود خدمة", labelEn: "Provider", dashboard: "/dashboard/provider" },
} as const;

export type UserRoleKey = keyof typeof USER_ROLE_CONFIG;
