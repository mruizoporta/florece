import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenant/tenant.context';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private tenantId(): bigint {
    return this.tenantContext.getTenant().id;
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
        items: { include: { item: true } },
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
    },
  ) {
    const order = await this.requireDraftOrder(orderId);
    const tenantId = this.tenantId();
    const now = new Date();

    let itemId = data.itemId ? BigInt(data.itemId) : null;
    let productId = data.productId ? BigInt(data.productId) : null;
    let snapshotName = 'Item';
    let unitPrice = new Prisma.Decimal(0);

    if (productId) {
      const product = await this.prisma.product.findFirst({
        where: { id: productId, item: { tenantId } },
        include: { item: true },
      });
      if (!product) {
        throw new BadRequestException('Product not found');
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

    const quantity = data.quantity || 1;
    const lineTotal = unitPrice.mul(quantity);

    const line = await this.prisma.itemOrder.create({
      data: {
        orderId: order.id,
        itemId,
        productId,
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
    data: { quantity: number; line_discount?: number },
  ) {
    await this.requireDraftOrder(orderId);
    const line = await this.prisma.itemOrder.findFirst({
      where: { id: lineId, orderId },
    });
    if (!line) {
      throw new NotFoundException('Line not found');
    }

    const discount = new Prisma.Decimal(data.line_discount ?? 0);
    const lineTotal = line.unitPriceSnapshot
      .mul(data.quantity)
      .minus(discount);

    await this.prisma.itemOrder.update({
      where: { id: lineId },
      data: {
        quantity: data.quantity,
        lineDiscount: discount,
        lineTotal,
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

  async finalize(orderId: bigint) {
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

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'finalized',
        paymentStatus: true,
        finalizedAt: new Date(),
        updatedAt: new Date(),
      },
      include: { items: true, payments: true },
    });
  }

  async cancel(orderId: bigint, reason?: string) {
    const order = await this.requireOrder(orderId);
    if (order.status === 'cancelled') {
      return order;
    }
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledReason: reason ?? null,
        updatedAt: new Date(),
      },
      include: { items: true, payments: true },
    });
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
