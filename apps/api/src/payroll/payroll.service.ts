import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { lineCommissionRate } from '../common/commission';
import { TenantContext } from '../tenant/tenant.context';
import {
  billingRegionOf,
  salonDateRange,
  salonDayBounds,
  salonTodayYmd,
} from '../common/date';

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private tenantId(): bigint {
    return this.tenantContext.getTenant().id;
  }

  /**
   * Running day for a stylist: services logged today (draft + finalized)
   * with estimated vs confirmed commission.
   */
  async myDay(employeeId: bigint, date?: string) {
    const tenantId = this.tenantId();
    const day = this.parseDay(date);

    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const liveRate = employee.commissionRate;
    const lines = await this.prisma.itemOrder.findMany({
      where: {
        tenantId,
        employeeId,
        itemId: { not: null },
        order: { status: { not: 'cancelled' } },
        createdAt: {
          gte: day.from,
          lte: day.to,
        },
      },
      include: {
        item: { select: { service: { select: { commissionRate: true } } } },
        order: {
          select: {
            id: true,
            name: true,
            status: true,
            finalizedAt: true,
            customer: {
              select: {
                user: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    let serviceSales = new Prisma.Decimal(0);
    let pendingSales = new Prisma.Decimal(0);
    let confirmedSales = new Prisma.Decimal(0);
    let pendingCommission = new Prisma.Decimal(0);
    let confirmedCommission = new Prisma.Decimal(0);

    const detailLines = lines.map((line) => {
      const confirmed = line.order.status === 'finalized';
      const live = lineCommissionRate(line, employee, line.item?.service?.commissionRate);
      const rate = confirmed ? (line.commissionRateSnapshot ?? live) : live;
      const lineCommission = line.lineTotal.mul(rate).div(100);
      if (line.productId == null) serviceSales = serviceSales.plus(line.lineTotal);
      if (confirmed) {
        confirmedSales = confirmedSales.plus(line.lineTotal);
        confirmedCommission = confirmedCommission.plus(lineCommission);
      } else {
        pendingSales = pendingSales.plus(line.lineTotal);
        pendingCommission = pendingCommission.plus(lineCommission);
      }
      return {
        id: Number(line.id),
        orderId: Number(line.orderId),
        orderName: line.order.name,
        customerName: line.order.customer?.user?.name ?? null,
        orderStatus: line.order.status,
        confirmed,
        createdAt: line.createdAt?.toISOString() ?? null,
        finalizedAt: line.order.finalizedAt?.toISOString() ?? null,
        serviceName: line.productNameSnapshot ?? 'Servicio',
        isProduct: line.productId != null,
        quantity: line.quantity,
        lineTotal: line.lineTotal.toNumber(),
        commissionRate: rate.toNumber(),
        commission: Number(lineCommission.toFixed(2)),
      };
    });

    const pending = Number(pendingCommission.toFixed(2));
    const confirmed = Number(confirmedCommission.toFixed(2));

    return {
      date: day.ymd,
      from: day.from.toISOString(),
      to: day.to.toISOString(),
      employee: {
        id: Number(employee.id),
        name: employee.name,
        commissionRate: liveRate.toNumber(),
      },
      lineCount: detailLines.filter((l) => !l.isProduct).length,
      serviceSales: Number(serviceSales.toFixed(2)),
      pendingSales: Number(pendingSales.toFixed(2)),
      confirmedSales: Number(confirmedSales.toFixed(2)),
      pendingCommission: pending,
      confirmedCommission: confirmed,
      commission: Number((pending + confirmed).toFixed(2)),
      lines: detailLines,
    };
  }

  async employeeDetail(employeeId: bigint, from?: string, to?: string) {
    const range = this.parseRange(from, to);
    const tenantId = this.tenantId();

    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const lines = await this.prisma.itemOrder.findMany({
      where: {
        tenantId,
        employeeId,
        itemId: { not: null },
        order: {
          status: 'finalized',
          finalizedAt: {
            gte: range.from,
            lte: range.to,
          },
        },
      },
      include: {
        order: {
          select: {
            id: true,
            name: true,
            finalizedAt: true,
            customer: {
              select: {
                user: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: [{ order: { finalizedAt: 'desc' } }, { id: 'desc' }],
    });

    let serviceSales = new Prisma.Decimal(0);
    let productSales = new Prisma.Decimal(0);
    let commission = new Prisma.Decimal(0);
    const detailLines = lines.map((line) => {
      const rate = line.commissionRateSnapshot ?? new Prisma.Decimal(0);
      const lineCommission = line.lineTotal.mul(rate).div(100);
      if (line.productId == null) serviceSales = serviceSales.plus(line.lineTotal);
      else productSales = productSales.plus(line.lineTotal);
      commission = commission.plus(lineCommission);
      return {
        id: Number(line.id),
        orderId: Number(line.orderId),
        orderName: line.order.name,
        customerName: line.order.customer?.user?.name ?? null,
        finalizedAt: line.order.finalizedAt?.toISOString() ?? null,
        serviceName: line.productNameSnapshot ?? 'Servicio',
        isProduct: line.productId != null,
        quantity: line.quantity,
        lineTotal: line.lineTotal.toNumber(),
        commissionRate: rate.toNumber(),
        commission: Number(lineCommission.toFixed(2)),
      };
    });

    const baseProrated = this.prorateBase(
      employee.baseSalary.toNumber(),
      range.fromYmd,
      range.toYmd,
    );
    const commissionTotal = Number(commission.toFixed(2));

    return {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      days: range.days,
      employee: {
        id: Number(employee.id),
        name: employee.name,
        image: employee.image,
        status: employee.status,
        baseSalaryMonthly: employee.baseSalary.toNumber(),
        commissionRate: employee.commissionRate.toNumber(),
      },
      baseProrated: Number(baseProrated.toFixed(2)),
      serviceSales: Number(serviceSales.toFixed(2)),
      productSales: Number(productSales.toFixed(2)),
      commission: commissionTotal,
      lineCount: detailLines.filter((l) => !l.isProduct).length,
      total: Number((baseProrated + commissionTotal).toFixed(2)),
      lines: detailLines,
    };
  }

  async summary(from?: string, to?: string) {
    const range = this.parseRange(from, to);
    const tenantId = this.tenantId();

    const [employees, lines, payments] = await Promise.all([
      this.prisma.employee.findMany({
        where: { tenantId, status: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.itemOrder.findMany({
        where: {
          tenantId,
          employeeId: { not: null },
          itemId: { not: null },
          order: {
            status: 'finalized',
            finalizedAt: {
              gte: range.from,
              lte: range.to,
            },
          },
        },
        include: {
          order: { select: { id: true, finalizedAt: true } },
        },
      }),
      this.prisma.payrollPayment.findMany({
        where: {
          tenantId,
          cancelledAt: null,
          OR: [
            {
              kind: 'payment',
              periodFrom: { lte: range.toYmd },
              periodTo: { gte: range.fromYmd },
            },
            { kind: 'advance', appliedToId: null },
          ],
        },
        select: { employeeId: true, kind: true, amount: true },
      }),
    ]);

    const byEmployee = new Map<
      string,
      {
        serviceSales: Prisma.Decimal;
        commission: Prisma.Decimal;
        lineCount: number;
      }
    >();

    for (const line of lines) {
      if (!line.employeeId) continue;
      const key = line.employeeId.toString();
      const current = byEmployee.get(key) ?? {
        serviceSales: new Prisma.Decimal(0),
        commission: new Prisma.Decimal(0),
        lineCount: 0,
      };
      const rate = line.commissionRateSnapshot ?? new Prisma.Decimal(0);
      current.commission = current.commission.plus(
        line.lineTotal.mul(rate).div(100),
      );
      // Productos vendidos suman comisión, no ventas de servicio.
      if (line.productId == null) {
        current.serviceSales = current.serviceSales.plus(line.lineTotal);
        current.lineCount += 1;
      }
      byEmployee.set(key, current);
    }

    const rows = employees.map((employee) => {
      const stats = byEmployee.get(employee.id.toString()) ?? {
        serviceSales: new Prisma.Decimal(0),
        commission: new Prisma.Decimal(0),
        lineCount: 0,
      };
      const baseProrated = this.prorateBase(
        employee.baseSalary.toNumber(),
        range.fromYmd,
        range.toYmd,
      );
      const commission = Number(stats.commission.toFixed(2));
      const serviceSales = Number(stats.serviceSales.toFixed(2));
      return {
        employeeId: Number(employee.id),
        name: employee.name,
        baseSalaryMonthly: employee.baseSalary.toNumber(),
        commissionRate: employee.commissionRate.toNumber(),
        baseProrated: Number(baseProrated.toFixed(2)),
        serviceSales,
        commission,
        lineCount: stats.lineCount,
        total: Number((baseProrated + commission).toFixed(2)),
        paid: payments.some(
          (p) => p.kind === 'payment' && p.employeeId === employee.id,
        ),
        pendingAdvances: Number(
          payments
            .filter((p) => p.kind === 'advance' && p.employeeId === employee.id)
            .reduce((sum, p) => sum + p.amount.toNumber(), 0)
            .toFixed(2),
        ),
      };
    });

    return {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      days: range.days,
      employees: rows,
      totals: {
        baseProrated: Number(
          rows.reduce((s, r) => s + r.baseProrated, 0).toFixed(2),
        ),
        serviceSales: Number(
          rows.reduce((s, r) => s + r.serviceSales, 0).toFixed(2),
        ),
        commission: Number(
          rows.reduce((s, r) => s + r.commission, 0).toFixed(2),
        ),
        total: Number(rows.reduce((s, r) => s + r.total, 0).toFixed(2)),
      },
    };
  }

  /** Historial de pagos y adelantos, y cuánto adelanto falta descontar. */
  async listPayments(employeeId: bigint) {
    await this.requireEmployee(employeeId);
    const rows = await this.prisma.payrollPayment.findMany({
      where: { tenantId: this.tenantId(), employeeId },
      orderBy: { paidAt: 'desc' },
      take: 60,
    });
    const pendingAdvances = rows
      .filter((r) => r.kind === 'advance' && !r.cancelledAt && !r.appliedToId)
      .reduce((sum, r) => sum + r.amount.toNumber(), 0);
    return {
      pendingAdvances: Number(pendingAdvances.toFixed(2)),
      payments: rows.map((r) => this.serializePayment(r)),
    };
  }

  async createAdvance(
    userId: bigint,
    employeeId: bigint,
    input: { amount: number; method: string; note?: string },
  ) {
    const employee = await this.requireEmployee(employeeId);
    const amount = this.money(input.amount);
    if (amount <= 0) throw new BadRequestException('El monto debe ser mayor a cero');
    const method = this.payMethod(input.method);
    const note = input.note?.trim() || null;

    const created = await this.prisma.$transaction(async (tx) => {
      const expenseId = await this.recordExpense(
        tx,
        userId,
        amount,
        method,
        `Adelanto · ${employee.name}${note ? ` · ${note}` : ''}`,
      );
      return tx.payrollPayment.create({
        data: {
          tenantId: this.tenantId(),
          employeeId,
          kind: 'advance',
          amount,
          method,
          note,
          recordedById: userId,
          expenseId,
        },
      });
    });
    return this.serializePayment(created);
  }

  /**
   * Liquida un período: base prorrateada + comisión + bono − deducción − adelantos pendientes.
   * No deja pagar dos veces días que ya están en otro pago.
   */
  async createPayment(
    userId: bigint,
    employeeId: bigint,
    input: {
      from: string;
      to: string;
      bonus?: number;
      deduction?: number;
      method: string;
      note?: string;
    },
  ) {
    const range = this.parseRange(input.from, input.to);
    const tenantId = this.tenantId();
    const method = this.payMethod(input.method);
    const bonus = this.money(input.bonus ?? 0);
    const deduction = this.money(input.deduction ?? 0);
    if (bonus < 0 || deduction < 0) {
      throw new BadRequestException('Bono y deducción no pueden ser negativos');
    }

    const overlap = await this.prisma.payrollPayment.findFirst({
      where: {
        tenantId,
        employeeId,
        kind: 'payment',
        cancelledAt: null,
        periodFrom: { lte: range.toYmd },
        periodTo: { gte: range.fromYmd },
      },
    });
    if (overlap) {
      throw new BadRequestException(
        `Ya hay un pago del ${overlap.periodFrom} al ${overlap.periodTo}. Anulalo o elegí otro período.`,
      );
    }

    const detail = await this.employeeDetail(employeeId, range.fromYmd, range.toYmd);
    const advances = await this.prisma.payrollPayment.findMany({
      where: {
        tenantId,
        employeeId,
        kind: 'advance',
        cancelledAt: null,
        appliedToId: null,
      },
    });
    const advancesTotal = this.money(
      advances.reduce((sum, a) => sum + a.amount.toNumber(), 0),
    );
    const amount = this.money(
      detail.baseProrated + detail.commission + bonus - deduction - advancesTotal,
    );
    if (amount < 0) {
      throw new BadRequestException(
        'Los adelantos y deducciones superan lo que se le debe en este período',
      );
    }
    const note = input.note?.trim() || null;

    const created = await this.prisma.$transaction(async (tx) => {
      const expenseId =
        amount > 0
          ? await this.recordExpense(
              tx,
              userId,
              amount,
              method,
              `Pago ${range.fromYmd} al ${range.toYmd} · ${detail.employee.name}`,
            )
          : null;
      const payment = await tx.payrollPayment.create({
        data: {
          tenantId,
          employeeId,
          kind: 'payment',
          periodFrom: range.fromYmd,
          periodTo: range.toYmd,
          base: detail.baseProrated,
          commission: detail.commission,
          bonus,
          deduction,
          advances: advancesTotal,
          amount,
          method,
          note,
          recordedById: userId,
          expenseId,
        },
      });
      if (advances.length > 0) {
        await tx.payrollPayment.updateMany({
          where: { id: { in: advances.map((a) => a.id) } },
          data: { appliedToId: payment.id },
        });
      }
      return payment;
    });
    return this.serializePayment(created);
  }

  /** Anula un pago o adelanto y borra su gasto; los adelantos de un pago anulado vuelven a quedar pendientes. */
  async cancelPayment(paymentId: bigint) {
    const tenantId = this.tenantId();
    const payment = await this.prisma.payrollPayment.findFirst({
      where: { id: paymentId, tenantId },
    });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (payment.cancelledAt) throw new BadRequestException('Ya está anulado');
    if (payment.kind === 'advance' && payment.appliedToId) {
      throw new BadRequestException(
        'Este adelanto ya se descontó en un pago: anulá primero ese pago',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (payment.expenseId) {
        await tx.expense.deleteMany({
          where: { id: payment.expenseId, tenantId },
        });
      }
      if (payment.kind === 'payment') {
        await tx.payrollPayment.updateMany({
          where: { tenantId, appliedToId: payment.id },
          data: { appliedToId: null },
        });
      }
      return tx.payrollPayment.update({
        where: { id: payment.id },
        data: { cancelledAt: new Date(), expenseId: null },
      });
    });
    return this.serializePayment(updated);
  }

  /** Datos para el recibo imprimible. */
  async getPayment(paymentId: bigint) {
    const tenant = this.tenantContext.getTenant();
    const payment = await this.prisma.payrollPayment.findFirst({
      where: { id: paymentId, tenantId: tenant.id },
      include: { employee: { select: { name: true } } },
    });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    const setting = await this.prisma.setting.findFirst({
      where: { tenantId: tenant.id },
      select: { companyName: true },
    });
    return {
      ...this.serializePayment(payment),
      employeeName: payment.employee.name,
      salonName: setting?.companyName || tenant.name,
    };
  }

  private async recordExpense(
    tx: Prisma.TransactionClient,
    userId: bigint,
    amount: number,
    method: string,
    note: string,
  ) {
    const tenantId = this.tenantId();
    const category = await tx.expenseCategory.upsert({
      where: { tenantId_slug: { tenantId, slug: 'sueldos' } },
      update: { active: true },
      create: { tenantId, name: 'Sueldos', slug: 'sueldos', createdAt: new Date() },
    });
    const expense = await tx.expense.create({
      data: {
        tenantId,
        categoryId: category.id,
        amount,
        method,
        spentAt: new Date(),
        note,
        recordedById: userId,
        updatedAt: new Date(),
      },
    });
    return expense.id;
  }

  private async requireEmployee(employeeId: bigint) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId: this.tenantId() },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  private payMethod(method: string) {
    const m = (method ?? '').toLowerCase();
    if (!['cash', 'transfer', 'card', 'other'].includes(m)) {
      throw new BadRequestException('Método de pago inválido');
    }
    return m;
  }

  private money(value: number) {
    const n = Number(value);
    if (!Number.isFinite(n)) throw new BadRequestException('Monto inválido');
    return Math.round(n * 100) / 100;
  }

  private serializePayment(r: {
    id: bigint;
    employeeId: bigint;
    kind: string;
    periodFrom: string | null;
    periodTo: string | null;
    base: Prisma.Decimal;
    commission: Prisma.Decimal;
    bonus: Prisma.Decimal;
    deduction: Prisma.Decimal;
    advances: Prisma.Decimal;
    amount: Prisma.Decimal;
    method: string;
    note: string | null;
    paidAt: Date;
    appliedToId: bigint | null;
    cancelledAt: Date | null;
  }) {
    return {
      id: Number(r.id),
      employeeId: Number(r.employeeId),
      kind: r.kind as 'payment' | 'advance',
      periodFrom: r.periodFrom,
      periodTo: r.periodTo,
      base: r.base.toNumber(),
      commission: r.commission.toNumber(),
      bonus: r.bonus.toNumber(),
      deduction: r.deduction.toNumber(),
      advances: r.advances.toNumber(),
      amount: r.amount.toNumber(),
      method: r.method,
      note: r.note,
      paidAt: r.paidAt.toISOString(),
      applied: r.appliedToId != null,
      cancelled: r.cancelledAt != null,
    };
  }

  private parseDay(date?: string) {
    const region = billingRegionOf(this.tenantContext.getTenant());
    const ymd =
      date && /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? date
        : salonTodayYmd(new Date(), region);
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Invalid date');
    }
    const { start, end } = salonDayBounds(ymd, region);
    return { from: start, to: end, ymd };
  }

  private parseRange(from?: string, to?: string) {
    return salonDateRange(
      from,
      to,
      billingRegionOf(this.tenantContext.getTenant()),
    );
  }

  /** Daily share of monthly base across each calendar day in range (salon days, YYYY-MM-DD). */
  private prorateBase(monthlyBase: number, fromYmd: string, toYmd: string): number {
    if (monthlyBase <= 0) return 0;
    let total = 0;
    const cursor = new Date(`${fromYmd}T00:00:00Z`);
    const end = new Date(`${toYmd}T00:00:00Z`);
    while (cursor <= end) {
      const daysInMonth = new Date(
        Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0),
      ).getUTCDate();
      total += monthlyBase / daysInMonth;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return total;
  }
}
