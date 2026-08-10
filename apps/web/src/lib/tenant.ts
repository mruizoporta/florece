import type { TenantPublic } from "@florece/shared";
import { api } from "./api";
import type {
  PublicCatalog,
  PublicEmployee,
  PublicPageData,
  TenantSettings,
} from "./types";

export async function fetchPublicPage(slug: string): Promise<PublicPageData | null> {
  try {
    return await api<PublicPageData>("/v1/settings/public", { tenantSlug: slug });
  } catch {
    return null;
  }
}

export async function fetchTenantPublic(slug: string): Promise<TenantPublic | null> {
  try {
    const data = await fetchPublicPage(slug);
    if (data?.tenant) {
      return {
        id: Number(data.tenant.id),
        name: data.tenant.name,
        slug: data.tenant.slug,
        locale: data.tenant.locale ?? "es",
        isDemo: false,
      };
    }
    return await api<TenantPublic>(`/tenants/${slug}/public`, { tenantSlug: slug });
  } catch {
    try {
      const settings = await api<TenantSettings>(`/v1/settings/public`, {
        tenantSlug: slug,
      });
      const s = settings as unknown as { tenant?: { name: string; locale?: string } };
      return {
        id: 0,
        name: s.tenant?.name ?? slug,
        slug,
        locale: s.tenant?.locale ?? "es",
        isDemo: false,
      };
    } catch {
      return { id: 0, name: slug, slug, locale: "es", isDemo: false };
    }
  }
}

export async function fetchPublicCatalog(slug: string): Promise<PublicCatalog> {
  try {
    const data = await api<{
      categories?: PublicCatalog["categories"];
      services: Array<{ id: number; durationTime: number; item: { name: string; slug: string; description: string; price: number; category?: { name: string; id: number } } }>;
      products: Array<{ id: number; stock: number; item: { name: string; slug: string; description: string; price: number; category?: { name: string; id: number } } }>;
    }>("/v1/catalog/public", { tenantSlug: slug });

    return {
      categories: data.categories,
      services: data.services.map((s) => ({
        id: s.id,
        name: s.item.name,
        slug: s.item.slug,
        description: s.item.description,
        price: Number(s.item.price),
        durationTime: s.durationTime,
        categoryId: s.item.category?.id,
        categoryName: s.item.category?.name,
      })),
      products: data.products.map((p) => ({
        id: p.id,
        name: p.item.name,
        slug: p.item.slug,
        description: p.item.description,
        price: Number(p.item.price),
        stock: p.stock,
        categoryId: p.item.category?.id,
        categoryName: p.item.category?.name,
      })),
    };
  } catch {
    return { services: [], products: [] };
  }
}

export async function fetchPublicEmployees(slug: string): Promise<PublicEmployee[]> {
  try {
    return await api<PublicEmployee[]>("/v1/employees/public", { tenantSlug: slug });
  } catch {
    return [];
  }
}

export function mapPublicPageCatalog(data: PublicPageData): PublicCatalog {
  const mapService = (s: PublicPageData["services"][0]) => {
    const item = (s as { item?: { name: string; slug: string; description: string; price: number; image?: string | null; category?: { id: number; name: string } } }).item;
    if (item) {
      return {
        id: s.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        price: Number(item.price),
        durationTime: (s as { durationTime?: number }).durationTime ?? 0,
        categoryId: item.category?.id,
        categoryName: item.category?.name,
        item: {
          id: s.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          price: Number(item.price),
          image: item.image,
        },
      };
    }
    return s as PublicCatalog["services"][0];
  };

  const mapProduct = (p: PublicPageData["products"][0]) => {
    const item = (p as { item?: { name: string; slug: string; description: string; price: number; image?: string | null; category?: { id: number; name: string } } }).item;
    if (item) {
      return {
        id: p.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        price: Number(item.price),
        stock: (p as { stock?: number }).stock ?? 0,
        categoryId: item.category?.id,
        categoryName: item.category?.name,
        item: {
          id: p.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          price: Number(item.price),
          image: item.image,
        },
      };
    }
    return p as PublicCatalog["products"][0];
  };

  return {
    services: data.services.map(mapService),
    products: data.products.map(mapProduct),
  };
}
