import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAppointmentInput } from '@florece/shared';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenant/tenant.context';
import { AppointmentsGateway } from './appointments.gateway';
import { salonDayBounds, salonTodayYmd } from '../common/date';

type TimeRange = { start: Date; end: Date };

export const APPOINTMENT_STATUS_NAMES = {
  CANCELLED: 'Cancelado',
  PENDING: 'Pendiente',
  WAITING: 'En espera',
  IN_PROGRESS: 'Atendiendo',
  COMPLETED: 'Concluido',
} as const;

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
    private readonly appointmentsGateway: AppointmentsGateway,
  ) {}

  private tenantId(): bigint {
    return this.tenantContext.getTenant().id;
  }

  /** Legacy DB requires customers.user_id NOT NULL — create a walk-in user+customer. */
  private async createWalkInCustomer(tenantId: bigint, name: string) {
    const now = new Date();
    const email = `walkin-${tenantId}-${Date.now()}-${randomUUID().slice(0, 8)}@guest.florece.app`;
    const password = await bcrypt.hash(randomUUID(), 8);
    const user = await this.prisma.user.create({
      data: {
        name: name.trim() || 'Cliente',
        email,
        password,
        image: 'default.png',
        tenantId,
        createdAt: now,
        updatedAt: now,
      },
    });
    return this.prisma.customer.create({
      data: {
        userId: user.id,
        tenantId,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  private appointmentInclude = {
    customer: true,
    employee: true,
    status: true,
    type: true,
    services: { include: { service: { include: { item: true } } } },
  } as const;

  async listByDate(date: string, statusIds?: number[], employeeId?: number) {
    const { start: dayStart, end: dayEnd } = salonDayBounds(date);

    return this.prisma.appointment.findMany({
      where: {
        tenantId: this.tenantId(),
        startTime: { gte: dayStart, lte: dayEnd },
        ...(statusIds?.length
          ? { statusId: { in: statusIds.map((id) => BigInt(id)) } }
          : {}),
        ...(employeeId != null ? { employeeId: BigInt(employeeId) } : {}),
      },
      include: this.appointmentInclude,
      orderBy: { startTime: 'asc' },
    });
  }

  async listByRange(from: string, to: string) {
    const { start: rangeStart } = salonDayBounds(from);
    const { end: rangeEnd } = salonDayBounds(to);

    return this.prisma.appointment.findMany({
      where: {
        tenantId: this.tenantId(),
        startTime: { gte: rangeStart, lte: rangeEnd },
      },
      include: this.appointmentInclude,
      orderBy: { startTime: 'asc' },
    });
  }

  async search(query: string, limit = 50) {
    const tenantId = this.tenantId();
    return this.prisma.appointment.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          ...( /^\d+$/.test(query) ? [{ id: BigInt(query) }] : []),
        ],
      },
      include: this.appointmentInclude,
      take: limit,
      orderBy: { startTime: 'desc' },
    });
  }

  async getStats(date?: string) {
    const resolvedDate = date ?? salonTodayYmd();
    const { start: dayStart, end: dayEnd } = salonDayBounds(resolvedDate);
    const tenantId = this.tenantId();

    const [todayCount, waiting, pending, incomeToday] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          tenantId,
          startTime: { gte: dayStart, lte: dayEnd },
        },
      }),
      this.countByStatusName(APPOINTMENT_STATUS_NAMES.WAITING, dayStart, dayEnd),
      this.countByStatusName(APPOINTMENT_STATUS_NAMES.PENDING, dayStart, dayEnd),
      this.getIncomeToday(dayStart, dayEnd),
    ]);

    return {
      date: resolvedDate,
      todayCount,
      waiting,
      pending,
      incomeToday,
    };
  }

  async getAvailableSlots(
    employeeId: bigint,
    date: string,
    durationMinutes: number,
  ) {
    if (durationMinutes <= 0) {
      return { hasSchedule: true, slots: [] as Array<{ start: string; end: string }> };
    }

    const jsDay = new Date(`${date}T12:00:00.000Z`).getUTCDay();
    const weekday = jsDay === 0 ? 7 : jsDay;
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        employeeId,
        weekday,
        status: true,
        employee: { tenantId: this.tenantId() },
      },
    });

    if (!schedule) {
      return { hasSchedule: false, slots: [] };
    }

    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const cancelStatus = await this.getStatusByName(
      APPOINTMENT_STATUS_NAMES.CANCELLED,
    );

    const appointments = await this.prisma.appointment.findMany({
      where: {
        employeeId,
        tenantId: this.tenantId(),
        startTime: { gte: dayStart, lte: dayEnd },
        ...(cancelStatus ? { statusId: { not: cancelStatus.id } } : {}),
      },
      orderBy: { startTime: 'asc' },
    });

    const busySlots: TimeRange[] = appointments
      .filter((a) => a.startTime && a.endTime)
      .map((a) => ({ start: a.startTime!, end: a.endTime! }));

    const workStart = this.combineDateAndTime(date, schedule.startTime);
    const workEnd = this.combineDateAndTime(date, schedule.endTime);

    const slots: Array<{ start: string; end: string }> = [];
    const slotStepMs = 30 * 60_000;
    const durationMs = durationMinutes * 60_000;

    let cursor = workStart.getTime();
    while (cursor + durationMs <= workEnd.getTime()) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(cursor + durationMs);

      const overlaps = busySlots.some(
        (busy) => slotStart < busy.end && slotEnd > busy.start,
      );

      if (!overlaps) {
        slots.push({
          start: this.formatTime(slotStart),
          end: this.formatTime(slotEnd),
        });
      }

      cursor += slotStepMs;
    }

    return { hasSchedule: true, slots };
  }

  async create(input: CreateAppointmentInput) {
    const tenantId = this.tenantId();
    const serviceIds = input.serviceIds.map((id) => BigInt(id));

    const services = await this.prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        item: { tenantId },
      },
    });

    if (services.length !== serviceIds.length) {
      throw new BadRequestException('Invalid service ids');
    }

    const duration = services.reduce((sum, s) => sum + s.durationTime, 0);
    if (duration < 1) {
      throw new BadRequestException(
        'La duración total de los servicios debe ser mayor a cero.',
      );
    }

    const startTime = this.parseDateTime(input.date, input.time);
    const endTime = new Date(startTime.getTime() + duration * 60_000);

    const available = await this.getAvailableSlots(
      BigInt(input.employeeId),
      input.date,
      duration,
    );
    if (!available.hasSchedule) {
      throw new BadRequestException('Employee has no schedule for this day');
    }

    const slotOk = available.slots.some(
      (slot) =>
        slot.start === this.formatTime(startTime) &&
        slot.end === this.formatTime(endTime),
    );
    if (!slotOk) {
      throw new BadRequestException('Slot not available');
    }

    let type = await this.prisma.type.findFirst({
      where: { id: BigInt(input.typeId), tenantId },
    });
    if (!type) {
      type = await this.prisma.type.findFirst({
        where: { tenantId, name: 'Web' },
      });
    }
    if (!type) {
      throw new BadRequestException('Appointment type not configured');
    }

    let customerId = input.customerId ? BigInt(input.customerId) : undefined;
    if (!customerId) {
      const guest = await this.createWalkInCustomer(tenantId, input.name);
      customerId = guest.id;
    }

    let statusId = input.statusId ? BigInt(input.statusId) : undefined;
    if (!statusId) {
      const pending = await this.getStatusByName(
        APPOINTMENT_STATUS_NAMES.PENDING,
      );
      statusId = pending?.id ?? 2n;
    }

    const now = new Date();
    const appointment = await this.prisma.appointment.create({
      data: {
        customerId,
        employeeId: BigInt(input.employeeId),
        statusId,
        typeId: type.id,
        name: input.name,
        phone: input.phone ?? null,
        startTime,
        endTime,
        tenantId,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.prisma.appointmentService.createMany({
      data: serviceIds.map((serviceId) => ({
        appointmentId: appointment.id,
        serviceId,
        createdAt: now,
        updatedAt: now,
      })),
    });

    const created = await this.getAppointment(appointment.id);
    this.notifyCreated(created);
    return created;
  }

  async createSimple(data: {
    name: string;
    phone?: string;
    employeeId?: number;
    serviceIds: number[];
  }) {
    const tenantId = this.tenantId();
    const flashType = await this.prisma.type.findFirst({
      where: { tenantId, name: 'Flash' },
    });
    if (!flashType) {
      throw new BadRequestException('Flash appointment type not configured');
    }

    const waitingStatus = await this.requireStatusByName(
      APPOINTMENT_STATUS_NAMES.WAITING,
    );

    const now = new Date();
    const serviceIds = data.serviceIds.map((id) => BigInt(id));
    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds }, item: { tenantId } },
    });
    if (services.length !== serviceIds.length) {
      throw new BadRequestException('Invalid service ids');
    }

    const duration = services.reduce((sum, s) => sum + s.durationTime, 0);
    const startTime = now;
    const endTime = new Date(startTime.getTime() + Math.max(duration, 30) * 60_000);

    let customerId: bigint;
    const existingCustomer = await this.prisma.customer.findFirst({
      where: { tenantId },
      orderBy: { id: 'asc' },
    });
    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const guest = await this.createWalkInCustomer(tenantId, data.name);
      customerId = guest.id;
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        customerId,
        employeeId: data.employeeId ? BigInt(data.employeeId) : null,
        statusId: waitingStatus.id,
        typeId: flashType.id,
        name: data.name,
        phone: data.phone ?? null,
        startTime,
        endTime,
        tenantId,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.prisma.appointmentService.createMany({
      data: serviceIds.map((serviceId) => ({
        appointmentId: appointment.id,
        serviceId,
        createdAt: now,
        updatedAt: now,
      })),
    });

    const created = await this.getAppointment(appointment.id);
    this.notifyCreated(created);
    return created;
  }

  async reschedule(
    appointmentId: bigint,
    data: { employeeId: number; date: string; time: string },
  ) {
    const appointment = await this.requireAppointment(appointmentId);

    const durationRows = await this.prisma.appointmentService.findMany({
      where: { appointmentId },
      include: { service: true },
    });
    const duration = durationRows.reduce(
      (sum, row) => sum + row.service.durationTime,
      0,
    );
    if (duration < 1) {
      throw new BadRequestException(
        'La cita no tiene duración de servicios válida.',
      );
    }

    const startTime = this.parseDateTime(data.date, data.time);
    const endTime = new Date(startTime.getTime() + duration * 60_000);

    const available = await this.getAvailableSlots(
      BigInt(data.employeeId),
      data.date,
      duration,
    );
    const slotOk = available.slots.some(
      (slot) =>
        slot.start === this.formatTime(startTime) &&
        slot.end === this.formatTime(endTime),
    );
    if (!slotOk) {
      throw new BadRequestException('Slot not available');
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        employeeId: BigInt(data.employeeId),
        startTime,
        endTime,
        updatedAt: new Date(),
      },
      include: { status: true, employee: true },
    });
    this.notifyUpdated(updated);
    return updated;
  }

  async updateStatus(appointmentId: bigint, statusId: bigint) {
    await this.requireAppointment(appointmentId);
    const status = await this.prisma.status.findFirst({
      where: { id: statusId, tenantId: this.tenantId() },
    });
    if (!status) {
      throw new BadRequestException('Invalid status');
    }
    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { statusId, updatedAt: new Date() },
      include: { status: true, employee: true },
    });
    this.notifyUpdated(updated);
    return updated;
  }

  async cancel(appointmentId: bigint) {
    await this.requireAppointment(appointmentId);
    const cancelled = await this.requireStatusByName(
      APPOINTMENT_STATUS_NAMES.CANCELLED,
    );
    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { statusId: cancelled.id, updatedAt: new Date() },
      include: this.appointmentInclude,
    });
    this.notifyUpdated(updated);
    return updated;
  }

  async changeEmployee(appointmentId: bigint, employeeId: bigint) {
    await this.requireAppointment(appointmentId);
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId: this.tenantId() },
    });
    if (!employee) {
      throw new BadRequestException('Invalid employee');
    }
    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { employeeId, updatedAt: new Date() },
      include: this.appointmentInclude,
    });
    this.notifyUpdated(updated);
    return updated;
  }

  async transitionTo(
    appointmentId: bigint,
    statusName: string,
  ) {
    const status = await this.requireStatusByName(statusName);
    return this.updateStatus(appointmentId, status.id);
  }

  async getStatusByName(name: string) {
    return this.prisma.status.findFirst({
      where: { tenantId: this.tenantId(), name },
    });
  }

  listStatuses() {
    return this.prisma.status.findMany({
      where: { tenantId: this.tenantId() },
      orderBy: { id: 'asc' },
    });
  }

  private async requireStatusByName(name: string) {
    const status = await this.getStatusByName(name);
    if (!status) {
      throw new BadRequestException(`Status "${name}" not configured`);
    }
    return status;
  }

  private async countByStatusName(
    name: string,
    dayStart: Date,
    dayEnd: Date,
  ) {
    const status = await this.getStatusByName(name);
    if (!status) {
      return 0;
    }
    return this.prisma.appointment.count({
      where: {
        tenantId: this.tenantId(),
        statusId: status.id,
        startTime: { gte: dayStart, lte: dayEnd },
      },
    });
  }

  private async getIncomeToday(dayStart: Date, dayEnd: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        tenantId: this.tenantId(),
        status: 'finalized',
        finalizedAt: { gte: dayStart, lte: dayEnd },
      },
    });
    return orders.reduce(
      (sum, order) => sum.plus(order.total),
      new Prisma.Decimal(0),
    ).toNumber();
  }

  async getAppointment(appointmentId: bigint) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId: this.tenantId() },
      include: this.appointmentInclude,
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }

  private async requireAppointment(appointmentId: bigint) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId: this.tenantId() },
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }

  private parseDateTime(date: string, time: string): Date {
    const normalizedTime = time.length === 5 ? `${time}:00` : time;
    return new Date(`${date}T${normalizedTime}.000Z`);
  }

  private combineDateAndTime(date: string, timeValue: Date): Date {
    const hours = timeValue.getUTCHours();
    const minutes = timeValue.getUTCMinutes();
    const seconds = timeValue.getUTCSeconds();
    return new Date(
      `${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.000Z`,
    );
  }

  private formatTime(date: Date): string {
    return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
  }

  private notifyCreated(appointment: {
    id: bigint;
    name: string | null;
    startTime: Date | null;
  }) {
    const tenant = this.tenantContext.tryGetTenant();
    if (!tenant) return;
    this.appointmentsGateway.emitCreated(tenant.slug, {
      id: Number(appointment.id),
      name: appointment.name,
      date: this.eventDate(appointment.startTime),
    });
  }

  private notifyUpdated(appointment: {
    id: bigint;
    name: string | null;
    startTime: Date | null;
  }) {
    const tenant = this.tenantContext.tryGetTenant();
    if (!tenant) return;
    this.appointmentsGateway.emitUpdated(tenant.slug, {
      id: Number(appointment.id),
      name: appointment.name,
      date: this.eventDate(appointment.startTime),
    });
  }

  private eventDate(startTime: Date | null): string {
    if (!startTime) return new Date().toISOString().slice(0, 10);
    return startTime.toISOString().slice(0, 10);
  }
}
