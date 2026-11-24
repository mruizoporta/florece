import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  isRecipeUsage,
  isSellableUsage,
  normalizeProductUnit,
  normalizeProductUsage,
  type ProductUnit,
  type ProductUsage,
} from '@florece/shared';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenant/tenant.context';
import { assertCanCreateWithinPlanLimitsOrThrow } from '../billing/plan-limits';

export type ProductListFor = 'sale' | 'recipe' | 'all';

/** Costo promedio ponderado tras un ingreso. Stock negativo o cero: manda el costo nuevo. */
export function averageCost(
  stock: number,
  currentCost: number,
  qty: number,
  unitCost: number,
) {
  if (stock <= 0) return unitCost;
  return Math.round(((stock * currentCost + qty * unitCost) / (stock + qty)) * 100) / 100;
}

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private tenantId(): bigint {
    return this.tenantContext.getTenant().id;
  }

  async getPublicCatalog() {
    const tenantId = this.tenantId();
    const [categories, services, products] = await Promise.all([
      this.prisma.category.findMany({
        where: { tenantId },
        orderBy: { name: 'asc' },
      }),
      this.prisma.service.findMany({
        where: { item: { tenantId, status: true } },
        include: { item: { include: { category: true } } },
      }),
      this.prisma.product.findMany({
        where: {
          item: { tenantId, status: true },
          usage: { in: ['retail', 'both'] },
        },
        include: { item: { include: { category: true } } },
      }),
    ]);

    return {
      categories,
      services: services.map((s) => this.mapService(s)),
      products: products.map((p) => this.mapProduct(p)),
    };
  }

  listServices(search?: string, limit = 50) {
    const tenantId = this.tenantId();
    return this.prisma.service
      .findMany({
        where: {
          item: {
            tenantId,
            ...(search
              ? { name: { contains: search, mode: 'insensitive' } }
              : {}),
          },
        },
        include: {
          item: { include: { category: true } },
          consumables: {
            include: {
              product: { include: { item: { select: { name: true } } } },
            },
            orderBy: { id: 'asc' },
          },
        },
        take: limit,
        orderBy: { id: 'desc' },
      })
      .then((rows) => rows.map((s) => this.mapService(s)));
  }

  async createService(data: {
    categoryId: number;
    name: string;
    slug: string;
    price: number;
    description: string;
    image?: string | null;
    status?: boolean;
    durationTime: number;
    commissionRate?: number | null;
  }) {
    const tenantId = this.tenantId();
    await this.assertServiceLimit(tenantId);
    const now = new Date();
    const item = await this.prisma.item.create({
      data: {
        categoryId: BigInt(data.categoryId),
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: new Prisma.Decimal(data.price),
        image: data.image ?? null,
        status: data.status ?? true,
        tenantId,
        createdAt: now,
        updatedAt: now,
      },
    });
    return this.prisma.service.create({
      data: {
        itemId: item.id,
        durationTime: data.durationTime,
        commissionRate: this.checkRate(data.commissionRate),
        createdAt: now,
        updatedAt: now,
      },
      include: { item: { include: { category: true } } },
    });
  }

  private async assertServiceLimit(tenantId: bigint) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { organization: { include: { plan: true } } },
    });
    const plan = tenant?.organization?.plan;
    if (!plan) return;
    const services = await this.prisma.service.count({
      where: { item: { tenantId, status: true } },
    });
    assertCanCreateWithinPlanLimitsOrThrow(
      plan,
      { employees: 0, services },
      'services',
    );
  }

  async updateService(
    serviceId: bigint,
    data: {
      categoryId: number;
      name: string;
      slug: string;
      price: number;
      description: string;
      image?: string | null;
      status: boolean;
      durationTime: number;
      commissionRate?: number | null;
    },
  ) {
    const service = await this.requireService(serviceId);
    const now = new Date();
    await this.prisma.item.update({
      where: { id: service.itemId },
      data: {
        categoryId: BigInt(data.categoryId),
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: new Prisma.Decimal(data.price),
        image: data.image ?? null,
        status: data.status,
        updatedAt: now,
      },
    });
    return this.prisma.service.update({
      where: { id: serviceId },
      data: {
        durationTime: data.durationTime,
        ...(data.commissionRate !== undefined
          ? { commissionRate: this.checkRate(data.commissionRate) }
          : {}),
        updatedAt: now,
      },
      include: { item: { include: { category: true } } },
    });
  }

  async archiveService(serviceId: bigint) {
    const service = await this.requireService(serviceId);
    await this.prisma.item.update({
      where: { id: service.itemId },
      data: { status: false, updatedAt: new Date() },
    });
    return { id: serviceId, archived: true };
  }

  listProducts(
    search?: string,
    limit = 50,
    lowOnly = false,
    forUse: ProductListFor = 'all',
  ) {
    const tenantId = this.tenantId();
    const usageFilter =
      forUse === 'sale'
        ? { usage: { in: ['retail', 'both'] } }
        : forUse === 'recipe'
          ? { usage: { in: ['internal', 'both'] } }
          : {};

    return this.prisma.product
      .findMany({
        where: {
          ...usageFilter,
          item: { tenantId },
          ...(search
            ? {
                OR: [
                  { item: { name: { contains: search, mode: 'insensitive' } } },
                  { barcode: search.trim() },
                ],
              }
            : {}),
        },
        include: { item: { include: { category: true } } },
        take: Math.min(Math.max(limit, 1), 200),
        orderBy: { id: 'desc' },
      })
      .then((rows) => {
        const mapped = rows.map((p) => this.mapProduct(p));
        return lowOnly ? mapped.filter((p) => p.lowStock) : mapped;
      });
  }

  async createProduct(data: {
    categoryId: number;
    name: string;
    slug: string;
    price: number;
    description: string;
    image?: string | null;
    status?: boolean;
    stock?: number;
    minStock?: number;
    usage?: string;
    unit?: string;
    barcode?: string | null;
    cost?: number;
  }) {
    const tenantId = this.tenantId();
    const now = new Date();
    const barcode = await this.checkBarcode(data.barcode);
    const cost = this.checkCost(data.cost) ?? 0;
    const stock = Math.max(0, Math.floor(data.stock ?? 0));
    const minStock = Math.max(0, Math.floor(data.minStock ?? 0));
    const usage = normalizeProductUsage(data.usage);
    const unit = normalizeProductUnit(data.unit);
    const item = await this.prisma.item.create({
      data: {
        categoryId: BigInt(data.categoryId),
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: new Prisma.Decimal(data.price),
        image: data.image ?? null,
        status: data.status ?? true,
        tenantId,
        createdAt: now,
        updatedAt: now,
      },
    });
    const product = await this.prisma.product.create({
      data: {
        itemId: item.id,
        stock,
        minStock,
        usage,
        unit,
        barcode,
        cost,
        createdAt: now,
        updatedAt: now,
      },
      include: { item: { include: { category: true } } },
    });

    if (stock > 0) {
      await this.prisma.inventoryMovement.create({
        data: {
          tenantId,
          productId: product.id,
          type: 'receive',
          quantity: stock,
          stockAfter: stock,
          reason: 'Stock inicial',
          unitCost: cost || null,
          createdAt: now,
        },
      });
    }

    return this.mapProduct(product);
  }

  async updateProduct(
    productId: bigint,
    data: {
      categoryId: number;
      name: string;
      slug: string;
      price: number;
      description: string;
      image?: string | null;
      status: boolean;
      stock?: number;
      minStock?: number;
      usage?: string;
      unit?: string;
      barcode?: string | null;
      cost?: number;
    },
    userId?: bigint | null,
  ) {
    const product = await this.requireProduct(productId);
    const now = new Date();
    const cost = this.checkCost(data.cost) ?? product.cost;
    const barcode =
      data.barcode !== undefined
        ? await this.checkBarcode(data.barcode, productId)
        : product.barcode;
    const minStock =
      data.minStock != null
        ? Math.max(0, Math.floor(data.minStock))
        : product.minStock;
    const usage =
      data.usage != null
        ? normalizeProductUsage(data.usage)
        : normalizeProductUsage(product.usage);
    const unit =
      data.unit != null
        ? normalizeProductUnit(data.unit)
        : normalizeProductUnit(product.unit);

    await this.prisma.item.update({
      where: { id: product.itemId },
      data: {
        categoryId: BigInt(data.categoryId),
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: new Prisma.Decimal(data.price),
        image: data.image ?? null,
        status: data.status,
        updatedAt: now,
      },
    });

    if (data.stock != null && data.stock !== product.stock) {
      const next = Math.max(0, Math.floor(data.stock));
      const delta = next - product.stock;
      await this.prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: productId },
          data: { stock: next, minStock, usage, unit, barcode, cost, updatedAt: now },
        });
        await tx.inventoryMovement.create({
          data: {
            tenantId: this.tenantId(),
            productId,
            userId: userId ?? null,
            type: 'adjustment',
            quantity: delta,
            stockAfter: next,
            reason: 'Ajuste desde ficha de producto',
            createdAt: now,
          },
        });
      });
    } else {
      await this.prisma.product.update({
        where: { id: productId },
        data: { minStock, usage, unit, barcode, cost, updatedAt: now },
      });
    }

    const updated = await this.prisma.product.findFirstOrThrow({
      where: { id: productId },
      include: { item: { include: { category: true } } },
    });
    return this.mapProduct(updated);
  }

  async archiveProduct(productId: bigint) {
    const product = await this.requireProduct(productId);
    await this.prisma.item.update({
      where: { id: product.itemId },
      data: { status: false, updatedAt: new Date() },
    });
    return { id: productId, archived: true };
  }

  /**
   * Signed stock change with reason (receive / adjustment / correction).
   * delta > 0 adds stock; delta < 0 removes.
   */
  async adjustProductStock(
    productId: bigint,
    data: {
      delta: number;
      reason?: string;
      type?: string;
      unitCost?: number | null;
      supplier?: string | null;
    },
    userId?: bigint | null,
  ) {
    const delta = Math.trunc(data.delta);
    if (!delta) {
      throw new BadRequestException('delta must be a non-zero integer');
    }
    const reason = data.reason?.trim() || null;
    if (!reason) {
      throw new BadRequestException('reason is required');
    }
    const type =
      data.type === 'receive' || data.type === 'adjustment'
        ? data.type
        : delta > 0
          ? 'receive'
          : 'adjustment';

    const product = await this.requireProduct(productId);
    const next = product.stock + delta;
    if (next < 0) {
      throw new BadRequestException(
        `Stock insuficiente (hay ${product.stock}, delta ${delta})`,
      );
    }

    // Solo los ingresos con costo mueven el promedio; ajustes y salidas no.
    const unitCost =
      type === 'receive' && delta > 0 ? this.checkCost(data.unitCost) : null;
    const cost =
      unitCost == null
        ? product.cost
        : averageCost(product.stock, Number(product.cost), delta, unitCost);
    const supplier = type === 'receive' ? data.supplier?.trim().slice(0, 120) || null : null;

    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.product.update({
        where: { id: productId },
        data: { stock: next, cost, updatedAt: now },
        include: { item: { include: { category: true } } },
      });
      await tx.inventoryMovement.create({
        data: {
          tenantId: this.tenantId(),
          productId,
          userId: userId ?? null,
          type,
          quantity: delta,
          stockAfter: next,
          reason,
          unitCost,
          supplier,
          createdAt: now,
        },
      });
      return row;
    });

    return this.mapProduct(updated);
  }

  listProductMovements(productId: bigint, limit = 40) {
    return this.requireProduct(productId).then(() =>
      this.prisma.inventoryMovement.findMany({
        where: { productId, tenantId: this.tenantId() },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: Math.min(Math.max(limit, 1), 100),
        include: {
          user: { select: { id: true, name: true } },
          order: { select: { id: true, name: true, status: true } },
        },
      }),
    );
  }

  listLowStock(limit = 50) {
    return this.listProducts(undefined, limit, true);
  }

  listCategories() {
    return this.prisma.category.findMany({
      where: { tenantId: this.tenantId() },
      orderBy: { name: 'asc' },
    });
  }

  createCategory(data: { name: string; slug?: string }) {
    const now = new Date();
    return this.prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug ?? null,
        tenantId: this.tenantId(),
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async updateCategory(
    categoryId: bigint,
    data: { name: string; slug?: string },
  ) {
    await this.requireCategory(categoryId);
    return this.prisma.category.update({
      where: { id: categoryId },
      data: { name: data.name, slug: data.slug ?? null, updatedAt: new Date() },
    });
  }

  async deleteCategory(categoryId: bigint) {
    const count = await this.prisma.item.count({
      where: { categoryId, tenantId: this.tenantId() },
    });
    if (count > 0) {
      throw new BadRequestException('Category has items');
    }
    await this.requireCategory(categoryId);
    await this.prisma.category.delete({ where: { id: categoryId } });
    return { deleted: true };
  }

  listServiceConsumables(serviceId: bigint) {
    return this.requireService(serviceId).then(() =>
      this.prisma.serviceConsumable.findMany({
        where: { serviceId, tenantId: this.tenantId() },
        include: {
          product: { include: { item: { select: { name: true } } } },
        },
        orderBy: { id: 'asc' },
      }),
    ).then((rows) => rows.map((r) => this.mapConsumable(r)));
  }

  /**
   * Replace the full recipe for a service (units = same unit as product stock).
   * Only internal / both products are allowed.
   */
  async setServiceConsumables(
    serviceId: bigint,
    items: Array<{ productId: number; quantity: number }>,
  ) {
    await this.requireService(serviceId);
    const tenantId = this.tenantId();
    const now = new Date();
    const cleaned: Array<{ productId: bigint; quantity: number }> = [];
    const seen = new Set<string>();

    for (const raw of items) {
      const qty = Math.trunc(Number(raw.quantity));
      if (!Number.isFinite(qty) || qty < 1) {
        throw new BadRequestException('Cada insumo necesita cantidad ≥ 1');
      }
      const productId = BigInt(raw.productId);
      const key = productId.toString();
      if (seen.has(key)) {
        throw new BadRequestException('Producto duplicado en la receta');
      }
      seen.add(key);
      const product = await this.prisma.product.findFirst({
        where: { id: productId, item: { tenantId } },
        include: { item: { select: { name: true } } },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      const usage = normalizeProductUsage(product.usage);
      if (!isRecipeUsage(usage)) {
        throw new BadRequestException(
          `«${product.item.name}» es solo vitrina; usá un producto de uso interno (insumo) o Ambos`,
        );
      }
      cleaned.push({ productId, quantity: qty });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.serviceConsumable.deleteMany({
        where: { serviceId, tenantId },
      });
      if (cleaned.length === 0) return;
      await tx.serviceConsumable.createMany({
        data: cleaned.map((c) => ({
          tenantId,
          serviceId,
          productId: c.productId,
          quantity: c.quantity,
          createdAt: now,
          updatedAt: now,
        })),
      });
    });

    return this.listServiceConsumables(serviceId);
  }

  private mapConsumable(row: {
    id: bigint;
    productId: bigint;
    quantity: number;
    product: {
      stock: number;
      usage?: string;
      unit?: string;
      item: { name: string };
    };
  }) {
    const usage = normalizeProductUsage(row.product.usage);
    const unit = normalizeProductUnit(row.product.unit);
    return {
      id: Number(row.id),
      productId: Number(row.productId),
      quantity: row.quantity,
      productName: row.product.item.name,
      stock: row.product.stock,
      usage,
      unit,
    };
  }

  private mapService(service: {
    id: bigint;
    durationTime: number;
    commissionRate?: Prisma.Decimal | null;
    item: Prisma.ItemGetPayload<{ include: { category: true } }>;
    consumables?: Array<{
      id: bigint;
      productId: bigint;
      quantity: number;
      product: {
        stock: number;
        usage?: string;
        unit?: string;
        item: { name: string };
      };
    }>;
  }) {
    const consumables = service.consumables?.map((c) => this.mapConsumable(c));
    return {
      id: Number(service.id),
      durationTime: service.durationTime,
      commissionRate:
        service.commissionRate == null ? null : Number(service.commissionRate),
      item: service.item,
      consumables: consumables ?? [],
      consumablesCount: consumables?.length ?? 0,
    };
  }

  /** Comisión propia del servicio: vacío = la de cada profesional. */
  private checkRate(raw?: number | null) {
    if (raw == null || (raw as unknown) === '') return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      throw new BadRequestException('La comisión debe estar entre 0 y 100%');
    }
    return n;
  }

  private checkCost(raw?: number | null) {
    if (raw == null || (raw as unknown) === '') return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) {
      throw new BadRequestException('El costo debe ser un número mayor o igual a 0');
    }
    return Math.round(n * 100) / 100;
  }

  /** Normaliza el código y evita que dos productos del salón compartan el mismo (el lector no sabría cuál vender). */
  private async checkBarcode(raw?: string | null, exceptId?: bigint) {
    const barcode = raw?.trim() || null;
    if (!barcode) return null;
    if (barcode.length > 64) {
      throw new BadRequestException('El código de barras es demasiado largo');
    }
    const taken = await this.prisma.product.findFirst({
      where: {
        barcode,
        item: { tenantId: this.tenantId() },
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      include: { item: true },
    });
    if (taken) {
      throw new BadRequestException(
        `Ese código ya lo tiene «${taken.item.name}»`,
      );
    }
    return barcode;
  }

  private mapProduct(
    product: Prisma.ProductGetPayload<{
      include: { item: { include: { category: true } } };
    }>,
  ) {
    const lowStock = product.stock <= product.minStock;
    const usage = normalizeProductUsage(product.usage) as ProductUsage;
    const unit = normalizeProductUnit(product.unit) as ProductUnit;
    return {
      id: Number(product.id),
      stock: product.stock,
      minStock: product.minStock,
      lowStock,
      usage,
      unit,
      barcode: product.barcode,
      cost: Number(product.cost),
      sellable: isSellableUsage(usage),
      recipeEligible: isRecipeUsage(usage),
      item: product.item,
    };
  }

  private async requireService(serviceId: bigint) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, item: { tenantId: this.tenantId() } },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  private async requireProduct(productId: bigint) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, item: { tenantId: this.tenantId() } },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  private async requireCategory(categoryId: bigint) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, tenantId: this.tenantId() },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }
}
