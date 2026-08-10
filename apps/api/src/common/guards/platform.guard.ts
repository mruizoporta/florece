import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthUser } from '../types/auth.types';

@Injectable()
export class PlatformGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user?.platformRole) {
      throw new ForbiddenException('Se requiere acceso de plataforma Florece');
    }
    return true;
  }
}

export function requirePlatformOwner(user: AuthUser) {
  if (user.platformRole !== 'PLATFORM_OWNER') {
    throw new ForbiddenException('Solo el dueño de plataforma puede hacer esto');
  }
}
