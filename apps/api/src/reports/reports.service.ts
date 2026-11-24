import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenant/tenant.context';
import { consumablesCost } from '../common/consumables-cost';
import {
  billingRegionOf,
  salonDateRange,
  salonTodayYmd,
} from '../common/date';

type Range = ReturnType<typeof salonDateRange>;

const round = (n: number) => Math.round(n * 100) / 100;

function shiftYmd(ymd: string, days: number) {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Suma por clave y devuelve los primeros `limit`, ordenados por monto. */
function topBy<
  T extends { key: string; name: string; qty: number; amount: number; cost: number },
>(rows: T[], limit: number) {
  const map = new Map<string, { name: string; qty: number; amount: number; cost: number }>();
  for (const r of rows) {
    const cur = map.get(r.key) ?? { name: r.name, qty: 0, amount: 0, cost: 0 };
    cur.qty += r.qty;
    cur.amount += r.amount;
    cur.cost += r.cost;
    map.set(r.key, cur);
  }
  return [...map.values()]
    .map((v) => ({ ...v, amount: round(v.amount), cost: round(v.cost) }))
    .sort((a, b) => b.amount - a.amount || b.qty - a.qty)
    .slice(0, limit);
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private tenantId() {
    return this.tenantContext.getTenant().id;
  }

  private region() {
    return billingRegionOf(this.tenantContext.getTenant());
  }

  async overview(from?: string, to?: string) {
    const region = this.region();
    const range = salonDateRange(from, to, region);
    // Período anterior del mismo largo, justo antes.
    const previous = salonDateRange(
      shiftYmd(range.fromYmd, -range.days),
      shiftYmd(range.fromYmd, -1),
      region,
    );

    const [current, prev, appointments, prevAppointments] = await Promise.all([
      this.sales(range),
      this.sales(previous),
      this.appointments(range),
      this.appointmentCount(previous),
    ]);

    // Ventas por día del salón, con todos los días del rango (aunque estén en cero).
    const daily = new Map<string, { sales: number; tickets: number }>();
    for (let i = 0; i < range.days; i++) {
      daily.set(shiftYmd(range.fromYmd, i), { sales: 0, tickets: 0 });
    }
    for (const o of current.orders) {
      const day = salonTodayYmd(o.finalizedAt!, region);
      const bucket = daily.get(day);
      if (bucket) {
        bucket.sales += Number(o.total);
        bucket.tickets += 1;
      }
    }

    const customers = await this.customerStats(current.orders, range);

    return {
      from: range.fromYmd,
      to: range.toYmd,
      days: range.days,
      previous: { from: previous.fromYmd, to: previous.toYmd },
      kpis: {
        current: current.kpis,
        previous: { ...prev.kpis },
      },
      daily: [...daily.entries()].map(([date, v]) => ({
        date,
        sales: round(v.sales),
        tickets: v.tickets,
      })),
      services: topBy(current.serviceLines, 10),
      products: topBy(current.productLines, 10),
      employees: current.employees,
      payments: current.payments,
      appointments: { ...appointments, previousTotal: prevAppointments },
      customers,
    };
  }

  private async sales(range: Range) {
    const tenantId = this.tenantId();
    const orders = await this.prisma.order.findMany({
      where: {
        tenantId,
        status: 'finalized',
        finalizedAt: { gte: range.from, lte: range.to },
      },
      select: {
        id: true,
        total: true,
        finalizedAt: true,
        customerId: true,
        items: {
          select: {
            itemId: true,
            productId: true,
            employeeId: true,
            quantity: true,
            lineTotal: true,
            productNameSnapshot: true,
            commissionRateSnapshot: true,
            unitCostSnapshot: true,
            item: { select: { name: true, product: { select: { cost: true } } } },
            employee: { select: { name: true } },
          },
        },
        payments: { select: { method: true, amount: true } },
      },
    });

    const serviceLines: Array<{ key: string; name: string; qty: number; amount: number; cost: number }> = [];
    const productLines: typeof serviceLines = [];
    const byEmployee = new Map<
      string,
      { id: number; name: string; sales: number; services: number; commission: number; tickets: Set<bigint> }
    >();
    const byMethod = new Map<string, number>();
    let sales = 0;
    let servicesSales = 0;
    let productsSales = 0;
    let productsCost = 0;

    for (const o of orders) {
      sales += Number(o.total);
      for (const p of o.payments) {
        const m = p.method.toLowerCase();
        byMethod.set(m, (byMethod.get(m) ?? 0) + Number(p.amount));
      }
      for (const l of o.items) {
        const amount = Number(l.lineTotal);
        const name = l.productNameSnapshot ?? l.item?.name ?? 'Sin nombre';
        // Ventas viejas sin costo guardado: costo actual del producto.
        const cost = l.productId
          ? l.quantity * Number(l.unitCostSnapshot ?? l.item?.product?.cost ?? 0)
          : 0;
        const line = { key: String(l.productId ?? l.itemId ?? name), name, qty: l.quantity, amount, cost };
        if (l.productId) {
          productLines.push(line);
          productsSales += amount;
          productsCost += cost;
        } else {
          serviceLines.push(line);
          servicesSales += amount;
        }
        if (l.employeeId) {
          const key = l.employeeId.toString();
          const cur = byEmployee.get(key) ?? {
            id: Number(l.employeeId),
            name: l.employee?.name ?? 'Profesional',
            sales: 0,
            services: 0,
            commission: 0,
            tickets: new Set<bigint>(),
          };
          cur.commission += (amount * Number(l.commissionRateSnapshot ?? 0)) / 100;
          // Productos que vendió: suman comisión, no ventas de servicio.
          if (!l.productId) {
            cur.sales += amount;
            cur.services += l.quantity;
            cur.tickets.add(o.id);
          }
          byEmployee.set(key, cur);
        }
      }
    }

    const suppliesCost = await consumablesCost(this.prisma, tenantId, range.from, range.to);
    // Descuentos dados (a mano, cupones, promociones) en los tickets cobrados del período; las ventas ya van netas.
    const discountsAgg = await this.prisma.orderDiscount.aggregate({
      where: { tenantId, orderId: { in: orders.map((o) => o.id) } },
      _sum: { amount: true },
    });
    const customerIds = new Set(orders.map((o) => o.customerId).filter(Boolean));
    return {
      orders,
      serviceLines,
      productLines,
      kpis: {
        sales: round(sales),
        tickets: orders.length,
        avgTicket: orders.length ? round(sales / orders.length) : 0,
        customers: customerIds.size,
        servicesSales: round(servicesSales),
        productsSales: round(productsSales),
        productsCost: round(productsCost),
        suppliesCost,
        discounts: round(Number(discountsAgg._sum.amount ?? 0)),
      },
      employees: [...byEmployee.values()]
        .map(({ tickets, ...e }) => ({
          ...e,
          sales: round(e.sales),
          commission: round(e.commission),
          tickets: tickets.size,
          avgTicket: tickets.size ? round(e.sales / tickets.size) : 0,
        }))
        .sort((a, b) => b.sales - a.sales),
      payments: [...byMethod.entries()]
        .map(([method, amount]) => ({ method, amount: round(amount) }))
        .sort((a, b) => b.amount - a.amount),
    };
  }

  private async appointments(range: Range) {
    const rows = await this.prisma.appointment.groupBy({
      by: ['statusId'],
      where: {
        tenantId: this.tenantId(),
        startTime: { gte: range.from, lte: range.to },
      },
      _count: { _all: true },
    });
    const statuses = await this.prisma.status.findMany({
      where: { id: { in: rows.map((r) => r.statusId) } },
      select: { id: true, name: true, color: true },
    });
    const byStatus = rows
      .map((r) => {
        const s = statuses.find((x) => x.id === r.statusId);
        return { name: s?.name ?? 'Sin estado', color: s?.color ?? null, count: r._count._all };
      })
      .sort((a, b) => b.count - a.count);
    return { total: byStatus.reduce((n, s) => n + s.count, 0), byStatus };
  }

  private appointmentCount(range: Range) {
    return this.prisma.appointment.count({
      where: {
        tenantId: this.tenantId(),
        startTime: { gte: range.from, lte: range.to },
      },
    });
  }

  /** Nuevas = su primer ticket cobrado cae en el período. Top por monto gastado. */
  private async customerStats(
    orders: Array<{ customerId: bigint | null; total: unknown }>,
    range: Range,
  ) {
    const spent = new Map<string, { visits: number; amount: number }>();
    for (const o of orders) {
      if (!o.customerId) continue;
      const key = o.customerId.toString();
      const cur = spent.get(key) ?? { visits: 0, amount: 0 };
      cur.visits += 1;
      cur.amount += Number(o.total);
      spent.set(key, cur);
    }
    const ids = [...spent.keys()].map((k) => BigInt(k));
    if (ids.length === 0) {
      return { identified: 0, anonymousTickets: orders.length, new: 0, returning: 0, top: [] };
    }
    const [firsts, people] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['customerId'],
        where: { tenantId: this.tenantId(), status: 'finalized', customerId: { in: ids } },
        _min: { finalizedAt: true },
      }),
      this.prisma.customer.findMany({
        where: { id: { in: ids } },
        select: { id: true, user: { select: { name: true } } },
      }),
    ]);
    const isNew = (id: bigint) => {
      const first = firsts.find((f) => f.customerId === id)?._min.finalizedAt;
      return first != null && first >= range.from;
    };
    const newCount = ids.filter(isNew).length;
    return {
      identified: ids.length,
      anonymousTickets: orders.filter((o) => !o.customerId).length,
      new: newCount,
      returning: ids.length - newCount,
      top: [...spent.entries()]
        .map(([id, v]) => ({
          name: people.find((p) => p.id.toString() === id)?.user.name ?? 'Clienta',
          visits: v.visits,
          amount: round(v.amount),
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8),
    };
  }
}
