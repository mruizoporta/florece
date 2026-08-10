import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  DEMO_SLUG,
  PLANS,
  PLATFORM_OWNER_EMAIL,
  PLATFORM_OWNER_PASSWORD,
  PLATFORM_TENANT_SLUG,
  PlatformRole,
  TENANT_SUBSCRIPTION_STATUS,
  TRIAL_DAYS,
} from '@florece/shared';

const prisma = new PrismaClient();

const LARAVEL_USER_MODEL = 'App\\Models\\User';

async function bootstrapTenant(tenantId: bigint, tenantName: string) {
  const now = new Date();

  const statusRows = [
    { name: 'Cancelado', color: 'danger', description: 'Cancelado' },
    { name: 'Pendiente', color: 'warning', description: 'Pendiente' },
    { name: 'En espera', color: 'success', description: 'En espera' },
    { name: 'Atendiendo', color: 'info', description: 'Atendiendo' },
    { name: 'Concluido', color: 'primary', description: 'Concluido' },
  ];
  for (const row of statusRows) {
    await prisma.status.create({
      data: { ...row, tenantId },
    });
  }

  const typeRows = ['Flash', 'Local', 'Web'];
  for (const name of typeRows) {
    await prisma.type.create({
      data: { name, description: name, tenantId },
    });
  }

  const categoryRows = [
    { name: 'Cortes', slug: 'cortes' },
    { name: 'Peinados', slug: 'peinados' },
    { name: 'Color', slug: 'color' },
    { name: 'Tratamientos', slug: 'tratamientos' },
  ];
  for (const row of categoryRows) {
    await prisma.category.create({
      data: { ...row, tenantId, createdAt: now, updatedAt: now },
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
    await prisma.social.create({
      data: { ...row, tenantId, createdAt: now, updatedAt: now },
    });
  }

  await prisma.section.create({
    data: { tenantId, createdAt: now, updatedAt: now },
  });

  await prisma.setting.create({
    data: { companyName: tenantName, tenantId },
  });
}

async function ensureAdminRole(userId: bigint) {
  const now = new Date();
  for (const name of ['Admin', 'Recepcionista', 'Cajero'] as const) {
    let role = await prisma.role.findFirst({
      where: { name, guardName: 'web' },
    });
    if (!role) {
      role = await prisma.role.create({
        data: {
          name,
          guardName: 'web',
          createdAt: now,
          updatedAt: now,
        },
      });
    }
    if (name === 'Admin') {
      await prisma.modelHasRole.upsert({
        where: {
          roleId_modelId_modelType: {
            roleId: role.id,
            modelId: userId,
            modelType: LARAVEL_USER_MODEL,
          },
        },
        create: {
          roleId: role.id,
          modelId: userId,
          modelType: LARAVEL_USER_MODEL,
        },
        update: {},
      });
    }
  }
}

async function seedPlans() {
  const now = new Date();
  for (const def of Object.values(PLANS)) {
    const data = {
      name: def.name,
      priceUsMonthly: new Prisma.Decimal(def.priceUsdMonthly),
      priceNiMonthly: new Prisma.Decimal(def.priceNioMonthly),
      currencyUs: 'USD',
      currencyNi: 'NIO',
      interval: 'month',
      maxEmployees: def.maxEmployees,
      maxServices: def.maxServices,
      features: [...def.features],
      entitlements: def.entitlements as Prisma.InputJsonValue,
      active: true,
      trialDays: def.trialDays,
      updatedAt: now,
    };
    await prisma.plan.upsert({
      where: { slug: def.slug },
      create: {
        slug: def.slug,
        createdAt: now,
        ...data,
      },
      update: data,
    });
  }
}

async function seedPlatformOwner() {
  const now = new Date();
  let ops = await prisma.tenant.findUnique({
    where: { slug: PLATFORM_TENANT_SLUG },
    include: { organization: true },
  });
  if (!ops) {
    const org = await prisma.organization.create({
      data: {
        name: 'Florece Ops',
        billingRegion: 'NI',
        subscriptionStatus: TENANT_SUBSCRIPTION_STATUS.ACTIVE,
        createdAt: now,
        updatedAt: now,
      },
    });
    ops = await prisma.tenant.create({
      data: {
        organizationId: org.id,
        name: 'Florece Ops',
        slug: PLATFORM_TENANT_SLUG,
        isDemo: false,
        locale: 'es',
        createdAt: now,
        updatedAt: now,
      },
      include: { organization: true },
    });
  }

  const passwordHash = await bcrypt.hash(PLATFORM_OWNER_PASSWORD, 10);
  let owner = await prisma.user.findUnique({
    where: {
      tenantId_email: {
        tenantId: ops.id,
        email: PLATFORM_OWNER_EMAIL,
      },
    },
  });
  if (!owner) {
    owner = await prisma.user.create({
      data: {
        name: 'Florece Owner',
        email: PLATFORM_OWNER_EMAIL,
        password: passwordHash,
        tenantId: ops.id,
        platformRole: PlatformRole.PLATFORM_OWNER,
        createdAt: now,
        updatedAt: now,
      },
    });
  } else {
    owner = await prisma.user.update({
      where: { id: owner.id },
      data: {
        password: passwordHash,
        platformRole: PlatformRole.PLATFORM_OWNER,
        updatedAt: now,
      },
    });
  }
  await ensureAdminRole(owner.id);

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: ops.organizationId,
        userId: owner.id,
      },
    },
    create: {
      organizationId: ops.organizationId,
      userId: owner.id,
      orgRole: 'OWNER',
    },
    update: { orgRole: 'OWNER' },
  });
  await prisma.branchMembership.upsert({
    where: {
      userId_tenantId: { userId: owner.id, tenantId: ops.id },
    },
    create: { userId: owner.id, tenantId: ops.id },
    update: {},
  });

  return owner;
}

