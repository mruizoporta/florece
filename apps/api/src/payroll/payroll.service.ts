import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenant/tenant.context';
import { salonDayBounds, salonTodayYmd } from '../common/date';

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
        productId: null,
        itemId: { not: null },
        createdAt: {
          gte: day.from,
          lte: day.to,
        },
      },
      include: {
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
      const rate = confirmed
        ? (line.commissionRateSnapshot ?? liveRate)
        : liveRate;
      const lineCommission = line.lineTotal.mul(rate).div(100);
      serviceSales = serviceSales.plus(line.lineTotal);
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
      lineCount: detailLines.length,
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
        productId: null,
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
    let commission = new Prisma.Decimal(0);
    const detailLines = lines.map((line) => {
      const rate = line.commissionRateSnapshot ?? new Prisma.Decimal(0);
      const lineCommission = line.lineTotal.mul(rate).div(100);
      serviceSales = serviceSales.plus(line.lineTotal);
      commission = commission.plus(lineCommission);
      return {
        id: Number(line.id),
        orderId: Number(line.orderId),
        orderName: line.order.name,
        customerName: line.order.customer?.user?.name ?? null,
        finalizedAt: line.order.finalizedAt?.toISOString() ?? null,
        serviceName: line.productNameSnapshot ?? 'Servicio',
        quantity: line.quantity,
        lineTotal: line.lineTotal.toNumber(),
        commissionRate: rate.toNumber(),
        commission: Number(lineCommission.toFixed(2)),
      };
    });

    const baseProrated = this.prorateBase(
      employee.baseSalary.toNumber(),
      range.from,
      range.to,
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
      commission: commissionTotal,
      lineCount: detailLines.length,
      total: Number((baseProrated + commissionTotal).toFixed(2)),
      lines: detailLines,
    };
  }

  async summary(from?: string, to?: string) {
    const range = this.parseRange(from, to);
    const tenantId = this.tenantId();

    const [employees, lines] = await Promise.all([
      this.prisma.employee.findMany({
        where: { tenantId, status: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.itemOrder.findMany({
        where: {
          tenantId,
          employeeId: { not: null },
          productId: null,
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
      current.serviceSales = current.serviceSales.plus(line.lineTotal);
      current.commission = current.commission.plus(
        line.lineTotal.mul(rate).div(100),
      );
      current.lineCount += 1;
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
        range.from,
        range.to,
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

  private parseDay(date?: string) {
    const ymd =
      date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : salonTodayYmd();
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Invalid date');
    }
    const { start, end } = salonDayBounds(ymd);
    return { from: start, to: end, ymd };
  }

  private parseRange(from?: string, to?: string) {
    const now = new Date();
    const start = from
      ? new Date(from)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = to ? new Date(to) : now;

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid from/to date');
    }

    const fromDay = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      0,
      0,
      0,
      0,
    );
    const toDay = new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate(),
      23,
      59,
      59,
      999,
    );

    if (toDay < fromDay) {
      throw new BadRequestException('to must be on or after from');
    }

    const days =
      Math.floor(
        (Date.UTC(toDay.getFullYear(), toDay.getMonth(), toDay.getDate()) -
          Date.UTC(
            fromDay.getFullYear(),
            fromDay.getMonth(),
            fromDay.getDate(),
          )) /
          86_400_000,
      ) + 1;

    return { from: fromDay, to: toDay, days };
  }

  /** Daily share of monthly base across each calendar day in range. */
  private prorateBase(monthlyBase: number, from: Date, to: Date): number {
    if (monthlyBase <= 0) return 0;
    let total = 0;
    const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    while (cursor <= end) {
      const daysInMonth = new Date(
        cursor.getFullYear(),
        cursor.getMonth() + 1,
        0,
      ).getDate();
      total += monthlyBase / daysInMonth;
      cursor.setDate(cursor.getDate() + 1);
    }
    return total;
  }
}
