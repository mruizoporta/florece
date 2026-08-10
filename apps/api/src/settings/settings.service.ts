import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenant/tenant.context';

const SETTING_UPLOAD_FIELDS = [
  'logo',
  'banner',
  'imageLeft',
  'imageRight',
  'imageParallax',
] as const;

type SettingUploadField = (typeof SETTING_UPLOAD_FIELDS)[number];

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  private tenantId(): bigint {
    return this.tenantContext.getTenant().id;
  }

  async getSettings() {
    const tenantId = this.tenantId();
    const [setting, section, socials] = await Promise.all([
      this.ensureSetting(tenantId),
      this.ensureSection(tenantId),
      this.prisma.social.findMany({
        where: { tenantId },
        orderBy: { id: 'asc' },
      }),
    ]);

    return { setting, section, socials };
  }

  async updateSetting(data: Prisma.SettingUpdateInput) {
    const tenantId = this.tenantId();
    const existing = await this.ensureSetting(tenantId);
    const setting = await this.prisma.setting.update({
      where: { id: existing.id },
      data,
    });
    return { setting };
  }

  async updateSections(data: Prisma.SectionUpdateInput) {
    const tenantId = this.tenantId();
    const existing = await this.ensureSection(tenantId);
    const section = await this.prisma.section.update({
      where: { id: existing.id },
      data: { ...data, updatedAt: new Date() },
    });
    return { section };
  }

  async uploadSettingImage(field: string, filename: string) {
    if (!SETTING_UPLOAD_FIELDS.includes(field as SettingUploadField)) {
      throw new BadRequestException(`Invalid upload field: ${field}`);
    }

    const tenantId = this.tenantId();
    const existing = await this.ensureSetting(tenantId);
    const setting = await this.prisma.setting.update({
      where: { id: existing.id },
      data: { [field]: filename },
    });

    return { setting, field, filename };
  }

  async getPublicPageSettings() {
    const tenantId = this.tenantId();
    const tenant = this.tenantContext.getTenant();

    const [
      setting,
      section,
      sponsors,
      instagramFeeds,
      services,
      products,
      employees,
    ] = await Promise.all([
      this.ensureSetting(tenantId),
      this.ensureSection(tenantId),
      this.prisma.sponsor.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { id: 'asc' },
      }),
      this.prisma.instagramFeed.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { id: 'asc' },
      }),
      this.prisma.service.findMany({
        where: { item: { tenantId, status: true } },
        include: { item: { include: { category: true } } },
        orderBy: { id: 'asc' },
      }),
      this.prisma.product.findMany({
        where: { item: { tenantId, status: true } },
        include: {
          item: { include: { category: true } },
          images: { orderBy: { order: 'asc' } },
        },
        orderBy: { id: 'asc' },
      }),
      this.prisma.employee.findMany({
        where: { tenantId, status: true },
        include: {
          personalInfo: true,
          socials: { include: { social: true } },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        locale: tenant.locale,
      },
      setting,
      section,
      sponsors,
      instagramFeeds,
      services,
      products,
      employees,
    };
  }

  private async ensureSetting(tenantId: bigint) {
    const existing = await this.prisma.setting.findFirst({
      where: { tenantId },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.setting.create({
      data: { tenantId, companyName: this.tenantContext.getTenant().name },
    });
  }

  private async ensureSection(tenantId: bigint) {
    const existing = await this.prisma.section.findFirst({
      where: { tenantId },
    });
    if (existing) {
      return existing;
    }
    const now = new Date();
    return this.prisma.section.create({
      data: { tenantId, createdAt: now, updatedAt: now },
    });
  }
}
