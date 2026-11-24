import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  DO_TRIAL_EMAIL,
  DO_TRIAL_SLUG,
  DO_TRIAL_STYLIST_EMAIL,
  TENANT_SUBSCRIPTION_STATUS,
} from '@florece/shared';

const LARAVEL_USER_MODEL = 'App\\Models\\User';

const SERVICES = [
  {
    category: 'cortes',
    name: 'Corte',
    slug: 'corte',
    price: 800,
    duration: 45,
    description: 'Corte y secado.',
  },
  {
    category: 'color',
    name: 'Color',
    slug: 'color',
    price: 2500,
    duration: 120,
    description: 'Color completo.',
  },
  {
    category: 'tratamientos',
    name: 'Manicure',
    slug: 'manicure',
    price: 600,
    duration: 40,
    description: 'Manicure.',
  },
] as const;

export async function seedDoTrial(prisma: PrismaClient) {
  const now = new Date();
  const premium = await prisma.plan.findUnique({ where: { slug: 'premium' } });
  const ends = new Date(now.getTime() + 180 * 86_400_000);

  let tenant = await prisma.tenant.findUnique({
    where: { slug: DO_TRIAL_SLUG },
    include: { organization: true },
  });
  let created = false;

  if (!tenant) {
    created = true;
    const org = await prisma.organization.create({
      data: {
        name: 'Estudio Prueba RD',
        billingRegion: 'DO',
        billingEmail: DO_TRIAL_EMAIL,
        planId: premium?.id,
        subscriptionStatus: TENANT_SUBSCRIPTION_STATUS.ACTIVE,
        trialEndsAt: ends,
        subscriptionEndsAt: ends,
        adminNote: 'Prueba para un salón en República Dominicana.',
        createdAt: now,
        updatedAt: now,
      },
    });
    tenant = await prisma.tenant.create({
      data: {
        organizationId: org.id,
        name: 'Estudio Prueba RD',
        slug: DO_TRIAL_SLUG,
        isDemo: true,
        locale: 'es',
        createdAt: now,
        updatedAt: now,
      },
      include: { organization: true },
    });
  } else if (tenant.organization.billingRegion !== 'DO') {
    await prisma.organization.update({
      where: { id: tenant.organizationId },
      data: { billingRegion: 'DO', updatedAt: now },
    });
  }

  const tenantId = tenant.id;
  await ensureBase(prisma, tenantId, now);

  await prisma.setting.updateMany({
    where: { tenantId, currencySymbol: { in: ['$', 'C$', ''] } },
    data: {
      companyName: 'Estudio Prueba RD',
      currencySymbol: 'RD$',
      location: 'Santo Domingo, República Dominicana',
      address: 'Gazcue, Santo Domingo',
      phone: '8095550100',
      whatsapp: '18095550100',
      schedules: 'Lun–Sáb 9:00–18:00',
      aboutUs:
        'Salón de prueba en Santo Domingo. Agenda tu cita y mira los precios en pesos.',
      mailContact: DO_TRIAL_EMAIL,
      activeAppointment: true,
    },
  });

  // El repo es público: la clave del salón de prueba no va en el código.
  const DO_TRIAL_PASSWORD = process.env.DO_TRIAL_PASSWORD;
  if (!DO_TRIAL_PASSWORD) throw new Error('Falta DO_TRIAL_PASSWORD en el .env de la API');
  const passwordHash = await bcrypt.hash(DO_TRIAL_PASSWORD, 10);
  await ensureUser(prisma, {
    tenantId,
    organizationId: tenant.organizationId,
    name: 'Ana Pérez',
    email: DO_TRIAL_EMAIL,
    passwordHash,
    roles: ['Admin'],
    owner: true,
    now,
  });

  const laura = await ensureEmployee(prisma, tenantId, now);
  await ensureUser(prisma, {
    tenantId,
    organizationId: tenant.organizationId,
    name: 'Laura Méndez',
    email: DO_TRIAL_STYLIST_EMAIL,
    passwordHash,
    roles: ['Estilista'],
    employeeId: laura.id,
    now,
  });

  for (const service of SERVICES) {
    await ensureService(prisma, tenantId, service, now);
  }
  await ensureSampleAppointments(prisma, tenantId, laura.id, now);

  return {
    slug: DO_TRIAL_SLUG,
    email: DO_TRIAL_EMAIL,
    stylist: DO_TRIAL_STYLIST_EMAIL,
    created,
    password: created ? DO_TRIAL_PASSWORD : '(sin cambio)',
  };
}

