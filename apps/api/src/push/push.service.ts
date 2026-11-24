import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const TOKEN_RE = /^(Exponent|Expo)PushToken\[[^\]]{10,200}\]$/;

export type PushMessage = { title: string; body: string; data?: Record<string, unknown> };
type Destino = { userIds?: bigint[]; appointmentId?: bigint };

export const isPushToken = (token: unknown): token is string =>
  typeof token === 'string' && TOKEN_RE.test(token);

/** Guarda los tokens de Expo y manda avisos push. Nunca lanza: un aviso fallido no rompe la acción. */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** El teléfono pasa a ser de este usuario: se quita de cualquier otra cuenta de staff. */
  async registerUser(token: string, userId: bigint, tenantId: bigint) {
    await this.prisma.$transaction([
      this.prisma.pushToken.deleteMany({ where: { token, userId: { not: null } } }),
      this.prisma.pushToken.create({ data: { token, userId, tenantId } }),
    ]);
  }

  async unregisterUser(token: string, userId: bigint) {
    await this.prisma.pushToken.deleteMany({ where: { token, userId } });
  }

  async registerAppointment(token: string, appointmentId: bigint, tenantId: bigint) {
    const existe = await this.prisma.pushToken.findFirst({ where: { token, appointmentId } });
    if (!existe) await this.prisma.pushToken.create({ data: { token, appointmentId, tenantId } });
  }

  async send(destino: Destino, message: PushMessage) {
    try {
      const or = [
        ...(destino.userIds?.length ? [{ userId: { in: destino.userIds } }] : []),
        ...(destino.appointmentId ? [{ appointmentId: destino.appointmentId }] : []),
      ];
      if (or.length === 0) return 0;
      const rows = await this.prisma.pushToken.findMany({ where: { OR: or }, select: { token: true } });
      const tokens = [...new Set(rows.map((r) => r.token))];
      if (tokens.length === 0 || this.disabled()) return 0;

      let sent = 0;
      for (let i = 0; i < tokens.length; i += 100) {
        const chunk = tokens.slice(i, i + 100);
        const res = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(chunk.map((to) => ({ to, sound: 'default', ...message }))),
        });
        if (!res.ok) {
          this.logger.warn(`Expo push respondió ${res.status}`);
          continue;
        }
        const { data } = (await res.json()) as { data?: { status: string; details?: { error?: string } }[] };
        const muertos = chunk.filter((_, j) => data?.[j]?.details?.error === 'DeviceNotRegistered');
        if (muertos.length) await this.prisma.pushToken.deleteMany({ where: { token: { in: muertos } } });
        sent += (data ?? []).filter((t) => t.status === 'ok').length;
      }
      return sent;
    } catch (err) {
      this.logger.warn(`No se pudo enviar el push: ${(err as Error).message}`);
      return 0;
    }
  }

  private disabled() {
    return this.config.get('NODE_ENV') === 'test' || this.config.get('PUSH_DISABLED') === 'true';
  }
}