async function main() {
  const now = new Date();

  await seedPlans();
  await seedPlatformOwner();

  const premiumPlan = await prisma.plan.findUnique({
    where: { slug: 'premium' },
  });
  const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * 86_400_000);

  let tenant = await prisma.tenant.findUnique({
    where: { slug: DEMO_SLUG },
    include: { organization: true },
  });
  if (!tenant) {
    const org = await prisma.organization.create({
      data: {
        name: 'Salón Demo',
        billingRegion: 'NI',
        planId: premiumPlan?.id,
        subscriptionStatus: TENANT_SUBSCRIPTION_STATUS.ACTIVE,
        trialEndsAt,
        subscriptionEndsAt: new Date(now.getTime() + 90 * 86_400_000),
        createdAt: now,
        updatedAt: now,
      },
    });
    tenant = await prisma.tenant.create({
      data: {
        organizationId: org.id,
        name: 'Salón Demo',
        slug: DEMO_SLUG,
        isDemo: true,
        locale: 'es',
        createdAt: now,
        updatedAt: now,
      },
      include: { organization: true },
    });
  } else {
    await prisma.organization.update({
      where: { id: tenant.organizationId },
      data: {
        planId: premiumPlan?.id ?? tenant.organization.planId,
        subscriptionStatus:
          tenant.organization.subscriptionStatus === 'pending_payment'
            ? TENANT_SUBSCRIPTION_STATUS.ACTIVE
            : tenant.organization.subscriptionStatus,
        updatedAt: now,
      },
    });
    tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenant.id },
      include: { organization: true },
    });
  }

  const statusCount = await prisma.status.count({ where: { tenantId: tenant.id } });
  if (statusCount === 0) {
    await bootstrapTenant(tenant.id, tenant.name);
  }

  const passwordHash = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10);

  let admin = await prisma.user.findUnique({
    where: {
      tenantId_email: { tenantId: tenant.id, email: DEMO_ADMIN_EMAIL },
    },
  });

  if (!admin) {
    const legacy = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: 'admin@demo.shearly.app',
        },
      },
    });
    if (legacy) {
      admin = await prisma.user.update({
        where: { id: legacy.id },
        data: {
          email: DEMO_ADMIN_EMAIL,
          password: passwordHash,
          updatedAt: now,
        },
      });
    } else {
      admin = await prisma.user.create({
        data: {
          name: 'Admin Demo',
          email: DEMO_ADMIN_EMAIL,
          password: passwordHash,
          tenantId: tenant.id,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
  } else {
    admin = await prisma.user.update({
      where: { id: admin.id },
      data: { password: passwordHash, updatedAt: now },
    });
  }
  await ensureAdminRole(admin.id);

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: tenant.organizationId,
        userId: admin.id,
      },
    },
    create: {
      organizationId: tenant.organizationId,
      userId: admin.id,
      orgRole: 'OWNER',
    },
    update: { orgRole: 'OWNER' },
  });
  await prisma.branchMembership.upsert({
    where: {
      userId_tenantId: { userId: admin.id, tenantId: tenant.id },
    },
    create: { userId: admin.id, tenantId: tenant.id },
    update: {},
  });

  await enrichDemoTenant(tenant.id, passwordHash, now);

  console.log('Seed OK:', {
    plans: Object.keys(PLANS),
    platform: {
      slug: PLATFORM_TENANT_SLUG,
      email: PLATFORM_OWNER_EMAIL,
      password: PLATFORM_OWNER_PASSWORD,
    },
    demo: {
      slug: DEMO_SLUG,
      plan: 'premium',
      admin: DEMO_ADMIN_EMAIL,
      password: DEMO_ADMIN_PASSWORD,
      tip: 'Panel /s/demo/admin — Premium: citas, POS, patrocinadores y multi-sucursal',
    },
  });
}

