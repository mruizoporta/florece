import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../common/types/auth.types';

export type CreateSupportTicketInput = {
  subject: string;
  body: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
};

export type CreatePublicSupportTicketInput = CreateSupportTicketInput & {
  name: string;
  email: string;
  phone?: string;
};

@Injectable()
export class SupportService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private endpoint() {
    const base = (this.config.get<string>('SUPPORTFLOW_URL') || '').replace(
      /\/$/,
      '',
    );
    const key = this.config.get<string>('SUPPORTFLOW_API_KEY') || '';
    return { base, key };
  }

  isConfigured() {
    const { base, key } = this.endpoint();
    return Boolean(base && key);
  }

  async createTicket(user: AuthUser, input: CreateSupportTicketInput) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: user.tenantId },
      select: { name: true, slug: true },
    });

    const appUrl = (this.config.get<string>('APP_URL') || '').replace(
      /\/$/,
      '',
    );
    const externalUrl =
      appUrl && tenant?.slug ? `${appUrl}/s/${tenant.slug}/admin` : appUrl || undefined;

    return this.forwardToSupportFlow({
      subject: input.subject,
      body: input.body,
      priority: input.priority,
      requesterName: user.name || 'Usuario Florece',
      requesterEmail: user.email || 'sin-email@florece.app',
      externalTenantId: String(user.tenantId),
      externalTenantName: tenant?.name,
      externalUserId: String(user.id),
      externalUrl,
      metadata: {
        roles: user.roles,
        platformRole: user.platformRole,
        tenantSlug: tenant?.slug,
        source: 'florece-help-assistant',
      },
    });
  }

  async createPublicTicket(input: CreatePublicSupportTicketInput) {
    const name = input.name?.trim();
    const email = input.email?.trim().toLowerCase();
    if (!name || name.length < 2) {
      throw new BadRequestException('Indicá tu nombre');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Correo inválido');
    }

    const appUrl = this.config.get<string>('APP_URL') || undefined;
    return this.forwardToSupportFlow({
      subject: input.subject,
      body: input.body,
      priority: input.priority,
      requesterName: name,
      requesterEmail: email,
      requesterPhone: input.phone?.trim() || undefined,
      externalUrl: appUrl,
      metadata: {
        source: 'florece-landing-help',
      },
    });
  }

  private async forwardToSupportFlow(payload: {
    subject: string;
    body: string;
    priority?: string;
    requesterName: string;
    requesterEmail: string;
    requesterPhone?: string;
    externalTenantId?: string;
    externalTenantName?: string;
    externalUserId?: string;
    externalUrl?: string;
    metadata?: Record<string, unknown>;
  }) {
    const { base, key } = this.endpoint();
    if (!base || !key) {
      throw new ServiceUnavailableException(
        'Soporte no está configurado (SUPPORTFLOW_URL / SUPPORTFLOW_API_KEY)',
      );
    }
    const subject = payload.subject?.trim();
    const body = payload.body?.trim();
    if (!subject || subject.length < 3) {
      throw new BadRequestException('Asunto muy corto');
    }
    if (!body || body.length < 5) {
      throw new BadRequestException('Describí el problema con más detalle');
    }

    const res = await fetch(`${base}/ingest/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': key,
      },
      body: JSON.stringify({
        subject,
        body,
        requesterName: payload.requesterName,
        requesterEmail: payload.requesterEmail,
        requesterPhone: payload.requesterPhone,
        externalTenantId: payload.externalTenantId,
        externalTenantName: payload.externalTenantName,
        externalUserId: payload.externalUserId,
        externalUrl: payload.externalUrl,
        environment:
          this.config.get<string>('NODE_ENV') === 'production'
            ? 'production'
            : 'development',
        priority: payload.priority || 'NORMAL',
        metadata: payload.metadata,
        tagNames: ['salon', 'florece'],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new ServiceUnavailableException(
        `SupportFlow no respondió (${res.status}): ${text.slice(0, 200)}`,
      );
    }

    return res.json();
  }
}
