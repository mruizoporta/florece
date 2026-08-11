import { z } from 'zod';

export * from './plans';
export * from './inventory';

export const RoleName = {
  Admin: 'Admin',
  Recepcionista: 'Recepcionista',
  Cajero: 'Cajero',
  Estilista: 'Estilista',
  Customer: 'Customer',
} as const;
export type RoleName = (typeof RoleName)[keyof typeof RoleName];

/** Roles de staff del salón (pueden entrar al panel o piso). */
export const STAFF_ROLES = [
  RoleName.Admin,
  RoleName.Recepcionista,
  RoleName.Cajero,
  RoleName.Estilista,
] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  Admin: 'Administrador (todo)',
  Recepcionista: 'Agenda / recepción',
  Cajero: 'Caja / facturación',
  Estilista: 'Piso / mis servicios',
};

export function isSalonStaff(roles: string[] | null | undefined): boolean {
  if (!roles?.length) return false;
  return roles.some((r) =>
    (STAFF_ROLES as readonly string[]).includes(r),
  );
}

export function canManageAgenda(roles: string[] | null | undefined): boolean {
  return Boolean(
    roles?.includes(RoleName.Admin) ||
      roles?.includes(RoleName.Recepcionista),
  );
}

export function canManageCaja(roles: string[] | null | undefined): boolean {
  return Boolean(
    roles?.includes(RoleName.Admin) || roles?.includes(RoleName.Cajero),
  );
}

export function canManageSalon(roles: string[] | null | undefined): boolean {
  return Boolean(roles?.includes(RoleName.Admin));
}

/** Acceso al panel admin completo (no solo piso de estilista). */
export function canAccessSalonAdmin(
  roles: string[] | null | undefined,
): boolean {
  return (
    canManageSalon(roles) || canManageAgenda(roles) || canManageCaja(roles)
  );
}

export function isStylist(roles: string[] | null | undefined): boolean {
  return Boolean(roles?.includes(RoleName.Estilista));
}

/** Home por defecto tras login de staff. */
export function salonStaffHomePath(
  slug: string,
  roles: string[] | null | undefined,
): string {
  if (isStylist(roles) && !canAccessSalonAdmin(roles)) {
    return `/s/${slug}/stylist`;
  }
  return `/s/${slug}/admin`;
}

export const PlatformRole = {
  PLATFORM_OWNER: 'PLATFORM_OWNER',
  PLATFORM_SUPPORT: 'PLATFORM_SUPPORT',
} as const;
export type PlatformRole = (typeof PlatformRole)[keyof typeof PlatformRole];

export const OrgRole = {
  OWNER: 'OWNER',
  MEMBER: 'MEMBER',
} as const;
export type OrgRole = (typeof OrgRole)[keyof typeof OrgRole];

export const createBranchSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  locale: z.enum(['es', 'en']).optional(),
});
export type CreateBranchInput = z.infer<typeof createBranchSchema>;

export const loginSchema = z.object({
  tenantSlug: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSalonSchema = z.object({
  salonName: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  adminName: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8),
  billingRegion: z.enum(['NI', 'US']).default('NI'),
  locale: z.enum(['es', 'en']).default('es'),
  planSlug: z.string().optional(),
});
export type RegisterSalonInput = z.infer<typeof registerSalonSchema>;

export const createAppointmentSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().max(40).optional().nullable(),
  /** Optional; if omitted, uses typeName or defaults to Web */
  typeId: z.number().int().positive().optional(),
  /** Prefer this over hardcoding type ids (Flash=1 is wrong across tenants) */
  typeName: z.enum(['Web', 'Local', 'Flash']).optional(),
  employeeId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  serviceIds: z.array(z.number().int().positive()).min(1),
  statusId: z.number().int().positive().optional(),
  customerId: z.number().int().positive().optional(),
});
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const DEMO_SLUG = 'demo';
export const DEMO_ADMIN_EMAIL = 'admin@demo.florece.app';
export const DEMO_ADMIN_PASSWORD = 'demo1234';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  tenantId: number;
  organizationId?: number | null;
  orgRole?: string | null;
  roles: string[];
  platformRole?: string | null;
  employeeId?: number | null;
};

export type TenantPublic = {
  id: number;
  name: string;
  slug: string;
  locale: string;
  isDemo: boolean;
  organizationId?: number;
  subscriptionStatus?: string;
  planName?: string | null;
  planSlug?: string | null;
};

export type BranchPublic = {
  id: number;
  name: string;
  slug: string;
  locale: string;
  isDemo: boolean;
};
