import { api } from './api';
import { temaDe, type BrandSetting, type SalonTheme } from './brand';
import { imagenUrl } from './images';

export type PublicService = {
  id: number;
  durationTime: number;
  item: {
    name: string;
    description?: string;
    price: number;
  };
};

export type PublicEmployee = {
  id: number;
  name: string;
  description?: string;
  image?: string | null;
};

export type PublicSalon = {
  slug: string;
  name: string;
  city: string | null;
  about: string | null;
  currency: string;
  bookingOpen: boolean;
  services: PublicService[];
  employees: PublicEmployee[];
  /** Colores del salón (Apariencia en la web) o los de Florece. */
  theme: SalonTheme;
  logo: string | null;
  banner: string | null;
};

type SettingsPage = {
  tenant?: { name?: string; slug?: string };
  setting?: BrandSetting & {
    companyName?: string | null;
    location?: string | null;
    aboutUs?: string | null;
    currencySymbol?: string | null;
    activeAppointment?: boolean;
  };
};

type CatalogPage = {
  services?: PublicService[];
};

export async function loadPublicSalon(slug: string): Promise<PublicSalon> {
  const [page, catalog, employees] = await Promise.all([
    api<SettingsPage>('/v1/settings/public', { slug }),
    api<CatalogPage>('/v1/catalog/public', { slug }),
    api<PublicEmployee[]>('/v1/employees/public', { slug }),
  ]);

  const setting = page.setting;
  return {
    slug,
    name: setting?.companyName?.trim() || page.tenant?.name || slug,
    city: setting?.location?.trim() || null,
    about: setting?.aboutUs?.trim() || null,
    currency: setting?.currencySymbol?.trim() || 'C$',
    bookingOpen: setting?.activeAppointment !== false,
    services: catalog.services ?? [],
    employees: (employees ?? []).map((persona) => ({
      ...persona,
      image: imagenUrl(persona.image, 'employees/300'),
    })),
    theme: temaDe(setting),
    logo: imagenUrl(setting?.logo, 'logo/128'),
    banner: imagenUrl(setting?.banner, 'banners/1920'),
  };
}

export type SalonHit = {
  slug: string;
  name: string;
  city: string | null;
};

export function searchSalons(query: string): Promise<SalonHit[]> {
  const q = query.trim();
  if (q.length < 1) return Promise.resolve([]);
  return api<SalonHit[]>(`/public/salons?q=${encodeURIComponent(q)}`);
}

export type Slot = { start: string; end: string };

export function loadSlots(
  slug: string,
  employeeId: number,
  date: string,
  durationMinutes: number,
): Promise<{ hasSchedule: boolean; slots: Slot[] }> {
  const params = new URLSearchParams({
    employee_id: String(employeeId),
    date,
    duration_minutes: String(durationMinutes),
  });
  return api(`/v1/appointments/available-slots?${params}`, { slug });
}

export type AppointmentView = {
  salon: { slug: string; name: string };
  name: string;
  status: string;
  employeeName: string | null;
  services: string[];
  startTime: string | null;
  endTime: string | null;
};

export function loadAppointmentView(token: string): Promise<AppointmentView> {
  return api(`/v1/appointments/view/${encodeURIComponent(token)}`);
}

export type CreatedAppointment = {
  viewToken?: string | null;
  name: string;
  startTime?: string | null;
  endTime?: string | null;
  status?: { name?: string };
  employee?: { name?: string } | null;
  services?: Array<{ service?: { item?: { name?: string } } }>;
};

export type PublicPromotion = { id: number; name: string; summary: string };

export function loadPromotions(slug: string): Promise<PublicPromotion[]> {
  return api('/v1/promotions/public', { slug });
}

export function joinWaitlist(
  slug: string,
  body: {
    name: string;
    phone: string;
    email: string | null;
    date: string;
    employee_id: number;
    service_ids: number[];
  },
): Promise<unknown> {
  return api('/v1/waitlist/public', { method: 'POST', slug, body });
}
