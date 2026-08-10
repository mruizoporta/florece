import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenant/tenant.context';

const EXPENSE_METHODS = ['cash', 'card', 'transfer', 'other'] as const;

@Injectable()
export class AccountingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private tenantId(): bigint {
    return this.tenantContext.getTenant().id;
  }

  private serializeExpense(e: {
    id: bigint;
    amount: Prisma.Decimal;
    currency: string;
    method: string;
    spentAt: Date;
    note: string | null;
    receiptUrl: string | null;
    categoryId: bigint;
    recordedById: bigint;
    createdAt: Date;
    category?: { id: bigint; name: string; slug: string } | null;
    recordedBy?: { id: bigint; name: string; email: string } | null;
  }) {
    return {
      id: Number(e.id),
      amount: Number(e.amount),
      currency: e.currency,
      method: e.method,
      spentAt: e.spentAt,
      note: e.note,
      receiptUrl: e.receiptUrl,
      categoryId: Number(e.categoryId),
      recordedById: Number(e.recordedById),
      createdAt: e.createdAt,
      category: e.category
        ? {
            id: Number(e.category.id),
            name: e.category.name,
            slug: e.category.slug,
          }
        : null,
      recordedBy: e.recordedBy
        ? {
            id: Number(e.recordedBy.id),
            name: e.recordedBy.name,
            email: e.recordedBy.email,
          }
        : null,
    };
  }

  private serializeSession(s: {
    id: bigint;
    status: string;
    openedAt: Date;
    closedAt: Date | null;
    openedById: bigint;
    closedById: bigint | null;
    openingFloat: Prisma.Decimal;
    expectedCash: Prisma.Decimal | null;
    countedCash: Prisma.Decimal | null;
    difference: Prisma.Decimal | null;
    snapshot: Prisma.JsonValue | null;
    note: string | null;
    openedBy?: { id: bigint; name: string } | null;
    closedBy?: { id: bigint; name: string } | null;
  }) {
    return {
      id: Number(s.id),
      status: s.status,
      openedAt: s.openedAt,
      closedAt: s.closedAt,
      openedById: Number(s.openedById),
      closedById: s.closedById != null ? Number(s.closedById) : null,
      openingFloat: Number(s.openingFloat),
      expectedCash: s.expectedCash != null ? Number(s.expectedCash) : null,
      countedCash: s.countedCash != null ? Number(s.countedCash) : null,
      difference: s.difference != null ? Number(s.difference) : null,
      snapshot: s.snapshot,
      note: s.note,
      openedBy: s.openedBy
        ? { id: Number(s.openedBy.id), name: s.openedBy.name }
        : null,
      closedBy: s.closedBy
        ? { id: Number(s.closedBy.id), name: s.closedBy.name }
        : null,
    };
  }

  listCategories() {
    return this.prisma.expenseCategory
      .findMany({
        where: { tenantId: this.tenantId(), active: true },
        orderBy: { name: 'asc' },
      })
      .then((rows) =>
        rows.map((c) => ({
          id: Number(c.id),
          name: c.name,
          slug: c.slug,
          active: c.active,
        })),
      );
  }

  async createCategory(input: { name: string; slug?: string }) {
    const name = input.name.trim();
    if (!name) throw new BadRequestException('Nombre requerido');
    const slug =
      input.slug?.trim().toLowerCase() ||
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const created = await this.prisma.expenseCategory.create({
      data: {
        tenantId: this.tenantId(),
        name,
        slug,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return {
      id: Number(created.id),
      name: created.name,
      slug: created.slug,
      active: created.active,
    };
  }

  async listExpenses(from?: string, to?: string, limit = 100) {
    const range = this.parseRange(from, to);
    const rows = await this.prisma.expense.findMany({
      where: {
        tenantId: this.tenantId(),
        ...(range
          ? { spentAt: { gte: range.from, lte: range.to } }
          : {}),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        recordedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { spentAt: 'desc' },
      take: Math.min(limit, 200),
    });
    return rows.map((e) => this.serializeExpense(e));
  }

  async createExpense(
    userId: bigint,
    input: {
      categoryId: number;
      amount: number;
      currency?: string;
      method: string;
      spentAt?: string;
      note?: string;
      receiptUrl?: string;
    },
  ) {
    if (!(input.amount > 0)) {
      throw new BadRequestException('El monto debe ser mayor a cero');
    }
    const method = input.method.toLowerCase();
    if (!EXPENSE_METHODS.includes(method as (typeof EXPENSE_METHODS)[number])) {
      throw new BadRequestException('Método de pago inválido');
    }

    const category = await this.prisma.expenseCategory.findFirst({
      where: {
        id: BigInt(input.categoryId),
        tenantId: this.tenantId(),
        active: true,
      },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    const created = await this.prisma.expense.create({
      data: {
        tenantId: this.tenantId(),
        categoryId: category.id,
        amount: input.amount,
        currency: input.currency ?? 'NIO',
        method,
        spentAt: input.spentAt ? new Date(input.spentAt) : new Date(),
        note: input.note?.trim() || null,
        receiptUrl: input.receiptUrl?.trim() || null,
        recordedById: userId,
        updatedAt: new Date(),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        recordedBy: { select: { id: true, name: true, email: true } },
      },
    });
    return this.serializeExpense(created);
  }

  async updateExpense(
    id: bigint,
    input: {
      categoryId?: number;
      amount?: number;
      currency?: string;
      method?: string;
      spentAt?: string;
      note?: string | null;
      receiptUrl?: string | null;
    },
  ) {
    const existing = await this.prisma.expense.findFirst({
      where: { id, tenantId: this.tenantId() },
    });
    if (!existing) throw new NotFoundException('Egreso no encontrado');

    if (input.amount != null && !(input.amount > 0)) {
      throw new BadRequestException('El monto debe ser mayor a cero');
    }
    if (input.method) {
      const method = input.method.toLowerCase();
      if (!EXPENSE_METHODS.includes(method as (typeof EXPENSE_METHODS)[number])) {
        throw new BadRequestException('Método de pago inválido');
      }
    }
    if (input.categoryId != null) {
      const category = await this.prisma.expenseCategory.findFirst({
        where: {
          id: BigInt(input.categoryId),
          tenantId: this.tenantId(),
          active: true,
        },
      });
      if (!category) throw new NotFoundException('Categoría no encontrada');
    }

    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        ...(input.categoryId != null
          ? { categoryId: BigInt(input.categoryId) }
          : {}),
        ...(input.amount != null ? { amount: input.amount } : {}),
        ...(input.currency ? { currency: input.currency } : {}),
        ...(input.method ? { method: input.method.toLowerCase() } : {}),
        ...(input.spentAt ? { spentAt: new Date(input.spentAt) } : {}),
        ...(input.note !== undefined
          ? { note: input.note?.trim() || null }
          : {}),
        ...(input.receiptUrl !== undefined
          ? { receiptUrl: input.receiptUrl?.trim() || null }
          : {}),
        updatedAt: new Date(),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        recordedBy: { select: { id: true, name: true, email: true } },
      },
    });
    return this.serializeExpense(updated);
  }

  async deleteExpense(id: bigint) {
    const existing = await this.prisma.expense.findFirst({
      where: { id, tenantId: this.tenantId() },
    });
    if (!existing) throw new NotFoundException('Egreso no encontrado');
    await this.prisma.expense.delete({ where: { id } });
    return { ok: true };
  }

  async getCurrentCashSession() {
    const session = await this.prisma.cashSession.findFirst({
      where: { tenantId: this.tenantId(), status: 'open' },
      include: {
        openedBy: { select: { id: true, name: true } },
        closedBy: { select: { id: true, name: true } },
      },
      orderBy: { openedAt: 'desc' },
    });
    return session ? this.serializeSession(session) : null;
  }

  async listCashSessions(limit = 30) {
    const rows = await this.prisma.cashSession.findMany({
      where: { tenantId: this.tenantId() },
      include: {
        openedBy: { select: { id: true, name: true } },
        closedBy: { select: { id: true, name: true } },
      },
      orderBy: { openedAt: 'desc' },
      take: Math.min(limit, 100),
    });
    return rows.map((s) => this.serializeSession(s));
  }

  async openCashSession(userId: bigint, openingFloat = 0, note?: string) {
    if (openingFloat < 0) {
      throw new BadRequestException('El fondo inicial no puede ser negativo');
    }
    const open = await this.prisma.cashSession.findFirst({
      where: { tenantId: this.tenantId(), status: 'open' },
    });
    if (open) {
      throw new BadRequestException('Ya hay una caja abierta');
    }

    const created = await this.prisma.cashSession.create({
      data: {
        tenantId: this.tenantId(),
        status: 'open',
        openedAt: new Date(),
        openedById: userId,
        openingFloat,
        note: note?.trim() || null,
        updatedAt: new Date(),
      },
      include: {
        openedBy: { select: { id: true, name: true } },
        closedBy: { select: { id: true, name: true } },
      },
    });
    return this.serializeSession(created);
  }

  async closeCashSession(
    userId: bigint,
    sessionId: bigint,
    countedCash: number,
    note?: string,
  ) {
    if (countedCash < 0) {
      throw new BadRequestException('El efectivo contado no puede ser negativo');
    }

    const session = await this.prisma.cashSession.findFirst({
      where: {
        id: sessionId,
        tenantId: this.tenantId(),
        status: 'open',
      },
    });
    if (!session) throw new NotFoundException('Sesión de caja no encontrada');

    const now = new Date();
    const [cashPayments, cashExpenses, paymentGroups] = await Promise.all([
      this.prisma.orderPayment.aggregate({
        where: {
          tenantId: this.tenantId(),
          method: { equals: 'cash', mode: 'insensitive' },
          order: {
            status: 'finalized',
            finalizedAt: { gte: session.openedAt, lte: now },
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          tenantId: this.tenantId(),
          method: 'cash',
          spentAt: { gte: session.openedAt, lte: now },
        },
        _sum: { amount: true },
      }),
      this.prisma.orderPayment.groupBy({
        by: ['method'],
        where: {
          tenantId: this.tenantId(),
          order: {
            status: 'finalized',
            finalizedAt: { gte: session.openedAt, lte: now },
          },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    const cashIn = Number(cashPayments._sum.amount ?? 0);
    const cashOut = Number(cashExpenses._sum.amount ?? 0);
    const openingFloat = Number(session.openingFloat);
    const expectedCash = openingFloat + cashIn - cashOut;
    const difference = countedCash - expectedCash;

    const byMethod: Record<string, { amount: number; count: number }> = {};
    for (const row of paymentGroups) {
      const key = row.method.toLowerCase();
      byMethod[key] = {
        amount: Number(row._sum.amount ?? 0),
        count: row._count._all,
      };
    }

    const updated = await this.prisma.cashSession.update({
      where: { id: session.id },
      data: {
        status: 'closed',
        closedAt: now,
        closedById: userId,
        expectedCash,
        countedCash,
        difference,
        snapshot: {
          cashIn,
          cashOut,
          openingFloat,
          byMethod,
          closedAt: now.toISOString(),
        } as Prisma.InputJsonValue,
        note: note?.trim() || session.note,
        updatedAt: now,
      },
      include: {
        openedBy: { select: { id: true, name: true } },
        closedBy: { select: { id: true, name: true } },
      },
    });
    return this.serializeSession(updated);
  }

  async profitSummary(from?: string, to?: string) {
    const range = this.parseRange(from, to) ?? this.defaultMonthRange();
    const tenantId = this.tenantId();

    const [orders, expenses, payments] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          tenantId,
          status: 'finalized',
          finalizedAt: { gte: range.from, lte: range.to },
        },
        select: { total: true, id: true },
      }),
      this.prisma.expense.findMany({
        where: {
          tenantId,
          spentAt: { gte: range.from, lte: range.to },
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.orderPayment.findMany({
        where: {
          tenantId,
          order: {
            status: 'finalized',
            finalizedAt: { gte: range.from, lte: range.to },
          },
        },
        select: { method: true, amount: true },
      }),
    ]);

    const income = orders.reduce((s, o) => s + Number(o.total), 0);
    const expenseTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);

    const byMethod: Record<string, number> = {};
    for (const p of payments) {
      const key = p.method.toLowerCase();
      byMethod[key] = (byMethod[key] ?? 0) + Number(p.amount);
    }

    const byCategoryMap = new Map<
      string,
      { categoryId: number; name: string; slug: string; amount: number }
    >();
    for (const e of expenses) {
      const key = String(e.categoryId);
      const prev = byCategoryMap.get(key);
      const amount = Number(e.amount);
      if (prev) {
        prev.amount += amount;
      } else {
        byCategoryMap.set(key, {
          categoryId: Number(e.category.id),
          name: e.category.name,
          slug: e.category.slug,
          amount,
        });
      }
    }

    return {
      from: range.from,
      to: range.to,
      income,
      expenses: expenseTotal,
      profit: income - expenseTotal,
      orderCount: orders.length,
      expenseCount: expenses.length,
      byMethod: Object.entries(byMethod).map(([method, amount]) => ({
        method,
        amount,
      })),
      byCategory: [...byCategoryMap.values()].sort(
        (a, b) => b.amount - a.amount,
      ),
    };
  }

  private parseRange(from?: string, to?: string) {
    if (!from && !to) return null;
    const start = from ? new Date(from) : new Date(0);
    const end = to ? new Date(to) : new Date();
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Rango de fechas inválido');
    }
    return { from: start, to: end };
  }

  private defaultMonthRange() {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: now,
    };
  }
}