async function ensureEmployee(
  tenantId: bigint,
  name: string,
  description: string,
  now: Date,
  image = 'placeholder.webp',
  phone?: string,
) {
  let employee = await prisma.employee.findFirst({
    where: { tenantId, name },
  });
  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        name,
        description,
        image,
        status: true,
        tenantId,
        createdAt: now,
        updatedAt: now,
      },
    });
  } else {
    employee = await prisma.employee.update({
      where: { id: employee.id },
      data: {
        description,
        image,
        status: true,
        updatedAt: now,
      },
    });
  }

  if (phone) {
    const info = await prisma.personalInformation.findFirst({
      where: { employeeId: employee.id },
    });
    if (info) {
      await prisma.personalInformation.update({
        where: { id: info.id },
        data: { phone, updatedAt: now },
      });
    } else {
      await prisma.personalInformation.create({
        data: {
          employeeId: employee.id,
          phone,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
  }

  const scheduleCount = await prisma.schedule.count({
    where: { employeeId: employee.id },
  });
  if (scheduleCount === 0) {
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
  tenantId: bigint,
  categorySlug: string,
  name: string,
  slug: string,
  price: number,
  duration: number,
  description: string,
  now: Date,
  image = 'placeholder.webp',
) {
  let existing = await prisma.item.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
    include: { service: true },
  });
  if (!existing) {
    existing = await prisma.item.findUnique({
      where: { tenantId_name: { tenantId, name } },
      include: { service: true },
    });
  }

  const category = await prisma.category.findFirst({
    where: { tenantId, slug: categorySlug },
  });
  if (!category) return null;

  if (existing) {
    if (image !== 'placeholder.webp' && existing.image !== image) {
      await prisma.item.update({
        where: { id: existing.id },
        data: { image, updatedAt: now },
      });
    }
    if (existing.service) return existing.service;
  }

  let item = existing;
  if (!item) {
    item = await prisma.item.create({
      data: {
        categoryId: category.id,
        name,
        slug,
        description,
        price: new Prisma.Decimal(price),
        image,
        status: true,
        tenantId,
        createdAt: now,
        updatedAt: now,
      },
      include: { service: true },
    });
  }

  if (item.service) return item.service;

  return prisma.service.create({
    data: {
      itemId: item.id,
      durationTime: duration,
      createdAt: now,
      updatedAt: now,
    },
  });
}

async function ensureProduct(
  tenantId: bigint,
  categorySlug: string,
  name: string,
  slug: string,
  price: number,
  stock: number,
  description: string,
  now: Date,
  image = 'placeholder.webp',
) {
  let existing = await prisma.item.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
    include: { product: true },
  });
  if (!existing) {
    existing = await prisma.item.findUnique({
      where: { tenantId_name: { tenantId, name } },
      include: { product: true },
    });
  }

  const category = await prisma.category.findFirst({
    where: { tenantId, slug: categorySlug },
  });
  if (!category) return null;

  if (existing) {
    if (image !== 'placeholder.webp' && existing.image !== image) {
      await prisma.item.update({
        where: { id: existing.id },
        data: { image, updatedAt: now },
      });
    }
    if (existing.product) return existing.product;
  }

  let item = existing;
  if (!item) {
    item = await prisma.item.create({
      data: {
        categoryId: category.id,
        name,
        slug,
        description,
        price: new Prisma.Decimal(price),
        image,
        status: true,
        tenantId,
        createdAt: now,
        updatedAt: now,
      },
      include: { product: true },
    });
  }

  if (item.product) return item.product;

  return prisma.product.create({
    data: {
      itemId: item.id,
      stock,
      createdAt: now,
      updatedAt: now,
    },
  });
}

