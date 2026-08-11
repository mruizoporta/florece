/**
 * Precios Florece (Nicaragua) — lanzamiento PYME 2026
 *
 * Estudio (docs/MARKET-PRICING-NI.md):
 * - ReservaSimple: gratis / ~$14 (solo citas)
 * - Nicteo reservas NI: ~$30/mes
 * - Neox Peluquerías NI: ~C$ 1,471/mes (≈ $40) agenda+caja+comisiones
 * - Fresha: ~$20 solo o ~$15/estilista + comisiones marketplace
 *
 * Florece = agenda + POS + inventario + piso estilista + sitio.
 * Marca nueva, self-service, pago por transferencia: Pro bajo Neox.
 * Tipo de cambio referencial ≈ 36.5 NIO/USD.
 */
export const NIO_PER_USD_REF = 36.5;

export const FEATURE_KEYS = [
  'appointments',
  'calendar',
  'pos',
  'catalog',
  'customers',
  'instagram',
  'sponsors',
  'images',
  'sections',
  'billing',
  'accounting',
  'branches',
  'service_consumables',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  appointments: 'Citas y agenda',
  calendar: 'Calendario',
  pos: 'Punto de venta (órdenes)',
  catalog: 'Catálogo de servicios',
  customers: 'Clientes',
  instagram: 'Instagram',
  sponsors: 'Patrocinadores',
  images: 'Imágenes del sitio',
  sections: 'Secciones del sitio',
  billing: 'Facturación del plan',
  accounting: 'Contabilidad operativa',
  branches: 'Utilidad multi-sucursal',
  service_consumables: 'Insumos por servicio (recetas)',
};

export const FEATURE_LABELS_EN: Record<FeatureKey, string> = {
  appointments: 'Appointments & schedule',
  calendar: 'Calendar',
  pos: 'Point of sale (orders)',
  catalog: 'Service catalog',
  customers: 'Customers',
  instagram: 'Instagram',
  sponsors: 'Sponsors',
  images: 'Site images',
  sections: 'Site sections',
  billing: 'Plan billing',
  accounting: 'Operational accounting',
  branches: 'Multi-branch profit',
  service_consumables: 'Service consumables (recipes)',
};

export type PlanFeatures = Record<FeatureKey, boolean>;

export type PlanDefinition = {
  slug: string;
  name: string;
  priceUsdMonthly: number;
  priceNioMonthly: number;
  maxEmployees: number | null;
  maxServices: number | null;
  /** Marketing bullets (Spanish, stored in DB / default API). */
  features: string[];
  /** Marketing bullets in English. */
  featuresEn: string[];
  entitlements: PlanFeatures;
  trialDays: number;
};

const ALL_OFF: PlanFeatures = {
  appointments: false,
  calendar: false,
  pos: false,
  catalog: false,
  customers: false,
  instagram: false,
  sponsors: false,
  images: false,
  sections: false,
  billing: false,
  accounting: false,
  branches: false,
  service_consumables: false,
};

export const PLANS = {
  basico: {
    slug: 'basico',
    name: 'Básico',
    priceUsdMonthly: 19,
    priceNioMonthly: 699,
    maxEmployees: 3,
    maxServices: 20,
    trialDays: 14,
    features: [
      'Para micro salón que empieza a ordenarse',
      'Agenda, citas y calendario',
      'Catálogo y clientes',
      'Hasta 3 profesionales · 20 servicios',
      'Trial 14 días',
    ],
    featuresEn: [
      'For micro salons getting organized',
      'Schedule, bookings & calendar',
      'Catalog & customers',
      'Up to 3 pros / 20 services',
      '14-day trial',
    ],
    entitlements: {
      ...ALL_OFF,
      appointments: true,
      calendar: true,
      catalog: true,
      customers: true,
      billing: true,
    },
  },
  pro: {
    slug: 'pro',
    name: 'Pro',
    priceUsdMonthly: 35,
    priceNioMonthly: 1299,
    maxEmployees: 10,
    maxServices: 80,
    trialDays: 14,
    features: [
      'Recomendado — salón que opera todos los días',
      'Todo Básico + hasta 10 profesionales',
      'POS / caja y cortes',
      'Inventario retail + insumos por servicio',
      'Piso del estilista + comisiones',
      'Contabilidad operativa',
      'Sitio web: secciones e imágenes + Instagram',
    ],
    featuresEn: [
      'Recommended — salon that runs every day',
      'Everything in Basic + up to 10 pros',
      'POS / checkout',
      'Retail inventory + service consumables',
      'Stylist floor + commissions',
      'Operational accounting',
      'Website: sections & images + Instagram',
    ],
    entitlements: {
      ...ALL_OFF,
      appointments: true,
      calendar: true,
      pos: true,
      catalog: true,
      customers: true,
      instagram: true,
      images: true,
      sections: true,
      billing: true,
      accounting: true,
      service_consumables: true,
    },
  },
  premium: {
    slug: 'premium',
    name: 'Premium',
    priceUsdMonthly: 55,
    priceNioMonthly: 1999,
    maxEmployees: null,
    maxServices: null,
    trialDays: 14,
    features: [
      'Varias sucursales o equipo grande',
      'Todo Pro (POS, inventario e insumos)',
      'Profesionales y servicios ilimitados',
      'Utilidad multi-sucursal',
      'Patrocinadores',
    ],
    featuresEn: [
      'Multi-branch or large teams',
      'Everything in Pro (POS, inventory & consumables)',
      'Unlimited pros & services',
      'Multi-branch profit rollups',
      'Sponsors',
    ],
    entitlements: {
      appointments: true,
      calendar: true,
      pos: true,
      catalog: true,
      customers: true,
      instagram: true,
      sponsors: true,
      images: true,
      sections: true,
      billing: true,
      accounting: true,
      branches: true,
      service_consumables: true,
    },
  },
} as const satisfies Record<string, PlanDefinition>;

