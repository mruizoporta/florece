import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import {
  AuthUser,
  JwtPayload,
  LARAVEL_USER_MODEL,
} from '../common/types/auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(payload.sub) },
    });
    if (!user) {
      throw new UnauthorizedException();
    }

    const activeTenantId = BigInt(payload.tenantId);
    const hasMembership = await this.prisma.branchMembership.findUnique({
      where: {
        userId_tenantId: { userId: user.id, tenantId: activeTenantId },
      },
    });

    const allowed =
      Boolean(user.platformRole) ||
      Boolean(hasMembership) ||
      user.tenantId === activeTenantId;

    if (!allowed) {
      throw new UnauthorizedException();
    }

    const roles =
      payload.roles ??
      (
        await this.prisma.modelHasRole.findMany({
          where: {
            modelId: user.id,
            modelType: LARAVEL_USER_MODEL,
          },
          include: { role: true },
        })
      ).map((row) => row.role.name);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: activeTenantId },
      select: { organizationId: true },
    });

    const orgMember = tenant
      ? await this.prisma.organizationMember.findUnique({
          where: {
            organizationId_userId: {
              organizationId: tenant.organizationId,
              userId: user.id,
            },
          },
        })
      : null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      tenantId: activeTenantId,
      organizationId: tenant?.organizationId ?? null,
      orgRole: orgMember?.orgRole ?? null,
      roles,
      platformRole: user.platformRole ?? payload.platformRole ?? null,
      employeeId: user.employeeId ?? null,
    };
  }
}
