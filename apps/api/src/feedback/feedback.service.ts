import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { isRealEmail } from '../appointments/appointment-reminders.service';
import { salonDateRange, salonWallClockNow } from '../common/date';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

const HOUR = 3_600_000;
const TICK_MS = 15 * 60_000;
type Channel = 'email' | 'whatsapp' | 'link';

@Injectable()
export class FeedbackService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FeedbackService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    if (this.config.get('NODE_ENV') === 'test' || this.config.get('REMINDERS_DISABLED') === 'true') return;
    this.timer = setInterval(() => void this.sendDueRequests(), TICK_MS);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  /** Crea (o reutiliza) el enlace de opinión de una cita o un ticket cobrado del salón. */
  async requestFor(
    tenantId: bigint,
    target: { appointmentId?: bigint; orderId?: bigint },
    channel: Channel,
  ) {
    let data: {
      appointmentId?: bigint;
      orderId?: bigint;
      customerName: string | null;
      employeeId: bigint | null;
      employeeName: string | null;
      serviceNames: string | null;
      phone: string | null;
    };
    if (target.appointmentId) {
      const a = await this.prisma.appointment.findFirst({
        where: { id: target.appointmentId, tenantId },
        include: {
          employee: { select: { id: true, name: true } },
          services: { include: { service: { include: { item: { select: { name: true } } } } } },
        },
      });
      if (!a) throw new NotFoundException('Cita no encontrada');
      data = {
        appointmentId: a.id,
        customerName: a.name,
        employeeId: a.employee?.id ?? null,
        employeeName: a.employee?.name ?? null,
        serviceNames: a.services.map((s) => s.service.item.name).join(', ').slice(0, 400) || null,
        phone: a.phone,
      };
    } else if (target.orderId) {
      const o = await this.prisma.order.findFirst({
        where: { id: target.orderId, tenantId, status: 'finalized' },
        include: {
          customer: { include: { user: { select: { name: true } } } },
          items: { include: { employee: { select: { id: true, name: true } } } },
        },
      });
      if (!o) throw new NotFoundException('Ticket cobrado no encontrado');
      const withEmployee = o.items.find((i) => i.employee);
      data = {
        orderId: o.id,
        customerName: o.customer?.user?.name ?? (o.name && o.name !== 'Consumidor final' ? o.name : null),
        employeeId: withEmployee?.employee?.id ?? null,
        employeeName: withEmployee?.employee?.name ?? null,
        serviceNames: o.items.map((i) => i.productNameSnapshot).filter(Boolean).join(', ').slice(0, 400) || null,
        phone: null,
      };
    } else {
      throw new BadRequestException('Indicá la cita o el ticket');
    }

    const where = data.appointmentId ? { appointmentId: data.appointmentId } : { orderId: data.orderId };
    const existing = await this.prisma.feedback.findFirst({ where });
    const { phone, ...fields } = data;
    const row =
      existing ??
      (await this.prisma.feedback.create({
        data: {
          ...fields,
          customerName: fields.customerName?.slice(0, 120) ?? null,
          tenantId,
          token: randomBytes(18).toString('base64url'),
          channel,
        },
      }));
    return { feedback: row, phone, created: !existing };
  }

  /** Correo a las clientas con cita concluida hace entre 2 y 26 horas. */
  async sendDueRequests(now = new Date()) {
    try {
      // end_time es hora local del salón: margen amplio y se filtra por la zona de cada salón.
      const recentlyAsked = (
        await this.prisma.feedback.findMany({
          where: { appointmentId: { not: null }, createdAt: { gte: new Date(now.getTime() - 4 * 24 * HOUR) } },
          select: { appointmentId: true },
        })
      ).map((f) => f.appointmentId as bigint);
      const due = await this.prisma.appointment.findMany({
        where: {
          endTime: { gte: new Date(now.getTime() - 40 * HOUR), lte: new Date(now.getTime() + 12 * HOUR) },
          status: { name: 'Concluido' },
          tenant: { isDemo: false, settings: { none: { feedbackRequests: false } } },
          // Las ya encuestadas fuera de la consulta: si no, con más de 200 siempre volverían las mismas.
          id: { notIn: recentlyAsked },
        },
        orderBy: { endTime: 'asc' },
        include: {
          customer: { include: { user: { select: { email: true } } } },
          tenant: {
            select: {
              slug: true,
              name: true,
              organization: { select: { billingRegion: true } },
              settings: { select: { companyName: true }, take: 1 },
            },
          },
        },
        take: 200,
      });
      const asked = new Set(
        (
          await this.prisma.feedback.findMany({
            where: { appointmentId: { in: due.map((a) => a.id) } },
            select: { appointmentId: true },
          })
        ).map((f) => String(f.appointmentId)),
      );
      let sent = 0;
      for (const a of due) {
        const wallNow = salonWallClockNow(now, a.tenant.organization?.billingRegion).getTime();
        const end = a.endTime!.getTime();
        if (end < wallNow - 26 * HOUR || end > wallNow - 2 * HOUR) continue;
        const email = a.customer.user.email;
        if (asked.has(String(a.id)) || !isRealEmail(email)) continue;
        try {
          const { feedback, created } = await this.requestFor(a.tenantId, { appointmentId: a.id }, 'email');
          if (!created) continue;
          const salon = a.tenant.settings[0]?.companyName?.trim() || a.tenant.name;
          await this.mail.send({
            to: email,
            subject: `¿Cómo te fue en ${salon}?`,
            text: [
              `Hola ${a.name},`,
              '',
              `Gracias por visitarnos en ${salon}. ¿Nos contás cómo te fue? Es un toque:`,
              `${this.appUrl()}/s/${a.tenant.slug}/opinion/${feedback.token}`,
              '',
              salon,
            ].join('\n'),
          });
          sent++;
        } catch (err) {
          // Unique en appointment_id: otro proceso ya la pidió.
          if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) throw err;
        }
      }
      if (sent) this.logger.log(`Encuestas enviadas: ${sent}`);
      return sent;
    } catch (err) {
      this.logger.error('Fallo enviando encuestas', err as Error);
      return 0;
    }
  }

  private appUrl() {
    return this.config.get<string>('APP_URL', 'http://localhost:3000').replace(/\/$/, '');
  }

  private async byToken(token: string) {
    const f = await this.prisma.feedback.findUnique({
      where: { token: String(token).slice(0, 48) },
      include: {
        tenant: {
          select: {
            name: true,
            slug: true,
            settings: { select: { companyName: true, googleReviewUrl: true }, take: 1 },
          },
        },
      },
    });
    if (!f) throw new NotFoundException('Encuesta no encontrada');
    return f;
  }

  private publicView(f: Awaited<ReturnType<FeedbackService['byToken']>>) {
    const setting = f.tenant.settings[0];
    const happy = (f.rating ?? 0) >= 4;
    return {
      salonName: setting?.companyName?.trim() || f.tenant.name,
      salonSlug: f.tenant.slug,
      firstName: f.customerName?.trim().split(/\s+/)[0] ?? null,
      employeeName: f.employeeName,
      serviceNames: f.serviceNames,
      answered: f.answeredAt != null,
      rating: f.rating,
      // Solo a quien quedó contenta se le ofrece reseñar en Google.
      googleReviewUrl: happy ? (setting?.googleReviewUrl ?? null) : null,
    };
  }

  async getPublic(token: string) {
    return this.publicView(await this.byToken(token));
  }

  async answer(token: string, body: { rating?: number; comment?: string | null }) {
    const f = await this.byToken(token);
    if (f.answeredAt) throw new BadRequestException('Esta encuesta ya fue respondida. ¡Gracias!');
    const rating = Math.trunc(Number(body?.rating));
    if (!(rating >= 1 && rating <= 5)) throw new BadRequestException('Elegí de 1 a 5 estrellas');
    const comment = typeof body?.comment === 'string' ? body.comment.trim().slice(0, 2000) || null : null;
    // Condicional: dos envíos a la vez no pisan la primera respuesta.
    const { count } = await this.prisma.feedback.updateMany({
      where: { id: f.id, answeredAt: null },
      data: { rating, comment, answeredAt: new Date() },
    });
    if (count !== 1) throw new BadRequestException('Esta encuesta ya fue respondida. ¡Gracias!');
    return this.publicView({ ...f, rating, comment, answeredAt: new Date() });
  }

  async markReviewClick(token: string) {
    await this.prisma.feedback.updateMany({
      where: { token: String(token).slice(0, 48), rating: { gte: 4 } },
      data: { reviewClicked: true },
    });
    return { ok: true };
  }

  async summary(tenantId: bigint, region: string | null, from?: string, to?: string) {
    const range = salonDateRange(from, to, region);
    const [sent, rows] = await Promise.all([
      this.prisma.feedback.count({
        where: { tenantId, createdAt: { gte: range.from, lte: range.to } },
      }),
      this.prisma.feedback.findMany({
        where: { tenantId, answeredAt: { gte: range.from, lte: range.to } },
        orderBy: { answeredAt: 'desc' },
        take: 500,
      }),
    ]);
    const distribution = [0, 0, 0, 0, 0];
    const byEmployee = new Map<string, { name: string; sum: number; count: number }>();
    for (const r of rows) {
      distribution[(r.rating ?? 1) - 1]++;
      if (r.employeeName) {
        const cur = byEmployee.get(r.employeeName) ?? { name: r.employeeName, sum: 0, count: 0 };
        cur.sum += r.rating ?? 0;
        cur.count++;
        byEmployee.set(r.employeeName, cur);
      }
    }
    const avg = rows.length ? rows.reduce((s, r) => s + (r.rating ?? 0), 0) / rows.length : null;
    return {
      from: range.fromYmd,
      to: range.toYmd,
      sent,
      answered: rows.length,
      average: avg == null ? null : Math.round(avg * 10) / 10,
      distribution,
      reviewClicks: rows.filter((r) => r.reviewClicked).length,
      byEmployee: [...byEmployee.values()]
        .map((e) => ({ name: e.name, count: e.count, average: Math.round((e.sum / e.count) * 10) / 10 }))
        .sort((a, b) => b.count - a.count),
      items: rows.map((r) => ({
        id: Number(r.id),
        rating: r.rating,
        comment: r.comment,
        customerName: r.customerName,
        employeeName: r.employeeName,
        serviceNames: r.serviceNames,
        reviewClicked: r.reviewClicked,
        appointmentId: r.appointmentId ? Number(r.appointmentId) : null,
        orderId: r.orderId ? Number(r.orderId) : null,
        answeredAt: r.answeredAt?.toISOString() ?? null,
      })),
    };
  }
}