export type PlanSlug = keyof typeof PLANS;

export const TRIAL_DAYS = 14;

export const PLATFORM_TENANT_SLUG = 'ops';
export const PLATFORM_OWNER_EMAIL = 'owner@florece.app';
export const PLATFORM_OWNER_PASSWORD = 'florece-owner-2026';

export const TENANT_SUBSCRIPTION_STATUS = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  SUSPENDED: 'suspended',
} as const;

export type TenantSubscriptionStatus =
  (typeof TENANT_SUBSCRIPTION_STATUS)[keyof typeof TENANT_SUBSCRIPTION_STATUS];

export function priceNioApprox(priceUsd: number, rate = NIO_PER_USD_REF): number {
  return Math.round(priceUsd * rate);
}

export function planBySlug(slug: string | null | undefined): PlanDefinition {
  if (slug && slug in PLANS) {
    return PLANS[slug as PlanSlug];
  }
  return PLANS.basico;
}

export function planMarketingFeatures(
  slug: string | null | undefined,
  locale: 'es' | 'en' = 'es',
): string[] {
  const plan = planBySlug(slug);
  return locale === 'en' ? [...plan.featuresEn] : [...plan.features];
}

export type PlanSnapshot = {
  slug: string;
  name: string;
  maxEmployees?: number | null;
  maxServices?: number | null;
  features?: string[];
  entitlements?: PlanFeatures | Partial<Record<FeatureKey, boolean>>;
};

export function normalizePlanFeatures(
  raw: Partial<Record<FeatureKey, boolean>> | PlanFeatures | null | undefined,
  fallback?: PlanFeatures,
): PlanFeatures {
  const base = fallback
    ? { ...fallback }
    : { ...planBySlug('basico').entitlements };
  if (!raw) return base;
  for (const key of FEATURE_KEYS) {
    if (typeof raw[key] === 'boolean') base[key] = raw[key]!;
  }
  return base;
}

export function resolveEntitlements(input: {
  planSlug?: string | null;
  plan?: PlanSnapshot | null;
  featureOverrides?: Partial<Record<FeatureKey, boolean>> | null;
}): {
  planSlug: string;
  planName: string;
  maxEmployees: number | null;
  maxServices: number | null;
  features: PlanFeatures;
  featureList: string[];
} {
  const fallback = planBySlug(input.plan?.slug || input.planSlug);
  const planName = input.plan?.name || fallback.name;
  const planSlug = input.plan?.slug || fallback.slug;
  const featureList = input.plan?.features?.length
    ? [...input.plan.features]
    : [...fallback.features];

  const features = normalizePlanFeatures(
    input.plan?.entitlements,
    fallback.entitlements,
  );

  if (input.featureOverrides) {
    for (const key of FEATURE_KEYS) {
      const v = input.featureOverrides[key];
      if (typeof v === 'boolean') features[key] = v;
    }
  }

  return {
    planSlug,
    planName,
    maxEmployees:
      input.plan?.maxEmployees !== undefined
        ? input.plan.maxEmployees
        : fallback.maxEmployees,
    maxServices:
      input.plan?.maxServices !== undefined
        ? input.plan.maxServices
        : fallback.maxServices,
    features,
    featureList,
  };
}

export function hasFeature(
  features: PlanFeatures | Record<string, boolean>,
  key: FeatureKey,
): boolean {
  return Boolean(features[key]);
}

/** Map salon admin routes → feature keys (null = always allowed). */
export const ADMIN_ROUTE_FEATURE: Record<string, FeatureKey | null> = {
  '': null,
  '/board': 'appointments',
  '/calendar': 'calendar',
  '/appointments': 'appointments',
  '/orders': 'pos',
  '/employees': null,
  '/catalog': 'catalog',
  '/customers': 'customers',
  '/users': null,
  '/sections': 'sections',
  '/appearance': null,
  '/settings/images': 'images',
  '/sponsors': 'sponsors',
  '/instagram': 'instagram',
  '/settings': null,
  '/branches': 'branches',
  '/sales-summary': 'branches',
  '/accounting': 'accounting',
  '/accounting/expenses': 'accounting',
  '/accounting/cash': 'accounting',
  '/accounting/branches': 'branches',
  '/help': null,
  '/billing': 'billing',
};

/** Resolve feature key for an admin path suffix (e.g. `/orders` or `/accounting/cash`). */
export function featureForAdminPath(pathSuffix: string): FeatureKey | null {
  const normalized = pathSuffix.replace(/\/$/, '') || '';
  if (normalized in ADMIN_ROUTE_FEATURE) {
    return ADMIN_ROUTE_FEATURE[normalized] ?? null;
  }
  // Longest prefix match for nested routes
  const keys = Object.keys(ADMIN_ROUTE_FEATURE).sort(
    (a, b) => b.length - a.length,
  );
  for (const key of keys) {
    if (key && (normalized === key || normalized.startsWith(`${key}/`))) {
      return ADMIN_ROUTE_FEATURE[key] ?? null;
    }
  }
  return null;
}
