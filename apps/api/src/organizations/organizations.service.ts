import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DEMO_SLUG, OrgRole, TENANT_SUBSCRIPTION_STATUS } from '@florece/shared';
import { OnboardingService } from '../auth/onboarding.service';
import type { AuthUser } from '../common/types/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import type { TenantWithOrganization } from './organizations.types';

export type { OrganizationWithPlan, TenantWithOrganization } from './organizations.types';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly onboarding: OnboardingService,
  ) {}

  async createOrganizationWithBranch(input: {
    name: string;
    slug: string;
    locale?: string;
    isDemo?: boolean;
    billingRegion?: string | null;
    billingEmail?: string | null;
    planId?: bigint | null;
    subscriptionStatus?: string;
    trialEndsAt?: Date | null;
    subscriptionEndsAt?: Date | null;
    adminNote?: string | null;
    featureOverrides?: Prisma.InputJsonValue | null;
  }): Promise<TenantWithOrganization> {
    const now = new Date();
    const organization = await this.prisma.organization.create({
      data: {
        name: input.name,
        billingRegion: input.billingRegion ?? null,
        billingEmail: input.billingEmail ?? null,
        planId: input.planId ?? null,
        subscriptionStatus:
          input.subscriptionStatus ?? TENANT_SUBSCRIPTION_STATUS.TRIAL,
        trialEndsAt: input.trialEndsAt ?? null,
        subscriptionEndsAt: input.subscriptionEndsAt ?? null,
        adminNote: input.adminNote ?? null,
        featureOverrides: input.featureOverrides ?? undefined,
        createdAt: now,
        updatedAt: now,
      },
    });

    const tenant = await this.prisma.tenant.create({
      data: {
        organizationId: organization.id,
        name: input.name,
        slug: input.slug,
        isDemo: input.isDemo ?? false,
        locale: input.locale ?? 'es',
        createdAt: now,
        updatedAt: now,
      },
      include: {
        organization: { include: { plan: true, scheduledPlan: true } },
      },
    });

    return tenant;
  }

  async grantOwnerAccess(userId: bigint, tenantId: bigint, organizationId: bigint) {
    await this.prisma.organizationMember.upsert({
      where: {
        organizationId_userId: { organizationId, userId },
      },
      create: {
        organizationId,
        userId,
        orgRole: OrgRole.OWNER,
      },
      update: { orgRole: OrgRole.OWNER },
    });

    await this.prisma.branchMembership.upsert({
      where: {
        userId_tenantId: { userId, tenantId },
      },
      create: { userId, tenantId },
      update: {},
    });
  }

  async ensureBranchMembership(userId: bigint, tenantId: bigint) {
    await this.prisma.branchMembership.upsert({
      where: { userId_tenantId: { userId, tenantId } },
      create: { userId, tenantId },
      update: {},
    });
  }

  async getOrgRole(
    userId: bigint,
    organizationId: bigint,
  ): Promise<string | null> {
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });
    return member?.orgRole ?? null;
  }

  async hasBranchAccess(userId: bigint, tenantId: bigint): Promise<boolean> {
    const membership = await this.prisma.branchMembership.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
    });
    return Boolean(membership);
  }

  async listBranchesForUser(userId: bigint) {
    const memberships = await this.prisma.branchMembership.findMany({
      where: { userId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            locale: true,
            isDemo: true,
            organizationId: true,
          },
        },
      },
      orderBy: { tenant: { name: 'asc' } },
    });

    return memberships.map((m) => ({
      id: Number(m.tenant.id),
      name: m.tenant.name,
      slug: m.tenant.slug,
      locale: m.tenant.locale,
      isDemo:
        m.tenant.isDemo ||
        m.tenant.slug.toLowerCase() === DEMO_SLUG.toLowerCase(),
      organizationId: Number(m.tenant.organizationId),
    }));
  }

  async requireOwner(user: AuthUser, organizationId: bigint) {
    if (user.platformRole) return;
    const role = await this.getOrgRole(BigInt(user.id), organizationId);
    if (role !== OrgRole.OWNER) {
      throw new ForbiddenException('Solo el dueño puede realizar esta acción');
    }
  }

  async createBranch(
    user: AuthUser,
    input: { name: string; slug: string; locale?: string },
  ) {
    const current = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: { organization: true },
    });
    if (!current) throw new NotFoundException('Sucursal no encontrada');

    await this.requireOwner(user, current.organizationId);

    const existing = await this.prisma.tenant.findUnique({
      where: { slug: input.slug },
    });
    if (existing) {
      throw new ConflictException('Slug already taken');
    }

    const now = new Date();
    const tenant = await this.prisma.tenant.create({
      data: {
        organizationId: current.organizationId,
        name: input.name.trim(),
        slug: input.slug,
        locale: input.locale ?? current.locale,
        isDemo: current.isDemo,
        createdAt: now,
        updatedAt: now,
      },
    });

    try {
      await this.onboarding.bootstrapTenant(tenant.id, tenant.name);
    } catch (err) {
      console.error('bootstrapTenant failed for new branch', err);
    }

    await this.grantOwnerAccess(
      BigInt(user.id),
      tenant.id,
      current.organizationId,
    );

    const peerOwners = await this.prisma.organizationMember.findMany({
      where: {
        organizationId: current.organizationId,
        orgRole: OrgRole.OWNER,
        user: {
          branchMemberships: { some: { tenantId: current.id } },
        },
      },
    });
    for (const owner of peerOwners) {
      await this.ensureBranchMembership(owner.userId, tenant.id);
    }

    return {
      id: Number(tenant.id),
      name: tenant.name,
      slug: tenant.slug,
      locale: tenant.locale,
      isDemo: tenant.isDemo,
      organizationId: Number(tenant.organizationId),
    };
  }

  async salesSummary(
    user: AuthUser,
    from?: Date,
    to?: Date,
  ) {
    const current = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
    });
    if (!current) throw new NotFoundException('Sucursal no encontrada');

    await this.requireOwner(user, current.organizationId);

    const branches = await this.prisma.tenant.findMany({
      where: { organizationId: current.organizationId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });

    const rangeStart = from ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const rangeEnd = to ?? new Date();

    const rows = await Promise.all(
      branches.map(async (branch) => {
        const orders = await this.prisma.order.findMany({
          where: {
            tenantId: branch.id,
            status: 'finalized',
            finalizedAt: { gte: rangeStart, lte: rangeEnd },
          },
          select: { total: true, id: true },
        });
        const totalRevenue = orders.reduce(
          (sum, o) => sum + Number(o.total),
          0,
        );
        return {
          tenantId: Number(branch.id),
          name: branch.name,
          slug: branch.slug,
          orderCount: orders.length,
          totalRevenue,
        };
      }),
    );

    return {
      from: rangeStart,
      to: rangeEnd,
      branches: rows,
      totalRevenue: rows.reduce((s, r) => s + r.totalRevenue, 0),
      totalOrders: rows.reduce((s, r) => s + r.orderCount, 0),
    };
  }

  async profitSummary(user: AuthUser, from?: Date, to?: Date) {
    const current = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
    });
    if (!current) throw new NotFoundException('Sucursal no encontrada');

    await this.requireOwner(user, current.organizationId);

    const branches = await this.prisma.tenant.findMany({
      where: { organizationId: current.organizationId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });

    const rangeStart =
      from ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const rangeEnd = to ?? new Date();

    const rows = await Promise.all(
      branches.map(async (branch) => {
        const [orders, expenses] = await Promise.all([
          this.prisma.order.findMany({
            where: {
              tenantId: branch.id,
              status: 'finalized',
              finalizedAt: { gte: rangeStart, lte: rangeEnd },
            },
            select: { total: true },
          }),
          this.prisma.expense.findMany({
            where: {
              tenantId: branch.id,
              spentAt: { gte: rangeStart, lte: rangeEnd },
            },
            select: { amount: true },
          }),
        ]);
        const income = orders.reduce((s, o) => s + Number(o.total), 0);
        const expenseTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
        return {
          tenantId: Number(branch.id),
          name: branch.name,
          slug: branch.slug,
          income,
          expenses: expenseTotal,
          profit: income - expenseTotal,
          orderCount: orders.length,
          expenseCount: expenses.length,
        };
      }),
    );

    return {
      from: rangeStart,
      to: rangeEnd,
      branches: rows,
      income: rows.reduce((s, r) => s + r.income, 0),
      expenses: rows.reduce((s, r) => s + r.expenses, 0),
      profit: rows.reduce((s, r) => s + r.profit, 0),
    };
  }
}
