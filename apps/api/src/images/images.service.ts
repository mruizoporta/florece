import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenant/tenant.context';

@Injectable()
export class ImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private tenantId(): bigint {
    return this.tenantContext.getTenant().id;
  }

  list(productId?: bigint) {
    return this.prisma.image.findMany({
      where: {
        tenantId: this.tenantId(),
        ...(productId ? { productId } : {}),
      },
      orderBy: [{ productId: 'asc' }, { order: 'asc' }],
    });
  }

  async get(id: bigint) {
    const image = await this.prisma.image.findFirst({
      where: { id, tenantId: this.tenantId() },
    });
    if (!image) {
      throw new NotFoundException('Image not found');
    }
    return image;
  }

  async create(data: { productId: number; image: string; order: number }) {
    const tenantId = this.tenantId();
    const product = await this.prisma.product.findFirst({
      where: { id: BigInt(data.productId), item: { tenantId } },
    });
    if (!product) {
      throw new BadRequestException('Product not found');
    }

    const now = new Date();
    return this.prisma.image.create({
      data: {
        productId: product.id,
        image: data.image,
        order: data.order,
        tenantId,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async update(
    id: bigint,
    data: { image?: string; order?: number },
  ) {
    await this.get(id);
    return this.prisma.image.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async remove(id: bigint) {
    await this.get(id);
    await this.prisma.image.delete({ where: { id } });
    return { deleted: true };
  }
}