async function ensureBase(prisma: PrismaClient, tenantId: bigint, now: Date) {
  const statuses = [
    { name: 'Cancelado', color: 'danger', description: 'Cancelado' },
    { name: 'Pendiente', color: 'warning', description: 'Pendiente' },
    { name: 'En espera', color: 'success', description: 'En espera' },
    { name: 'Atendiendo', color: 'info', description: 'Atendiendo' },
    { name: 'Concluido', color: 'primary', description: 'Concluido' },
    { name: 'No se presentó', color: 'secondary', description: 'La clienta no vino y no avisó' },
  ];
  for (const row of statuses) {
    const existing = await prisma.status.findFirst({
      where: { tenantId, name: row.name },
    });
    if (!existing) await prisma.status.create({ data: { ...row, tenantId } });
  }
  for (const name of ['Flash', 'Local', 'Web']) {
    const existing = await prisma.type.findFirst({ where: { tenantId, name } });
    if (!existing) {
      await prisma.type.create({
        data: { name, description: name, color: 'primary', tenantId },
      });
    }
  }
  for (const row of [
    { name: 'Cortes', slug: 'cortes' },
    { name: 'Peinados', slug: 'peinados' },
    { name: 'Color', slug: 'color' },
    { name: 'Tratamientos', slug: 'tratamientos' },
  ]) {
    const existing = await prisma.category.findFirst({
      where: { tenantId, slug: row.slug },
    });
    if (!existing) {
      await prisma.category.create({
        data: { ...row, tenantId, createdAt: now, updatedAt: now },
      });
    }
  }
  if ((await prisma.section.count({ where: { tenantId } })) === 0) {
    await prisma.section.create({
      data: { tenantId, createdAt: now, updatedAt: now },
    });
  }
  if ((await prisma.setting.count({ where: { tenantId } })) === 0) {
    await prisma.setting.create({
      data: { companyName: 'Estudio Prueba RD', tenantId },
    });
  }
}

async function ensureRole(prisma: PrismaClient, name: string, now: Date) {
  const existing = await prisma.role.findFirst({
    where: { name, guardName: 'web' },
  });
  if (existing) return existing;
  return prisma.role.create({
    data: { name, guardName: 'web', createdAt: now, updatedAt: now },
  });
}

async function ensureUser(
  prisma: PrismaClient,
  input: {
    tenantId: bigint;
    organizationId: bigint;
    name: string;
    email: string;
    passwordHash: string;
    roles: string[];
    employeeId?: bigint;
    owner?: boolean;
    now: Date;
  },
) {
  let user = await prisma.user.findUnique({
    where: {
      tenantId_email: { tenantId: input.tenantId, email: input.email },
    },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: input.passwordHash,
        tenantId: input.tenantId,
        employeeId: input.employeeId ?? null,
        createdAt: input.now,
        updatedAt: input.now,
      },
    });
  } else if (input.employeeId && user.employeeId !== input.employeeId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { employeeId: input.employeeId, updatedAt: input.now },
    });
  }

  for (const roleName of input.roles) {
    const role = await ensureRole(prisma, roleName, input.now);
    await prisma.modelHasRole.upsert({
      where: {
        roleId_modelId_modelType: {
          roleId: role.id,
          modelId: user.id,
          modelType: LARAVEL_USER_MODEL,
        },
      },
      create: {
        roleId: role.id,
        modelId: user.id,
        modelType: LARAVEL_USER_MODEL,
      },
      update: {},
    });
  }

  await prisma.branchMembership.upsert({
    where: { userId_tenantId: { userId: user.id, tenantId: input.tenantId } },
    create: { userId: user.id, tenantId: input.tenantId },
    update: {},
  });

  if (input.owner) {
    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: input.organizationId,
          userId: user.id,
        },
      },
      create: {
        organizationId: input.organizationId,
        userId: user.id,
        orgRole: 'OWNER',
      },
      update: { orgRole: 'OWNER' },
    });
  }
  return user;
}

