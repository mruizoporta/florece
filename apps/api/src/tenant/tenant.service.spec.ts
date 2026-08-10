import { DEMO_SLUG } from '@florece/shared';
import { TENANT_STATUS, TenantService } from './tenant.service';
import type { TenantWithOrganization } from '../organizations/organizations.types';

describe('TenantService.hasActiveSubscription', () => {
  const service = new TenantService(null as never);

  const baseTenant = (): TenantWithOrganization =>
    ({
      id: 1n,
      organizationId: 1n,
      name: 'Test',
      slug: 'test',
      isDemo: false,
      locale: 'es',
      createdAt: new Date(),
      updatedAt: new Date(),
      organization: {
        id: 1n,
        name: 'Test Org',
        billingRegion: 'NI',
        billingEmail: null,
        planId: null,
        scheduledPlanId: null,
        subscriptionStatus: TENANT_STATUS.TRIAL,
        subscriptionEndsAt: null,
        trialEndsAt: new Date(Date.now() + 86_400_000),
        pastDueSince: null,
        adminNote: null,
        featureOverrides: null,
        stripeId: null,
        pmType: null,
        pmLastFour: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: null,
        scheduledPlan: null,
      },
    }) as TenantWithOrganization;

  it('returns true for demo tenant by isDemo flag', () => {
    const tenant = { ...baseTenant(), isDemo: true };
    expect(service.hasActiveSubscription(tenant)).toBe(true);
  });

  it('returns true for demo slug even without isDemo flag', () => {
    const tenant = { ...baseTenant(), slug: DEMO_SLUG, isDemo: false };
    expect(service.hasActiveSubscription(tenant)).toBe(true);
  });

  it('returns false for pending_payment', () => {
    const tenant = baseTenant();
    tenant.organization.subscriptionStatus = TENANT_STATUS.PENDING_PAYMENT;
    expect(service.hasActiveSubscription(tenant)).toBe(false);
  });

  it('returns true for active subscription', () => {
    const tenant = baseTenant();
    tenant.organization.subscriptionStatus = TENANT_STATUS.ACTIVE;
    expect(service.hasActiveSubscription(tenant)).toBe(true);
  });

  it('returns true for trial with future trialEndsAt', () => {
    const tenant = baseTenant();
    tenant.organization.subscriptionStatus = TENANT_STATUS.TRIAL;
    tenant.organization.trialEndsAt = new Date(Date.now() + 86_400_000);
    expect(service.hasActiveSubscription(tenant)).toBe(true);
  });

  it('returns false for expired trial', () => {
    const tenant = baseTenant();
    tenant.organization.subscriptionStatus = TENANT_STATUS.TRIAL;
    tenant.organization.trialEndsAt = new Date(Date.now() - 86_400_000);
    expect(service.hasActiveSubscription(tenant)).toBe(false);
  });

  it('returns false for canceled without active status', () => {
    const tenant = baseTenant();
    tenant.organization.subscriptionStatus = TENANT_STATUS.CANCELED;
    tenant.organization.trialEndsAt = null;
    expect(service.hasActiveSubscription(tenant)).toBe(false);
  });
});
