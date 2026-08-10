import { fetchPublicPage, mapPublicPageCatalog } from "@/lib/tenant";
import { BookingPageClient } from "./BookingPageClient";

type Props = { params: Promise<{ slug: string }> };

export default async function BookingPage({ params }: Props) {
  const { slug } = await params;
  const publicData = await fetchPublicPage(slug);
  const catalog = publicData
    ? mapPublicPageCatalog(publicData)
    : { services: [], products: [] };

  return (
    <BookingPageClient
      slug={slug}
      salonName={publicData?.setting?.companyName ?? publicData?.tenant?.name ?? slug}
      setting={publicData?.setting ?? {}}
      services={catalog.services}
      employees={publicData?.employees ?? []}
    />
  );
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const publicData = await fetchPublicPage(slug);
  const name =
    publicData?.setting?.companyName ?? publicData?.tenant?.name;
  return {
    title: name ? `Agendar — ${name}` : "Agendar cita — Florece",
  };
}
