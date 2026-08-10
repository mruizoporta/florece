import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import {
  FEATURE_KEYS,
  FeatureKey,
  normalizePlanFeatures,
  TENANT_SUBSCRIPTION_STATUS,
  TRIAL_DAYS,
} from '@florece/shared';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardingService } from '../auth/onboarding.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { AuthUser } from '../common/types/auth.types';
import { requirePlatformOwner } from '../common/guards/platform.guard';

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function tempPassword() {
  return `Florece-${randomBytes(4).toString('hex')}`;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

@Injectable()
export class PlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly onboarding: OnboardingService,
    private readonly organizations: OrganizationsService,
  ) {}

  async overview() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const in7 = addDays(now, 7);

    const [byStatus, revenueAgg, paymentCount, expiringSoon, totalTenants] =
      await Promise.all([
        this.prisma.organization.groupBy({
          by: ['subscriptionStatus'],
          _count: { _all: true },
          where: {
            tenants: { some: { slug: { not: 'ops' } } },
          },
        }),
        this.prisma.saasPayment.aggregate({
          where: { paidAt: { gte: monthStart } },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        this.prisma.saasPayment.count(),
        this.prisma.tenant.findMany({
          where: {
            slug: { not: 'ops' },
            OR: [
              {
                organization: {
                  subscriptionEndsAt: { lte: in7, gte: now },
                  subscriptionStatus: TENANT_SUBSCRIPTION_STATUS.ACTIVE,
                },
              },
              {
                organization: {
                  trialEndsAt: { lte: in7, gte: now },
                  subscriptionStatus: TENANT_SUBSCRIPTION_STATUS.TRIAL,
                },
              },
            ],
          },
          take: 20,
          orderBy: { organization: { subscriptionEndsAt: 'asc' } },
          include: {
            organization: {
              include: { plan: { select: { slug: true, name: true } } },
            },
          },
        }),
        this.prisma.tenant.count({ where: { slug: { not: 'ops' } } }),
      ]);

    const statusCounts: Record<string, number> = {};
    for (const row of byStatus) {
      statusCounts[row.subscriptionStatus] = row._count._all;
    }

    return {
      totalTenants,
      statusCounts,
      revenueThisMonth: Number(revenueAgg._sum.amount || 0),
      paymentsThisMonth: revenueAgg._count._all,
      totalPayments: paymentCount,
      expiringSoon: expiringSoon.map((t) => {
        const org = t.organization;
        return {
          tenantId: Number(t.id),
          name: t.name,
          slug: t.slug,
          status: org.subscriptionStatus,
          plan: org.plan?.name ?? null,
          planSlug: org.plan?.slug ?? null,
          periodEnd: org.subscriptionEndsAt ?? org.trialEndsAt,
        };
      }),
    };
  }

  async listPlans() {
    const plans = await this.prisma.plan.findMany({
      orderBy: { priceNiMonthly: 'asc' },
    });
    return plans.map((p) => this.serializePlan(p));
  }

  async createPlan(
    _admin: AuthUser,
    input: {
      slug: string;
      name: string;
      priceUsdMonthly?: number;
      priceNioMonthly: number;
      maxEmployees?: number | null;
      maxServices?: number | null;
      features?: string[];
      entitlements?: Partial<Record<FeatureKey, boolean>>;
      active?: boolean;
      trialDays?: number;
    },
  ) {
    const slug = input.slug.toLowerCase().trim();
    const exists = await this.prisma.plan.findUnique({ where: { slug } });
    if (exists) throw new ConflictException(`Ya existe el plan ${slug}`);

    const entitlements = normalizePlanFeatures(input.entitlements);
    const clean: Record<string, boolean> = {};
    for (const key of FEATURE_KEYS) clean[key] = entitlements[key];

    const created = await this.prisma.plan.create({
      data: {
        slug,
        name: input.name.trim(),
        priceUsMonthly: input.priceUsdMonthly ?? null,
        priceNiMonthly: input.priceNioMonthly,
        currencyNi: 'NIO',
        currencyUs: 'USD',
        maxEmployees: input.maxEmployees ?? null,
        maxServices: input.maxServices ?? null,
        features: input.features?.length
          ? input.features.map((f) => f.trim()).filter(Boolean)
          : [`Plan ${input.name.trim()}`],
        entitlements: clean as Prisma.InputJsonValue,
        active: input.active ?? true,
        trialDays: input.trialDays ?? TRIAL_DAYS,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return this.serializePlan(created);
  }

  async updatePlan(
    _admin: AuthUser,
    slug: string,
    input: {
      name?: string;
      priceUsdMonthly?: number;
      priceNioMonthly?: number;
      maxEmployees?: number | null;
      maxServices?: number | null;
      features?: string[];
      entitlements?: Partial<Record<FeatureKey, boolean>>;
      active?: boolean;
      trialDays?: number;
    },
  ) {
    const plan = await this.prisma.plan.findUnique({
      where: { slug: slug.toLowerCase() },
    });
    if (!plan) throw new NotFoundException('Plan no encontrado');

    const data: Prisma.PlanUpdateInput = { updatedAt: new Date() };
    if (input.name?.trim()) data.name = input.name.trim();
    if (input.priceUsdMonthly != null) data.priceUsMonthly = input.priceUsdMonthly;
    if (input.priceNioMonthly != null) data.priceNiMonthly = input.priceNioMonthly;
    if (input.maxEmployees !== undefined) data.maxEmployees = input.maxEmployees;
    if (input.maxServices !== undefined) data.maxServices = input.maxServices;
    if (input.features) data.features = input.features;
    if (input.active != null) data.active = input.active;
    if (input.trialDays != null) data.trialDays = input.trialDays;
    if (input.entitlements) {
      const current =
        plan.entitlements &&
        typeof plan.entitlements === 'object' &&
        !Array.isArray(plan.entitlements)
          ? (plan.entitlements as Partial<Record<FeatureKey, boolean>>)
          : null;
      const merged = normalizePlanFeatures({ ...current, ...input.entitlements });
      const clean: Record<string, boolean> = {};
      for (const key of FEATURE_KEYS) clean[key] = merged[key];
      data.entitlements = clean as Prisma.InputJsonValue;
    }

    const updated = await this.prisma.plan.update({
      where: { id: plan.id },
      data,
    });
    return this.serializePlan(updated);
  }

  async listTenants(filters: {
    q?: string;
    status?: string;
    planSlug?: string;
  }) {
    const where: Prisma.TenantWhereInput = {
      slug: { not: 'ops' },
    };

    if (filters.status || filters.planSlug) {
      where.organization = {
        ...(filters.status
          ? { subscriptionStatus: filters.status }
          : {}),
        ...(filters.planSlug
          ? { plan: { slug: filters.planSlug } }
          : {}),
      };
    }

    if (filters.q?.trim()) {
      const q = filters.q.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        {
          organization: {
            billingEmail: { contains: q, mode: 'insensitive' },
          },
        },
      ];
    }

    const tenants = await this.prisma.tenant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        organization: {
          include: {
            plan: { select: { id: true, slug: true, name: true } },
            _count: { select: { saasPayments: true } },
          },
        },
        _count: { select: { users: true } },
      },
    });

    return tenants.map((t) => {
      const org = t.organization;
      return {
        id: Number(t.id),
        name: t.name,
        slug: t.slug,
        isDemo: t.isDemo,
        billingRegion: org.billingRegion,
        locale: t.locale,
        billingEmail: org.billingEmail,
        subscriptionStatus: org.subscriptionStatus,
        trialEndsAt: org.trialEndsAt,
        subscriptionEndsAt: org.subscriptionEndsAt,
        pastDueSince: org.pastDueSince,
        adminNote: org.adminNote,
        plan: org.plan
          ? { id: Number(org.plan.id), slug: org.plan.slug, name: org.plan.name }
          : null,
        userCount: t._count.users,
        paymentCount: org._count.saasPayments,
        createdAt: t.createdAt,
      };
    });
  }

  async getTenant(id: string | number) {
    const tenantId = BigInt(id);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        organization: {
          include: {
            plan: true,
            scheduledPlan: true,
            saasPayments: {
              orderBy: { paidAt: 'desc' },
              take: 50,
              include: {
                recordedBy: { select: { id: true, name: true, email: true } },
                plan: { select: { slug: true, name: true } },
              },
            },
          },
        },
        users: {
          where: {
            modelHasRoles: {
              some: { role: { name: 'Admin' } },
            },
          },
          take: 5,
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });
    if (!tenant || tenant.slug === 'ops') {
      throw new NotFoundException('Salón no encontrado');
    }

    const org = tenant.organization;

    return {
      id: Number(tenant.id),
      name: tenant.name,
      slug: tenant.slug,
      isDemo: tenant.isDemo,
      billingRegion: org.billingRegion,
      locale: tenant.locale,
      billingEmail: org.billingEmail,
      subscriptionStatus: org.subscriptionStatus,
      trialEndsAt: org.trialEndsAt,
      subscriptionEndsAt: org.subscriptionEndsAt,
      pastDueSince: org.pastDueSince,
      adminNote: org.adminNote,
      featureOverrides: org.featureOverrides,
      plan: org.plan ? this.serializePlan(org.plan) : null,
      scheduledPlan: org.scheduledPlan
        ? this.serializePlan(org.scheduledPlan)
        : null,
      owners: tenant.users.map((u) => ({
        id: Number(u.id),
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
      })),
      payments: org.saasPayments.map((p) =>
        this.serializePayment(p, tenant.id),
      ),
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }

  async createTenant(
    _admin: AuthUser,
    input: {
      salonName: string;
      slug?: string;
      ownerEmail: string;
      ownerName: string;
      planSlug?: string;
      trialDays?: number;
      adminNote?: string;
      billingRegion?: 'NI' | 'US';
      locale?: 'es' | 'en';
      featureOverrides?: Partial<Record<FeatureKey, boolean>> | null;
    },
  ) {
    const baseSlug = input.slug?.trim() || slugify(input.salonName);
    const slug = await this.uniqueSlug(baseSlug || 'salon');
    const now = new Date();
    const trialDays = input.trialDays ?? TRIAL_DAYS;
    const trialEndsAt = addDays(now, trialDays);

    let planId: bigint | undefined;
    if (input.planSlug) {
      const plan = await this.prisma.plan.findUnique({
        where: { slug: input.planSlug },
      });
      if (!plan?.active) throw new NotFoundException('Plan no encontrado');
      planId = plan.id;
    } else {
      const defaultPlan = await this.prisma.plan.findFirst({
        where: { active: true },
        orderBy: { priceNiMonthly: 'asc' },
      });
      planId = defaultPlan?.id;
    }

    const existingEmail = await this.prisma.user.findFirst({
      where: {
        email: input.ownerEmail,
        tenant: { slug },
      },
    });
    if (existingEmail) {
      throw new ConflictException('Email ya registrado en ese salón');
    }

    const plainPassword = tempPassword();
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const tenant = await this.organizations.createOrganizationWithBranch({
      name: input.salonName.trim(),
      slug,
      billingRegion: input.billingRegion ?? 'NI',
      locale: input.locale ?? 'es',
      billingEmail: input.ownerEmail,
      planId,
      subscriptionStatus: TENANT_SUBSCRIPTION_STATUS.TRIAL,
      trialEndsAt,
      adminNote: input.adminNote ?? null,
      featureOverrides: (input.featureOverrides ??
        undefined) as Prisma.InputJsonValue | undefined,
    });

    await this.onboarding.bootstrapTenant(tenant.id, tenant.name);

    const user = await this.prisma.user.create({
      data: {
        name: input.ownerName.trim(),
        email: input.ownerEmail.trim().toLowerCase(),
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

    const detail = await this.getTenant(Number(tenant.id));
    return {
      ...detail,
      temporaryPassword: plainPassword,
      ownerEmail: user.email,
    };
  }

  async updateTenant(
    _admin: AuthUser,
    id: string | number,
    input: {
      name?: string;
      adminNote?: string | null;
      billingEmail?: string | null;
      planSlug?: string;
      featureOverrides?: Partial<Record<FeatureKey, boolean>> | null;
    },
  ) {
    const tenantId = BigInt(id);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant || tenant.slug === 'ops') {
      throw new NotFoundException('Salón no encontrado');
    }

    const tenantData: Prisma.TenantUpdateInput = { updatedAt: new Date() };
    if (input.name?.trim()) tenantData.name = input.name.trim();

    const orgData: Prisma.OrganizationUpdateInput = { updatedAt: new Date() };
    if (input.adminNote !== undefined) orgData.adminNote = input.adminNote;
    if (input.billingEmail !== undefined) orgData.billingEmail = input.billingEmail;
    if (input.featureOverrides !== undefined) {
      orgData.featureOverrides =
        input.featureOverrides === null
          ? Prisma.DbNull
          : (input.featureOverrides as Prisma.InputJsonValue);
    }
    if (input.planSlug) {
      const plan = await this.prisma.plan.findUnique({
        where: { slug: input.planSlug },
      });
      if (!plan) throw new NotFoundException('Plan no encontrado');
      orgData.plan = { connect: { id: plan.id } };
    }

    await this.prisma.$transaction([
      this.prisma.tenant.update({ where: { id: tenantId }, data: tenantData }),
      this.prisma.organization.update({
        where: { id: tenant.organizationId },
        data: orgData,
      }),
    ]);

    return this.getTenant(Number(tenantId));
  }

  async extendTrial(_admin: AuthUser, id: string | number, days: number) {
    if (days < 1 || days > 365) {
      throw new BadRequestException('Días entre 1 y 365');
    }
    const tenantId = BigInt(id);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { organization: true },
    });
    if (!tenant || tenant.slug === 'ops') {
      throw new NotFoundException('Salón no encontrado');
    }

    const org = tenant.organization;
    const base =
      org.trialEndsAt && org.trialEndsAt > new Date()
        ? org.trialEndsAt
        : new Date();
    const trialEndsAt = addDays(base, days);
    const status =
      org.subscriptionStatus === TENANT_SUBSCRIPTION_STATUS.SUSPENDED
        ? org.subscriptionStatus
        : TENANT_SUBSCRIPTION_STATUS.TRIAL;

    await this.prisma.organization.update({
      where: { id: org.id },
      data: {
        trialEndsAt,
        subscriptionStatus: status,
        pastDueSince: null,
        updatedAt: new Date(),
      },
    });
    return this.getTenant(Number(tenantId));
  }

  async markPastDue(_admin: AuthUser, id: string | number) {
    const tenantId = BigInt(id);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant || tenant.slug === 'ops') {
      throw new NotFoundException('Salón no encontrado');
    }
    await this.prisma.organization.update({
      where: { id: tenant.organizationId },
      data: {
        subscriptionStatus: TENANT_SUBSCRIPTION_STATUS.PAST_DUE,
        pastDueSince: new Date(),
        updatedAt: new Date(),
      },
    });
    return this.getTenant(Number(tenantId));
  }

  async suspend(admin: AuthUser, id: string | number) {
    requirePlatformOwner(admin);
    const tenantId = BigInt(id);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant || tenant.slug === 'ops') {
      throw new NotFoundException('Salón no encontrado');
    }
    await this.prisma.organization.update({
      where: { id: tenant.organizationId },
      data: {
        subscriptionStatus: TENANT_SUBSCRIPTION_STATUS.SUSPENDED,
        updatedAt: new Date(),
      },
    });
    return this.getTenant(Number(tenantId));
  }

  async reactivate(admin: AuthUser, id: string | number) {
    requirePlatformOwner(admin);
    const tenantId = BigInt(id);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { organization: true },
    });
    if (!tenant || tenant.slug === 'ops') {
      throw new NotFoundException('Salón no encontrado');
    }

    const org = tenant.organization;
    const now = new Date();
    let next: string = TENANT_SUBSCRIPTION_STATUS.PAST_DUE;
    if (org.subscriptionEndsAt && org.subscriptionEndsAt > now) {
      next = TENANT_SUBSCRIPTION_STATUS.ACTIVE;
    } else if (org.trialEndsAt && org.trialEndsAt > now) {
      next = TENANT_SUBSCRIPTION_STATUS.TRIAL;
    }

    await this.prisma.organization.update({
      where: { id: org.id },
      data: {
        subscriptionStatus: next,
        pastDueSince:
          next === TENANT_SUBSCRIPTION_STATUS.PAST_DUE ? now : null,
        updatedAt: now,
      },
    });
    return this.getTenant(Number(tenantId));
  }

  async listPayments(tenantId: string | number) {
    const id = BigInt(tenantId);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });
    if (!tenant || tenant.slug === 'ops') {
      throw new NotFoundException('Salón no encontrado');
    }

    const payments = await this.prisma.saasPayment.findMany({
      where: { organizationId: tenant.organizationId },
      orderBy: { paidAt: 'desc' },
      include: {
        recordedBy: { select: { id: true, name: true, email: true } },
        plan: { select: { slug: true, name: true } },
      },
    });
    return payments.map((p) => this.serializePayment(p, tenant.id));
  }

  async recordPayment(
    admin: AuthUser,
    tenantId: string | number,
    input: {
      amount: number;
      currency?: 'NIO' | 'USD';
      method: 'TRANSFER' | 'DEPOSIT' | 'CASH' | 'OTHER';
      reference?: string;
      paidAt?: string;
      months?: number;
      note?: string;
      planSlug?: string;
    },
  ) {
    if (input.amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a cero');
    }
    const months = input.months ?? 1;
    if (months < 1 || months > 36) {
      throw new BadRequestException('Meses entre 1 y 36');
    }

    const id = BigInt(tenantId);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { organization: true },
    });
    if (!tenant || tenant.slug === 'ops') {
      throw new NotFoundException('Salón no encontrado');
    }

    const org = tenant.organization;
    let planId = org.planId;
    if (input.planSlug) {
      const plan = await this.prisma.plan.findUnique({
        where: { slug: input.planSlug },
      });
      if (!plan?.active) throw new NotFoundException('Plan no encontrado');
      planId = plan.id;
    }

    const paidAt = input.paidAt ? new Date(input.paidAt) : new Date();
    const base =
      org.subscriptionEndsAt && org.subscriptionEndsAt > paidAt
        ? org.subscriptionEndsAt
        : paidAt;
    const subscriptionEndsAt = addMonths(base, months);

    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.saasPayment.create({
        data: {
          organizationId: org.id,
          amount: input.amount,
          currency: input.currency ?? 'NIO',
          method: input.method,
          reference: input.reference ?? null,
          paidAt,
          months,
          note: input.note ?? null,
          recordedById: admin.id,
          planId: planId ?? null,
        },
        include: {
          recordedBy: { select: { id: true, name: true, email: true } },
          plan: { select: { slug: true, name: true } },
        },
      });

      await tx.organization.update({
        where: { id: org.id },
        data: {
          subscriptionStatus: TENANT_SUBSCRIPTION_STATUS.ACTIVE,
          subscriptionEndsAt,
          pastDueSince: null,
          ...(planId ? { planId } : {}),
          updatedAt: new Date(),
        },
      });

      return created;
    });

    return {
      payment: this.serializePayment(payment, tenant.id),
      tenant: await this.getTenant(Number(id)),
    };
  }

  async resetOwnerPassword(admin: AuthUser, tenantId: string | number) {
    requirePlatformOwner(admin);
    const id = BigInt(tenantId);
    const owner = await this.prisma.user.findFirst({
      where: {
        tenantId: id,
        modelHasRoles: { some: { role: { name: 'Admin' } } },
      },
      orderBy: { createdAt: 'asc' },
    });
    if (!owner) {
      throw new NotFoundException('No hay admin en este salón');
    }

    const plainPassword = tempPassword();
    await this.prisma.user.update({
      where: { id: owner.id },
      data: {
        password: await bcrypt.hash(plainPassword, 10),
        updatedAt: new Date(),
      },
    });

    return {
      ownerEmail: owner.email,
      temporaryPassword: plainPassword,
    };
  }

  private async uniqueSlug(base: string) {
    let slug = base;
    let i = 0;
    while (await this.prisma.tenant.findUnique({ where: { slug } })) {
      i += 1;
      slug = `${base}-${i}`;
    }
    return slug;
  }

  private serializePlan(plan: {
    id: bigint;
    name: string;
    slug: string;
    priceUsMonthly: Prisma.Decimal | null;
    priceNiMonthly: Prisma.Decimal | null;
    currencyUs: string;
    currencyNi: string;
    maxEmployees: number | null;
    maxServices: number | null;
    features: string[];
    entitlements: Prisma.JsonValue;
    active: boolean;
    trialDays: number;
  }) {
    return {
      id: Number(plan.id),
      name: plan.name,
      slug: plan.slug,
      priceUsMonthly: plan.priceUsMonthly
        ? Number(plan.priceUsMonthly)
        : null,
      priceNioMonthly: plan.priceNiMonthly
        ? Number(plan.priceNiMonthly)
        : null,
      currencyUs: plan.currencyUs,
      currencyNi: plan.currencyNi,
      maxEmployees: plan.maxEmployees,
      maxServices: plan.maxServices,
      features: plan.features,
      entitlements: plan.entitlements,
      active: plan.active,
      trialDays: plan.trialDays,
    };
  }

  private serializePayment(
    p: {
      id: bigint;
      organizationId: bigint;
      amount: Prisma.Decimal;
      currency: string;
      method: string;
      reference: string | null;
      paidAt: Date;
      months: number;
      note: string | null;
      recordedById: bigint;
      planId: bigint | null;
      createdAt: Date;
      recordedBy?: { id: bigint; name: string; email: string };
      plan?: { slug: string; name: string } | null;
    },
    branchTenantId: bigint | number,
  ) {
    return {
      id: Number(p.id),
      tenantId: Number(branchTenantId),
      organizationId: Number(p.organizationId),
      amount: Number(p.amount),
      currency: p.currency,
      method: p.method,
      reference: p.reference,
      paidAt: p.paidAt,
      months: p.months,
      note: p.note,
      recordedById: Number(p.recordedById),
      planId: p.planId != null ? Number(p.planId) : null,
      createdAt: p.createdAt,
      recordedBy: p.recordedBy
        ? {
            id: Number(p.recordedBy.id),
            name: p.recordedBy.name,
            email: p.recordedBy.email,
          }
        : undefined,
      plan: p.plan ?? null,
    };
  }
}
