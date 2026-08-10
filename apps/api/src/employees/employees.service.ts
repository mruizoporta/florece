import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenant/tenant.context';
import { assertCanCreateWithinPlanLimitsOrThrow } from '../billing/plan-limits';

type ScheduleEntry = {
  weekday: number;
  start_time: string;
  end_time: string;
  status?: boolean;
};

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private tenantId(): bigint {
    return this.tenantContext.getTenant().id;
  }

  async getPublicEmployees() {
    return this.prisma.employee.findMany({
      where: { tenantId: this.tenantId(), status: true },
      include: { personalInfo: true },
      orderBy: { name: 'asc' },
    });
  }

  listEmployees(search?: string, includeArchived = false, limit = 50) {
    return this.prisma.employee.findMany({
      where: {
        tenantId: this.tenantId(),
        ...(includeArchived ? {} : { status: true }),
        ...(search
          ? { name: { contains: search, mode: 'insensitive' } }
          : {}),
      },
      include: { personalInfo: true },
      take: limit,
      orderBy: { name: 'asc' },
    });
  }

  async getEmployee(employeeId: bigint) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId: this.tenantId() },
      include: {
        personalInfo: true,
        schedules: true,
        socials: { include: { social: true } },
      },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  async createEmployee(data: {
    name: string;
    description: string;
    image: string;
    status?: boolean;
    phone?: string;
  }) {
    const now = new Date();
    const tenantId = this.tenantId();
    await this.assertEmployeeLimit(tenantId);
    const employee = await this.prisma.employee.create({
      data: {
        name: data.name,
        description: data.description,
        image: data.image,
        status: data.status ?? true,
        tenantId,
        createdAt: now,
        updatedAt: now,
      },
    });

    if (data.phone) {
      await this.prisma.personalInformation.create({
        data: {
          employeeId: employee.id,
          phone: data.phone ?? null,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    return this.getEmployee(employee.id);
  }

  private async assertEmployeeLimit(tenantId: bigint) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { organization: { include: { plan: true } } },
    });
    const plan = tenant?.organization?.plan;
    if (!plan) return;
    const employees = await this.prisma.employee.count({
      where: { tenantId, status: true },
    });
    assertCanCreateWithinPlanLimitsOrThrow(
      plan,
      { employees, services: 0 },
      'employees',
    );
  }

  async updateEmployee(
    employeeId: bigint,
    data: {
      name: string;
      description: string;
      image: string;
      status: boolean;
      phone?: string;
    },
  ) {
    await this.requireEmployee(employeeId);
    const now = new Date();
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        name: data.name,
        description: data.description,
        image: data.image,
        status: data.status,
        updatedAt: now,
      },
    });

    await this.prisma.personalInformation.upsert({
      where: { employeeId },
      create: {
        employeeId,
        phone: data.phone ?? null,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        phone: data.phone ?? null,
        updatedAt: now,
      },
    });

    return this.getEmployee(employeeId);
  }

  async archiveEmployee(employeeId: bigint) {
    await this.requireEmployee(employeeId);
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { status: false, updatedAt: new Date() },
    });
    return { id: employeeId, archived: true };
  }

  async getSchedule(employeeId: bigint) {
    await this.requireEmployee(employeeId);
    return this.prisma.schedule.findMany({
      where: { employeeId },
      orderBy: { weekday: 'asc' },
    });
  }

  async syncSocials(
    employeeId: bigint,
    socials: Array<{ socialId: number; href: string }>,
  ) {
    await this.requireEmployee(employeeId);
    const tenantId = this.tenantId();
    const now = new Date();

    for (const entry of socials) {
      const social = await this.prisma.social.findFirst({
        where: { id: BigInt(entry.socialId), tenantId },
      });
      if (!social) {
        throw new BadRequestException(`Invalid social id: ${entry.socialId}`);
      }
    }

    await this.prisma.employeeSocial.deleteMany({ where: { employeeId } });

    if (socials.length > 0) {
      await this.prisma.employeeSocial.createMany({
        data: socials.map((entry) => ({
          employeeId,
          socialId: BigInt(entry.socialId),
          href: entry.href,
          createdAt: now,
          updatedAt: now,
        })),
      });
    }

    return this.getEmployee(employeeId);
  }

  async replaceSchedule(employeeId: bigint, entries: ScheduleEntry[]) {
    await this.requireEmployee(employeeId);
    const tenantId = this.tenantId();
    const now = new Date();

    await this.prisma.schedule.deleteMany({ where: { employeeId } });

    if (entries.length === 0) {
      return [];
    }

    await this.prisma.schedule.createMany({
      data: entries.map((entry) => ({
        employeeId,
        weekday: entry.weekday,
        startTime: this.parseTime(entry.start_time),
        endTime: this.parseTime(entry.end_time),
        status: entry.status ?? true,
        tenantId,
        createdAt: now,
        updatedAt: now,
      })),
    });

    return this.getSchedule(employeeId);
  }

  private parseTime(value: string): Date {
    const parts = value.split(':').map(Number);
    const date = new Date(Date.UTC(1970, 0, 1, parts[0] ?? 0, parts[1] ?? 0, 0));
    return date;
  }

  private async requireEmployee(employeeId: bigint) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId: this.tenantId() },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }
}
