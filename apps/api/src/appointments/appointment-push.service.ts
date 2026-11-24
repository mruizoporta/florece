import { Injectable } from '@nestjs/common';
import { formatWallClock } from '../common/date';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';

// Roles que reciben "cita nueva" cuando una clienta reserva sola.
const AGENDA_ROLES = ['Admin', 'Recepcionista'];

type Cita = NonNullable<Awaited<ReturnType<AppointmentPushService['load']>>>;

/** Avisos push de citas: a la clienta (por su cita), a la estilista y a recepción. */
@Injectable()
export class AppointmentPushService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  /** byClient: la reservó la clienta desde la app o la web (no el salón). */
  async created(appointmentId: bigint, byClient: boolean) {
    const a = await this.load(appointmentId);
    if (!a) return;
    const quien = `${a.name} · ${this.cuando(a.startTime)}`;
    const estilista = await this.userOf(a.employeeId);
    if (estilista) {
      await this.push.send({ userIds: [estilista] }, { title: 'Cita nueva para vos', body: `${quien}${this.servicios(a)}`, data: this.data(a) });
    }
    if (byClient) {
      const agenda = (await this.agendaUsers(a.tenantId)).filter((id) => id !== estilista);
      await this.push.send({ userIds: agenda }, { title: 'Reserva nueva', body: `${quien}${this.servicios(a)}`, data: this.data(a) });
    }
  }

  async rescheduled(appointmentId: bigint, prevEmployeeId: bigint | null) {
    const a = await this.load(appointmentId);
    if (!a) return;
    const cuando = this.cuando(a.startTime);
    await this.push.send({ appointmentId: a.id }, { title: `Tu cita en ${a.salon} cambió`, body: `Ahora es el ${cuando}.`, data: this.dataClienta(a) });
    await this.employeeChangedOrMoved(a, prevEmployeeId, `Se movió la cita de ${a.name} al ${cuando}.`);
  }

  async employeeChanged(appointmentId: bigint, prevEmployeeId: bigint | null) {
    const a = await this.load(appointmentId);
    if (!a || a.employeeId === prevEmployeeId) return;
    if (a.employeeName) {
      await this.push.send({ appointmentId: a.id }, { title: `Tu cita en ${a.salon}`, body: `Ahora te atiende ${a.employeeName}.`, data: this.dataClienta(a) });
    }
    await this.employeeChangedOrMoved(a, prevEmployeeId, null);
  }

  async statusChanged(appointmentId: bigint, statusName: string) {
    const a = await this.load(appointmentId);
    if (!a) return;
    const estilista = await this.userOf(a.employeeId);
    if (statusName === 'Cancelado') {
      await this.push.send({ appointmentId: a.id }, { title: `Tu cita en ${a.salon} se canceló`, body: `Era el ${this.cuando(a.startTime)}. Podés reservar otra hora en la app.`, data: this.dataClienta(a) });
      if (estilista) await this.push.send({ userIds: [estilista] }, { title: 'Cita cancelada', body: `${a.name} · ${this.cuando(a.startTime)}`, data: this.data(a) });
    } else if (statusName === 'En espera' && estilista) {
      await this.push.send({ userIds: [estilista] }, { title: `Llegó ${a.name}`, body: `Te espera${this.servicios(a, ' para ')}.`, data: this.data(a) });
    }
  }

  /** Recordatorio 24 h / 2 h a la clienta (además del correo). */
  async reminder(appointmentId: bigint, kind: '24h' | '2h') {
    const a = await this.load(appointmentId);
    if (!a) return;
    await this.push.send(
      { appointmentId: a.id },
      {
        title: kind === '24h' ? `Mañana tenés cita en ${a.salon}` : `Tu cita en ${a.salon} es en un rato`,
        body: `${this.cuando(a.startTime)}${this.servicios(a, ' · ')}`,
        data: this.dataClienta(a),
      },
    );
  }

  private async employeeChangedOrMoved(a: Cita, prevEmployeeId: bigint | null, movedText: string | null) {
    const nueva = await this.userOf(a.employeeId);
    const cambio = prevEmployeeId !== a.employeeId;
    if (nueva && cambio) {
      await this.push.send({ userIds: [nueva] }, { title: 'Te asignaron una cita', body: `${a.name} · ${this.cuando(a.startTime)}${this.servicios(a)}`, data: this.data(a) });
    } else if (nueva && movedText) {
      await this.push.send({ userIds: [nueva] }, { title: 'Cita movida', body: movedText, data: this.data(a) });
    }
    const anterior = cambio ? await this.userOf(prevEmployeeId) : null;
    if (anterior && anterior !== nueva) {
      await this.push.send({ userIds: [anterior] }, { title: 'Cita reasignada', body: `${a.name} ya no está en tu agenda.` });
    }
  }

  private async load(id: bigint) {
    const a = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        employee: { select: { name: true } },
        services: { include: { service: { include: { item: { select: { name: true } } } } } },
        tenant: { select: { slug: true, name: true, settings: { select: { companyName: true }, take: 1 } } },
      },
    });
    if (!a) return null;
    return {
      id: a.id,
      tenantId: a.tenantId,
      slug: a.tenant.slug,
      salon: a.tenant.settings[0]?.companyName?.trim() || a.tenant.name,
      name: a.name,
      startTime: a.startTime,
      employeeId: a.employeeId,
      employeeName: a.employee?.name ?? null,
      viewToken: a.viewToken,
      services: a.services.map((s) => s.service.item.name),
    };
  }

  private async userOf(employeeId: bigint | null) {
    if (!employeeId) return null;
    const u = await this.prisma.user.findFirst({ where: { employeeId }, select: { id: true } });
    return u?.id ?? null;
  }

  private async agendaUsers(tenantId: bigint) {
    const users = await this.prisma.user.findMany({
      where: { tenantId, modelHasRoles: { some: { role: { name: { in: AGENDA_ROLES } } } } },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  private cuando(start: Date | null) {
    return start ? formatWallClock(start) : 'sin hora';
  }

  private servicios(a: { services: string[] }, sep = ' · ') {
    return a.services.length ? `${sep}${a.services.join(', ')}` : '';
  }

  // La app abre el detalle de la cita del salón o la cita de la clienta.
  private data(a: { id: bigint; slug: string }) {
    return { url: `/salon/cita/${a.id}`, slug: a.slug };
  }

  private dataClienta(_a: unknown) {
    return { url: '/citas' };
  }
}
