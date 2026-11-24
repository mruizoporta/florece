import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { lineCommissionRate } from '../common/commission';
import type { AuthUser } from '../common/types/auth.types';
import {
  consumePromotionUses,
  isFirstVisit,
  normalizePromoCode,
  recalcOrderTotals,
  restorePromotionUses,
} from '../promotions/order-discounts';
import { promoBlockedBy } from '../promotions/discount-engine';
import { billingRegionOf, salonWallClockNow } from '../common/date';
import {
  VOUCHER_METHOD,
  consumeVouchers,
  normalizeCode,
  parseVoucherRef,
  restoreVouchers,
  sessionValue,
  voucherRef,
} from '../vouchers/voucher-ledger';
import {
  formatStockQty,
  isSellableUsage,
  normalizeProductUnit,
  normalizeProductUsage,
} from '@florece/shared';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenant/tenant.context';
import { EntitlementsService } from '../entitlements/entitlements.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
    private readonly entitlements: EntitlementsService,
  ) {}

  private tenantId(): bigint {
    return this.tenantContext.getTenant().id;
  }

  async findOrOpenSheet(data: {
    name: string;
    customerId?: number;
    employeeId?: number;
  }) {
    const tenantId = this.tenantId();
    const name = data.name.trim();
    if (!name) {
      throw new BadRequestException('Client name is required');
    }

    const normalized = this.normalizeClientName(name);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const drafts = await this.prisma.order.findMany({
      where: {
        tenantId,
        status: 'draft',
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        items: {
          include: {
            employee: { select: { id: true, name: true } },
          },
        },
        customer: { include: { user: { select: { name: true } } } },
      },
      orderBy: { id: 'desc' },
      take: 80,
    });

    const customerId = data.customerId ? BigInt(data.customerId) : null;

    const match = drafts.find((order) => {
      if (customerId && order.customerId === customerId) return true;
      const orderName = this.normalizeClientName(order.name ?? '');
      if (orderName && orderName === normalized) return true;
      const customerName = this.normalizeClientName(
        order.customer?.user?.name ?? '',
      );
      if (customerId == null && customerName && customerName === normalized) {
        return true;
      }
      return false;
    });

    if (match) {
      return { order: match, created: false };
    }

    const order = await this.createOrder({
      name,
      customerId: data.customerId,
      employeeId: data.employeeId,
    });
    return { order, created: true };
  }

  listOpenSheetsToday(limit = 40) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.order.findMany({
      where: {
        tenantId: this.tenantId(),
        status: 'draft',
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        items: {
          include: {
            employee: { select: { id: true, name: true } },
          },
        },
        customer: { include: { user: { select: { name: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  private normalizeClientName(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  listOrders(search?: string, status?: string, limit = 50) {
    return this.prisma.order.findMany({
      where: {
        tenantId: this.tenantId(),
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { id: this.parseBigIntSearch(search) },
              ],
            }
          : {}),
      },
      include: { items: true, payments: true },
      take: limit,
      orderBy: { id: 'desc' },
    });
  }

  async getOrder(orderId: bigint) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId: this.tenantId() },
      include: {
        items: {
          include: {
            item: true,
            employee: { select: { id: true, name: true, image: true } },
          },
        },
        payments: true,
        customer: true,
        employee: true,
        discounts: { orderBy: { id: 'asc' } },
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async createOrder(data: {
    customerId?: number;
    employeeId?: number;
    name: string;
  }) {
    const now = new Date();
    return this.prisma.order.create({
      data: {
        customerId: data.customerId ? BigInt(data.customerId) : null,
        employeeId: data.employeeId ? BigInt(data.employeeId) : null,
        name: data.name,
        status: 'draft',
        paymentStatus: false,
        tenantId: this.tenantId(),
        createdAt: now,
        updatedAt: now,
      },
      include: { items: true, payments: true },
    });
  }

  async addItem(
    orderId: bigint,
    data: {
      itemId?: number;
      productId?: number;
      quantity: number;
      employeeId?: number;
    },
  ) {
    const order = await this.requireDraftOrder(orderId);
    const tenantId = this.tenantId();
    const now = new Date();

    let itemId = data.itemId ? BigInt(data.itemId) : null;
    let productId = data.productId ? BigInt(data.productId) : null;
    let snapshotName = 'Item';
    let unitPrice = new Prisma.Decimal(0);
    let unitCost: Prisma.Decimal | null = null;
    const isService = !productId && !!itemId;

    if (productId) {
      const product = await this.prisma.product.findFirst({
        where: { id: productId, item: { tenantId } },
        include: { item: true },
      });
      if (!product) {
        throw new BadRequestException('Product not found');
      }
      if (!isSellableUsage(normalizeProductUsage(product.usage))) {
        throw new BadRequestException(
          `«${product.item.name}» es insumo de uso interno; no se vende en caja. Usalo en la receta del servicio.`,
        );
      }
      itemId = product.itemId;
      productId = product.id;
      snapshotName = product.item.name;
      unitPrice = product.item.price;
      unitCost = product.cost;
    } else if (itemId) {
      const item = await this.prisma.item.findFirst({
        where: { id: itemId, tenantId },
      });
      if (!item) {
        throw new BadRequestException('Item not found');
      }
      snapshotName = item.name;
      unitPrice = item.price;
    } else {
      throw new BadRequestException('item_id or product_id required');
    }

    let employeeId: bigint | null = null;
    if (data.employeeId != null) {
      employeeId = await this.requireTenantEmployee(BigInt(data.employeeId));
    } else if (isService && order.employeeId) {
      employeeId = order.employeeId;
    }

    if (isService && !employeeId) {
      throw new BadRequestException(
        'employee_id is required for service lines',
      );
    }

    const quantity = data.quantity || 1;
    const lineTotal = unitPrice.mul(quantity);

    const line = await this.prisma.itemOrder.create({
      data: {
        orderId: order.id,
        itemId,
        productId,
        employeeId,
        quantity,
        productNameSnapshot: snapshotName,
        unitPriceSnapshot: unitPrice,
        unitCostSnapshot: unitCost,
        lineTotal,
        tenantId,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.recalculateOrder(order.id);
    return this.getOrder(orderId).then((o) => ({ order: o, line }));
  }

  async updateItem(
    orderId: bigint,
    lineId: bigint,
    data: {
      quantity?: number;
      employeeId?: number | null;
    },
  ) {
    await this.requireDraftOrder(orderId);
    await this.assertNoVouchers(orderId);
    const line = await this.prisma.itemOrder.findFirst({
      where: { id: lineId, orderId },
    });
    if (!line) {
      throw new NotFoundException('Line not found');
    }

    const isService = line.itemId != null && line.productId == null;
    const quantity = data.quantity ?? line.quantity;

    let employeeId = line.employeeId;
    if (data.employeeId !== undefined) {
      if (data.employeeId == null) {
        employeeId = null;
      } else {
        employeeId = await this.requireTenantEmployee(BigInt(data.employeeId));
      }
    }

    if (isService && !employeeId) {
      throw new BadRequestException(
        'employee_id is required for service lines',
      );
    }

    await this.prisma.itemOrder.update({
      where: { id: lineId },
      data: {
        quantity,
        employeeId,
        updatedAt: new Date(),
      },
    });

    await this.recalculateOrder(orderId);
    return this.getOrder(orderId);
  }

  async removeItem(orderId: bigint, lineId: bigint) {
    await this.requireDraftOrder(orderId);
    await this.assertNoVouchers(orderId);
    await this.prisma.itemOrder.deleteMany({
      where: { id: lineId, orderId },
    });
    await this.recalculateOrder(orderId);
    return this.getOrder(orderId);
  }

  async syncPayments(
    orderId: bigint,
    payments: Array<{
      method: string;
      amount: number;
      reference?: string;
      paid_at?: string;
    }>,
  ) {
    await this.requireDraftOrder(orderId);
    const tenantId = this.tenantId();
    const now = new Date();
    // Los canjes de bonos solo los crea applyVoucher (monto calculado acá, no por el cliente).
    const plain = payments.filter((p) => p.method !== VOUCHER_METHOD);

    await this.prisma.orderPayment.deleteMany({
      where: { orderId, method: { not: VOUCHER_METHOD } },
    });

    if (plain.length > 0) {
      await this.prisma.orderPayment.createMany({
        data: plain.map((payment) => ({
          orderId,
          tenantId,
          method: payment.method,
          amount: new Prisma.Decimal(payment.amount),
          reference: payment.reference ?? null,
          paidAt: payment.paid_at ? new Date(payment.paid_at) : now,
          createdAt: now,
          updatedAt: now,
        })),
      });
    }

    return this.getOrder(orderId);
  }

  /**
   * Aplica un bono al ticket. Gift card: paga hasta su saldo. Paquete: cubre las sesiones
   * de su servicio al valor pagado por sesión (la diferencia con el precio de lista va como descuento).
   */
  async applyVoucher(orderId: bigint, rawCode: string) {
    await this.requireDraftOrder(orderId);
    const tenantId = this.tenantId();
    const code = normalizeCode(rawCode);
    const voucher = await this.prisma.voucher.findUnique({
      where: { tenantId_code: { tenantId, code } },
    });
    const now = new Date();
    if (!voucher) throw new NotFoundException(`No existe el bono ${code || rawCode}`);
    if (voucher.cancelledAt) throw new BadRequestException('Ese bono está anulado');
    if (voucher.expiresAt && voucher.expiresAt <= now) {
      throw new BadRequestException('Ese bono está vencido');
    }
    await this.removeVoucher(orderId, code);

    if (voucher.kind === 'giftcard') {
      const order = await this.requireOrder(orderId);
      // Lo que falta después de TODO lo cargado (efectivo, tarjeta, otros bonos).
      const others = await this.prisma.orderPayment.aggregate({
        where: { orderId },
        _sum: { amount: true },
      });
      const due = order.total.minus(others._sum.amount ?? 0);
      const amount = Prisma.Decimal.min(voucher.balance, due);
      if (amount.lte(0)) {
        throw new BadRequestException(
          voucher.balance.lte(0) ? 'La gift card no tiene saldo' : 'El ticket ya está cubierto',
        );
      }
      await this.prisma.orderPayment.create({
        data: { orderId, tenantId, method: VOUCHER_METHOD, amount, reference: voucherRef(code), paidAt: now, createdAt: now, updatedAt: now },
      });
      return this.getOrder(orderId);
    }

    let left = voucher.sessionsTotal - voucher.sessionsUsed;
    if (left <= 0) throw new BadRequestException('El paquete ya no tiene sesiones');
    // Dos paquetes del mismo servicio se pisarían el descuento de las mismas líneas.
    const otherCodes = (
      await this.prisma.orderPayment.findMany({ where: { orderId, method: VOUCHER_METHOD }, select: { reference: true } })
    )
      .map((p) => parseVoucherRef(p.reference))
      .filter((r) => r.sessions > 0)
      .map((r) => r.code);
    if (otherCodes.length) {
      const clash = await this.prisma.voucher.count({
        where: { tenantId, code: { in: otherCodes }, kind: 'package', serviceItemId: voucher.serviceItemId },
      });
      if (clash) throw new BadRequestException(`Ya hay otro paquete de «${voucher.serviceName}» en este ticket`);
    }
    const lines = await this.prisma.itemOrder.findMany({
      where: { orderId, itemId: voucher.serviceItemId, productId: null },
      orderBy: { id: 'asc' },
    });
    if (lines.length === 0) {
      throw new BadRequestException(`Agregá «${voucher.serviceName}» al ticket para usar el paquete`);
    }
    const value = new Prisma.Decimal(sessionValue(voucher).toFixed(2));
    // La última sesión del paquete se lleva los centavos del redondeo (100 en 3 = 33,33 + 33,33 + 33,34).
    const lastValue = voucher.price.minus(value.mul(voucher.sessionsTotal - 1));
    let sessions = 0;
    let covered = new Prisma.Decimal(0);
    for (const line of lines) {
      const k = Math.min(line.quantity, left);
      if (k <= 0) break;
      const unit = line.unitPriceSnapshot;
      const includesLast = left - k === 0;
      const lineCovered = Prisma.Decimal.min(unit, value)
        .mul(includesLast ? k - 1 : k)
        .plus(includesLast ? Prisma.Decimal.min(unit, lastValue) : 0);
      const discount = unit.mul(k).minus(lineCovered);
      await this.prisma.itemOrder.update({
        where: { id: line.id },
        data: {
          lineDiscount: discount,
          lineTotal: unit.mul(line.quantity).minus(discount),
          updatedAt: now,
        },
      });
      covered = covered.plus(lineCovered);
      sessions += k;
      left -= k;
    }
    await this.recalculateOrder(orderId);
    await this.prisma.orderPayment.create({
      data: { orderId, tenantId, method: VOUCHER_METHOD, amount: covered, reference: voucherRef(code, sessions), paidAt: now, createdAt: now, updatedAt: now },
    });
    // El total bajó: una gift card ya aplicada se recalcula para no cobrar de más.
    const giftcards = await this.prisma.orderPayment.findMany({
      where: { orderId, method: VOUCHER_METHOD, NOT: { reference: { contains: ':' } } },
    });
    for (const g of giftcards) {
      // Si esa gift card ya no sirve (venció entre medio), queda fuera y el paquete igual se aplica.
      await this.applyVoucher(orderId, g.reference ?? '').catch(() => undefined);
    }
    return this.getOrder(orderId);
  }

  /** Quita un bono del ticket (y el descuento que puso un paquete). */
  async removeVoucher(orderId: bigint, rawCode: string) {
    await this.requireDraftOrder(orderId);
    const code = normalizeCode(rawCode);
    const applied = await this.prisma.orderPayment.findMany({
      where: { orderId, method: VOUCHER_METHOD },
    });
    const mine = applied.filter((p) => parseVoucherRef(p.reference).code === code);
    if (mine.length === 0) return this.getOrder(orderId);
    await this.prisma.orderPayment.deleteMany({ where: { id: { in: mine.map((p) => p.id) } } });
    const voucher = await this.prisma.voucher.findUnique({
      where: { tenantId_code: { tenantId: this.tenantId(), code } },
    });
    if (voucher?.kind === 'package') {
      // lineDiscount es solo de paquetes; los demás descuentos van en promoDiscount.
      const lines = await this.prisma.itemOrder.findMany({
        where: { orderId, itemId: voucher.serviceItemId, productId: null },
      });
      for (const line of lines) {
        await this.prisma.itemOrder.update({
          where: { id: line.id },
          data: {
            lineDiscount: 0,
            lineTotal: line.unitPriceSnapshot.mul(line.quantity),
            updatedAt: new Date(),
          },
        });
      }
      await this.recalculateOrder(orderId);
    }
    return this.getOrder(orderId);
  }

  /** Descuento a mano. Quién puede y cuánto lo decide cada salón en Ajustes. */
  async addManualDiscount(
    orderId: bigint,
    user: AuthUser,
    input: { type?: string; value?: number; reason?: string },
  ) {
    const order = await this.requireDraftOrder(orderId);
    await this.assertNoVouchers(orderId);
    const setting = await this.prisma.setting.findFirst({
      where: { tenantId: this.tenantId() },
      select: { manualDiscounts: true, manualDiscountMaxPct: true },
    });
    const mode = setting?.manualDiscounts ?? 'admin';
    const isAdmin = user.roles.includes('Admin');
    if (mode === 'off') throw new ForbiddenException('Este salón no usa descuentos a mano');
    if (!isAdmin && !(mode === 'cashier' && user.roles.includes('Cajero'))) {
      throw new ForbiddenException('Solo la administración puede dar descuentos a mano');
    }
    const type = input.type === 'amount' ? 'amount' : 'percent';
    const value = Number(input.value);
    if (!Number.isFinite(value) || value <= 0 || (type === 'percent' && value > 100)) {
      throw new BadRequestException('Descuento inválido');
    }
    const reason = input.reason?.trim().slice(0, 200);
    if (!reason) throw new BadRequestException('Escribí el motivo del descuento');
    if (!isAdmin) {
      const max = setting?.manualDiscountMaxPct ?? 20;
      const pct = type === 'percent' ? value : (value / Math.max(Number(order.subtotal), 0.01)) * 100;
      if (pct > max + 1e-9) throw new ForbiddenException(`Tu tope de descuento es ${max}%`);
    }
    await this.prisma.orderDiscount.create({
      data: {
        tenantId: this.tenantId(),
        orderId,
        source: 'manual',
        label: type === 'percent' ? `Descuento ${value}%` : 'Descuento',
        discountType: type,
        value: new Prisma.Decimal(value.toFixed(2)),
        reason,
        createdById: user.id,
      },
    });
    await this.recalculateOrder(orderId);
    return this.getOrder(orderId);
  }

  async applyCoupon(orderId: bigint, rawCode: string, userId?: bigint) {
    const order = await this.requireDraftOrder(orderId);
    await this.assertNoVouchers(orderId);
    const code = normalizePromoCode(rawCode);
    const promo = code
      ? await this.prisma.promotion.findFirst({ where: { tenantId: this.tenantId(), kind: 'coupon', code } })
      : null;
    if (!promo) throw new NotFoundException(`No existe el cupón ${code || rawCode}`);
    const blocked = promoBlockedBy(promo, {
      wallNow: salonWallClockNow(new Date(), billingRegionOf(this.tenantContext.getTenant())),
      firstVisit: await isFirstVisit(this.prisma, order.customerId, orderId),
    });
    if (blocked) throw new BadRequestException(`Cupón ${code}: ${blocked.toLowerCase()}`);
    // Un cupón por ticket: el nuevo reemplaza al anterior.
    await this.prisma.orderDiscount.deleteMany({ where: { orderId, source: 'coupon' } });
    await this.prisma.orderDiscount.create({
      data: {
        tenantId: this.tenantId(),
        orderId,
        promotionId: promo.id,
        source: 'coupon',
        label: `${promo.name} (${code})`.slice(0, 120),
        discountType: promo.discountType,
        value: promo.value,
        createdById: userId ?? null,
      },
    });
    await this.recalculateOrder(orderId);
    return this.getOrder(orderId);
  }

  /** Saca un descuento. Una promoción automática queda marcada como quitada para que no vuelva sola. */
  async removeDiscount(orderId: bigint, discountId: bigint, restore = false) {
    await this.requireDraftOrder(orderId);
    await this.assertNoVouchers(orderId);
    const d = await this.prisma.orderDiscount.findFirst({ where: { id: discountId, orderId } });
    if (!d) throw new NotFoundException('Descuento no encontrado');
    if (d.source === 'auto') {
      await this.prisma.orderDiscount.update({ where: { id: d.id }, data: { dismissed: !restore } });
    } else if (!restore) {
      await this.prisma.orderDiscount.delete({ where: { id: d.id } });
    }
    await this.recalculateOrder(orderId);
    return this.getOrder(orderId);
  }

  async finalize(
    orderId: bigint,
    opts?: {
      consumables?: Array<{ productId: number; quantity: number }>;
      consumablesReason?: string;
    },
  ) {
    const order = await this.requireDraftOrder(orderId);
    const total = order.total;
    const payments = await this.prisma.orderPayment.findMany({
      where: { orderId },
    });
    const paid = payments.reduce(
      (sum, payment) => sum.plus(payment.amount),
      new Prisma.Decimal(0),
    );

    if (paid.lessThan(total)) {
      throw new BadRequestException('Payments do not cover order total');
    }

    const lines = await this.prisma.itemOrder.findMany({
      where: { orderId },
      include: {
        employee: true,
        item: { select: { service: { select: { commissionRate: true } } } },
      },
    });

    const missingStylist = lines.filter(
      (line) =>
        line.itemId != null &&
        line.productId == null &&
        line.employeeId == null,
    );
    if (missingStylist.length > 0) {
      throw new BadRequestException(
        'Every service line needs an employee before finalizing',
      );
    }

    const saleQty = new Map<string, number>();
    for (const line of lines) {
      if (line.productId == null) continue;
      const key = line.productId.toString();
      saleQty.set(key, (saleQty.get(key) ?? 0) + line.quantity);
    }

    const canConsume = await this.entitlements.hasFeature(
      this.tenantId(),
      'service_consumables',
    );
    const recipeQty = canConsume
      ? await this.recipeQtyForServiceLines(lines)
      : new Map<string, number>();

    let consumeQty = recipeQty;
    let consumeReason = `Insumos de servicio · orden #${orderId}`;

    if (canConsume && opts?.consumables) {
      const override = this.parseConsumableOverrides(opts.consumables);
      const changed = this.consumableMapsDiffer(recipeQty, override);
      if (changed) {
        const reason = opts.consumablesReason?.trim();
        if (!reason) {
          throw new BadRequestException(
            'Indicá el motivo del ajuste excepcional de insumos (ej. pelo largo)',
          );
        }
        consumeReason = `Insumos ajustados · orden #${orderId}: ${reason}`;
      }
      consumeQty = override;
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await this.claimFinalize(tx, orderId, now);
      await consumeVouchers(tx, this.tenantId(), payments, now);
      await consumePromotionUses(tx, orderId);
      await this.applyStockOut(tx, saleQty, {
        orderId,
        type: 'sale',
        reason: `Venta orden #${orderId}`,
        now,
      });
      await this.applyStockOut(tx, consumeQty, {
        orderId,
        type: 'consume',
        reason: consumeReason,
        now,
      });

      for (const line of lines) {
        if (!line.employee) continue;
        await tx.itemOrder.update({
          where: { id: line.id },
          data: {
            commissionRateSnapshot: lineCommissionRate(
              line,
              line.employee,
              line.item?.service?.commissionRate,
            ),
            updatedAt: now,
          },
        });
      }
    });

    return this.getOrder(orderId);
  }

  /** Pasa el ticket a cobrado solo si sigue en borrador; dentro de la transacción del cobro. */
  private async claimFinalize(tx: Prisma.TransactionClient, orderId: bigint, now: Date) {
    // Primero y condicional: un doble toque o un reintento no descuenta bonos ni stock dos veces.
    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: 'draft' },
      data: {
        status: 'finalized',
        paymentStatus: true,
        finalizedAt: now,
        updatedAt: now,
      },
    });
    if (claimed.count !== 1) throw new BadRequestException('El ticket ya se cobró');
  }

  /** Suggested consumable deductions for an open order (from service recipes). */
  async previewConsumables(orderId: bigint) {
    const order = await this.requireOrder(orderId);
    const canConsume = await this.entitlements.hasFeature(
      this.tenantId(),
      'service_consumables',
    );
    if (!canConsume) {
      return { enabled: false, items: [] as Array<unknown> };
    }

    const lines = await this.prisma.itemOrder.findMany({
      where: { orderId },
    });
    const qty = await this.recipeQtyForServiceLines(lines);
    const items = await this.mapConsumablePreview(qty);
    return {
      enabled: true,
      orderId: Number(order.id),
      status: order.status,
      items,
    };
  }

  private parseConsumableOverrides(
    rows: Array<{ productId: number; quantity: number }>,
  ) {
    const map = new Map<string, number>();
    for (const row of rows) {
      const productId = Number(row.productId);
      const qty = Math.trunc(Number(row.quantity));
      if (!Number.isFinite(productId) || productId <= 0) {
        throw new BadRequestException('productId inválido en insumos');
      }
      if (!Number.isFinite(qty) || qty < 0) {
        throw new BadRequestException(
          'La cantidad de insumo debe ser un entero ≥ 0',
        );
      }
      if (qty === 0) continue;
      const key = BigInt(productId).toString();
      map.set(key, (map.get(key) ?? 0) + qty);
    }
    return map;
  }

  private consumableMapsDiffer(
    a: Map<string, number>,
    b: Map<string, number>,
  ) {
    if (a.size !== b.size) return true;
    for (const [k, v] of a) {
      if ((b.get(k) ?? 0) !== v) return true;
    }
    for (const [k, v] of b) {
      if ((a.get(k) ?? 0) !== v) return true;
    }
    return false;
  }

  private async mapConsumablePreview(qty: Map<string, number>) {
    const ids = [...qty.keys()].map((k) => BigInt(k));
    if (ids.length === 0) return [];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, item: { tenantId: this.tenantId() } },
      include: { item: { select: { name: true } } },
    });
    const byId = new Map(products.map((p) => [p.id.toString(), p] as const));
    return ids
      .map((id) => {
        const key = id.toString();
        const product = byId.get(key);
        if (!product) return null;
        const unit = normalizeProductUnit(product.unit);
        const quantity = qty.get(key) ?? 0;
        return {
          productId: Number(product.id),
          productName: product.item.name,
          quantity,
          suggestedQuantity: quantity,
          stock: product.stock,
          unit,
          quantityLabel: formatStockQty(quantity, unit),
          stockLabel: formatStockQty(product.stock, unit),
        };
      })
      .filter(Boolean);
  }

  async cancel(orderId: bigint, reason?: string) {
    const order = await this.requireOrder(orderId);
    if (order.status === 'cancelled') {
      return order;
    }
    if (order.status === 'prepaid') {
      throw new BadRequestException('Es la venta de un bono: anulalo desde Bonos y gift cards');
    }

    const wasFinalized = order.status === 'finalized';
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // Condicional: cancelar dos veces a la vez no devuelve saldo ni stock dos veces.
      const claimed = await tx.order.updateMany({
        where: { id: orderId, status: order.status },
        data: { status: 'cancelled', cancelledAt: now, cancelledReason: reason ?? null, updatedAt: now },
      });
      if (claimed.count !== 1) throw new BadRequestException('El ticket cambió mientras tanto; recargá');
      if (wasFinalized) {
        const paid = await tx.orderPayment.findMany({ where: { orderId } });
        await restoreVouchers(tx, this.tenantId(), paid, now);
        await restorePromotionUses(tx, orderId);
        const outs = await tx.inventoryMovement.findMany({
          where: {
            orderId,
            tenantId: this.tenantId(),
            type: { in: ['sale', 'consume'] },
            quantity: { lt: 0 },
          },
        });
        const restoreQty = new Map<string, number>();
        for (const move of outs) {
          const key = move.productId.toString();
          restoreQty.set(
            key,
            (restoreQty.get(key) ?? 0) + Math.abs(move.quantity),
          );
        }
        for (const [productIdStr, qty] of restoreQty) {
          const productId = BigInt(productIdStr);
          const product = await tx.product.findFirst({
            where: { id: productId, item: { tenantId: this.tenantId() } },
          });
          if (!product) continue;
          const next = product.stock + qty;
          await tx.product.update({
            where: { id: productId },
            data: { stock: next, updatedAt: now },
          });
          await tx.inventoryMovement.create({
            data: {
              tenantId: this.tenantId(),
              productId,
              orderId,
              type: 'restore',
              quantity: qty,
              stockAfter: next,
              reason:
                reason?.trim() ||
                `Reverso por cancelación orden #${orderId}`,
              createdAt: now,
            },
          });
        }
      }
    });

    return this.getOrder(orderId);
  }

  /** Units to deduct from inventory for service lines with recipes. */
  private async recipeQtyForServiceLines(
    lines: Array<{ itemId: bigint | null; productId: bigint | null; quantity: number }>,
  ) {
    const consumeQty = new Map<string, number>();
    const serviceItemIds = [
      ...new Set(
        lines
          .filter((l) => l.itemId != null && l.productId == null)
          .map((l) => l.itemId!.toString()),
      ),
    ].map((id) => BigInt(id));

    if (serviceItemIds.length === 0) return consumeQty;

    const services = await this.prisma.service.findMany({
      where: {
        itemId: { in: serviceItemIds },
        item: { tenantId: this.tenantId() },
      },
      include: { consumables: true },
    });
    const byItemId = new Map(
      services.map((s) => [s.itemId.toString(), s] as const),
    );

    for (const line of lines) {
      if (line.itemId == null || line.productId != null) continue;
      const service = byItemId.get(line.itemId.toString());
      if (!service?.consumables.length) continue;
      for (const c of service.consumables) {
        const key = c.productId.toString();
        const add = c.quantity * line.quantity;
        consumeQty.set(key, (consumeQty.get(key) ?? 0) + add);
      }
    }
    return consumeQty;
  }

  private async applyStockOut(
    tx: Prisma.TransactionClient,
    qtyByProduct: Map<string, number>,
    meta: {
      orderId: bigint;
      type: 'sale' | 'consume';
      reason: string;
      now: Date;
    },
  ) {
    for (const [productIdStr, qty] of qtyByProduct) {
      if (qty <= 0) continue;
      const productId = BigInt(productIdStr);
      const product = await tx.product.findFirst({
        where: { id: productId, item: { tenantId: this.tenantId() } },
        include: { item: { select: { name: true } } },
      });
      if (!product) {
        throw new BadRequestException(`Product ${productIdStr} not found`);
      }
      if (product.stock < qty) {
        const kind =
          meta.type === 'consume' ? 'insumos del servicio' : 'venta';
        const unit = normalizeProductUnit(product.unit);
        throw new BadRequestException(
          `Stock insuficiente de «${product.item.name}» para ${kind} (hay ${formatStockQty(product.stock, unit)}, se necesitan ${formatStockQty(qty, unit)})`,
        );
      }
      const next = product.stock - qty;
      await tx.product.update({
        where: { id: productId },
        data: { stock: next, updatedAt: meta.now },
      });
      await tx.inventoryMovement.create({
        data: {
          tenantId: this.tenantId(),
          productId,
          orderId: meta.orderId,
          type: meta.type,
          quantity: -qty,
          stockAfter: next,
          reason: meta.reason,
          // Costo del momento: Utilidad descuenta los insumos con este valor.
          unitCost: product.cost,
          createdAt: meta.now,
        },
      });
    }
  }

  async reportSummary(from?: string, to?: string) {
    const tenantId = this.tenantId();
    const where: Prisma.OrderWhereInput = {
      tenantId,
      status: 'finalized',
      ...(from || to
        ? {
            finalizedAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const orders = await this.prisma.order.findMany({ where });
    const totalRevenue = orders.reduce(
      (sum, order) => sum.plus(order.total),
      new Prisma.Decimal(0),
    );

    return {
      orderCount: orders.length,
      totalRevenue: totalRevenue.toNumber(),
    };
  }

  async reportPayments(from?: string, to?: string) {
    const tenantId = this.tenantId();
    const payments = await this.prisma.orderPayment.findMany({
      where: {
        tenantId,
        ...(from || to
          ? {
              paidAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      include: { order: true },
    });

    const byMethod = new Map<string, number>();
    for (const payment of payments) {
      const current = byMethod.get(payment.method) ?? 0;
      byMethod.set(payment.method, current + payment.amount.toNumber());
    }

    return {
      totalPayments: payments.length,
      byMethod: Object.fromEntries(byMethod),
    };
  }

  async reportProducts(from?: string, to?: string) {
    const tenantId = this.tenantId();
    const lines = await this.prisma.itemOrder.findMany({
      where: {
        tenantId,
        order: {
          status: 'finalized',
          ...(from || to
            ? {
                finalizedAt: {
                  ...(from ? { gte: new Date(from) } : {}),
                  ...(to ? { lte: new Date(to) } : {}),
                },
              }
            : {}),
        },
      },
    });

    const byProduct = new Map<string, { quantity: number; revenue: number }>();
    for (const line of lines) {
      const name = line.productNameSnapshot ?? 'Unknown';
      const current = byProduct.get(name) ?? { quantity: 0, revenue: 0 };
      current.quantity += line.quantity;
      current.revenue += line.lineTotal.toNumber();
      byProduct.set(name, current);
    }

    return { products: Object.fromEntries(byProduct) };
  }

  private async recalculateOrder(orderId: bigint) {
    await recalcOrderTotals(this.prisma, this.tenantContext.getTenant(), orderId);
  }

  /** Con bonos aplicados el ticket queda fijo: cambiarlo dejaría el canje desfasado. */
  private async assertNoVouchers(orderId: bigint) {
    const n = await this.prisma.orderPayment.count({ where: { orderId, method: VOUCHER_METHOD } });
    if (n > 0) {
      throw new BadRequestException('Quitá los bonos aplicados antes de cambiar el ticket');
    }
  }

  private async requireDraftOrder(orderId: bigint) {
    const order = await this.requireOrder(orderId);
    if (order.status !== 'draft') {
      throw new BadRequestException('Order is not in draft status');
    }
    return order;
  }

  private async requireTenantEmployee(employeeId: bigint) {
    const employee = await this.prisma.employee.findFirst({
      where: {
        id: employeeId,
        tenantId: this.tenantId(),
        status: true,
      },
    });
    if (!employee) {
      throw new BadRequestException('Employee not found');
    }
    return employee.id;
  }

  private async requireOrder(orderId: bigint) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId: this.tenantId() },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  private parseBigIntSearch(search: string): bigint | undefined {
    if (/^\d+$/.test(search)) {
      return BigInt(search);
    }
    return undefined;
  }
}
