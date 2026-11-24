import { Injectable } from '@nestjs/common';
import {
  PLATFORM_TENANT_SLUG,
  TENANT_SUBSCRIPTION_STATUS,
} from '@florece/shared';
import { PrismaService } from '../prisma/prisma.service';

const BOOKABLE_STATUSES = [
  TENANT_SUBSCRIPTION_STATUS.TRIAL,
  TENANT_SUBSCRIPTION_STATUS.ACTIVE,
  TENANT_SUBSCRIPTION_STATUS.PAST_DUE,
];

@Injectable()
export class PublicSalonsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query?: string) {
    const q = query?.trim() ?? '';
    if (q.length < 1) {
      return [];
    }

    const tenants = await this.prisma.tenant.findMany({
      where: {
        AND: [
          {
            slug: { not: PLATFORM_TENANT_SLUG },
            organization: { subscriptionStatus: { in: BOOKABLE_STATUSES } },
            settings: { some: { activeAppointment: true } },
          },
          {
            OR: [
              { slug: { contains: q, mode: 'insensitive' } },
              { name: { contains: q, mode: 'insensitive' } },
              {
                settings: {
                  some: { companyName: { contains: q, mode: 'insensitive' } },
                },
              },
              {
                settings: {
                  some: { location: { contains: q, mode: 'insensitive' } },
                },
              },
            ],
          },
        ],
      },
      include: {
        settings: {
          where: { activeAppointment: true },
          select: { companyName: true, location: true },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
      take: 20,
    });

    return tenants.map((tenant) => {
      const setting = tenant.settings[0];
      return {
        slug: tenant.slug,
        name: setting?.companyName?.trim() || tenant.name,
        city: setting?.location?.trim() || null,
      };
    });
  }
}
