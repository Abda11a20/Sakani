import type { SearchFilters } from "@/types";

export interface CityPageDefinition {
  slug: string;
  name: {
    ar: string;
    en: string;
  };
  filters: {
    governorate: NonNullable<SearchFilters["governorate"]>;
    district?: SearchFilters["district"];
  };
}

/**
 * SEO city routes are intentionally mapped to the same Arabic values stored in
 * listings. English routes use the same filters, while their copy is localized.
 */
export const CITY_PAGES: readonly CityPageDefinition[] = [
  { slug: "cairo", name: { ar: "القاهرة", en: "Cairo" }, filters: { governorate: "القاهرة" } },
  { slug: "giza", name: { ar: "الجيزة", en: "Giza" }, filters: { governorate: "الجيزة" } },
  { slug: "alexandria", name: { ar: "الإسكندرية", en: "Alexandria" }, filters: { governorate: "الإسكندرية" } },
  {
    slug: "mansoura",
    name: { ar: "المنصورة", en: "Mansoura" },
    filters: { governorate: "الدقهلية", district: "المنصورة" },
  },
  { slug: "minya", name: { ar: "المنيا", en: "Minya" }, filters: { governorate: "المنيا" } },
  { slug: "assiut", name: { ar: "أسيوط", en: "Assiut" }, filters: { governorate: "أسيوط" } },
  { slug: "beni-suef", name: { ar: "بني سويف", en: "Beni Suef" }, filters: { governorate: "بني سويف" } },
  { slug: "qena", name: { ar: "قنا", en: "Qena" }, filters: { governorate: "قنا" } },
];

export function getCityPage(slug: string): CityPageDefinition | undefined {
  return CITY_PAGES.find((city) => city.slug === slug);
}
