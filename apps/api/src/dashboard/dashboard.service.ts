import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenant/tenant.context';
import { APPOINTMENT_STATUS_NAMES } from '../appointments/appointments.service';
import { salonDayBounds, salonTodayYmd } from '../common/date';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private tenantId(): bigint {
    return this.tenantContext.getTenant().id;
  }

  async getSummary(date?: string) {
    const resolvedDate = date ?? salonTodayYmd();
    const { start: dayStart, end: dayEnd } = salonDayBounds(resolvedDate);
    const tenantId = this.tenantId();

    const [waitingStatus, pendingStatus] = await Promise.all([
      this.prisma.status.findFirst({
        where: { tenantId, name: APPOINTMENT_STATUS_NAMES.WAITING },
      }),
      this.prisma.status.findFirst({
        where: { tenantId, name: APPOINTMENT_STATUS_NAMES.PENDING },
      }),
    ]);

    const [
      appointmentsToday,
      waiting,
      pending,
      ordersToday,
      topServices,
      topProducts,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: { tenantId, startTime: { gte: dayStart, lte: dayEnd } },
      }),
      waitingStatus
        ? this.prisma.appointment.count({
            where: {
              tenantId,
              statusId: waitingStatus.id,
              startTime: { gte: dayStart, lte: dayEnd },
            },
          })
        : 0,
      pendingStatus
        ? this.prisma.appointment.count({
            where: {
              tenantId,
              statusId: pendingStatus.id,
              startTime: { gte: dayStart, lte: dayEnd },
            },
          })
        : 0,
      this.prisma.order.findMany({
        where: {
          tenantId,
          status: 'finalized',
          finalizedAt: { gte: dayStart, lte: dayEnd },
        },
      }),
      this.getTopServices(dayStart, dayEnd),
      this.getTopProducts(dayStart, dayEnd),
    ]);

    const incomeToday = ordersToday.reduce(
      (sum, order) => sum.plus(order.total),
      new Prisma.Decimal(0),
    );

    return {
      date: resolvedDate,
      appointmentsToday,
      todayCount: appointmentsToday,
      waiting,
      pending,
      incomeToday: incomeToday.toNumber(),
      topServices,
      topProducts,
    };
  }

  private async getTopServices(dayStart: Date, dayEnd: Date) {
    const tenantId = this.tenantId();
    const rows = await this.prisma.appointmentService.findMany({
      where: {
        appointment: {
          tenantId,
          startTime: { gte: dayStart, lte: dayEnd },
        },
      },
      include: { service: { include: { item: true } } },
    });

    const counts = new Map<string, { quantity: number; revenue: number }>();
    for (const row of rows) {
      const name = row.service.item.name;
      const price = Number(row.service.item.price ?? 0);
      const current = counts.get(name) ?? { quantity: 0, revenue: 0 };
      current.quantity += 1;
      current.revenue += price;
      counts.set(name, current);
    }

    return [...counts.entries()]
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }

  private async getTopProducts(dayStart: Date, dayEnd: Date) {
    const tenantId = this.tenantId();
    const lines = await this.prisma.itemOrder.findMany({
      where: {
        tenantId,
        order: {
          status: 'finalized',
          finalizedAt: { gte: dayStart, lte: dayEnd },
        },
      },
    });

    const counts = new Map<string, { quantity: number; revenue: number }>();
    for (const line of lines) {
      const name = line.productNameSnapshot ?? 'Unknown';
      const current = counts.get(name) ?? { quantity: 0, revenue: 0 };
      current.quantity += line.quantity;
      current.revenue += line.lineTotal.toNumber();
      counts.set(name, current);
    }

    return [...counts.entries()]
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }
}
