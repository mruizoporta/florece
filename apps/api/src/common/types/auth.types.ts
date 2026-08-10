export type AuthUser = {
  id: bigint;
  name: string;
  email: string;
  tenantId: bigint;
  organizationId?: bigint | null;
  orgRole?: string | null;
  roles: string[];
  platformRole?: string | null;
};

export type JwtPayload = {
  sub: number;
  tenantId: number;
  organizationId?: number | null;
  roles: string[];
  platformRole?: string | null;
};

export const LARAVEL_USER_MODEL = 'App\\Models\\User';
