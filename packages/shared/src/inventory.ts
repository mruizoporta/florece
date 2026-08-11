/** Product usage: vitrina vs uso interno (recetas). */
export const PRODUCT_USAGES = ['retail', 'internal', 'both'] as const;
export type ProductUsage = (typeof PRODUCT_USAGES)[number];

export const PRODUCT_USAGE_LABELS: Record<ProductUsage, string> = {
  retail: 'Vitrina',
  internal: 'Insumo',
  both: 'Ambos',
};

export const PRODUCT_USAGE_LABELS_EN: Record<ProductUsage, string> = {
  retail: 'Retail',
  internal: 'Supply',
  both: 'Both',
};

/** Stock unit — quantity is always an integer in this unit. */
export const PRODUCT_UNITS = ['unit', 'g', 'ml'] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];

export const PRODUCT_UNIT_LABELS: Record<ProductUnit, string> = {
  unit: 'und',
  g: 'g',
  ml: 'ml',
};

export function isProductUsage(value: unknown): value is ProductUsage {
  return (
    typeof value === 'string' &&
    (PRODUCT_USAGES as readonly string[]).includes(value)
  );
}

export function isProductUnit(value: unknown): value is ProductUnit {
  return (
    typeof value === 'string' &&
    (PRODUCT_UNITS as readonly string[]).includes(value)
  );
}

export function normalizeProductUsage(
  value: unknown,
  fallback: ProductUsage = 'retail',
): ProductUsage {
  return isProductUsage(value) ? value : fallback;
}

export function normalizeProductUnit(
  value: unknown,
  fallback: ProductUnit = 'unit',
): ProductUnit {
  return isProductUnit(value) ? value : fallback;
}

/** Can sell on POS / public catalog. */
export function isSellableUsage(usage: ProductUsage): boolean {
  return usage === 'retail' || usage === 'both';
}

/** Can appear in service recipes. */
export function isRecipeUsage(usage: ProductUsage): boolean {
  return usage === 'internal' || usage === 'both';
}

export function formatStockQty(
  qty: number,
  unit: ProductUnit | string | null | undefined,
): string {
  const u = normalizeProductUnit(unit);
  const label = PRODUCT_UNIT_LABELS[u];
  return u === 'unit' ? `${qty} ${label}` : `${qty} ${label}`;
}
