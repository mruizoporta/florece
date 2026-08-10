import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FeatureKey } from '@florece/shared';
import { FEATURE_KEY } from '../decorators/feature.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthUser } from '../types/auth.types';
import { EntitlementsService } from '../../entitlements/entitlements.service';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlements: EntitlementsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const feature = this.reflector.getAllAndOverride<FeatureKey | undefined>(
      FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!feature) return true;

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user?.tenantId) {
      throw new ForbiddenException('Sin tenant');
    }
    if (user.platformRole) return true;

    const resolved = await this.entitlements.resolve(user.tenantId);
    if (!resolved.features[feature]) {
      throw new ForbiddenException(
        `Tu plan no incluye el módulo: ${feature}. Actualiza tu plan con Florece.`,
      );
    }
    return true;
  }
}
