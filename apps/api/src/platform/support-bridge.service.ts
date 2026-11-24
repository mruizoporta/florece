import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AuthUser } from '../common/types/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformService } from './platform.service';

function emptyClient(partial: {
  id: string;
  name: string;
  status: string | null;
  planName: string | null;
  planCode: string | null;
  ownerEmail: string | null;
  adminNote: string | null;
  trialEndsAt: string | null;
  periodEnd: string | null;
}) {
  return {
    ...partial,
    ownerName: null as string | null,
    openaiHasKey: false,
    openaiLast4: null as string | null,
    openaiSupported: false,
    phone: null as string | null,
    ruc: null as string | null,
    limits: null,
    members: [] as Array<{ id: string; name: string; email: string; role: string }>,
    payments: [] as Array<{
      id: string;
      amount: number;
      currency: string;
      method: string;
      paidAt: string;
      reference: string | null;
      note: string | null;
    }>,
  };
}

@Injectable()
export class SupportBridgeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platform: PlatformService,
  ) {}

  async overview() {
    const data = await this.platform.overview();
    return {
      totalClients: data.totalTenants,
      statusCounts: data.statusCounts,
      revenueThisMonth: data.revenueThisMonth,
      paymentsThisMonth: data.paymentsThisMonth,
      capabilities: { plans: true, billing: true, lifecycle: true },
      expiringSoon: data.expiringSoon.map((row) => ({
        id: String(row.tenantId),
        name: row.name,
        plan: row.plan,
        periodEnd: row.periodEnd ? new Date(row.periodEnd).toISOString() : null,
      })),
    };
  }

  async plans() {
    const rows = await this.platform.listPlans();
    return rows.map((p) => ({
      code: p.slug,
      name: p.name,
      priceUsd: p.priceUsMonthly,
      active: p.active,
      detail: p.maxEmployees != null ? `${p.maxEmployees} empleados` : null,
    }));
  }

  async updatePlan(code: string, input: { name?: string; priceUsd?: number; active?: boolean }) {
    await this.platform.updatePlan(await this.actor(), code, {
      name: input.name,
      priceUsdMonthly: input.priceUsd,
      active: input.active,
    });
    return this.plans();
  }

  async list() {
    const rows = await this.platform.listTenants({});
    return rows.map((row) =>
      emptyClient({
        id: String(row.id),
        name: row.name,
        status: row.subscriptionStatus,
        planName: row.plan?.name ?? null,
        planCode: row.plan?.slug ?? null,
        ownerEmail: row.billingEmail,
        adminNote: row.adminNote,
        trialEndsAt: row.trialEndsAt ? new Date(row.trialEndsAt).toISOString() : null,
        periodEnd: row.subscriptionEndsAt
          ? new Date(row.subscriptionEndsAt).toISOString()
          : null,
      }),
    );
  }

  async createClient(input: {
    name: string;
    ownerEmail: string;
    ownerName: string;
    planCode?: string;
    adminNote?: string;
  }) {
    const created = await this.platform.createTenant(await this.actor(), {
      salonName: input.name,
      ownerEmail: input.ownerEmail,
      ownerName: input.ownerName,
      planSlug: input.planCode,
      adminNote: input.adminNote,
    });
    return {
      temporaryPassword: created.temporaryPassword,
      ownerEmail: created.ownerEmail,
      client: await this.detail(created.id),
    };
  }

  getOne(id: string) {
    return this.detail(id);
  }

  async updateClient(
    id: string,
    input: { name?: string; planCode?: string; adminNote?: string | null },
  ) {
    await this.platform.updateTenant(await this.actor(), id, {
      name: input.name,
      planSlug: input.planCode,
      adminNote: input.adminNote,
    });
    return this.detail(id);
  }

  async runAction(
    id: string,
    action: 'suspend' | 'reactivate' | 'past-due' | 'extend-trial' | 'reset-password',
    days?: number,
  ) {
    const admin = await this.actor();
    if (action === 'suspend') await this.platform.suspend(admin, id);
    else if (action === 'reactivate') await this.platform.reactivate(admin, id);
    else if (action === 'past-due') await this.platform.markPastDue(admin, id);
    else if (action === 'extend-trial') await this.platform.extendTrial(admin, id, days ?? 14);
    else {
      const reset = await this.platform.resetOwnerPassword(admin, id);
      return {
        client: await this.detail(id),
        temporaryPassword: reset.temporaryPassword,
        ownerEmail: reset.ownerEmail,
      };
    }
    return { client: await this.detail(id) };
  }

  async recordPayment(
    id: string,
    input: {
      amount: number;
      currency?: 'NIO' | 'USD';
      method: 'TRANSFER' | 'DEPOSIT' | 'CASH' | 'OTHER';
      reference?: string;
      paidAt?: string;
      months?: number;
      note?: string;
      planCode?: string;
    },
  ) {
    await this.platform.recordPayment(await this.actor(), id, {
      ...input,
      planSlug: input.planCode,
    });
    return this.detail(id);
  }

  private async detail(id: string | number) {
    const tenant = await this.platform.getTenant(id);
    const owner = tenant.owners[0];
    return {
      id: String(tenant.id),
      name: tenant.name,
      status: tenant.subscriptionStatus,
      planName: tenant.plan?.name ?? null,
      planCode: tenant.plan?.slug ?? null,
      ownerName: owner?.name ?? null,
      ownerEmail: owner?.email ?? tenant.billingEmail,
      openaiHasKey: false,
      openaiLast4: null,
      openaiSupported: false,
      adminNote: tenant.adminNote,
      phone: null,
      ruc: null,
      trialEndsAt: tenant.trialEndsAt ? new Date(tenant.trialEndsAt).toISOString() : null,
      periodEnd: tenant.subscriptionEndsAt
        ? new Date(tenant.subscriptionEndsAt).toISOString()
        : null,
      limits: null,
      members: tenant.owners.map((o) => ({
        id: String(o.id),
        name: o.name,
        email: o.email,
        role: 'OWNER',
      })),
      payments: tenant.payments.map((p) => ({
        id: String(p.id),
        amount: p.amount,
        currency: p.currency,
        method: p.method,
        paidAt: new Date(p.paidAt).toISOString(),
        reference: p.reference,
        note: p.note,
      })),
    };
  }

  private async actor(): Promise<AuthUser> {
    const user = await this.prisma.user.findFirst({
      where: { platformRole: 'PLATFORM_OWNER' },
      orderBy: { createdAt: 'asc' },
    });
    if (!user) {
      throw new ServiceUnavailableException(
        'No hay un dueño de plataforma para registrar la acción',
      );
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      tenantId: user.tenantId,
      roles: [],
      platformRole: 'PLATFORM_OWNER',
    };
  }
}
