import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenant/tenant.context';
import { assertCanCreateWithinPlanLimitsOrThrow } from '../billing/plan-limits';

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
        where: { item: { tenantId, status: true } },
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
    return this.prisma.service.findMany({
      where: {
        item: {
          tenantId,
          ...(search
            ? { name: { contains: search, mode: 'insensitive' } }
            : {}),
        },
      },
      include: { item: { include: { category: true } } },
      take: limit,
      orderBy: { id: 'desc' },
    });
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
      data: { durationTime: data.durationTime, updatedAt: now },
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

  listProducts(search?: string, limit = 50) {
    const tenantId = this.tenantId();
    return this.prisma.product.findMany({
      where: {
        item: {
          tenantId,
          ...(search
            ? { name: { contains: search, mode: 'insensitive' } }
            : {}),
        },
      },
      include: { item: { include: { category: true } } },
      take: limit,
      orderBy: { id: 'desc' },
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
  }) {
    const tenantId = this.tenantId();
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
    return this.prisma.product.create({
      data: {
        itemId: item.id,
        stock: data.stock ?? 0,
        createdAt: now,
        updatedAt: now,
      },
      include: { item: { include: { category: true } } },
    });
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
      stock: number;
    },
  ) {
    const product = await this.requireProduct(productId);
    const now = new Date();
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
    return this.prisma.product.update({
      where: { id: productId },
      data: { stock: data.stock, updatedAt: now },
      include: { item: { include: { category: true } } },
    });
  }

  async archiveProduct(productId: bigint) {
    const product = await this.requireProduct(productId);
    await this.prisma.item.update({
      where: { id: product.itemId },
      data: { status: false, updatedAt: new Date() },
    });
    return { id: productId, archived: true };
  }

  async updateProductStock(productId: bigint, stock: number) {
    await this.requireProduct(productId);
    return this.prisma.product.update({
      where: { id: productId },
      data: { stock, updatedAt: new Date() },
      include: { item: true },
    });
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

  private mapService(
    service: Prisma.ServiceGetPayload<{
      include: { item: { include: { category: true } } };
    }>,
  ) {
    return {
      id: service.id,
      durationTime: service.durationTime,
      item: service.item,
    };
  }

  private mapProduct(
    product: Prisma.ProductGetPayload<{
      include: { item: { include: { category: true } } };
    }>,
  ) {
    return {
      id: product.id,
      stock: product.stock,
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
