import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenant/tenant.context';

@Injectable()
export class SponsorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private tenantId(): bigint {
    return this.tenantContext.getTenant().id;
  }

  list() {
    return this.prisma.sponsor.findMany({
      where: { tenantId: this.tenantId(), deletedAt: null },
      orderBy: { id: 'asc' },
    });
  }

  async get(id: bigint) {
    const sponsor = await this.findActive(id);
    if (!sponsor) {
      throw new NotFoundException('Sponsor not found');
    }
    return sponsor;
  }

  async create(data: { name: string; image: string }) {
    const now = new Date();
    return this.prisma.sponsor.create({
      data: {
        name: data.name,
        image: data.image,
        tenantId: this.tenantId(),
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async update(id: bigint, data: { name?: string; image?: string }) {
    await this.requireActive(id);
    return this.prisma.sponsor.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async softDelete(id: bigint) {
    await this.requireActive(id);
    return this.prisma.sponsor.update({
      where: { id },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    });
  }

  private findActive(id: bigint) {
    return this.prisma.sponsor.findFirst({
      where: { id, tenantId: this.tenantId(), deletedAt: null },
    });
  }

  private async requireActive(id: bigint) {
    const sponsor = await this.findActive(id);
    if (!sponsor) {
      throw new NotFoundException('Sponsor not found');
    }
    return sponsor;
  }
}
