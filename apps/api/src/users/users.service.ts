import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { STAFF_ROLES } from '@florece/shared';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenant/tenant.context';
import { LARAVEL_USER_MODEL } from '../common/types/auth.types';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private tenantId(): bigint {
    return this.tenantContext.getTenant().id;
  }

  async listUsers(search?: string, limit = 50) {
    await this.ensureStaffRolesExist();
    const users = await this.prisma.user.findMany({
      where: {
        tenantId: this.tenantId(),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      take: Math.max(limit * 3, 100),
      orderBy: { name: 'asc' },
    });

    const mapped = await Promise.all(
      users.map(async (user) => {
        const roles = await this.getUserRoles(user.id);
        const { password: _pw, ...rest } = user;
        return { ...rest, roles };
      }),
    );

    return mapped
      .filter((u) =>
        u.roles.some((r) => (STAFF_ROLES as readonly string[]).includes(r)),
      )
      .slice(0, limit);
  }

  async getUser(userId: bigint) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId: this.tenantId() },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const roles = await this.getUserRoles(user.id);
    const { password: _pw, ...rest } = user;
    return { ...rest, roles };
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    roles?: string[];
  }) {
    await this.ensureStaffRolesExist();
    const roles = this.normalizeStaffRoles(data.roles);
    if (roles.length === 0) {
      throw new BadRequestException(
        'Asigná al menos un permiso: Agenda, Caja o Administrador.',
      );
    }

    const tenantId = this.tenantId();
    const existing = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email: data.email } },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const now = new Date();
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: await bcrypt.hash(data.password, 10),
        tenantId,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.syncRoles(user.id, roles);
    await this.prisma.branchMembership.upsert({
      where: { userId_tenantId: { userId: user.id, tenantId } },
      create: { userId: user.id, tenantId },
      update: {},
    });
    return this.getUser(user.id);
  }

  async updateUser(
    userId: bigint,
    data: { name?: string; email?: string; image?: string },
  ) {
    await this.requireUser(userId);
    const tenantId = this.tenantId();

    if (data.email) {
      const conflict = await this.prisma.user.findFirst({
        where: {
          tenantId,
          email: data.email,
          NOT: { id: userId },
        },
      });
      if (conflict) {
        throw new ConflictException('Email already registered');
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { ...data, updatedAt: new Date() },
    });

    return this.getUser(userId);
  }

  async resetPassword(userId: bigint, password: string) {
    await this.requireUser(userId);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: await bcrypt.hash(password, 10),
        updatedAt: new Date(),
      },
    });
    return { id: userId, reset: true };
  }

  async syncUserRoles(userId: bigint, roleNames: string[]) {
    await this.ensureStaffRolesExist();
    await this.requireUser(userId);
    const roles = this.normalizeStaffRoles(roleNames);
    if (roles.length === 0) {
      throw new BadRequestException(
        'Asigná al menos un permiso: Agenda, Caja o Administrador.',
      );
    }
    await this.syncRoles(userId, roles);
    return this.getUser(userId);
  }

  private normalizeStaffRoles(roleNames?: string[]): string[] {
    const allowed = new Set<string>(STAFF_ROLES);
    return [...new Set((roleNames ?? []).filter((r) => allowed.has(r)))];
  }

  private async ensureStaffRolesExist() {
    const now = new Date();
    for (const name of STAFF_ROLES) {
      const existing = await this.prisma.role.findFirst({
        where: { name, guardName: 'web' },
      });
      if (!existing) {
        await this.prisma.role.create({
          data: { name, guardName: 'web', createdAt: now, updatedAt: now },
        });
      }
    }
  }

  private async syncRoles(userId: bigint, roleNames: string[]) {
    const roles = await this.prisma.role.findMany({
      where: { name: { in: roleNames }, guardName: 'web' },
    });

    if (roles.length !== roleNames.length) {
      const found = new Set(roles.map((r) => r.name));
      const missing = roleNames.filter((name) => !found.has(name));
      throw new BadRequestException(`Unknown roles: ${missing.join(', ')}`);
    }

    await this.prisma.modelHasRole.deleteMany({
      where: { modelId: userId, modelType: LARAVEL_USER_MODEL },
    });

    if (roles.length > 0) {
      await this.prisma.modelHasRole.createMany({
        data: roles.map((role) => ({
          roleId: role.id,
          modelId: userId,
          modelType: LARAVEL_USER_MODEL,
        })),
      });
    }
  }

  private async getUserRoles(userId: bigint): Promise<string[]> {
    const rows = await this.prisma.modelHasRole.findMany({
      where: { modelId: userId, modelType: LARAVEL_USER_MODEL },
      include: { role: true },
    });
    return rows.map((row) => row.role.name);
  }

  private async requireUser(userId: bigint) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId: this.tenantId() },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
