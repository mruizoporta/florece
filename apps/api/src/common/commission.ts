import type { Prisma } from '@prisma/client';

/**
 * % de comisión de una línea: productos usan el % de productos de la profesional;
 * servicios usan el % propio del servicio y, si no tiene, el de la profesional.
 */
export function lineCommissionRate(
  line: { productId: bigint | null },
  employee: { commissionRate: Prisma.Decimal; productCommissionRate: Prisma.Decimal },
  serviceRate?: Prisma.Decimal | null,
): Prisma.Decimal {
  if (line.productId != null) return employee.productCommissionRate;
  return serviceRate ?? employee.commissionRate;
}
