import { BadRequestException } from '@nestjs/common';
import { Plan } from '@prisma/client';

export type PlanLimitExcess = {
  current: number;
  limit: number;
};

export type PlanLimitExcesses = {
  employees?: PlanLimitExcess;
  services?: PlanLimitExcess;
};

export function getStripePriceIdForRegion(
  plan: Pick<Plan, 'stripePriceIdNi' | 'stripePriceIdUs'>,
  region: string | null | undefined,
): string | null {
  const normalized = (region ?? '').toUpperCase();
  if (normalized === 'US') {
    return plan.stripePriceIdUs ?? plan.stripePriceIdNi ?? null;
  }
  if (normalized === 'NI') {
    return plan.stripePriceIdNi ?? plan.stripePriceIdUs ?? null;
  }
  return plan.stripePriceIdNi ?? plan.stripePriceIdUs ?? null;
}

export function buildPlanLimitMessages(
  exceeds: PlanLimitExcesses,
): Record<string, string> {
  const messages: Record<string, string> = {};
  if (exceeds.employees) {
    messages.employees = `Empleados: tienes ${exceeds.employees.current}, el plan permite ${exceeds.employees.limit}. Reduce antes de hacer downgrade.`;
  }
  if (exceeds.services) {
    messages.services = `Servicios: tienes ${exceeds.services.current}, el plan permite ${exceeds.services.limit}. Reduce antes de hacer downgrade.`;
  }
  return messages;
}

export function assertPlanLimitsOrThrow(exceeds: PlanLimitExcesses): void {
  const messages = buildPlanLimitMessages(exceeds);
  if (Object.keys(messages).length > 0) {
    throw new BadRequestException({
      message: 'El salón excede los límites del plan destino.',
      errors: messages,
      exceeds,
    });
  }
}

export function computePlanLimitExcesses(
  plan: Pick<Plan, 'maxEmployees' | 'maxServices'>,
  counts: { employees: number; services: number },
): PlanLimitExcesses {
  const exceeds: PlanLimitExcesses = {};

  if (plan.maxEmployees != null && counts.employees > plan.maxEmployees) {
    exceeds.employees = {
      current: counts.employees,
      limit: plan.maxEmployees,
    };
  }

  if (plan.maxServices != null && counts.services > plan.maxServices) {
    exceeds.services = {
      current: counts.services,
      limit: plan.maxServices,
    };
  }

  return exceeds;
}

/** Block creating more employees/services when already at the plan cap. */
export function assertCanCreateWithinPlanLimitsOrThrow(
  plan: Pick<Plan, 'maxEmployees' | 'maxServices'>,
  counts: { employees: number; services: number },
  resource: 'employees' | 'services',
): void {
  if (
    resource === 'employees' &&
    plan.maxEmployees != null &&
    counts.employees >= plan.maxEmployees
  ) {
    throw new BadRequestException(
      `Tu plan permite hasta ${plan.maxEmployees} empleados. Actualiza tu plan para agregar más.`,
    );
  }
  if (
    resource === 'services' &&
    plan.maxServices != null &&
    counts.services >= plan.maxServices
  ) {
    throw new BadRequestException(
      `Tu plan permite hasta ${plan.maxServices} servicios. Actualiza tu plan para agregar más.`,
    );
  }
}