async function ensureStaffUser(
  tenantId: bigint,
  name: string,
  email: string,
  passwordHash: string,
  roleNames: Array<'Admin' | 'Recepcionista' | 'Cajero'>,
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
        password: passwordHash,
        tenantId,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  for (const roleName of roleNames) {
    let role = await prisma.role.findFirst({
      where: { name: roleName, guardName: 'web' },
    });
    if (!role) {
      role = await prisma.role.create({
        data: {
          name: roleName,
          guardName: 'web',
          createdAt: now,
          updatedAt: now,
        },
      });
    }
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
  return user;
}

async function ensureNamedCustomer(
  tenantId: bigint,
  name: string,
  email: string,
  passwordHash: string,
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
        password: passwordHash,
        tenantId,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
  let customer = await prisma.customer.findFirst({
    where: { tenantId, userId: user.id },
  });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        userId: user.id,
        tenantId,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
  return customer;
}

function todayAt(hours: number, minutes = 0) {
  const ymd = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Managua',
  });
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return new Date(`${ymd}T${hh}:${mm}:00-06:00`);
}

function demoDayBounds() {
  const ymd = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Managua',
  });
  return {
    start: new Date(`${ymd}T00:00:00.000-06:00`),
    end: new Date(`${ymd}T23:59:59.999-06:00`),
  };
}

