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
  for (const name of ['Admin', 'Recepcionista', 'Cajero', 'Estilista'] as const) {
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
  pay?: { baseSalary: number; commissionRate: number },
) {
  let employee = await prisma.employee.findFirst({
    where: { tenantId, name },
  });
  const payData = {
    baseSalary: pay?.baseSalary ?? 0,
    commissionRate: pay?.commissionRate ?? 0,
  };
  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        name,
        description,
        image,
        status: true,
        ...payData,
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
        ...payData,
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
  minStock = 5,
  usage: 'retail' | 'internal' | 'both' = 'retail',
  unit: 'unit' | 'g' | 'ml' = 'unit',
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
    if (existing.product) {
      const needsMeta =
        existing.product.minStock !== minStock ||
        existing.product.usage !== usage ||
        existing.product.unit !== unit;
      if (needsMeta) {
        return prisma.product.update({
          where: { id: existing.product.id },
          data: { minStock, usage, unit, updatedAt: now },
        });
      }
      return existing.product;
    }
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

  if (item.product) {
    return prisma.product.update({
      where: { id: item.product.id },
      data: { usage, unit, minStock, updatedAt: now },
    });
  }

  return prisma.product.create({
    data: {
      itemId: item.id,
      stock,
      minStock,
      usage,
      unit,
      createdAt: now,
      updatedAt: now,
    },
  });
}

