import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async bootstrapTenant(tenantId: bigint, tenantName: string): Promise<void> {
    const now = new Date();

    const statusRows = [
      { name: 'Cancelado', color: 'danger', description: 'Cancelado' },
      { name: 'Pendiente', color: 'warning', description: 'Pendiente' },
      { name: 'En espera', color: 'success', description: 'En espera' },
      { name: 'Atendiendo', color: 'info', description: 'Atendiendo' },
      { name: 'Concluido', color: 'primary', description: 'Concluido' },
    ];

    for (const row of statusRows) {
      await this.prisma.status.create({
        data: {
          name: row.name,
          description: row.description,
          color: row.color,
          tenantId,
        },
      });
    }

    const typeRows = ['Flash', 'Local', 'Web'];

    for (const name of typeRows) {
      await this.prisma.type.create({
        data: {
          name,
          description: name,
          tenantId,
        },
      });
    }

    const categoryRows = [
      { name: 'Cortes', slug: 'cortes' },
      { name: 'Peinados', slug: 'peinados' },
      { name: 'Color', slug: 'color' },
      { name: 'Tratamientos', slug: 'tratamientos' },
    ];

    for (const row of categoryRows) {
      await this.prisma.category.create({
        data: {
          name: row.name,
          slug: row.slug,
          tenantId,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    const socialRows = [
      { name: 'Instagram', icon: 'instagram' },
      { name: 'Linkedin', icon: 'linkedin-in' },
      { name: 'Facebook', icon: 'facebook' },
      { name: 'TikTok', icon: 'tiktok' },
      { name: 'Website', icon: 'link' },
    ];

    for (const row of socialRows) {
      await this.prisma.social.create({
        data: {
          name: row.name,
          icon: row.icon,
          tenantId,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    await this.prisma.section.create({
      data: {
        tenantId,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.prisma.setting.create({
      data: {
        companyName: tenantName,
        tenantId,
      },
    });

    await this.bootstrapExpenseCategories(tenantId, now);
  }

  async bootstrapExpenseCategories(tenantId: bigint, now = new Date()) {
    const rows = [
      { name: 'Alquiler', slug: 'alquiler' },
      { name: 'Insumos', slug: 'insumos' },
      { name: 'Servicios', slug: 'servicios' },
      { name: 'Marketing', slug: 'marketing' },
      { name: 'Sueldos', slug: 'sueldos' },
      { name: 'Otros', slug: 'otros' },
    ];
    for (const row of rows) {
      await this.prisma.expenseCategory.upsert({
        where: {
          tenantId_slug: { tenantId, slug: row.slug },
        },
        create: {
          tenantId,
          name: row.name,
          slug: row.slug,
          active: true,
          createdAt: now,
          updatedAt: now,
        },
        update: { active: true, updatedAt: now },
      });
    }
  }

  async ensureAdminRole(userId: bigint, tenantId: bigint): Promise<void> {
    const now = new Date();
    for (const name of ['Admin', 'Recepcionista', 'Cajero'] as const) {
      let role = await this.prisma.role.findFirst({
        where: { name, guardName: 'web' },
      });
      if (!role) {
        role = await this.prisma.role.create({
          data: {
            name,
            guardName: 'web',
            createdAt: now,
            updatedAt: now,
          },
        });
      }
      if (name === 'Admin') {
        await this.prisma.modelHasRole.upsert({
          where: {
            roleId_modelId_modelType: {
              roleId: role.id,
              modelId: userId,
              modelType: 'App\\Models\\User',
            },
          },
          create: {
            roleId: role.id,
            modelId: userId,
            modelType: 'App\\Models\\User',
          },
          update: {},
        });
      }
    }
    void tenantId;
  }
}
