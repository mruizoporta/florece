import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenant/tenant.context';

@Injectable()
export class InstagramService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private tenantId(): bigint {
    return this.tenantContext.getTenant().id;
  }

  list() {
    return this.prisma.instagramFeed.findMany({
      where: { tenantId: this.tenantId(), deletedAt: null },
      orderBy: { id: 'asc' },
    });
  }

  async get(id: bigint) {
    const feed = await this.findActive(id);
    if (!feed) {
      throw new NotFoundException('Instagram feed not found');
    }
    return feed;
  }

  async create(data: { content: string }) {
    const now = new Date();
    return this.prisma.instagramFeed.create({
      data: {
        content: data.content,
        tenantId: this.tenantId(),
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async update(id: bigint, data: { content?: string }) {
    await this.requireActive(id);
    return this.prisma.instagramFeed.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async softDelete(id: bigint) {
    await this.requireActive(id);
    return this.prisma.instagramFeed.update({
      where: { id },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    });
  }

  private findActive(id: bigint) {
    return this.prisma.instagramFeed.findFirst({
      where: { id, tenantId: this.tenantId(), deletedAt: null },
    });
  }

  private async requireActive(id: bigint) {
    const feed = await this.findActive(id);
    if (!feed) {
      throw new NotFoundException('Instagram feed not found');
    }
    return feed;
  }
}
