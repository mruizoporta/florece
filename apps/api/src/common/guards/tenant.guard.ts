import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import {
  IS_PUBLIC_KEY,
  SKIP_TENANT_KEY,
} from '../decorators/public.decorator';
import { AuthUser } from '../types/auth.types';
import { TenantContext } from '../../tenant/tenant.context';
import { TenantService } from '../../tenant/tenant.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantService: TenantService,
    private readonly tenantContext: TenantContext,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipTenant = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skipTenant) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();

    const slugHeader = request.headers['x-tenant-slug'];
    const slug =
      typeof slugHeader === 'string' && slugHeader.length > 0
        ? slugHeader
        : undefined;

    let tenant = slug
      ? await this.tenantService.findBySlug(slug)
      : null;

    if (!tenant && request.user?.tenantId) {
      tenant = await this.tenantService.findById(request.user.tenantId);
    }

    if (!tenant) {
      const isPublic = this.reflector.getAllAndOverride<boolean>(
        IS_PUBLIC_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (isPublic && !slug) {
        throw new ForbiddenException(
          'Se requiere header X-Tenant-Slug o autenticación con tenant.',
        );
      }
      throw new ForbiddenException(
        'Se requiere contexto de salón (usuario con tenant asignado).',
      );
    }

    if (request.user && slug && BigInt(request.user.tenantId) !== tenant.id) {
      throw new ForbiddenException('Tenant mismatch');
    }

    (request as Request & { tenant?: typeof tenant }).tenant = tenant;
    this.tenantContext.setTenant(tenant);
    return true;
  }
}
