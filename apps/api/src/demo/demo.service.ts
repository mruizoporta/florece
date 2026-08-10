import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  DEMO_SLUG,
  TENANT_SUBSCRIPTION_STATUS,
} from '@florece/shared';
import { Prisma } from '@prisma/client';
import { OnboardingService } from '../auth/onboarding.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DemoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly onboarding: OnboardingService,
    private readonly organizations: OrganizationsService,
  ) {}

  async seed() {
    const now = new Date();
    let tenant = await this.prisma.tenant.findUnique({
      where: { slug: DEMO_SLUG },
    });

    let bootstrapped = false;
    if (!tenant) {
      tenant = await this.organizations.createOrganizationWithBranch({
        name: 'Salón Demo',
        slug: DEMO_SLUG,
        isDemo: true,
        billingRegion: 'NI',
        locale: 'es',
        subscriptionStatus: TENANT_SUBSCRIPTION_STATUS.ACTIVE,
      });
      bootstrapped = true;
    }

    const statusCount = await this.prisma.status.count({
      where: { tenantId: tenant.id },
    });
    if (statusCount === 0) {
      await this.onboarding.bootstrapTenant(tenant.id, tenant.name);
      bootstrapped = true;
    }

    let admin = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: DEMO_ADMIN_EMAIL,
        },
      },
    });

    const passwordHash = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10);
    if (!admin) {
      admin = await this.prisma.user.create({
        data: {
          name: 'Admin Demo',
          email: DEMO_ADMIN_EMAIL,
          password: passwordHash,
          tenantId: tenant.id,
          createdAt: now,
          updatedAt: now,
        },
      });
    } else {
      admin = await this.prisma.user.update({
        where: { id: admin.id },
        data: { password: passwordHash, updatedAt: now },
      });
    }
    await this.onboarding.ensureAdminRole(admin.id, tenant.id);
    await this.organizations.grantOwnerAccess(
      admin.id,
      tenant.id,
      tenant.organizationId,
    );

    if (bootstrapped) {
      await this.seedLightCatalog(tenant.id);
    }

    return {
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
      },
      admin: {
        email: DEMO_ADMIN_EMAIL,
        password: DEMO_ADMIN_PASSWORD,
      },
      bootstrapped,
    };
  }

  private async seedLightCatalog(tenantId: bigint) {
    const category = await this.prisma.category.findFirst({
      where: { tenantId, slug: 'cortes' },
    });
    if (!category) {
      return;
    }

    const existingServices = await this.prisma.service.count({
      where: { item: { tenantId } },
    });
    if (existingServices > 0) {
      return;
    }

    const now = new Date();
    const item = await this.prisma.item.create({
      data: {
        categoryId: category.id,
        name: 'Corte demo',
        slug: `corte-demo-${Date.now()}`,
        description: 'Servicio de demostración.',
        price: new Prisma.Decimal(250),
        image: 'placeholder.webp',
        status: true,
        tenantId,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.prisma.service.create({
      data: {
        itemId: item.id,
        durationTime: 45,
        createdAt: now,
        updatedAt: now,
      },
    });

    const employeeCount = await this.prisma.employee.count({
      where: { tenantId },
    });
    if (employeeCount === 0) {
      const employee = await this.prisma.employee.create({
        data: {
          name: 'María',
          description: 'Estilista',
          image: 'placeholder.webp',
          status: true,
          tenantId,
          createdAt: now,
          updatedAt: now,
        },
      });

      for (let weekday = 1; weekday <= 6; weekday++) {
        await this.prisma.schedule.create({
          data: {
            employeeId: employee.id,
            weekday,
            startTime: new Date('1970-01-01T09:00:00.000Z'),
            endTime: new Date('1970-01-01T18:00:00.000Z'),
            status: true,
            tenantId,
            createdAt: now,
            updatedAt: now,
          },
        });
      }
    }
  }
}