async function enrichDemoTenant(
  tenantId: bigint,
  passwordHash: string,
  now: Date,
) {
  await prisma.setting.updateMany({
    where: { tenantId },
    data: {
      companyName: 'Salón Demo Florece',
      mailContact: 'hola@demo.florece.app',
      phone: '+505 8888 1234',
      whatsapp: '50588881234',
      address: 'Plaza Inter, Managua',
      location: 'Managua, Nicaragua',
      schedules: 'Lun–Sáb 9:00–18:00',
      aboutUs:
        'Salón demo de Florece. Agenda, equipo y caja listos para mostrar a clientes.',
      currencySymbol: 'C$',
      instagramHref: 'https://www.instagram.com/florece.app',
      activeAppointment: true,
      logo: '/demo/site/logo.jpg',
      banner: '/demo/banners/hero.jpg',
      imageLeft: '/demo/site/left.jpg',
      imageRight: '/demo/site/right.jpg',
      imageParallax: '/demo/site/parallax.jpg',
    },
  });

  const maria = await ensureEmployee(
    tenantId,
    'María López',
    'Colorista y cortes damas',
    now,
    '/demo/employees/maria.jpg',
    '88881234',
  );
  const carlos = await ensureEmployee(
    tenantId,
    'Carlos Méndez',
    'Barbería y fades',
    now,
    '/demo/employees/carlos.jpg',
    '88884567',
  );
  const sofia = await ensureEmployee(
    tenantId,
    'Sofía Ruiz',
    'Peinados y maquillaje',
    now,
    '/demo/employees/sofia.jpg',
    '88887890',
  );
  await ensureEmployee(
    tenantId,
    'Ana Castillo',
    'Manicure y pedicure',
    now,
    '/demo/employees/ana.jpg',
    '88880123',
  );
  await ensureEmployee(
    tenantId,
    'Luis Vargas',
    'Barbería clásica',
    now,
    '/demo/employees/luis.jpg',
    '88883456',
  );
  await ensureEmployee(
    tenantId,
    'Laura Jiménez',
    'Tratamientos capilares',
    now,
    '/demo/employees/laura.jpg',
    '88886789',
  );
  await ensureEmployee(
    tenantId,
    'Diego Morales',
    'Cortes caballero y diseño',
    now,
    '/demo/employees/diego.jpg',
    '88889012',
  );

  // Archive legacy short-name duplicates (old seed left "María" / "Carlos")
  await prisma.employee.updateMany({
    where: {
      tenantId,
      OR: [{ name: 'María' }, { name: 'Carlos' }, { name: 'Sofía' }],
      NOT: {
        id: { in: [maria.id, carlos.id, sofia.id] },
      },
    },
    data: { status: false, updatedAt: now },
  });

  // If somehow two "María López" exist, keep the canonical one
  const mariaDupes = await prisma.employee.findMany({
    where: { tenantId, name: 'María López', status: true },
    orderBy: { id: 'asc' },
  });
  for (const dupe of mariaDupes) {
    if (dupe.id !== maria.id) {
      await prisma.employee.update({
        where: { id: dupe.id },
        data: { status: false, updatedAt: now },
      });
    }
  }

  const corte = await ensureService(
    tenantId,
    'cortes',
    'Corte damas',
    'corte-damas',
    350,
    45,
    'Corte y peinado básico.',
    now,
    '/demo/services/corte.jpg',
  );
  const fade = await ensureService(
    tenantId,
    'cortes',
    'Fade caballeros',
    'fade-caballeros',
    280,
    40,
    'Degradado moderno.',
    now,
    '/demo/services/fade.jpg',
  );
  const balayage = await ensureService(
    tenantId,
    'color',
    'Balayage',
    'balayage',
    1800,
    150,
    'Coloración iluminada.',
    now,
    '/demo/services/balayage.jpg',
  );
  const brush = await ensureService(
    tenantId,
    'peinados',
    'Brushing',
    'brushing',
    450,
    60,
    'Secado y peinado.',
    now,
    '/demo/services/brushing.jpg',
  );
  const keratina = await ensureService(
    tenantId,
    'tratamientos',
    'Keratina express',
    'keratina-express',
    1200,
    90,
    'Alisado temporal.',
    now,
    '/demo/services/keratina.jpg',
  );

  await ensureProduct(
    tenantId,
    'tratamientos',
    'Shampoo reparador',
    'shampoo-reparador',
    420,
    18,
    'Uso diario.',
    now,
    '/demo/products/shampoo.jpg',
  );
  await ensureProduct(
    tenantId,
    'tratamientos',
    'Aceite de argán',
    'aceite-argan',
    380,
    12,
    'Brillo y nutrición.',
    now,
    '/demo/products/aceite.jpg',
  );
  const serum = await ensureProduct(
    tenantId,
    'color',
    'Serum protector',
    'serum-protector',
    290,
    25,
    'Protección térmica.',
    now,
    '/demo/products/aceite.jpg',
  );

  await ensureStaffUser(
    tenantId,
    'Ana Recepción',
    'recepcion@demo.florece.app',
    passwordHash,
    ['Recepcionista'],
    now,
  );
  await ensureStaffUser(
    tenantId,
    'Luis Caja',
    'caja@demo.florece.app',
    passwordHash,
    ['Cajero'],
    now,
  );

  const c1 = await ensureNamedCustomer(
    tenantId,
    'Valeria Gómez',
    'valeria@demo.florece.app',
    passwordHash,
    now,
  );
  const c2 = await ensureNamedCustomer(
    tenantId,
    'Diego Herrera',
    'diego@demo.florece.app',
    passwordHash,
    now,
  );
  const c3 = await ensureNamedCustomer(
    tenantId,
    'Camila Ortega',
    'camila@demo.florece.app',
    passwordHash,
    now,
  );

  const pending = await prisma.status.findFirst({
    where: { tenantId, name: 'Pendiente' },
  });
  const waiting = await prisma.status.findFirst({
    where: { tenantId, name: 'En espera' },
  });
  const attending = await prisma.status.findFirst({
    where: { tenantId, name: 'Atendiendo' },
  });
  const webType = await prisma.type.findFirst({
    where: { tenantId, name: 'Web' },
  });
  const flashType = await prisma.type.findFirst({
    where: { tenantId, name: 'Flash' },
  });

  if (pending && waiting && attending && webType && flashType) {
    // Refresh today's demo appointments so the board/dashboard always have data
    const { start: dayStart, end: dayEnd } = demoDayBounds();
    const todays = await prisma.appointment.findMany({
      where: { tenantId, startTime: { gte: dayStart, lte: dayEnd } },
      select: { id: true },
    });
    if (todays.length > 0) {
      const ids = todays.map((a) => a.id);
      await prisma.appointmentService.deleteMany({
        where: { appointmentId: { in: ids } },
      });
      await prisma.appointment.deleteMany({
        where: { id: { in: ids } },
      });
    }

    const slots: Array<{
      customerId: bigint;
      employeeId: bigint;
      statusId: bigint;
      typeId: bigint;
      name: string;
      phone: string;
      start: Date;
      minutes: number;
      serviceId?: bigint | null;
    }> = [
      {
        customerId: c1.id,
        employeeId: maria.id,
        statusId: attending.id,
        typeId: webType.id,
        name: 'Valeria Gómez',
        phone: '88881111',
        start: todayAt(10, 0),
        minutes: 45,
        serviceId: corte?.id,
      },
      {
        customerId: c2.id,
        employeeId: carlos.id,
        statusId: waiting.id,
        typeId: webType.id,
        name: 'Diego Herrera',
        phone: '88882222',
        start: todayAt(11, 0),
        minutes: 40,
        serviceId: fade?.id,
      },
      {
        customerId: c3.id,
        employeeId: sofia.id,
        statusId: pending.id,
        typeId: webType.id,
        name: 'Camila Ortega',
        phone: '88883333',
        start: todayAt(14, 30),
        minutes: 60,
        serviceId: brush?.id,
      },
      {
        customerId: c1.id,
        employeeId: maria.id,
        statusId: pending.id,
        typeId: webType.id,
        name: 'Valeria Gómez',
        phone: '88881111',
        start: todayAt(16, 0),
        minutes: 150,
        serviceId: balayage?.id,
      },
      {
        customerId: c2.id,
        employeeId: sofia.id,
        statusId: waiting.id,
        typeId: flashType.id,
        name: 'Walk-in Ana',
        phone: '88884444',
        start: todayAt(12, 15),
        minutes: 45,
        serviceId: keratina?.id,
      },
    ];

    for (const slot of slots) {
      const end = new Date(slot.start.getTime() + slot.minutes * 60_000);
      const appointment = await prisma.appointment.create({
        data: {
          customerId: slot.customerId,
          employeeId: slot.employeeId,
          statusId: slot.statusId,
          typeId: slot.typeId,
          name: slot.name,
          phone: slot.phone,
          startTime: slot.start,
          endTime: end,
          tenantId,
          createdAt: now,
          updatedAt: now,
        },
      });
      if (slot.serviceId) {
        await prisma.appointmentService.create({
          data: {
            appointmentId: appointment.id,
            serviceId: slot.serviceId,
            createdAt: now,
            updatedAt: now,
          },
        });
      }
    }
  }

  // Keep a finalized order dated "today" for top products / income,
  // always ensuring line items + payment exist (idempotent).
  const shampooItem = await prisma.item.findFirst({
    where: { tenantId, slug: 'shampoo-reparador' },
  });
  const serumItem =
    serum?.itemId != null
      ? await prisma.item.findFirst({
          where: { id: serum.itemId, tenantId },
        })
      : await prisma.item.findFirst({
          where: { tenantId, slug: 'serum-protector' },
        });

  let demoOrder = await prisma.order.findFirst({
    where: {
      tenantId,
      status: 'finalized',
      name: 'Venta mostrador',
    },
    include: { items: true, payments: true },
    orderBy: { id: 'asc' },
  });

  if (!demoOrder) {
    demoOrder = await prisma.order.create({
      data: {
        customerId: c1.id,
        employeeId: maria.id,
        name: 'Venta mostrador',
        status: 'finalized',
        paymentStatus: true,
        subtotal: new Prisma.Decimal(710),
        total: new Prisma.Decimal(710),
        finalizedAt: todayAt(13, 0),
        tenantId,
        createdAt: now,
        updatedAt: now,
      },
      include: { items: true, payments: true },
    });
  } else {
    await prisma.order.update({
      where: { id: demoOrder.id },
      data: {
        employeeId: maria.id,
        paymentStatus: true,
        subtotal: new Prisma.Decimal(710),
        total: new Prisma.Decimal(710),
        finalizedAt: todayAt(13, 0),
        updatedAt: now,
      },
    });
  }

  if (demoOrder.items.length === 0) {
    if (serumItem) {
      await prisma.itemOrder.create({
        data: {
          orderId: demoOrder.id,
          itemId: serumItem.id,
          productId: serum?.id ?? null,
          quantity: 1,
          price: new Prisma.Decimal(290),
          productNameSnapshot: serumItem.name,
          unitPriceSnapshot: new Prisma.Decimal(290),
          lineTotal: new Prisma.Decimal(290),
          tenantId,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
    if (shampooItem) {
      await prisma.itemOrder.create({
        data: {
          orderId: demoOrder.id,
          itemId: shampooItem.id,
          quantity: 1,
          price: new Prisma.Decimal(420),
          productNameSnapshot: shampooItem.name,
          unitPriceSnapshot: new Prisma.Decimal(420),
          lineTotal: new Prisma.Decimal(420),
          tenantId,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
  }

  if (demoOrder.payments.length === 0) {
    await prisma.orderPayment.create({
      data: {
        tenantId,
        orderId: demoOrder.id,
        method: 'cash',
        amount: new Prisma.Decimal(710),
        paidAt: todayAt(13, 0),
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  await prisma.order.updateMany({
    where: { tenantId, status: 'finalized' },
    data: { finalizedAt: todayAt(13, 0) },
  });

  const sponsorCount = await prisma.sponsor.count({
    where: { tenantId, deletedAt: null },
  });
  const samples = [
    {
      name: "L'Oréal Professionnel",
      image: '/demo/sponsors/loreal.svg',
    },
    {
      name: 'Olaplex',
      image: '/demo/sponsors/olaplex.svg',
    },
    {
      name: 'Plaza Inter',
      image: '/demo/sponsors/plaza-inter.svg',
    },
  ];
  if (sponsorCount === 0) {
    for (const s of samples) {
      await prisma.sponsor.create({
        data: {
          name: s.name,
          image: s.image,
          tenantId,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
  } else {
    // Keep demo logos in sync with public SVG assets.
    for (const s of samples) {
      const existing = await prisma.sponsor.findFirst({
        where: {
          tenantId,
          deletedAt: null,
          OR: [
            { name: s.name },
            { name: { contains: s.name.split(' ')[0].replace("'", '') } },
          ],
        },
      });
      if (existing) {
        await prisma.sponsor.update({
          where: { id: existing.id },
          data: { name: s.name, image: s.image, updatedAt: now },
        });
      }
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
