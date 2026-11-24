import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import {
  DEMO_SLUG,
  LoginInput,
  RegisterSalonInput,
  RoleName,
  TENANT_SUBSCRIPTION_STATUS,
  TRIAL_DAYS,
} from '@florece/shared';
import { PrismaService } from '../prisma/prisma.service';
import {
  AuthUser,
  JwtPayload,
  LARAVEL_USER_MODEL,
} from '../common/types/auth.types';
import { OnboardingService } from './onboarding.service';
import { MailService } from '../mail/mail.service';
import { TenantService } from '../tenant/tenant.service';
import { OrganizationsService } from '../organizations/organizations.service';
import type { TenantWithOrganization } from '../organizations/organizations.types';

const REFRESH_COOKIE = 'refresh_token';
const RESET_TTL_MS = 60 * 60 * 1000;
const RESET_COOLDOWN_MS = 2 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly onboarding: OnboardingService,
    private readonly tenantService: TenantService,
    private readonly organizations: OrganizationsService,
    private readonly mail: MailService,
  ) {}

  async login(input: LoginInput): Promise<
    | Awaited<ReturnType<AuthService['loginToTenant']>>
    | { needsSalon: true; salons: { slug: string; name: string }[] }
  > {
    if (input.tenantSlug) {
      return this.loginToTenant({ ...input, tenantSlug: input.tenantSlug });
    }

    // Sin código: el correo puede tener cuenta en varios salones, cada una con su
    // contraseña. Solo cuentan las cuentas cuya contraseña coincide.
    const candidates = await this.findUsersByEmail(input.email);
    const matches: typeof candidates = [];
    for (const user of candidates) {
      if (await bcrypt.compare(input.password, user.password)) matches.push(user);
    }
    if (matches.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (matches.length > 1) {
      return {
        needsSalon: true,
        salons: matches.map((u) => ({ slug: u.tenant.slug, name: u.tenant.name })),
      };
    }
    // tenantId es la última sucursal usada; desde ahí puede cambiar de sucursal.
    return this.loginToTenant({
      tenantSlug: matches[0].tenant.slug,
      email: matches[0].email,
      password: input.password,
    });
  }

  private async loginToTenant(input: Required<LoginInput>) {
    const tenant = await this.tenantService.requireBySlug(input.tenantSlug);
    const user = await this.findUserForBranch(tenant.id, input.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const hasAccess =
      user.platformRole ||
      (await this.organizations.hasBranchAccess(user.id, tenant.id));
    if (!hasAccess) {
      // Legacy users without membership row: auto-grant home branch
      if (user.tenantId === tenant.id) {
        await this.organizations.ensureBranchMembership(user.id, tenant.id);
      } else {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { tenantId: tenant.id, updatedAt: new Date() },
    });

    const roles = await this.getUserRoles(user.id);
    const tokens = await this.issueTokens(
      user.id,
      tenant.id,
      tenant.organizationId,
      roles,
      user.platformRole,
    );

    const orgRole = await this.organizations.getOrgRole(
      user.id,
      tenant.organizationId,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toAuthUser(
        { ...user, tenantId: tenant.id },
        roles,
        tenant.organizationId,
        orgRole,
      ),
      tenant: this.toTenantPublic(tenant),
    };
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: true,
        tenant: {
          include: {
            organization: { include: { plan: true, scheduledPlan: true } },
          },
        },
      },
    });

    if (!stored || stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    const roles = await this.getUserRoles(stored.userId);
    const tokens = await this.issueTokens(
      stored.userId,
      stored.tenantId,
      stored.tenant.organizationId,
      roles,
      stored.user.platformRole,
    );

    const orgRole = await this.organizations.getOrgRole(
      stored.userId,
      stored.tenant.organizationId,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toAuthUser(
        stored.user,
        roles,
        stored.tenant.organizationId,
        orgRole,
      ),
      tenant: this.toTenantPublic(stored.tenant),
    };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }

  async me(userId: bigint, tenantId: bigint) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const tenant = await this.tenantService.findById(tenantId);
    if (!user || !tenant) {
      throw new UnauthorizedException('User not found');
    }
    const roles = await this.getUserRoles(user.id);
    const orgRole = await this.organizations.getOrgRole(
      user.id,
      tenant.organizationId,
    );
    return {
      user: this.toAuthUser(user, roles, tenant.organizationId, orgRole),
      tenant: this.toTenantPublic(tenant),
    };
  }

  async listBranches(userId: bigint) {
    return this.organizations.listBranchesForUser(userId);
  }

  async switchBranch(
    user: AuthUser,
    input: { slug?: string; tenantId?: number },
  ) {
    let target = input.slug
      ? await this.tenantService.findBySlug(input.slug)
      : input.tenantId
        ? await this.tenantService.findById(BigInt(input.tenantId))
        : null;

    if (!target) {
      throw new ForbiddenException('Sucursal no encontrada');
    }

    if (!user.platformRole) {
      const allowed = await this.organizations.hasBranchAccess(
        user.id,
        target.id,
      );
      if (!allowed) {
        throw new ForbiddenException('No tienes acceso a esta sucursal');
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { tenantId: target.id, updatedAt: new Date() },
    });

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });
    if (!dbUser) throw new UnauthorizedException('User not found');

    const roles = await this.getUserRoles(dbUser.id);
    const tokens = await this.issueTokens(
      dbUser.id,
      target.id,
      target.organizationId,
      roles,
      dbUser.platformRole,
    );
    const orgRole = await this.organizations.getOrgRole(
      dbUser.id,
      target.organizationId,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toAuthUser(
        { ...dbUser, tenantId: target.id },
        roles,
        target.organizationId,
        orgRole,
      ),
      tenant: this.toTenantPublic(target),
    };
  }

  async registerSalon(input: RegisterSalonInput) {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: input.slug },
    });
    if (existing) {
      throw new ConflictException('Slug already taken');
    }

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * 86_400_000);

    let planId: bigint | undefined;
    if (input.planSlug) {
      const plan = await this.prisma.plan.findUnique({
        where: { slug: input.planSlug },
      });
      planId = plan?.id;
    } else {
      const defaultPlan = await this.prisma.plan.findFirst({
        where: { active: true, slug: 'basico' },
      });
      planId = defaultPlan?.id;
    }

    const tenant = await this.organizations.createOrganizationWithBranch({
      name: input.salonName,
      slug: input.slug,
      isDemo: input.slug === DEMO_SLUG,
      billingRegion: input.billingRegion,
      locale: input.locale,
      billingEmail: input.email,
      planId,
      subscriptionStatus: TENANT_SUBSCRIPTION_STATUS.TRIAL,
      trialEndsAt,
    });

    await this.onboarding.bootstrapTenant(tenant.id, tenant.name);
    await this.onboarding.applyMarketDefaults(tenant.id, input.billingRegion);

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: input.adminName,
        email: input.email,
        password: passwordHash,
        tenantId: tenant.id,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.onboarding.ensureAdminRole(user.id, tenant.id);
    await this.organizations.grantOwnerAccess(
      user.id,
      tenant.id,
      tenant.organizationId,
    );

    const roles = [RoleName.Admin];
    const tokens = await this.issueTokens(
      user.id,
      tenant.id,
      tenant.organizationId,
      roles,
      user.platformRole,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toAuthUser(user, roles, tenant.organizationId, 'OWNER'),
      tenant: this.toTenantPublic(tenant),
    };
  }

  async forgotPassword(email: string, tenantSlug?: string) {
    // Siempre la misma respuesta: no revela si el correo tiene cuenta.
    if (tenantSlug) {
      const tenant = await this.tenantService.requireBySlug(tenantSlug);
      const user = await this.findUserForBranch(tenant.id, email);
      if (user) await this.sendResetLink(user, tenant);
      return { ok: true };
    }

    // Sin código: un enlace por cada cuenta con ese correo (cada una tiene su contraseña).
    const users = await this.findUsersByEmail(email);
    for (const user of users) await this.sendResetLink(user, user.tenant);
    return { ok: true };
  }

  private async sendResetLink(
    user: { id: bigint; email: string; name: string },
    tenant: { name: string; slug: string },
  ) {
    // Anti-spam: un correo cada 2 minutos por usuario.
    const recent = await this.prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        createdAt: { gt: new Date(Date.now() - RESET_COOLDOWN_MS) },
      },
    });
    if (recent) return { ok: true };

    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      },
    });

    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000').replace(/\/$/, '');
    const link = `${appUrl}/restablecer-contrasena?token=${token}`;
    await this.mail.send({
      to: user.email,
      subject: 'Restablecé tu contraseña de Florece',
      text:
        `Hola ${user.name},\n\n` +
        `Pediste restablecer tu contraseña en ${tenant.name} (código: ${tenant.slug}).\n` +
        `Abrí este enlace para elegir una nueva (vence en 1 hora):\n\n${link}\n\n` +
        `Si no fuiste vos, ignorá este correo; tu contraseña no cambia.`,
    });

    return { ok: true };
  }

  async resetPassword(token: string, password: string) {
    const stored = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });
    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw new BadRequestException('Reset link is invalid or expired');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.$transaction(async (tx) => {
      // Condicional: dos envíos simultáneos del mismo enlace no pasan los dos.
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: stored.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (claimed.count === 0) throw new BadRequestException('Reset link is invalid or expired');
      await tx.user.update({ where: { id: stored.userId }, data: { password: passwordHash } });
      // Invalida otros enlaces pendientes y cierra las sesiones abiertas.
      await tx.passwordResetToken.deleteMany({ where: { userId: stored.userId, usedAt: null } });
      await tx.refreshToken.deleteMany({ where: { userId: stored.userId } });
    });

    return { ok: true };
  }

  async registerCustomer(input: {
    tenantSlug: string;
    name: string;
    email: string;
    password: string;
  }) {
    const tenant = await this.tenantService.requireBySlug(input.tenantSlug);
    const existing = await this.prisma.user.findUnique({
      where: {
        tenantId_email: { tenantId: tenant.id, email: input.email },
      },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const now = new Date();
    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: await bcrypt.hash(input.password, 10),
        tenantId: tenant.id,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.prisma.customer.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        createdAt: now,
        updatedAt: now,
      },
    });

    let customerRole = await this.prisma.role.findFirst({
      where: { name: RoleName.Customer, guardName: 'web' },
    });
    if (!customerRole) {
      customerRole = await this.prisma.role.create({
        data: {
          name: RoleName.Customer,
          guardName: 'web',
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    await this.prisma.modelHasRole.create({
      data: {
        roleId: customerRole.id,
        modelId: user.id,
        modelType: LARAVEL_USER_MODEL,
      },
    });

    await this.organizations.ensureBranchMembership(user.id, tenant.id);

    const roles = [RoleName.Customer];
    const tokens = await this.issueTokens(
      user.id,
      tenant.id,
      tenant.organizationId,
      roles,
      user.platformRole,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toAuthUser(user, roles, tenant.organizationId, null),
      tenant: this.toTenantPublic(tenant),
    };
  }

  getRefreshCookieOptions() {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: this.parseTtlMs(
        this.config.get<string>('JWT_REFRESH_TTL', '7d'),
      ),
    };
  }

  getRefreshCookieName(): string {
    return REFRESH_COOKIE;
  }

  private findUsersByEmail(email: string) {
    return this.prisma.user.findMany({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: { tenant: true },
      take: 10, // tope de comparaciones bcrypt por intento
    });
  }

  private async findUserForBranch(tenantId: bigint, email: string) {
    const direct = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });
    if (direct) return direct;

    // Same org: owner may have home tenant elsewhere but membership here
    const viaMembership = await this.prisma.branchMembership.findFirst({
      where: {
        tenantId,
        user: { email },
      },
      include: { user: true },
    });
    return viaMembership?.user ?? null;
  }

  private async issueTokens(
    userId: bigint,
    tenantId: bigint,
    organizationId: bigint,
    roles: string[],
    platformRole?: string | null,
  ) {
    const payload: JwtPayload = {
      sub: Number(userId),
      tenantId: Number(tenantId),
      organizationId: Number(organizationId),
      roles,
      platformRole: platformRole ?? null,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(
      Date.now() +
        this.parseTtlMs(this.config.get<string>('JWT_REFRESH_TTL', '7d')),
    );

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshToken),
        userId,
        tenantId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseTtlMs(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl.trim());
    if (!match) {
      return 7 * 86_400_000;
    }
    const value = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    return value * (multipliers[unit] ?? 86_400_000);
  }

  private async getUserRoles(userId: bigint): Promise<string[]> {
    const rows = await this.prisma.modelHasRole.findMany({
      where: { modelId: userId, modelType: LARAVEL_USER_MODEL },
      include: { role: true },
    });
    return rows.map((row) => row.role.name);
  }

  private toAuthUser(
    user: {
      id: bigint;
      name: string;
      email: string;
      tenantId: bigint;
      platformRole?: string | null;
      employeeId?: bigint | null;
    },
    roles: string[],
    organizationId?: bigint | null,
    orgRole?: string | null,
  ) {
    return {
      id: Number(user.id),
      name: user.name,
      email: user.email,
      tenantId: Number(user.tenantId),
      organizationId: organizationId != null ? Number(organizationId) : null,
      orgRole: orgRole ?? null,
      roles,
      platformRole: user.platformRole ?? null,
      employeeId: user.employeeId != null ? Number(user.employeeId) : null,
    };
  }

  private toTenantPublic(tenant: TenantWithOrganization) {
    const org = tenant.organization;
    return {
      id: Number(tenant.id),
      name: tenant.name,
      slug: tenant.slug,
      locale: tenant.locale,
      isDemo:
        tenant.isDemo ||
        tenant.slug.toLowerCase() === DEMO_SLUG.toLowerCase(),
      organizationId: Number(tenant.organizationId),
      subscriptionStatus: org.subscriptionStatus,
      planName: org.plan?.name ?? null,
      planSlug: org.plan?.slug ?? null,
    };
  }
}
