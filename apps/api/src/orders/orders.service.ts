import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
        employeeId: isService ? employeeId : null,
        quantity,
        productNameSnapshot: snapshotName,
        unitPriceSnapshot: unitPrice,
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
      line_discount?: number;
      employeeId?: number | null;
    },
  ) {
    await this.requireDraftOrder(orderId);
    const line = await this.prisma.itemOrder.findFirst({
      where: { id: lineId, orderId },
    });
    if (!line) {
      throw new NotFoundException('Line not found');
    }

    const isService = line.itemId != null && line.productId == null;
    const quantity = data.quantity ?? line.quantity;
    const discount = new Prisma.Decimal(
      data.line_discount ?? line.lineDiscount.toNumber(),
    );
    const lineTotal = line.unitPriceSnapshot.mul(quantity).minus(discount);

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
        lineDiscount: discount,
        lineTotal,
        employeeId: isService ? employeeId : null,
        updatedAt: new Date(),
      },
    });

    await this.recalculateOrder(orderId);
    return this.getOrder(orderId);
  }

  async removeItem(orderId: bigint, lineId: bigint) {
    await this.requireDraftOrder(orderId);
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

    await this.prisma.orderPayment.deleteMany({ where: { orderId } });

    if (payments.length > 0) {
      await this.prisma.orderPayment.createMany({
        data: payments.map((payment) => ({
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
      include: { employee: true },
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
        const isService = line.itemId != null && line.productId == null;
        if (!isService || !line.employee) continue;
        await tx.itemOrder.update({
          where: { id: line.id },
          data: {
            commissionRateSnapshot: line.employee.commissionRate,
            updatedAt: now,
          },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'finalized',
          paymentStatus: true,
          finalizedAt: now,
          updatedAt: now,
        },
      });
    });

    return this.getOrder(orderId);
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

    const wasFinalized = order.status === 'finalized';
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      if (wasFinalized) {
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

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          cancelledAt: now,
          cancelledReason: reason ?? null,
          updatedAt: now,
        },
      });
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
    const lines = await this.prisma.itemOrder.findMany({ where: { orderId } });
    const subtotal = lines.reduce(
      (sum, line) => sum.plus(line.lineTotal),
      new Prisma.Decimal(0),
    );
    const discountTotal = lines.reduce(
      (sum, line) => sum.plus(line.lineDiscount),
      new Prisma.Decimal(0),
    );
    const taxTotal = lines.reduce(
      (sum, line) => sum.plus(line.lineTax),
      new Prisma.Decimal(0),
    );
    const total = subtotal.minus(discountTotal).plus(taxTotal);

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        subtotal,
        discountTotal,
        taxTotal,
        total,
        updatedAt: new Date(),
      },
    });
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
