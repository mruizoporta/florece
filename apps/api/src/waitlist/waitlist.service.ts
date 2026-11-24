import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isRealEmail } from '../appointments/appointment-reminders.service';
import { billingRegionOf, formatWallClock, salonTodayYmd, salonWallClockNow } from '../common/date';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenant/tenant.context';

const MAX_DAYS_AHEAD = 90;
const MAX_PER_DAY = 60;
const STATUSES = ['waiting', 'booked', 'dropped'];

export type WaitlistInput = {
  name?: string;
  phone?: string;
  email?: string | null;
  date?: string;
  employee_id?: number | null;
  service_ids?: number[];
  note?: string | null;
};

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  private tenant() {
    return this.tenantContext.getTenant();
  }

  /** Anotarse (desde la reserva web o el panel). Mismo teléfono y día = se actualiza, no se duplica. */
  async add(input: WaitlistInput, source: 'web' | 'panel') {
    const tenant = this.tenant();
    const name = input.name?.trim().slice(0, 120);
    const phone = input.phone?.trim().slice(0, 40);
    if (!name) throw new BadRequestException('Escribí tu nombre');
    if (!phone || phone.replace(/\D/g, '').length < 7) throw new BadRequestException('Escribí un teléfono válido');
    const email = input.email?.trim().slice(0, 160) || null;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException('Correo inválido');

    const date = String(input.date ?? '');
    const today = salonTodayYmd(new Date(), billingRegionOf(tenant));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today) throw new BadRequestException('Elegí un día de hoy en adelante');
    const limit = new Date(`${today}T12:00:00Z`);
    limit.setUTCDate(limit.getUTCDate() + MAX_DAYS_AHEAD);
    if (date > limit.toISOString().slice(0, 10)) throw new BadRequestException('Ese día está muy lejos');

    let employeeId: bigint | null = null;
    if (input.employee_id) {
      const emp = await this.prisma.employee.findFirst({
        where: { id: BigInt(input.employee_id), tenantId: tenant.id, status: true },
        select: { id: true },
      });
      if (!emp) throw new BadRequestException('Profesional inválida');
      employeeId = emp.id;
    }
    const serviceIds = (input.service_ids ?? []).slice(0, 10).map((id) => BigInt(id));
    const services = serviceIds.length
      ? await this.prisma.service.findMany({
          where: { id: { in: serviceIds }, item: { tenantId: tenant.id } },
          include: { item: { select: { name: true } } },
        })
      : [];
    const durationMinutes = services.reduce((s, x) => s + x.durationTime, 0) || 30;
    const data = {
      name,
      phone,
      email,
      employeeId,
      serviceNames: services.map((s) => s.item.name).join(', ').slice(0, 400) || null,
      durationMinutes,
      note: input.note?.trim().slice(0, 400) || null,
      status: 'waiting',
      source,
    };

    const existing = await this.prisma.waitlistEntry.findFirst({
      where: { tenantId: tenant.id, date, phone, status: 'waiting' },
    });
    if (existing) {
      // Lo que no vuelve a mandar (correo, servicios, nota) se conserva.
      await this.prisma.waitlistEntry.update({
        where: { id: existing.id },
        data: {
          ...data,
          // Desde la web cualquiera que sepa el teléfono podría pisar nombre y correo ajenos.
          ...(source === 'web' ? { name: existing.name } : {}),
          email: source === 'web' ? (existing.email ?? data.email) : (data.email ?? existing.email),
          serviceNames: data.serviceNames ?? existing.serviceNames,
          durationMinutes: services.length ? data.durationMinutes : existing.durationMinutes,
          note: data.note ?? existing.note,
          source: existing.source,
        },
      });
      return { ok: true, id: Number(existing.id) };
    }
    // Freno a formularios automáticos: un día no necesita más que esto.
    const count = await this.prisma.waitlistEntry.count({ where: { tenantId: tenant.id, date } });
    if (count >= MAX_PER_DAY) throw new BadRequestException('La lista de espera de ese día está llena');
    const row = await this.prisma.waitlistEntry.create({ data: { ...data, tenantId: tenant.id, date } });
    return { ok: true, id: Number(row.id) };
  }

  async list() {
    const tenant = this.tenant();
    const today = salonTodayYmd(new Date(), billingRegionOf(tenant));
    const rows = await this.prisma.waitlistEntry.findMany({
      where: { tenantId: tenant.id, date: { gte: today } },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      take: 500,
    });
    const employees = await this.prisma.employee.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, name: true },
    });
    const names = new Map(employees.map((e) => [String(e.id), e.name]));
    return rows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      phone: r.phone,
      email: r.email,
      date: r.date,
      employeeId: r.employeeId ? Number(r.employeeId) : null,
      employeeName: r.employeeId ? (names.get(String(r.employeeId)) ?? null) : null,
      serviceNames: r.serviceNames,
      durationMinutes: r.durationMinutes,
      note: r.note,
      status: r.status,
      source: r.source,
      slotFreedAt: r.slotFreedAt?.toISOString() ?? null,
      notifiedAt: r.notifiedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async setStatus(id: bigint, status: string) {
    if (!STATUSES.includes(status)) throw new BadRequestException('Estado inválido');
    const { count } = await this.prisma.waitlistEntry.updateMany({
      where: { id, tenantId: this.tenant().id },
      data: { status },
    });
    if (!count) throw new NotFoundException('No está en la lista');
    return { ok: true };
  }

  /**
   * Se canceló una cita: marca a quienes esperaban ese día (esa profesional o cualquiera)
   * y les avisa por correo a las que dejaron uno. Nunca hace fallar la cancelación.
   */
  async slotFreed(appointment: { startTime: Date | null; employeeId: bigint | null; tenantId: bigint }) {
    try {
      const now = new Date();
      if (!appointment.startTime) return 0;
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: appointment.tenantId },
        select: {
          slug: true,
          name: true,
          isDemo: true,
          organization: { select: { billingRegion: true } },
          settings: { select: { companyName: true }, take: 1 },
        },
      });
      if (!tenant) return 0;
      const region = tenant.organization?.billingRegion ?? null;
      // start_time es hora local del salón (11:00 = 11:00Z).
      if (appointment.startTime <= salonWallClockNow(now, region)) return 0;
      const date = appointment.startTime.toISOString().slice(0, 10);
      const where = {
        tenantId: appointment.tenantId,
        date,
        status: 'waiting',
        OR: [{ employeeId: null }, ...(appointment.employeeId ? [{ employeeId: appointment.employeeId }] : [])],
      };
      const waiting = await this.prisma.waitlistEntry.findMany({ where });
      if (waiting.length === 0) return 0;
      await this.prisma.waitlistEntry.updateMany({ where, data: { slotFreedAt: now } });

      if (tenant.isDemo) return waiting.length;
      const salon = tenant.settings[0]?.companyName?.trim() || tenant.name;
      const when = formatWallClock(appointment.startTime);
      const link = `${this.config.get<string>('APP_URL', 'http://localhost:3000').replace(/\/$/, '')}/s/${tenant.slug}/agendar`;
      for (const w of waiting) {
        if (!isRealEmail(w.email)) continue;
        // Un correo por hora como mucho: reservar y cancelar en bucle no debe servir para spamear.
        if (w.notifiedAt && now.getTime() - w.notifiedAt.getTime() < 60 * 60 * 1000) continue;
        await this.mail.send({
          to: w.email,
          subject: `Se liberó un horario en ${salon}`,
          text: [
            `Hola ${w.name},`,
            '',
            `Estabas en la lista de espera de ${salon}. Se liberó un horario: ${when}.`,
            `Reservalo antes que otra persona: ${link}`,
            '',
            salon,
          ].join('\n'),
        });
        await this.prisma.waitlistEntry.update({ where: { id: w.id }, data: { notifiedAt: now } });
      }
      return waiting.length;
    } catch (err) {
      this.logger.error('Fallo avisando a la lista de espera', err as Error);
      return 0;
    }
  }
}
