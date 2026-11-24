/**
 * Cálculo de descuentos de un ticket. Puro (sin base de datos) para poder usarlo
 * igual en el ticket guardado y en la cotización de la venta rápida.
 * Todo en centavos para no arrastrar errores de redondeo.
 */

export type EngineLine = {
  id: string;
  isProduct: boolean;
  itemId: string | null;
  /** precio × cantidad, en centavos */
  gross: number;
  /** descuento de paquete, en centavos: esas líneas ya tienen su precio y no reciben promociones */
  packageDiscount: number;
};

export type PromoRules = {
  appliesTo: 'all' | 'services' | 'products' | 'items';
  itemIds: string[];
};

export type EngineDiscount = {
  key: string;
  source: 'manual' | 'coupon' | 'auto';
  label: string;
  discountType: 'percent' | 'amount';
  /** porcentaje (0-100) o monto en centavos */
  value: number;
  rules: PromoRules;
  dismissed?: boolean;
  /** condición que no se cumple (día, horario, mínimo…); null = aplica */
  blockedBy?: string | null;
};

export type EngineResult = {
  amounts: Record<string, { amount: number; note: string | null }>;
  perLine: Record<string, number>;
  total: number;
};

const ORDER = { auto: 0, coupon: 1, manual: 2 } as const;

function targets(lines: EngineLine[], rules: PromoRules) {
  return lines.filter((l) => {
    if (l.packageDiscount > 0) return false;
    if (rules.appliesTo === 'services') return !l.isProduct;
    if (rules.appliesTo === 'products') return l.isProduct;
    if (rules.appliesTo === 'items') return l.itemId != null && rules.itemIds.includes(l.itemId);
    return true;
  });
}

function amountFor(d: EngineDiscount, base: number) {
  if (base <= 0) return 0;
  const raw = d.discountType === 'percent' ? Math.round((base * Math.min(d.value, 100)) / 100) : d.value;
  return Math.max(0, Math.min(raw, base));
}

export function computeDiscounts(
  lines: EngineLine[],
  discounts: EngineDiscount[],
  opts: { stackPromotions: boolean; minTotalOf?: (d: EngineDiscount) => number | null },
): EngineResult {
  const remaining = new Map(lines.map((l) => [l.id, l.gross - l.packageDiscount]));
  const perLine: Record<string, number> = Object.fromEntries(lines.map((l) => [l.id, 0]));
  const amounts: EngineResult['amounts'] = {};
  const orderTotal = lines.reduce((s, l) => s + l.gross - l.packageDiscount, 0);

  const sorted = [...discounts].sort((a, b) => ORDER[a.source] - ORDER[b.source]);
  const live: EngineDiscount[] = [];
  for (const d of sorted) {
    const min = opts.minTotalOf?.(d) ?? null;
    if (d.dismissed) amounts[d.key] = { amount: 0, note: 'Quitada en caja' };
    else if (d.blockedBy) amounts[d.key] = { amount: 0, note: d.blockedBy };
    else if (min != null && orderTotal < min) amounts[d.key] = { amount: 0, note: 'El ticket no llega al mínimo' };
    else live.push(d);
  }

  // Sin combinar: entre cupones y automáticas gana la que más descuenta (la manual siempre suma).
  const promos = live.filter((d) => d.source !== 'manual');
  if (!opts.stackPromotions && promos.length > 1) {
    const standalone = (d: EngineDiscount) =>
      amountFor(d, targets(lines, d.rules).reduce((s, l) => s + (remaining.get(l.id) ?? 0), 0));
    const best = promos.reduce((a, b) => (standalone(b) > standalone(a) ? b : a));
    for (const d of promos) {
      if (d === best) continue;
      amounts[d.key] = { amount: 0, note: `No se combina con «${best.label}»` };
      live.splice(live.indexOf(d), 1);
    }
  }

  for (const d of live) {
    const ts = targets(lines, d.rules).filter((l) => (remaining.get(l.id) ?? 0) > 0);
    const base = ts.reduce((s, l) => s + (remaining.get(l.id) ?? 0), 0);
    const amount = amountFor(d, base);
    let left = amount;
    ts.forEach((l, i) => {
      const r = remaining.get(l.id) ?? 0;
      const share = i === ts.length - 1 ? Math.min(left, r) : Math.min(r, Math.floor((amount * r) / base));
      remaining.set(l.id, r - share);
      perLine[l.id] += share;
      left -= share;
    });
    amounts[d.key] = {
      amount: amount - left,
      note: amount === 0 ? (ts.length ? null : 'No hay servicios o productos a los que aplique') : null,
    };
  }

  const total = [...remaining.values()].reduce((s, v) => s + v, 0);
  return { amounts, perLine, total };
}

/** Condiciones de fecha, día, horario y usos. Devuelve el motivo si no aplica. */
export function promoBlockedBy(
  p: {
    active: boolean;
    weekdays: unknown;
    fromTime: string | null;
    toTime: string | null;
    startsOn: string | null;
    endsOn: string | null;
    maxUses: number | null;
    usesCount: number;
    firstVisitOnly: boolean;
  },
  ctx: { wallNow: Date; firstVisit: boolean | null },
): string | null {
  if (!p.active) return 'Promoción pausada';
  const ymd = ctx.wallNow.toISOString().slice(0, 10);
  if (p.startsOn && ymd < p.startsOn) return `Empieza el ${p.startsOn}`;
  if (p.endsOn && ymd > p.endsOn) return 'Promoción vencida';
  if (p.maxUses != null && p.usesCount >= p.maxUses) return 'Se agotaron los usos';
  const days = Array.isArray(p.weekdays) ? (p.weekdays as number[]) : [];
  const weekday = ((ctx.wallNow.getUTCDay() + 6) % 7) + 1; // 1 = lunes … 7 = domingo
  if (days.length && !days.includes(weekday)) return 'No vale hoy';
  const hhmm = ctx.wallNow.toISOString().slice(11, 16);
  if (p.fromTime && hhmm < p.fromTime) return `Vale desde las ${p.fromTime}`;
  if (p.toTime && hhmm >= p.toTime) return `Vale hasta las ${p.toTime}`;
  if (p.firstVisitOnly) {
    if (ctx.firstVisit == null) return 'Elegí la clienta para saber si es su primera visita';
    if (!ctx.firstVisit) return 'Solo primera visita';
  }
  return null;
}

export const toCents = (v: { toString(): string } | number | null | undefined) =>
  Math.round(Number(v ?? 0) * 100);
