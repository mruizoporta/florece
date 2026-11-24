import type { PrismaService } from '../prisma/prisma.service';

/**
 * Costo de los insumos que gastaron los servicios de tickets cobrados en el rango.
 * Movimientos viejos sin costo guardado usan el costo actual del producto.
 */
export async function consumablesCost(
  prisma: PrismaService,
  tenantId: bigint,
  from: Date,
  to: Date,
): Promise<number> {
  const moves = await prisma.inventoryMovement.findMany({
    where: {
      tenantId,
      type: 'consume',
      order: { status: 'finalized', finalizedAt: { gte: from, lte: to } },
    },
    select: { quantity: true, unitCost: true, product: { select: { cost: true } } },
  });
  const total = moves.reduce(
    (s, m) => s + -m.quantity * Number(m.unitCost ?? m.product.cost),
    0,
  );
  return Math.round(total * 100) / 100;
}
