import { Injectable, NotFoundException } from '@nestjs/common';
import {
  FeatureKey,
  resolveEntitlements,
  type PlanFeatures,
} from '@florece/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(tenantId: bigint) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        organization: { include: { plan: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const org = tenant.organization;
    const overrides =
      org.featureOverrides &&
      typeof org.featureOverrides === 'object' &&
      !Array.isArray(org.featureOverrides)
        ? (org.featureOverrides as Partial<Record<FeatureKey, boolean>>)
        : null;

    const planEntitlements =
      org.plan?.entitlements &&
      typeof org.plan.entitlements === 'object' &&
      !Array.isArray(org.plan.entitlements)
        ? (org.plan.entitlements as Partial<Record<FeatureKey, boolean>>)
        : null;

    return resolveEntitlements({
      planSlug: org.plan?.slug,
      plan: org.plan
        ? {
            slug: org.plan.slug,
            name: org.plan.name,
            maxEmployees: org.plan.maxEmployees,
            maxServices: org.plan.maxServices,
            features: org.plan.features,
            entitlements: planEntitlements ?? undefined,
          }
        : null,
      featureOverrides: overrides,
    });
  }

  async hasFeature(tenantId: bigint, key: FeatureKey): Promise<boolean> {
    const resolved = await this.resolve(tenantId);
    return Boolean(resolved.features[key]);
  }

  async featuresMap(tenantId: bigint): Promise<PlanFeatures> {
    return (await this.resolve(tenantId)).features;
  }
}
