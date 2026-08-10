import { Organization, Plan, Tenant } from '@prisma/client';

export type OrganizationWithPlan = Organization & {
  plan: Plan | null;
  scheduledPlan: Plan | null;
};

export type TenantWithOrganization = Tenant & {
  organization: OrganizationWithPlan;
};