async function ensureEmployee(
  prisma: PrismaClient,
  tenantId: bigint,
  now: Date,
) {
  let employee = await prisma.employee.findFirst({
    where: { tenantId, name: 'Laura Méndez' },
  });
  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        name: 'Laura Méndez',
        description: 'Corte y color',
        image: 'placeholder.webp',
        status: true,
        baseSalary: new Prisma.Decimal(25000),
        commissionRate: new Prisma.Decimal(40),
        tenantId,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
  const info = await prisma.personalInformation.findFirst({
    where: { employeeId: employee.id },
  });
  if (!info) {
    await prisma.personalInformation.create({
      data: {
        employeeId: employee.id,
        phone: '8095550101',
        location: 'Santo Domingo',
        createdAt: now,
        updatedAt: now,
      },
    });
  }
  const schedules = await prisma.schedule.count({
    where: { employeeId: employee.id },
  });
  if (schedules === 0) {
    for (let weekday = 1; weekday <= 6; weekday++) {
      await prisma.$executeRaw`
        INSERT INTO schedules (employee_id, weekday, start_time, end_time, status, tenant_id, created_at, updated_at)
        VALUES (${employee.id}, ${weekday}, TIME '09:00:00', TIME '18:00:00', true, ${tenantId}, ${now}, ${now})
      `;
    }
  }
  return employee;
}

async function ensureService(
  prisma: PrismaClient,
  tenantId: bigint,
  service: (typeof SERVICES)[number],
  now: Date,
) {
  const existing = await prisma.item.findUnique({
    where: { tenantId_slug: { tenantId, slug: service.slug } },
    include: { service: true },
  });
  if (existing?.service) return existing.service;
  const category = await prisma.category.findFirst({
    where: { tenantId, slug: service.category },
  });
  if (!category) return null;
  const item =
    existing ??
    (await prisma.item.create({
      data: {
        categoryId: category.id,
        name: service.name,
        slug: service.slug,
        description: service.description,
        price: new Prisma.Decimal(service.price),
        status: true,
        tenantId,
        createdAt: now,
        updatedAt: now,
      },
      include: { service: true },
    }));
  if (item.service) return item.service;
  return prisma.service.create({
    data: {
      itemId: item.id,
      durationTime: service.duration,
      createdAt: now,
      updatedAt: now,
    },
  });
}

async function ensureSampleAppointments(
  prisma: PrismaClient,
  tenantId: bigint,
  employeeId: bigint,
  now: Date,
) {
  const count = await prisma.appointment.count({ where: { tenantId } });
  if (count > 0) return;
  const corte = await prisma.service.findFirst({
    where: { item: { tenantId, slug: 'corte' } },
  });
  const color = await prisma.service.findFirst({
    where: { item: { tenantId, slug: 'color' } },
  });
  const pending = await prisma.status.findFirst({
    where: { tenantId, name: 'Pendiente' },
  });
  const waiting = await prisma.status.findFirst({
    where: { tenantId, name: 'En espera' },
  });
  const local = await prisma.type.findFirst({
    where: { tenantId, name: 'Local' },
  });
  if (!corte || !pending || !waiting || !local) return;

  const ymd = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Santo_Domingo',
  });
  const camila = await ensureCustomer(
    prisma,
    tenantId,
    'Camila Reyes',
    'camila@prueba.florece.app',
    now,
  );
  const luis = await ensureCustomer(
    prisma,
    tenantId,
    'Luis Herrera',
    'luis@prueba.florece.app',
    now,
  );
  await prisma.appointment.create({
    data: {
      customerId: camila.id,
      employeeId,
      statusId: pending.id,
      typeId: local.id,
      name: 'Camila Reyes',
      phone: '8095550142',
      startTime: new Date(`${ymd}T10:00:00.000Z`),
      endTime: new Date(`${ymd}T10:45:00.000Z`),
      tenantId,
      createdAt: now,
      updatedAt: now,
      services: { create: [{ serviceId: corte.id, createdAt: now, updatedAt: now }] },
    },
  });
  if (!color) return;
  await prisma.appointment.create({
    data: {
      customerId: luis.id,
      employeeId,
      statusId: waiting.id,
      typeId: local.id,
      name: 'Luis Herrera',
      phone: '8295550190',
      startTime: new Date(`${ymd}T15:30:00.000Z`),
      endTime: new Date(`${ymd}T17:30:00.000Z`),
      tenantId,
      createdAt: now,
      updatedAt: now,
      services: { create: [{ serviceId: color.id, createdAt: now, updatedAt: now }] },
    },
  });
}

async function ensureCustomer(
  prisma: PrismaClient,
  tenantId: bigint,
  name: string,
  email: string,
  now: Date,
) {
  let user = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId, email } },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(`guest-${email}`, 8),
        tenantId,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
  const existing = await prisma.customer.findFirst({
    where: { tenantId, userId: user.id },
  });
  if (existing) return existing;
  return prisma.customer.create({
    data: { userId: user.id, tenantId, createdAt: now, updatedAt: now },
  });
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seedDoTrial(prisma)
    .then(async (result) => {
      console.log('DO trial', result);
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
