import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { formatWallClock, salonWallClockNow } from '../common/date';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentPushService } from './appointment-push.service';

const HOUR = 3_600_000;
const TICK_MS = 10 * 60_000;
// Estados en los que la cita ya no necesita recordatorio.
const CLOSED_STATUSES = ['Cancelado', 'Concluido', 'Atendiendo', 'No se presentó'];

type Kind = '24h' | '2h';
const WINDOWS: Record<Kind, number> = { '24h': 24 * HOUR, '2h': 2 * HOUR };

/** Envía por correo recordatorios 24 h y 2 h antes de cada cita. */
@Injectable()
export class AppointmentRemindersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppointmentRemindersService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly pushes: AppointmentPushService,
  ) {}

  onModuleInit() {
    if (this.config.get('NODE_ENV') === 'test' || this.config.get('REMINDERS_DISABLED') === 'true') {
      return;
    }
    this.timer = setInterval(() => void this.run(), TICK_MS);
    setTimeout(() => void this.run(), 15_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async run(now = new Date()) {
    try {
      // El de 2 h primero: si una cita entra en las dos ventanas, solo recibe el más cercano.
      const sent2h = await this.sendDue('2h', now);
      const sent24h = await this.sendDue('24h', now);
      if (sent2h + sent24h > 0) {
        this.logger.log(`Recordatorios enviados: ${sent24h} (24 h), ${sent2h} (2 h)`);
      }
      return { sent24h, sent2h };
    } catch (err) {
      this.logger.error('Fallo enviando recordatorios', err as Error);
      return { sent24h: 0, sent2h: 0 };
    }
  }

  private async sendDue(kind: Kind, now: Date) {
    const window = WINDOWS[kind];
    const sentField = kind === '24h' ? 'reminder24hSentAt' : 'reminder2hSentAt';
    // start_time es hora local del salón: se trae un margen amplio y se filtra por la zona de cada salón.
    const due = await this.prisma.appointment.findMany({
      where: {
        startTime: {
          gt: new Date(now.getTime() - 14 * HOUR),
          lte: new Date(now.getTime() + window + 14 * HOUR),
        },
        [sentField]: null,
        status: { name: { notIn: CLOSED_STATUSES } },
        tenant: {
          isDemo: false,
          settings: { none: { appointmentReminders: false } },
        },
      },
      include: {
        customer: { include: { user: { select: { email: true } } } },
        employee: { select: { name: true } },
        services: { include: { service: { include: { item: { select: { name: true } } } } } },
        tenant: {
          select: {
            slug: true,
            name: true,
            organization: { select: { billingRegion: true } },
            settings: { select: { companyName: true, whatsapp: true, phone: true }, take: 1 },
          },
        },
      },
      take: 200,
    });

    let sent = 0;
    for (const appt of due) {
      const region = appt.tenant.organization?.billingRegion;
      const wallNow = salonWallClockNow(now, region).getTime();
      const start = appt.startTime!.getTime();
      const inWindow =
        start > wallNow + (kind === '24h' ? WINDOWS['2h'] : 0) && start <= wallNow + window;
      if (!inWindow) continue;
      const email = appt.customer.user.email;
      // Reservada cuando ya estaba dentro de la ventana: no avisar lo que acaba de agendar.
      const bookedLate =
        appt.createdAt &&
        salonWallClockNow(appt.createdAt, region).getTime() > start - window;
      const reachable = isRealEmail(email);

      // Se marca primero (y solo si nadie lo marcó antes) para que dos procesos no dupliquen el correo.
      const claimed = await this.prisma.appointment.updateMany({
        where: { id: appt.id, [sentField]: null },
        data: { [sentField]: now },
      });
      if (claimed.count === 0 || bookedLate) continue;
      // El push llega aunque la clienta no haya dejado correo.
      await this.pushes.reminder(appt.id, kind);
      if (!reachable) continue;

      await this.mail.send({ to: email, ...reminderMessage(kind, appt, this.appUrl()) });
      sent++;
    }
    return sent;
  }

  private appUrl() {
    return this.config.get<string>('APP_URL', 'http://localhost:3000').replace(/\/$/, '');
  }
}

/** Las clientas sin correo (walk-in) tienen uno interno que no se debe usar. */
export function isRealEmail(email: string | null | undefined): email is string {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1].toLowerCase();
  return !['guest.florece.app', 'example.com'].includes(domain);
}

type ReminderAppointment = {
  name: string;
  startTime: Date | null;
  employee: { name: string } | null;
  services: { service: { item: { name: string } } }[];
  tenant: {
    slug: string;
    name: string;
    organization: { billingRegion: string | null } | null;
    settings: { companyName: string | null; whatsapp: string | null; phone: string | null }[];
  };
};

export function reminderMessage(kind: Kind, appt: ReminderAppointment, appUrl: string) {
  const setting = appt.tenant.settings[0];
  const salon = setting?.companyName?.trim() || appt.tenant.name;
  const when = formatWallClock(appt.startTime!);
  const services = appt.services.map((s) => s.service.item.name).join(', ');
  const whatsapp = setting?.whatsapp?.replace(/\D/g, '');
  const contact = whatsapp
    ? `Si no podés venir o querés cambiar la hora, escribinos por WhatsApp: https://wa.me/${whatsapp}`
    : setting?.phone
      ? `Si no podés venir o querés cambiar la hora, llamanos al ${setting.phone}.`
      : 'Si no podés venir o querés cambiar la hora, avisanos.';

  const lines = [
    `Hola ${appt.name},`,
    '',
    kind === '24h'
      ? `Te recordamos tu cita en ${salon}: ${when}.`
      : `Tu cita en ${salon} es en un rato: ${when}.`,
    services ? `Servicios: ${services}` : null,
    appt.employee ? `Te atiende: ${appt.employee.name}` : null,
    '',
    contact,
    '',
    `${salon} · ${appUrl}/s/${appt.tenant.slug}`,
  ].filter((line): line is string => line !== null);

  return {
    subject: kind === '24h' ? `Recordatorio de tu cita en ${salon}` : `Tu cita en ${salon} es en un rato`,
    text: lines.join('\n'),
  };
}
