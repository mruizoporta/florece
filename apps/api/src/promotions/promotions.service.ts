import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { billingRegionOf, salonTodayYmd, salonWallClockNow } from '../common/date';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenant/tenant.context';
import { computeDiscounts, EngineDiscount, promoBlockedBy, toCents } from './discount-engine';
import { isFirstVisit, normalizePromoCode, rulesOf } from './order-discounts';

export type PromotionInput = {
  name?: string;
  kind?: string;
  code?: string | null;
  discount_type?: string;
  value?: number;
  applies_to?: string;
  item_ids?: number[];
  weekdays?: number[];
  from_time?: string | null;
  to_time?: string | null;
  first_visit_only?: boolean;
  min_total?: number | null;
  starts_on?: string | null;
  ends_on?: string | null;
  max_uses?: number | null;
  show_on_booking?: boolean;
  active?: boolean;
};

export type QuoteInput = {
  lines?: Array<{ item_id?: number; product_id?: number; quantity?: number }>;
  customer_id?: number | null;
  coupon?: string | null;
  manual?: { type?: string; value?: number } | null;
};

type PromotionRow = Prisma.PromotionGetPayload<object>;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const DAY_NAMES = ['', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados', 'domingos'];

/** Resumen legible: «20% en servicios · martes · 9:00 a 12:00». */
export function describePromotion(p: PromotionRow, money: (n: number) => string = (n) => `$${n}`) {
  const parts = [
    p.discountType === 'percent' ? `${Number(p.value)}% de descuento` : `${money(Number(p.value))} de descuento`,
  ];
  if (p.appliesTo === 'services') parts.push('en servicios');
  if (p.appliesTo === 'products') parts.push('en productos');
  if (p.appliesTo === 'items') parts.push('en servicios elegidos');
  const days = Array.isArray(p.weekdays) ? (p.weekdays as number[]) : [];
  if (days.length && days.length < 7) parts.push(`los ${days.map((d) => DAY_NAMES[d]).join(', ')}`);
  if (p.fromTime || p.toTime) parts.push(`de ${p.fromTime ?? '00:00'} a ${p.toTime ?? '24:00'}`);
  if (p.firstVisitOnly) parts.push('en la primera visita');
  if (p.minTotal != null) parts.push(`desde ${money(Number(p.minTotal))}`);
  if (p.endsOn) parts.push(`hasta el ${p.endsOn.split('-').reverse().join('/')}`);
  return parts.join(' · ');
}

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private tenantId() {
    return this.tenantContext.getTenant().id;
  }

  private async money() {
    const st = await this.prisma.setting.findFirst({ where: { tenantId: this.tenantId() }, select: { currencySymbol: true } });
    const sym = st?.currencySymbol?.trim() || '$';
    return (n: number) => `${sym}${n.toLocaleString('es', { maximumFractionDigits: 2 })}`;
  }

  private map(p: PromotionRow, stats?: { uses: number; given: number }, money?: (n: number) => string) {
    return {
      id: Number(p.id),
      name: p.name,
      kind: p.kind,
      code: p.code,
      discountType: p.discountType,
      value: Number(p.value),
      appliesTo: p.appliesTo,
      itemIds: rulesOf(p).itemIds.map(Number),
      weekdays: Array.isArray(p.weekdays) ? (p.weekdays as number[]) : [],
      fromTime: p.fromTime,
      toTime: p.toTime,
      firstVisitOnly: p.firstVisitOnly,
      minTotal: p.minTotal != null ? Number(p.minTotal) : null,
      startsOn: p.startsOn,
      endsOn: p.endsOn,
      maxUses: p.maxUses,
      usesCount: p.usesCount,
      showOnBooking: p.showOnBooking,
      active: p.active,
      summary: describePromotion(p, money),
      given: stats?.given ?? 0,
    };
  }

  async list() {
    const tenantId = this.tenantId();
    const [rows, given, bySource] = await Promise.all([
      this.prisma.promotion.findMany({ where: { tenantId }, orderBy: [{ active: 'desc' }, { id: 'desc' }] }),
      this.prisma.orderDiscount.groupBy({
        by: ['promotionId'],
        where: { tenantId, promotionId: { not: null }, order: { status: 'finalized' } },
        _sum: { amount: true },
      }),
      this.prisma.orderDiscount.groupBy({
        by: ['source'],
        where: {
          tenantId,
          order: { status: 'finalized', finalizedAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);
    const money = await this.money();
    const givenBy = new Map(given.map((g) => [g.promotionId?.toString(), Number(g._sum.amount ?? 0)]));
    return {
      promotions: rows.map((p) => this.map(p, { uses: p.usesCount, given: givenBy.get(p.id.toString()) ?? 0 }, money)),
      last30: Object.fromEntries(
        bySource.map((s) => [s.source, { amount: Number(s._sum.amount ?? 0), count: s._count._all }]),
      ),
    };
  }

  async save(input: PromotionInput, id?: bigint) {
    const tenantId = this.tenantId();
    const current = id ? await this.require(id) : null;
    const kind = current?.kind ?? (input.kind === 'coupon' ? 'coupon' : input.kind === 'auto' ? 'auto' : null);
    if (!kind) throw new BadRequestException('Elegí si es cupón o promoción automática');
    const name = String(input.name ?? current?.name ?? '').trim().slice(0, 120);
    if (!name) throw new BadRequestException('Poné un nombre');
    const code = kind === 'coupon' ? normalizePromoCode(input.code ?? current?.code) : null;
    if (kind === 'coupon' && (!code || code.length < 3)) {
      throw new BadRequestException('El código necesita al menos 3 letras o números');
    }
    if (code) {
      const clash = await this.prisma.promotion.findFirst({
        where: { tenantId, code, ...(id ? { id: { not: id } } : {}) },
      });
      if (clash) throw new BadRequestException(`Ya existe el cupón ${code}`);
    }
    const discountType = input.discount_type === 'amount' ? 'amount' : 'percent';
    const value = Number(input.value);
    if (!Number.isFinite(value) || value <= 0 || (discountType === 'percent' && value > 100)) {
      throw new BadRequestException(discountType === 'percent' ? 'El porcentaje va de 1 a 100' : 'Monto inválido');
    }
    const appliesTo = ['all', 'services', 'products', 'items'].includes(String(input.applies_to))
      ? String(input.applies_to)
      : 'all';
    let itemIds: number[] = [];
    if (appliesTo === 'items') {
      const ids = [...new Set((input.item_ids ?? []).map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 200);
      const found = await this.prisma.item.count({ where: { tenantId, id: { in: ids.map(BigInt) } } });
      if (!ids.length || found !== ids.length) throw new BadRequestException('Elegí los servicios o productos');
      itemIds = ids;
    }
    const weekdays = [...new Set((input.weekdays ?? []).map(Number))].filter((d) => d >= 1 && d <= 7).sort();
    const fromTime = input.from_time || null;
    const toTime = input.to_time || null;
    if ((fromTime && !HHMM.test(fromTime)) || (toTime && !HHMM.test(toTime))) {
      throw new BadRequestException('Horario inválido (HH:MM)');
    }
    if (fromTime && toTime && fromTime >= toTime) throw new BadRequestException('El horario termina antes de empezar');
    const startsOn = input.starts_on || null;
    const endsOn = input.ends_on || null;
    if ((startsOn && !YMD.test(startsOn)) || (endsOn && !YMD.test(endsOn))) throw new BadRequestException('Fecha inválida');
    if (startsOn && endsOn && endsOn < startsOn) throw new BadRequestException('La vigencia termina antes de empezar');
    const minTotal = input.min_total == null || input.min_total === ('' as unknown) ? null : Number(input.min_total);
    if (minTotal != null && (!Number.isFinite(minTotal) || minTotal < 0)) throw new BadRequestException('Mínimo inválido');
    const maxUses = input.max_uses == null || input.max_uses === ('' as unknown) ? null : Math.trunc(Number(input.max_uses));
    if (maxUses != null && (!Number.isFinite(maxUses) || maxUses < 1)) throw new BadRequestException('Usos máximos inválidos');

    const data = {
      name,
      code,
      discountType,
      value: new Prisma.Decimal(value.toFixed(2)),
      appliesTo,
      itemIds: itemIds.length ? itemIds : Prisma.DbNull,
      weekdays: weekdays.length ? weekdays : Prisma.DbNull,
      fromTime,
      toTime,
      firstVisitOnly: Boolean(input.first_visit_only),
      minTotal: minTotal != null ? new Prisma.Decimal(minTotal.toFixed(2)) : null,
      startsOn,
      endsOn,
      maxUses,
      // Un cupón publicado en la reserva dejaría de ser un código para unos pocos.
      showOnBooking: kind === 'auto' && Boolean(input.show_on_booking),
      active: input.active ?? current?.active ?? true,
      updatedAt: new Date(),
    };
    const row = current
      ? await this.prisma.promotion.update({ where: { id: current.id }, data })
      : await this.prisma.promotion.create({ data: { ...data, tenantId, kind } });
    return this.map(row, undefined, await this.money());
  }

  async remove(id: bigint) {
    const p = await this.require(id);
    if (p.usesCount > 0) throw new BadRequestException('Ya se usó: pausala en vez de borrarla, así queda en los reportes');
    await this.prisma.promotion.delete({ where: { id: p.id } });
    return { ok: true };
  }

  /** Promociones que el salón quiere mostrar en la reserva web. */
  async publicList() {
    const tenant = this.tenantContext.getTenant();
    const today = salonTodayYmd(new Date(), billingRegionOf(tenant));
    const rows = await this.prisma.promotion.findMany({
      where: { tenantId: tenant.id, kind: 'auto', active: true, showOnBooking: true },
      orderBy: { id: 'asc' },
      take: 20,
    });
    const money = await this.money();
    return rows
      .filter((p) => (!p.startsOn || p.startsOn <= today) && (!p.endsOn || p.endsOn >= today))
      .filter((p) => p.maxUses == null || p.usesCount < p.maxUses)
      .map((p) => ({ id: Number(p.id), name: p.name, summary: describePromotion(p, money), appliesTo: p.appliesTo, itemIds: rulesOf(p).itemIds.map(Number) }));
  }

  /** Cotización para la venta rápida (el carrito todavía no es un ticket). Mismo cálculo que el ticket. */
  async quote(input: QuoteInput) {
    const tenant = this.tenantContext.getTenant();
    const tenantId = tenant.id;
    const raw = (input.lines ?? []).slice(0, 100);
    const productIds = raw.filter((l) => l.product_id).map((l) => BigInt(Math.trunc(Number(l.product_id))));
    const itemIds = raw.filter((l) => !l.product_id && l.item_id).map((l) => BigInt(Math.trunc(Number(l.item_id))));
    const [products, items] = await Promise.all([
      this.prisma.product.findMany({ where: { id: { in: productIds }, item: { tenantId } }, include: { item: true } }),
      this.prisma.item.findMany({ where: { id: { in: itemIds }, tenantId } }),
    ]);
    const lines = raw.flatMap((l, i) => {
      const qty = Math.max(1, Math.trunc(Number(l.quantity) || 1));
      const prod = l.product_id ? products.find((p) => p.id === BigInt(Math.trunc(Number(l.product_id)))) : null;
      const item = !l.product_id ? items.find((it) => it.id === BigInt(Math.trunc(Number(l.item_id)))) : null;
      if (!prod && !item) return [];
      return [{
        id: String(i),
        isProduct: Boolean(prod),
        itemId: (prod ? prod.itemId : item!.id).toString(),
        gross: toCents(prod ? prod.item.price : item!.price) * qty,
        packageDiscount: 0,
      }];
    });

    const customerId = input.customer_id ? BigInt(Math.trunc(Number(input.customer_id))) : null;
    const ctx = {
      wallNow: salonWallClockNow(new Date(), billingRegionOf(tenant)),
      firstVisit: await isFirstVisit(this.prisma, customerId),
    };
    const setting = await this.prisma.setting.findFirst({
      where: { tenantId },
      select: { stackPromotions: true, manualDiscounts: true, manualDiscountMaxPct: true },
    });
    const promos: PromotionRow[] = await this.prisma.promotion.findMany({ where: { tenantId, kind: 'auto', active: true } });
    const discounts: EngineDiscount[] = promos
      .filter((p) => !promoBlockedBy(p, ctx))
      .map((p) => ({
        key: `auto-${p.id}`,
        source: 'auto',
        label: p.name,
        discountType: p.discountType as 'percent' | 'amount',
        value: p.discountType === 'percent' ? Number(p.value) : toCents(p.value),
        rules: rulesOf(p),
      }));
    let couponError: string | null = null;
    const code = normalizePromoCode(input.coupon);
    if (code) {
      const c = await this.prisma.promotion.findFirst({ where: { tenantId, kind: 'coupon', code } });
      if (!c) couponError = `No existe el cupón ${code}`;
      else {
        promos.push(c);
        discounts.push({
          key: `coupon-${c.id}`,
          source: 'coupon',
          label: `${c.name} (${code})`,
          discountType: c.discountType as 'percent' | 'amount',
          value: c.discountType === 'percent' ? Number(c.value) : toCents(c.value),
          rules: rulesOf(c),
          blockedBy: promoBlockedBy(c, ctx),
        });
      }
    }
    const m = input.manual;
    if (m && Number(m.value) > 0) {
      const type = m.type === 'amount' ? 'amount' : 'percent';
      discounts.push({
        key: 'manual',
        source: 'manual',
        label: type === 'percent' ? `Descuento ${Number(m.value)}%` : 'Descuento',
        discountType: type,
        value: type === 'percent' ? Math.min(Number(m.value), 100) : toCents(m.value),
        rules: { appliesTo: 'all', itemIds: [] },
      });
    }
    const minOf = new Map(promos.map((p) => [p.id.toString(), p.minTotal != null ? toCents(p.minTotal) : null]));
    const result = computeDiscounts(lines, discounts, {
      stackPromotions: setting?.stackPromotions ?? false,
      minTotalOf: (d) => minOf.get(d.key.split('-')[1] ?? '') ?? null,
    });
    return {
      manualMode: setting?.manualDiscounts ?? 'admin',
      manualMaxPct: setting?.manualDiscountMaxPct ?? 20,
      couponError,
      discounts: discounts.map((d) => ({
        key: d.key,
        source: d.source,
        label: d.label,
        amount: result.amounts[d.key].amount / 100,
        note: result.amounts[d.key].note,
      })),
      total: result.total / 100,
    };
  }

  private async require(id: bigint) {
    const p = await this.prisma.promotion.findFirst({ where: { id, tenantId: this.tenantId() } });
    if (!p) throw new NotFoundException('Promoción no encontrada');
    return p;
  }
}
