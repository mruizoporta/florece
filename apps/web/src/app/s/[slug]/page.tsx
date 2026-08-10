import { fetchPublicPage, mapPublicPageCatalog } from "@/lib/tenant";
import { SalonPublicClient } from "./SalonPublicClient";

type Props = { params: Promise<{ slug: string }> };

export default async function SalonPublicPage({ params }: Props) {
  const { slug } = await params;
  const publicData = await fetchPublicPage(slug);

  if (publicData) {
    const catalog = mapPublicPageCatalog(publicData);
    const isDemo =
      slug.toLowerCase() === "demo" ||
      Boolean((publicData.tenant as { isDemo?: boolean }).isDemo);
    return (
      <SalonPublicClient
        slug={slug}
        name={publicData.tenant.name}
        setting={publicData.setting}
        section={publicData.section}
        services={catalog.services}
        products={catalog.products}
        employees={publicData.employees}
        sponsors={publicData.sponsors}
        instagramFeeds={publicData.instagramFeeds}
        isDemo={isDemo}
      />
    );
  }

  return (
    <SalonPublicClient
      slug={slug}
      name={slug}
      setting={{}}
      section={{}}
      services={[]}
      products={[]}
      employees={[]}
      sponsors={[]}
      instagramFeeds={[]}
      isDemo={slug.toLowerCase() === "demo"}
    />
  );
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const publicData = await fetchPublicPage(slug);
  return {
    title: publicData?.tenant.name
      ? `${publicData.tenant.name} — Florece`
      : "Salón — Florece",
  };
}
