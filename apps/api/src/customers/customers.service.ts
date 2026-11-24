import { PRIVATE_FILE } from '../storage/storage.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WaitlistService } from '../waitlist/waitlist.service';
import { TenantContext } from '../tenant/tenant.context';
import { APPOINTMENT_STATUS_NAMES } from '../appointments/appointments.service';

const CANCELLATION_HOURS = 6;

export type RecordInput = {
  service_name?: string | null;
  formula?: string | null;
  notes?: string | null;
  before_photo?: string | null;
  after_photo?: string | null;
  employee_id?: number | null;
  recorded_at?: string | null;
};

function isGuestEmail(email?: string | null) {
  return Boolean(email?.endsWith('@guest.florece.app'));
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
    private readonly waitlist: WaitlistService,
  ) {}

  private tenantId(): bigint {
    return this.tenantContext.getTenant().id;
  }

  private mapCustomer(customer: {
    id: bigint;
    user?: { name?: string | null; email?: string | null } | null;
    appointments?: Array<{ phone?: string | null; name?: string | null }>;
    _count?: { appointments: number };
  }) {
    const phone =
      customer.appointments?.find((a) => a.phone)?.phone?.trim() || null;
    const email = customer.user?.email ?? null;
    return {
      id: customer.id,
      name: customer.user?.name?.trim() || 'Cliente',
      email: email && !isGuestEmail(email) ? email : null,
      phone,
      appointmentsCount: customer._count?.appointments ?? 0,
    };
  }

  async listCustomers(search?: string, limit = 50) {
    const q = search?.trim();
    const rows = await this.prisma.customer.findMany({
      where: {
        tenantId: this.tenantId(),
        ...(q
          ? {
              OR: [
                {
                  user: {
                    OR: [
                      { name: { contains: q, mode: 'insensitive' } },
                      { email: { contains: q, mode: 'insensitive' } },
                    ],
                  },
                },
                {
                  appointments: {
                    some: {
                      OR: [
                        { phone: { contains: q, mode: 'insensitive' } },
                        { name: { contains: q, mode: 'insensitive' } },
                      ],
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        user: true,
        appointments: {
          orderBy: { startTime: 'desc' },
          take: 5,
          select: { phone: true, name: true },
        },
        _count: { select: { appointments: true } },
      },
      take: limit,
      orderBy: { id: 'desc' },
    });

    return rows.map((row) => this.mapCustomer(row));
  }

  /**
   * Clientas que vinieron alguna vez pero no en los últimos `days` días y no tienen cita futura.
   * Visita = ticket cobrado o cita pasada no cancelada.
   */
  async inactiveCustomers(days = 60) {
    const tenantId = this.tenantId();
    const now = new Date();
    const cutoff = new Date(now.getTime() - Math.max(days, 1) * 86_400_000);
    const notCancelled = {
      status: {
        name: {
          notIn: [APPOINTMENT_STATUS_NAMES.CANCELLED, APPOINTMENT_STATUS_NAMES.NO_SHOW],
        },
      },
    };

    const [orderStats, apptStats, upcoming] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['customerId'],
        where: { tenantId, status: 'finalized', customerId: { not: null } },
        _max: { finalizedAt: true },
        _count: { _all: true },
        _sum: { total: true },
      }),
      this.prisma.appointment.groupBy({
        by: ['customerId'],
        where: { tenantId, startTime: { lte: now }, ...notCancelled },
        _max: { startTime: true },
        _count: { _all: true },
      }),
      this.prisma.appointment.findMany({
        where: { tenantId, startTime: { gt: now }, ...notCancelled },
        select: { customerId: true },
        distinct: ['customerId'],
      }),
    ]);

    const booked = new Set(upcoming.map((a) => a.customerId.toString()));
    const stats = new Map<string, { last: Date; visits: number; spent: number }>();
    const bump = (id: bigint, last: Date | null, visits: number, spent = 0) => {
      if (!last) return;
      const key = id.toString();
      const cur = stats.get(key) ?? { last, visits: 0, spent: 0 };
      if (last > cur.last) cur.last = last;
      // Una cita concluida suele tener su ticket: tomamos la mayor de las dos cuentas.
      cur.visits = Math.max(cur.visits, visits);
      cur.spent += spent;
      stats.set(key, cur);
    };
    for (const o of orderStats) {
      bump(o.customerId!, o._max.finalizedAt, o._count._all, Number(o._sum.total ?? 0));
    }
    for (const a of apptStats) bump(a.customerId, a._max.startTime, a._count._all);

    const inactive = [...stats.entries()].filter(
      ([id, st]) => st.last < cutoff && !booked.has(id),
    );
    if (inactive.length === 0) return { days, customers: [] };
    const ids = inactive.map(([id]) => BigInt(id));

    const [people, phones, lastOrders] = await Promise.all([
      this.prisma.customer.findMany({
        where: { id: { in: ids }, tenantId },
        select: { id: true, lastContactedAt: true, user: { select: { name: true, email: true } } },
      }),
      this.prisma.appointment.findMany({
        where: { tenantId, customerId: { in: ids }, phone: { not: null } },
        orderBy: { startTime: 'desc' },
        distinct: ['customerId'],
        select: { customerId: true, phone: true },
      }),
      this.prisma.order.findMany({
        where: { tenantId, status: 'finalized', customerId: { in: ids } },
        orderBy: { finalizedAt: 'desc' },
        distinct: ['customerId'],
        select: {
          customerId: true,
          items: {
            where: { productId: null },
            take: 1,
            select: { productNameSnapshot: true, item: { select: { name: true } } },
          },
        },
      }),
    ]);

    const customers = inactive
      .map(([id, st]) => {
        const person = people.find((p) => p.id.toString() === id);
        if (!person) return null;
        const line = lastOrders.find((o) => o.customerId?.toString() === id)?.items[0];
        const email = person.user.email;
        return {
          id: Number(id),
          name: person.user.name?.trim() || 'Clienta',
          phone: phones.find((p) => p.customerId.toString() === id)?.phone?.trim() || null,
          email: email && !isGuestEmail(email) ? email : null,
          lastVisit: st.last.toISOString(),
          daysAway: Math.floor((now.getTime() - st.last.getTime()) / 86_400_000),
          visits: st.visits,
          spent: Math.round(st.spent * 100) / 100,
          lastService: line?.productNameSnapshot ?? line?.item?.name ?? null,
          lastContactedAt: person.lastContactedAt?.toISOString() ?? null,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c != null)
      // Las que más gastaron primero: son las que más vale la pena recuperar.
      .sort((a, b) => b.spent - a.spent || b.visits - a.visits);

    return { days, customers };
  }

  async markContacted(customerId: bigint) {
    const updated = await this.prisma.customer.updateMany({
      where: { id: customerId, tenantId: this.tenantId() },
      data: { lastContactedAt: new Date() },
    });
    if (updated.count === 0) throw new NotFoundException('Clienta no encontrada');
    return { ok: true, lastContactedAt: new Date().toISOString() };
  }

  async getCustomer(customerId: bigint) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId: this.tenantId() },
      include: {
        user: true,
        appointments: {
          include: {
            status: true,
            employee: true,
            services: { include: { service: { include: { item: true } } } },
          },
          orderBy: { startTime: 'desc' },
        },
        _count: { select: { appointments: true } },
      },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const mapped = this.mapCustomer({
      id: customer.id,
      user: customer.user,
      appointments: customer.appointments,
      _count: customer._count,
    });

    return {
      ...mapped,
      allergies: customer.allergies,
      user: customer.user,
      appointments: customer.appointments,
    };
  }

  // ---- Ficha técnica ----

  private async requireTenantCustomer(customerId: bigint) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId: this.tenantId() },
      select: { id: true },
    });
    if (!customer) throw new NotFoundException('Customer not found');
  }

  async setAllergies(customerId: bigint, allergies?: string | null) {
    await this.requireTenantCustomer(customerId);
    const value = allergies?.trim().slice(0, 2000) || null;
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { allergies: value, updatedAt: new Date() },
    });
    return { allergies: value };
  }

  async listRecords(customerId: bigint) {
    await this.requireTenantCustomer(customerId);
    const rows = await this.prisma.customerRecord.findMany({
      where: { tenantId: this.tenantId(), customerId },
      include: { employee: { select: { name: true } } },
      orderBy: [{ recordedAt: 'desc' }, { id: 'desc' }],
    });
    return rows.map((r) => this.mapRecord(r));
  }

  async saveRecord(
    customerId: bigint,
    data: RecordInput,
    userId: bigint | null,
    recordId?: bigint,
  ) {
    await this.requireTenantCustomer(customerId);
    const tenantId = this.tenantId();
    const clean = this.cleanRecord(data);
    if (!clean.serviceName && !clean.formula && !clean.notes && !clean.beforePhoto && !clean.afterPhoto) {
      throw new BadRequestException('Escribí algo o agregá una foto');
    }
    let employeeId: bigint | null = null;
    if (data.employee_id) {
      const emp = await this.prisma.employee.findFirst({
        where: { id: BigInt(data.employee_id), tenantId },
        select: { id: true },
      });
      if (!emp) throw new BadRequestException('Profesional inválida');
      employeeId = emp.id;
    }
    const now = new Date();
    const fields = { ...clean, employeeId, updatedAt: now };
    if (recordId) {
      const existing = await this.prisma.customerRecord.findFirst({
        where: { id: recordId, tenantId, customerId },
      });
      if (!existing) throw new NotFoundException('Ficha no encontrada');
      const row = await this.prisma.customerRecord.update({
        where: { id: recordId },
        data: fields,
        include: { employee: { select: { name: true } } },
      });
      return this.mapRecord(row);
    }
    const row = await this.prisma.customerRecord.create({
      data: { ...fields, tenantId, customerId, createdById: userId, createdAt: now },
      include: { employee: { select: { name: true } } },
    });
    return this.mapRecord(row);
  }

  async deleteRecord(customerId: bigint, recordId: bigint) {
    const { count } = await this.prisma.customerRecord.deleteMany({
      where: { id: recordId, customerId, tenantId: this.tenantId() },
    });
    if (!count) throw new NotFoundException('Ficha no encontrada');
    return { ok: true };
  }

  private cleanRecord(data: RecordInput) {
    const text = (v: unknown, max: number) =>
      typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
    const recordedAt = data.recorded_at ? new Date(data.recorded_at) : new Date();
    if (Number.isNaN(recordedAt.getTime())) {
      throw new BadRequestException('Fecha inválida');
    }
    return {
      serviceName: text(data.service_name, 120),
      formula: text(data.formula, 4000),
      notes: text(data.notes, 4000),
      beforePhoto: this.photoPath(data.before_photo),
      afterPhoto: this.photoPath(data.after_photo),
      recordedAt,
    };
  }

  /** Solo fotos privadas subidas por este salón (ver StorageService). */
  private photoPath(value: unknown) {
    if (value == null || value === '') return null;
    const slug = this.tenantContext.getTenant().slug;
    const path = String(value);
    if (!path.startsWith(`/private/${slug}/customers/`) || !PRIVATE_FILE.test(path.split('/').pop() ?? '')) {
      throw new BadRequestException('Foto inválida');
    }
    return path;
  }

  private mapRecord(r: {
    id: bigint;
    employeeId: bigint | null;
    employee?: { name: string } | null;
    serviceName: string | null;
    formula: string | null;
    notes: string | null;
    beforePhoto: string | null;
    afterPhoto: string | null;
    recordedAt: Date;
  }) {
    return {
      id: Number(r.id),
      employeeId: r.employeeId ? Number(r.employeeId) : null,
      employeeName: r.employee?.name ?? null,
      serviceName: r.serviceName,
      formula: r.formula,
      notes: r.notes,
      beforePhoto: r.beforePhoto,
      afterPhoto: r.afterPhoto,
      recordedAt: r.recordedAt.toISOString(),
    };
  }

  async getMyAppointments(userId: bigint) {
    const customer = await this.requireCustomerByUserId(userId);
    return this.prisma.appointment.findMany({
      where: { customerId: customer.id, tenantId: this.tenantId() },
      include: {
        status: true,
        employee: true,
        type: true,
        services: { include: { service: { include: { item: true } } } },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async cancelMyAppointment(userId: bigint, appointmentId: bigint) {
    const customer = await this.requireCustomerByUserId(userId);
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        customerId: customer.id,
        tenantId: this.tenantId(),
      },
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (!this.canCancel(appointment.startTime)) {
      throw new ForbiddenException(
        `Solo puedes cancelar con al menos ${CANCELLATION_HOURS} horas de anticipación.`,
      );
    }

    const cancelled = await this.prisma.status.findFirst({
      where: {
        tenantId: this.tenantId(),
        name: APPOINTMENT_STATUS_NAMES.CANCELLED,
      },
    });
    if (!cancelled) {
      throw new BadRequestException('Cancel status not configured');
    }

    if (appointment.statusId !== cancelled.id) void this.waitlist.slotFreed(appointment);
    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { statusId: cancelled.id, updatedAt: new Date() },
      include: {
        status: true,
        employee: true,
        services: { include: { service: { include: { item: true } } } },
      },
    });
  }

  private canCancel(startTime: Date | null, now = new Date()): boolean {
    if (!startTime) {
      return false;
    }
    const diffMs = startTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours >= CANCELLATION_HOURS;
  }

  private async requireCustomerByUserId(userId: bigint) {
    const customer = await this.prisma.customer.findFirst({
      where: { userId, tenantId: this.tenantId() },
    });
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }
    return customer;
  }
}
