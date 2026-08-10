import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  IS_PUBLIC_KEY,
  SKIP_TENANT_KEY,
} from '../decorators/public.decorator';
import { AuthUser } from '../types/auth.types';
import { PrismaService } from '../../prisma/prisma.service';
import { TENANT_SUBSCRIPTION_STATUS } from '@florece/shared';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const skipTenant = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skipTenant) return true;

    const request = context.switchToHttp().getRequest<{
      user?: AuthUser;
      method?: string;
    }>();
    const user = request.user;
    if (!user?.tenantId) return true;
    if (user.platformRole) return true;

    const method = (request.method || 'GET').toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return true;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        isDemo: true,
        organization: { select: { subscriptionStatus: true } },
      },
    });
    if (!tenant) {
      throw new ForbiddenException('Salón no encontrado');
    }
    if (tenant.isDemo) return true;

    const status = tenant.organization.subscriptionStatus;
    if (
      status === TENANT_SUBSCRIPTION_STATUS.SUSPENDED ||
      status === 'canceled' ||
      status === 'expired'
    ) {
      throw new ForbiddenException(
        'La suscripción está suspendida. Contacta a Florece para reactivar.',
      );
    }
    return true;
  }
}