async function ensureServiceConsumable(
  tenantId: bigint,
  serviceId: bigint,
  productId: bigint,
  quantity: number,
  now: Date,
) {
  const existing = await prisma.serviceConsumable.findUnique({
    where: { serviceId_productId: { serviceId, productId } },
  });
  if (existing) {
    if (existing.quantity !== quantity) {
      return prisma.serviceConsumable.update({
        where: { id: existing.id },
        data: { quantity, updatedAt: now },
      });
    }
    return existing;
  }
  return prisma.serviceConsumable.create({
    data: {
      tenantId,
      serviceId,
      productId,
      quantity,
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
  roleNames: Array<'Admin' | 'Recepcionista' | 'Cajero' | 'Estilista'>,
  now: Date,
  employeeId?: bigint | null,
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
        employeeId: employeeId ?? null,
        createdAt: now,
        updatedAt: now,
      },
    });
  } else if (employeeId !== undefined) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { employeeId: employeeId ?? null, updatedAt: now },
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
  } else if (user.name !== name) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { name, updatedAt: now },
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
    { baseSalary: 8000, commissionRate: 40 },
  );
  const carlos = await ensureEmployee(
    tenantId,
    'Carlos Méndez',
    'Barbería y fades',
    now,
    '/demo/employees/carlos.jpg',
    '88884567',
    { baseSalary: 7500, commissionRate: 40 },
  );
  const sofia = await ensureEmployee(
    tenantId,
    'Sofía Ruiz',
    'Peinados y maquillaje',
    now,
    '/demo/employees/sofia.jpg',
    '88887890',
    { baseSalary: 7000, commissionRate: 35 },
  );
  await ensureEmployee(
    tenantId,
    'Ana Castillo',
    'Manicure y pedicure',
    now,
    '/demo/employees/ana.jpg',
    '88880123',
    { baseSalary: 6500, commissionRate: 35 },
  );
  await ensureEmployee(
    tenantId,
    'Luis Vargas',
    'Barbería clásica',
    now,
    '/demo/employees/luis.jpg',
    '88883456',
    { baseSalary: 6500, commissionRate: 40 },
  );
  await ensureEmployee(
    tenantId,
    'Laura Jiménez',
    'Tratamientos capilares',
    now,
    '/demo/employees/laura.jpg',
    '88886789',
    { baseSalary: 7000, commissionRate: 35 },
  );
  await ensureEmployee(
    tenantId,
    'Diego Morales',
    'Cortes caballero y diseño',
    now,
    '/demo/employees/diego.jpg',
    '88889012',
    { baseSalary: 6500, commissionRate: 40 },
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

  const shampoo = await ensureProduct(
    tenantId,
    'tratamientos',
    'Shampoo reparador',
    'shampoo-reparador',
    420,
    18,
    'Uso diario — vitrina.',
    now,
    '/demo/products/shampoo.jpg',
    5,
    'retail',
    'unit',
  );
  const aceite = await ensureProduct(
    tenantId,
    'tratamientos',
    'Aceite de argán',
    'aceite-argan',
    380,
    12,
    'Brillo y nutrición — vitrina.',
    now,
    '/demo/products/aceite.jpg',
    5,
    'retail',
    'unit',
  );
  const serum = await ensureProduct(
    tenantId,
    'color',
    'Serum protector',
    'serum-protector',
    290,
    4,
    'Protección térmica — vitrina.',
    now,
    '/demo/products/aceite.jpg',
    5,
    'retail',
    'unit',
  );

  // Insumos de uso interno (gramos / ml) — no se venden en caja
  const tinte = await ensureProduct(
    tenantId,
    'color',
    'Tinte profesional castaño',
    'tinte-profesional-castano',
    0,
    500,
    'Insumo de piso. Stock en gramos.',
    now,
    '/demo/products/aceite.jpg',
    80,
    'internal',
    'g',
  );
  const oxidante = await ensureProduct(
    tenantId,
    'color',
    'Oxidante 20 vol',
    'oxidante-20-vol',
    0,
    1000,
    'Insumo de piso. Stock en ml.',
    now,
    '/demo/products/aceite.jpg',
    150,
    'internal',
    'ml',
  );
  const keratinaInsumo = await ensureProduct(
    tenantId,
    'tratamientos',
    'Keratina líquida (uso interno)',
    'keratina-liquida-interna',
    0,
    400,
    'Insumo para tratamientos. Stock en ml.',
    now,
    '/demo/products/shampoo.jpg',
    60,
    'internal',
    'ml',
  );
  const serumPiso = await ensureProduct(
    tenantId,
    'tratamientos',
    'Serum térmico (piso)',
    'serum-termico-piso',
    0,
    200,
    'Insumo de brushing. Stock en ml.',
    now,
    '/demo/products/aceite.jpg',
    40,
    'internal',
    'ml',
  );

  // Limpiar recetas viejas que apuntaban a retail y armar con insumos
  for (const svc of [keratina, balayage, brush]) {
    if (!svc) continue;
    await prisma.serviceConsumable.deleteMany({
      where: { tenantId, serviceId: svc.id },
    });
  }
  if (keratina && keratinaInsumo) {
    await ensureServiceConsumable(
      tenantId,
      keratina.id,
      keratinaInsumo.id,
      40,
      now,
    );
  }
  if (keratina && serumPiso) {
    await ensureServiceConsumable(
      tenantId,
      keratina.id,
      serumPiso.id,
      10,
      now,
    );
  }
  if (balayage && tinte) {
    await ensureServiceConsumable(tenantId, balayage.id, tinte.id, 35, now);
  }
  if (balayage && oxidante) {
    await ensureServiceConsumable(
      tenantId,
      balayage.id,
      oxidante.id,
      50,
      now,
    );
  }
  if (brush && serumPiso) {
    await ensureServiceConsumable(tenantId, brush.id, serumPiso.id, 8, now);
  }

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
  await ensureStaffUser(
    tenantId,
    'María López',
    'maria@demo.florece.app',
    passwordHash,
    ['Estilista'],
    now,
    maria.id,
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
    'Elena Vargas',
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
        name: 'Elena Vargas',
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

  // Floor demo for María López: open sheets + services today (stylist UI / Mi día)
  {
    const { start: dayStart, end: dayEnd } = demoDayBounds();
    const floorNames = [
      'Valeria Gómez',
      'Ana Ruiz',
      'Lucía Mendoza',
      'Cliente walk-in',
    ];

    const oldFloor = await prisma.order.findMany({
      where: {
        tenantId,
        name: { in: floorNames },
        OR: [
          {
            status: 'draft',
            createdAt: { gte: dayStart, lte: dayEnd },
          },
          {
            status: 'finalized',
            name: 'Lucía Mendoza',
            finalizedAt: { gte: dayStart, lte: dayEnd },
          },
        ],
      },
      select: { id: true },
    });
    if (oldFloor.length > 0) {
      const ids = oldFloor.map((o) => o.id);
      await prisma.itemOrder.deleteMany({ where: { orderId: { in: ids } } });
      await prisma.orderPayment.deleteMany({ where: { orderId: { in: ids } } });
      await prisma.order.deleteMany({ where: { id: { in: ids } } });
    }

    const corteItem =
      corte?.itemId != null
        ? await prisma.item.findFirst({ where: { id: corte.itemId, tenantId } })
        : null;
    const brushItem =
      brush?.itemId != null
        ? await prisma.item.findFirst({ where: { id: brush.itemId, tenantId } })
        : null;
    const balayageItem =
      balayage?.itemId != null
        ? await prisma.item.findFirst({
            where: { id: balayage.itemId, tenantId },
          })
        : null;
    const keratinaItem =
      keratina?.itemId != null
        ? await prisma.item.findFirst({
            where: { id: keratina.itemId, tenantId },
          })
        : null;

    const rate = new Prisma.Decimal(40);

    async function addServiceLine(
      orderId: bigint,
      item: { id: bigint; name: string; price: Prisma.Decimal } | null,
      createdAt: Date,
      withSnapshot = false,
    ) {
      if (!item) return;
      await prisma.itemOrder.create({
        data: {
          orderId,
          itemId: item.id,
          productId: null,
          employeeId: maria.id,
          quantity: 1,
          price: item.price,
          productNameSnapshot: item.name,
          unitPriceSnapshot: item.price,
          lineTotal: item.price,
          commissionRateSnapshot: withSnapshot ? rate : null,
          tenantId,
          createdAt,
          updatedAt: createdAt,
        },
      });
    }

    // Open sheet: Valeria (cita en atención) — 1 servicio de María
    const sheetValeria = await prisma.order.create({
      data: {
        customerId: c1.id,
        employeeId: maria.id,
        name: 'Valeria Gómez',
        status: 'draft',
        paymentStatus: false,
        subtotal: corteItem?.price ?? new Prisma.Decimal(0),
        total: corteItem?.price ?? new Prisma.Decimal(0),
        tenantId,
        createdAt: todayAt(10, 5),
        updatedAt: todayAt(10, 20),
      },
    });
    await addServiceLine(sheetValeria.id, corteItem, todayAt(10, 20));

    // Open sheet: walk-in Ana — brushing
    const sheetAna = await prisma.order.create({
      data: {
        customerId: c3.id,
        employeeId: maria.id,
        name: 'Ana Ruiz',
        status: 'draft',
        paymentStatus: false,
        subtotal: brushItem?.price ?? new Prisma.Decimal(0),
        total: brushItem?.price ?? new Prisma.Decimal(0),
        tenantId,
        createdAt: todayAt(11, 10),
        updatedAt: todayAt(11, 40),
      },
    });
    await addServiceLine(sheetAna.id, brushItem, todayAt(11, 40));

    // Empty open sheet ready to annotate
    await prisma.order.create({
      data: {
        employeeId: maria.id,
        name: 'Cliente walk-in',
        status: 'draft',
        paymentStatus: false,
        subtotal: new Prisma.Decimal(0),
        total: new Prisma.Decimal(0),
        tenantId,
        createdAt: todayAt(12, 0),
        updatedAt: todayAt(12, 0),
      },
    });

    // Finalized ticket: Lucía — confirmed commission for Mi día
    const luciaTotal = balayageItem?.price ?? new Prisma.Decimal(1800);
    const sheetLucia = await prisma.order.create({
      data: {
        customerId: c2.id,
        employeeId: maria.id,
        name: 'Lucía Mendoza',
        status: 'finalized',
        paymentStatus: true,
        subtotal: luciaTotal,
        total: luciaTotal,
        finalizedAt: todayAt(9, 45),
        tenantId,
        createdAt: todayAt(9, 0),
        updatedAt: todayAt(9, 45),
      },
    });
    await addServiceLine(sheetLucia.id, balayageItem, todayAt(9, 30), true);
    await prisma.orderPayment.create({
      data: {
        tenantId,
        orderId: sheetLucia.id,
        method: 'card',
        amount: luciaTotal,
        paidAt: todayAt(9, 45),
        createdAt: todayAt(9, 45),
        updatedAt: todayAt(9, 45),
      },
    });

    // Extra pending line on Valeria if keratina exists (multi-service sheet)
    if (keratinaItem && corteItem) {
      const extra = corteItem.price.plus(keratinaItem.price);
      await addServiceLine(sheetValeria.id, keratinaItem, todayAt(10, 50));
      await prisma.order.update({
        where: { id: sheetValeria.id },
        data: { subtotal: extra, total: extra, updatedAt: todayAt(10, 50) },
      });
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
    where: {
      tenantId,
      status: 'finalized',
      OR: [
        { name: { in: ['Lucía Mendoza', 'Venta mostrador'] } },
        { finalizedAt: null },
      ],
    },
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

  await enrichDemoOpsData(tenantId, {
    now,
    passwordHash,
    mariaId: maria.id,
    carlosId: carlos.id,
    sofiaId: sofia.id,
    corteId: corte?.id ?? null,
    fadeId: fade?.id ?? null,
    brushId: brush?.id ?? null,
    balayageId: balayage?.id ?? null,
    shampooId: shampoo?.id ?? null,
    serumId: serum?.id ?? null,
    customerIds: [c1.id, c2.id, c3.id],
  });
}

type DemoOpsCtx = {
  now: Date;
  passwordHash: string;
  mariaId: bigint;
  carlosId: bigint;
  sofiaId: bigint;
  corteId: bigint | null;
  fadeId: bigint | null;
  brushId: bigint | null;
  balayageId: bigint | null;
  shampooId: bigint | null;
  serumId: bigint | null;
  customerIds: bigint[];
};

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function atDayOffset(offsetDays: number, hour: number, minute: number): Date {
  const todayYmd = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Managua',
  });
  const ymd = addDaysYmd(todayYmd, offsetDays);
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return new Date(`${ymd}T${hh}:${mm}:00-06:00`);
}

async function ensureExpenseCategories(tenantId: bigint, now: Date) {
  const rows = [
    { name: 'Alquiler', slug: 'alquiler' },
    { name: 'Insumos', slug: 'insumos' },
    { name: 'Servicios', slug: 'servicios' },
    { name: 'Marketing', slug: 'marketing' },
    { name: 'Sueldos', slug: 'sueldos' },
    { name: 'Otros', slug: 'otros' },
  ];
  for (const row of rows) {
    await prisma.expenseCategory.upsert({
      where: { tenantId_slug: { tenantId, slug: row.slug } },
      create: {
        tenantId,
        name: row.name,
        slug: row.slug,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      update: { active: true, name: row.name, updatedAt: now },
    });
  }
}

/** Fills empty demo modules: expenses, cash, Instagram, calendar history, stock moves. */
async function enrichDemoOpsData(tenantId: bigint, ctx: DemoOpsCtx) {
  const { now } = ctx;
  const admin = await prisma.user.findFirst({
    where: { tenantId, email: DEMO_ADMIN_EMAIL },
  });
  if (!admin) return;

  await ensureExpenseCategories(tenantId, now);

  const cats = await prisma.expenseCategory.findMany({ where: { tenantId } });
  const bySlug = new Map(cats.map((c) => [c.slug, c]));

  const expenseCount = await prisma.expense.count({ where: { tenantId } });
  if (expenseCount === 0) {
    const expenseRows: Array<{
      slug: string;
      amount: number;
      method: string;
      offset: number;
      note: string;
    }> = [
      {
        slug: 'alquiler',
        amount: 12000,
        method: 'transfer',
        offset: -3,
        note: 'Alquiler Plaza Inter — mes demo',
      },
      {
        slug: 'insumos',
        amount: 2850,
        method: 'cash',
        offset: -2,
        note: 'Compra coloración y oxidante',
      },
      {
        slug: 'servicios',
        amount: 1600,
        method: 'transfer',
        offset: -5,
        note: 'Energía / agua',
      },
      {
        slug: 'marketing',
        amount: 900,
        method: 'card',
        offset: -1,
        note: 'Boost Instagram',
      },
      {
        slug: 'otros',
        amount: 450,
        method: 'cash',
        offset: 0,
        note: 'Café y snacks para clientas',
      },
    ];
    for (const row of expenseRows) {
      const cat = bySlug.get(row.slug);
      if (!cat) continue;
      await prisma.expense.create({
        data: {
          tenantId,
          categoryId: cat.id,
          amount: new Prisma.Decimal(row.amount),
          currency: 'NIO',
          method: row.method,
          spentAt: atDayOffset(row.offset, 10, 30),
          note: row.note,
          recordedById: admin.id,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
  }

  const cashCount = await prisma.cashSession.count({ where: { tenantId } });
  if (cashCount === 0) {
    await prisma.cashSession.create({
      data: {
        tenantId,
        status: 'closed',
        openedAt: atDayOffset(-1, 8, 45),
        closedAt: atDayOffset(-1, 18, 10),
        openedById: admin.id,
        closedById: admin.id,
        openingFloat: new Prisma.Decimal(1500),
        expectedCash: new Prisma.Decimal(4200),
        countedCash: new Prisma.Decimal(4180),
        difference: new Prisma.Decimal(-20),
        note: 'Cierre demo día anterior',
        createdAt: now,
        updatedAt: now,
      },
    });
    await prisma.cashSession.create({
      data: {
        tenantId,
        status: 'open',
        openedAt: todayAt(8, 50),
        openedById: admin.id,
        openingFloat: new Prisma.Decimal(2000),
        note: 'Caja abierta hoy (demo)',
        createdAt: now,
        updatedAt: now,
      },
    });
  } else {
    const open = await prisma.cashSession.findFirst({
      where: { tenantId, status: 'open' },
    });
    if (!open) {
      await prisma.cashSession.create({
        data: {
          tenantId,
          status: 'open',
          openedAt: todayAt(8, 50),
          openedById: admin.id,
          openingFloat: new Prisma.Decimal(2000),
          note: 'Caja abierta hoy (demo)',
          createdAt: now,
          updatedAt: now,
        },
      });
    }
  }

  const igCount = await prisma.instagramFeed.count({
    where: { tenantId, deletedAt: null },
  });
  if (igCount === 0) {
    const cards = [
      {
        title: 'Color balayage',
        href: 'https://www.instagram.com/florece.app',
      },
      {
        title: 'Fade de temporada',
        href: 'https://www.instagram.com/florece.app',
      },
    ];
    for (const card of cards) {
      const html = `<a href="${card.href}" target="_blank" rel="noopener noreferrer" style="display:block;padding:1.25rem;border-radius:1rem;background:linear-gradient(145deg,#f7f3ef,#efe6da);border:1px solid rgba(22,20,18,.08);text-decoration:none;color:#161412;font-family:system-ui,sans-serif"><p style="margin:0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;opacity:.5">Instagram</p><p style="margin:.5rem 0 0;font-size:1.15rem;font-weight:600">${card.title}</p><p style="margin:.35rem 0 0;font-size:.85rem;opacity:.65">@florece.app · Ver publicación</p></a>`;
      await prisma.instagramFeed.create({
        data: {
          content: html,
          tenantId,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
  }

  // Inventory history (receive + adjustment) so Catálogo → movimientos no esté vacío
  const moveCount = await prisma.inventoryMovement.count({ where: { tenantId } });
  if (moveCount === 0) {
    const products = await prisma.product.findMany({
      where: { item: { tenantId } },
      take: 4,
      orderBy: { id: 'asc' },
    });
    for (const p of products) {
      await prisma.inventoryMovement.create({
        data: {
          tenantId,
          productId: p.id,
          userId: admin.id,
          type: 'receive',
          quantity: Math.max(5, Math.floor(p.stock * 0.3) || 5),
          stockAfter: p.stock,
          reason: 'Recepción inicial demo',
          createdAt: atDayOffset(-7, 11, 0),
        },
      });
      if (p.stock > 0) {
        await prisma.inventoryMovement.create({
          data: {
            tenantId,
            productId: p.id,
            userId: admin.id,
            type: 'adjustment',
            quantity: -1,
            stockAfter: Math.max(0, p.stock - 1),
            reason: 'Ajuste inventario demo',
            createdAt: atDayOffset(-2, 16, 0),
          },
        });
      }
    }
  }

  // Calendar: citas de días pasados / mañana (además de las de hoy)
  const pending = await prisma.status.findFirst({
    where: { tenantId, name: 'Pendiente' },
  });
  const concluded = await prisma.status.findFirst({
    where: { tenantId, name: 'Concluido' },
  });
  const localType = await prisma.type.findFirst({
    where: { tenantId, name: 'Local' },
  });
  const webType = await prisma.type.findFirst({
    where: { tenantId, name: 'Web' },
  });

  if (pending && concluded && localType && webType && ctx.customerIds.length >= 3) {
    const histPhones = ['88885501', '88885502', '88885503', '88885504', '88885505'];
    const { start: dayStart, end: dayEnd } = demoDayBounds();
    const oldHist = await prisma.appointment.findMany({
      where: {
        tenantId,
        phone: { in: histPhones },
        OR: [
          { startTime: { lt: dayStart } },
          { startTime: { gt: dayEnd } },
        ],
      },
      select: { id: true },
    });
    if (oldHist.length > 0) {
      const ids = oldHist.map((a) => a.id);
      await prisma.appointmentService.deleteMany({
        where: { appointmentId: { in: ids } },
      });
      await prisma.appointment.deleteMany({ where: { id: { in: ids } } });
    }

    const histSlots: Array<{
      customerId: bigint;
      employeeId: bigint;
      statusId: bigint;
      typeId: bigint;
      name: string;
      phone: string;
      start: Date;
      minutes: number;
      serviceId: bigint | null;
    }> = [
      {
        customerId: ctx.customerIds[0],
        employeeId: ctx.mariaId,
        statusId: concluded.id,
        typeId: localType.id,
        name: 'Carla Núñez',
        phone: histPhones[0],
        start: atDayOffset(-5, 10, 0),
        minutes: 45,
        serviceId: ctx.corteId,
      },
      {
        customerId: ctx.customerIds[1],
        employeeId: ctx.carlosId,
        statusId: concluded.id,
        typeId: webType.id,
        name: 'Pedro Salinas',
        phone: histPhones[1],
        start: atDayOffset(-3, 11, 30),
        minutes: 40,
        serviceId: ctx.fadeId,
      },
      {
        customerId: ctx.customerIds[2],
        employeeId: ctx.sofiaId,
        statusId: concluded.id,
        typeId: localType.id,
        name: 'Andrea López',
        phone: histPhones[2],
        start: atDayOffset(-1, 15, 0),
        minutes: 60,
        serviceId: ctx.brushId,
      },
      {
        customerId: ctx.customerIds[0],
        employeeId: ctx.mariaId,
        statusId: pending.id,
        typeId: webType.id,
        name: 'Mónica Reyes',
        phone: histPhones[3],
        start: atDayOffset(1, 9, 30),
        minutes: 150,
        serviceId: ctx.balayageId,
      },
      {
        customerId: ctx.customerIds[1],
        employeeId: ctx.carlosId,
        statusId: pending.id,
        typeId: webType.id,
        name: 'José Amador',
        phone: histPhones[4],
        start: atDayOffset(2, 12, 0),
        minutes: 40,
        serviceId: ctx.fadeId,
      },
    ];

    for (const slot of histSlots) {
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

  // Una cita Concluido hoy para el tablero
  if (concluded && localType && ctx.customerIds[2] && ctx.sofiaId) {
    const { start: dayStart, end: dayEnd } = demoDayBounds();
    const hasConcluded = await prisma.appointment.findFirst({
      where: {
        tenantId,
        statusId: concluded.id,
        startTime: { gte: dayStart, lte: dayEnd },
      },
    });
    if (!hasConcluded) {
      const start = todayAt(9, 0);
      const appt = await prisma.appointment.create({
        data: {
          customerId: ctx.customerIds[2],
          employeeId: ctx.sofiaId,
          statusId: concluded.id,
          typeId: localType.id,
          name: 'Rosa Medina',
          phone: '88886666',
          startTime: start,
          endTime: new Date(start.getTime() + 45 * 60_000),
          tenantId,
          createdAt: now,
          updatedAt: now,
        },
      });
      if (ctx.brushId) {
        await prisma.appointmentService.create({
          data: {
            appointmentId: appt.id,
            serviceId: ctx.brushId,
            createdAt: now,
            updatedAt: now,
          },
        });
      }
    }
  }

  // Extra customers for Clientes list
  await ensureNamedCustomer(
    tenantId,
    'Rosa Medina',
    'rosa@demo.florece.app',
    ctx.passwordHash,
    now,
  );
  await ensureNamedCustomer(
    tenantId,
    'Carla Núñez',
    'carla@demo.florece.app',
    ctx.passwordHash,
    now,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
