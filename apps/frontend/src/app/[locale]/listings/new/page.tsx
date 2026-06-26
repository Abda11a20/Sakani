// apps/frontend/src/app/[locale]/listings/new/page.tsx
import { redirect } from "next/navigation";

export default async function NewListingRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/landlord/listings/add`);
}
