import Link from "next/link";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { CITY_PAGES } from "@/lib/seo/city-pages";

interface CityLandingSectionProps {
  locale: string;
}

interface LocationCount {
  governorate: string;
  district: string;
  count: number;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://sakani-backend-production.up.railway.app/api/v1";

async function getLocationCounts(): Promise<LocationCount[]> {
  try {
    const response = await fetch(`${API_BASE}/search/location-counts`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function formatAvailability(count: number, isArabic: boolean) {
  if (count === 0) {
    return isArabic ? "لا تتوافر إعلانات بعد" : "No listings yet";
  }

  if (isArabic) {
    return count === 1 ? "إعلان متاح" : `${count} إعلانات متاحة`;
  }

  return `${count} ${count === 1 ? "listing" : "listings"} available`;
}

/**
 * A server-rendered internal-link section for the city rental pages.
 * It deliberately uses no images or client state. One cached server request
 * supplies the real availability labels without adding browser network work.
 */
export async function CityLandingSection({ locale }: CityLandingSectionProps) {
  const isArabic = locale === "ar";
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;
  const locationCounts = await getLocationCounts();

  return (
    <section
      className="border-b border-border-divider bg-surface px-4 py-12 font-cairo md:py-16"
      aria-labelledby="city-rentals-title"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="city-rentals-title"
              className="text-2xl font-bold tracking-tight text-text sm:text-3xl"
            >
              {isArabic ? "ابحث عن سكن في محافظتك" : "Find a home in your governorate"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
              {isArabic
                ? "تصفح الشقق والأسرّة المتاحة للإيجار حسب المدينة، ثم استخدم الفلاتر للوصول إلى الأنسب لك."
                : "Browse available apartments and beds by city, then refine the results with the filters."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {CITY_PAGES.map((city) => {
            const name = isArabic ? city.name.ar : city.name.en;
            const count = locationCounts
              .filter((item) =>
                item.governorate === city.filters.governorate &&
                (!city.filters.district || item.district === city.filters.district)
              )
              .reduce((total, item) => total + item.count, 0);

            return (
              <Link
                key={city.slug}
                href={`/${locale}/rentals/${city.slug}`}
                className="group flex min-h-24 flex-col justify-between rounded-2xl border border-border bg-surface p-3 shadow-xs transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:min-h-28 sm:p-4"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-white sm:h-9 sm:w-9">
                  <MapPin size={16} aria-hidden="true" />
                </span>
                <span className="mt-3 flex items-center justify-between gap-1.5">
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold text-text sm:text-sm">{name}</span>
                    <span className="mt-1 block text-[10px] font-semibold text-text-secondary sm:text-[11px]">
                      {formatAvailability(count, isArabic)}
                    </span>
                  </span>
                  <ArrowIcon
                    size={15}
                    aria-hidden="true"
                    className="shrink-0 text-text-tertiary transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary rtl:group-hover:-translate-x-0.5"
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
