import { BadRequestException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { billingRegionOf, salonWallClockNow } from '../common/date';
import { computeDiscounts, EngineDiscount, promoBlockedBy, PromoRules, toCents } from './discount-engine';

type Db = PrismaClient | Prisma.TransactionClient;
type PromotionRow = Prisma.PromotionGetPayload<object>;

export function rulesOf(p: PromotionRow | null): PromoRules {
  if (!p) return { appliesTo: 'all', itemIds: [] };
  return {
    appliesTo: p.appliesTo as PromoRules['appliesTo'],
    itemIds: Array.isArray(p.itemIds) ? (p.itemIds as unknown[]).map(String) : [],
  };
}

export async function isFirstVisit(db: Db, customerId: bigint | null, exceptOrderId?: bigint) {
  if (!customerId) return null;
  const n = await db.order.count({
    where: { customerId, status: 'finalized', ...(exceptOrderId ? { id: { not: exceptOrderId } } : {}) },
  });
  return n === 0;
}

/**
 * Recalcula descuentos y totales de un ticket en borrador: agrega o saca las promociones
 * automáticas que correspondan, reparte cada descuento entre sus líneas y guarda los totales.
 */
export async function recalcOrderTotals(db: Db, tenant: object & { id: bigint }, orderId: bigint, now = new Date()) {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId }, select: { status: true, customerId: true } });
  const lines = await db.itemOrder.findMany({ where: { orderId }, orderBy: { id: 'asc' } });
  const setting = await db.setting.findFirst({ where: { tenantId: tenant.id }, select: { stackPromotions: true } });
  const wallNow = salonWallClockNow(now, billingRegionOf(tenant));
  const firstVisit = await isFirstVisit(db, order.customerId, orderId);
  const ctx = { wallNow, firstVisit };

  if (order.status === 'draft') {
    const autos = await db.promotion.findMany({ where: { tenantId: tenant.id, kind: 'auto', active: true } });
    const existing = await db.orderDiscount.findMany({ where: { orderId, source: 'auto' } });
    for (const p of autos) {
      const row = existing.find((d) => d.promotionId === p.id);
      const ok = !promoBlockedBy(p, ctx);
      if (ok && !row) {
        await db.orderDiscount.create({
          data: {
            tenantId: tenant.id,
            orderId,
            promotionId: p.id,
            source: 'auto',
            label: p.name,
            discountType: p.discountType,
            value: p.value,
          },
        });
      } else if (!ok && row && !row.dismissed) {
        await db.orderDiscount.delete({ where: { id: row.id } });
      }
    }
    // Automáticas que se pausaron o borraron mientras el ticket estaba abierto.
    const stale = existing.filter((d) => !d.dismissed && !autos.some((p) => p.id === d.promotionId));
    if (stale.length) await db.orderDiscount.deleteMany({ where: { id: { in: stale.map((d) => d.id) } } });
  }

  const rows = await db.orderDiscount.findMany({ where: { orderId }, include: { promotion: true }, orderBy: { id: 'asc' } });
  const engineDiscounts: EngineDiscount[] = rows.map((r) => ({
    key: r.id.toString(),
    source: r.source as EngineDiscount['source'],
    label: r.label,
    discountType: r.discountType as EngineDiscount['discountType'],
    value: r.discountType === 'percent' ? Number(r.value) : toCents(r.value),
    rules: rulesOf(r.promotion),
    dismissed: r.dismissed,
    blockedBy:
      r.source === 'coupon'
        ? r.promotion
          ? promoBlockedBy(r.promotion, ctx)
          : 'El cupón ya no existe'
        : null,
  }));
  const minTotal = new Map(rows.map((r) => [r.id.toString(), r.promotion?.minTotal != null ? toCents(r.promotion.minTotal) : null]));
  const result = computeDiscounts(
    lines.map((l) => ({
      id: l.id.toString(),
      isProduct: l.productId != null,
      itemId: l.itemId?.toString() ?? null,
      gross: toCents(l.unitPriceSnapshot) * l.quantity,
      packageDiscount: toCents(l.lineDiscount),
    })),
    engineDiscounts,
    { stackPromotions: setting?.stackPromotions ?? false, minTotalOf: (d) => minTotal.get(d.key) ?? null },
  );

  for (const r of rows) {
    const a = result.amounts[r.id.toString()];
    const amount = new Prisma.Decimal(a.amount).div(100);
    if (!amount.equals(r.amount) || (a.note ?? null) !== r.note) {
      await db.orderDiscount.update({ where: { id: r.id }, data: { amount, note: a.note } });
    }
  }
  let subtotal = new Prisma.Decimal(0);
  let discountTotal = new Prisma.Decimal(0);
  let taxTotal = new Prisma.Decimal(0);
  for (const l of lines) {
    const promo = new Prisma.Decimal(result.perLine[l.id.toString()] ?? 0).div(100);
    const gross = l.unitPriceSnapshot.mul(l.quantity);
    const lineTotal = gross.minus(l.lineDiscount).minus(promo);
    if (!promo.equals(l.promoDiscount) || !lineTotal.equals(l.lineTotal)) {
      await db.itemOrder.update({ where: { id: l.id }, data: { promoDiscount: promo, lineTotal, updatedAt: now } });
    }
    subtotal = subtotal.plus(gross);
    discountTotal = discountTotal.plus(l.lineDiscount).plus(promo);
    taxTotal = taxTotal.plus(l.lineTax);
  }
  await db.order.update({
    where: { id: orderId },
    data: { subtotal, discountTotal, taxTotal, total: subtotal.minus(discountTotal).plus(taxTotal), updatedAt: now },
  });
}

/** Al cobrar: suma un uso a cada promoción que descontó. Falla si un cupón llegó a su límite entre medio. */
export async function consumePromotionUses(tx: Prisma.TransactionClient, orderId: bigint) {
  const used = await tx.orderDiscount.findMany({
    where: { orderId, promotionId: { not: null }, amount: { gt: 0 } },
  });
  for (const d of used) {
    const n = await tx.$executeRaw`
      UPDATE promotions SET uses_count = uses_count + 1, updated_at = now()
      WHERE id = ${d.promotionId} AND (max_uses IS NULL OR uses_count < max_uses)`;
    if (n !== 1) throw new BadRequestException(`«${d.label}» ya no tiene usos disponibles. Quitala y volvé a cobrar.`);
  }
}

/** Al anular un ticket cobrado: devuelve los usos. */
export async function restorePromotionUses(tx: Prisma.TransactionClient, orderId: bigint) {
  const used = await tx.orderDiscount.findMany({
    where: { orderId, promotionId: { not: null }, amount: { gt: 0 } },
  });
  for (const d of used) {
    await tx.$executeRaw`UPDATE promotions SET uses_count = GREATEST(uses_count - 1, 0) WHERE id = ${d.promotionId}`;
  }
}

export function normalizePromoCode(raw: unknown) {
  return String(raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 30);
}
