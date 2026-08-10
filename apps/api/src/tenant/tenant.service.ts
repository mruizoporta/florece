import { Injectable, NotFoundException } from '@nestjs/common';
import { DEMO_SLUG } from '@florece/shared';
import { PrismaService } from '../prisma/prisma.service';
import type {
  OrganizationWithPlan,
  TenantWithOrganization,
} from '../organizations/organizations.types';

export type { OrganizationWithPlan, TenantWithOrganization };
export const TENANT_STATUS = {
  ACTIVE: 'active',
  TRIAL: 'trial',
  PENDING_PAYMENT: 'pending_payment',
  PAST_DUE: 'past_due',
  SUSPENDED: 'suspended',
  CANCELED: 'canceled',
  EXPIRED: 'expired',
} as const;

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<TenantWithOrganization | null> {
    return this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        organization: { include: { plan: true, scheduledPlan: true } },
      },
    });
  }

  async findById(id: bigint): Promise<TenantWithOrganization | null> {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: {
        organization: { include: { plan: true, scheduledPlan: true } },
      },
    });
  }

  async requireBySlug(slug: string): Promise<TenantWithOrganization> {
    const tenant = await this.findBySlug(slug);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  isDemo(tenant: { isDemo: boolean; slug: string }): boolean {
    if (tenant.isDemo) {
      return true;
    }
    return tenant.slug.toLowerCase() === DEMO_SLUG.toLowerCase();
  }

  orgOf(tenant: TenantWithOrganization): OrganizationWithPlan {
    return tenant.organization;
  }

  hasActiveSubscription(tenant: TenantWithOrganization): boolean {
    if (this.isDemo(tenant)) {
      return true;
    }

    const org = tenant.organization;

    if (org.subscriptionStatus === TENANT_STATUS.PENDING_PAYMENT) {
      return false;
    }

    if (org.subscriptionStatus === TENANT_STATUS.ACTIVE) {
      return true;
    }

    if (
      org.subscriptionStatus === TENANT_STATUS.TRIAL &&
      org.trialEndsAt &&
      org.trialEndsAt.getTime() > Date.now()
    ) {
      return true;
    }

    return false;
  }
}
