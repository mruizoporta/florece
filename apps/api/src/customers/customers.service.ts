import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenant/tenant.context';
import { APPOINTMENT_STATUS_NAMES } from '../appointments/appointments.service';

const CANCELLATION_HOURS = 6;

function isGuestEmail(email?: string | null) {
  return Boolean(email?.endsWith('@guest.florece.app'));
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
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
      user: customer.user,
      appointments: customer.appointments,
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
