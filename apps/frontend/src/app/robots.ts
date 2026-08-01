// apps/frontend/src/app/robots.ts
import { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://sakanieg.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/ar/admin/",
          "/en/admin/",
          "/ar/dashboard/",
          "/en/dashboard/",
          "/ar/dev/",
          "/en/dev/",
          "/ar/login/",
          "/en/login/",
          "/ar/register/",
          "/en/register/",
          "/ar/forgot-password/",
          "/en/forgot-password/",
          "/ar/reset-password/",
          "/en/reset-password/",
          "/ar/restore-account/",
          "/en/restore-account/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
