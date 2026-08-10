import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { canManageAgenda } from '@florece/shared';
import { JwtPayload } from '../common/types/auth.types';
import { TenantService } from '../tenant/tenant.service';

export type AppointmentRealtimeEvent = {
  id: number;
  name: string | null;
  date: string;
};

@WebSocketGateway({
  namespace: '/appointments',
  cors: {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const allowed = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
        .split(',')
        .map((value) => value.trim());
      if (
        allowed.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
        /^http:\/\/100\.\d+\.\d+\.\d+(:\d+)?$/.test(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  },
})
export class AppointmentsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(AppointmentsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly tenantService: TenantService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        (typeof client.handshake.headers.authorization === 'string'
          ? client.handshake.headers.authorization.replace(/^Bearer\s+/i, '')
          : undefined);
      const tenantSlug = client.handshake.auth?.tenantSlug as string | undefined;

      if (!token || !tenantSlug) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      if (!canManageAgenda(payload.roles)) {
        client.disconnect(true);
        return;
      }

      const tenant = await this.tenantService.findBySlug(tenantSlug);
      if (!tenant || Number(tenant.id) !== payload.tenantId) {
        client.disconnect(true);
        return;
      }

      await client.join(this.room(tenant.slug));
      client.data.tenantSlug = tenant.slug;
      this.logger.debug(`Board connected: ${tenant.slug} (${client.id})`);
    } catch (error) {
      this.logger.warn(
        `Socket auth failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const slug = client.data?.tenantSlug as string | undefined;
    if (slug) {
      this.logger.debug(`Board disconnected: ${slug} (${client.id})`);
    }
  }

  emitCreated(tenantSlug: string, payload: AppointmentRealtimeEvent) {
    this.server.to(this.room(tenantSlug)).emit('appointment:created', payload);
  }

  emitUpdated(tenantSlug: string, payload: AppointmentRealtimeEvent) {
    this.server.to(this.room(tenantSlug)).emit('appointment:updated', payload);
  }

  private room(tenantSlug: string) {
    return `tenant:${tenantSlug}`;
  }
}
