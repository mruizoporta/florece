import type { AuthUser, LoginInput, RegisterSalonInput } from "@florece/shared";
import { api, setAccessToken, setStoredTenantSlug } from "./api";

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
  tenant?: { slug: string; name: string };
};

export async function login(input: LoginInput): Promise<LoginResponse> {
  const data = await api<LoginResponse>("/auth/login", {
    method: "POST",
    body: input,
    tenantSlug: input.tenantSlug,
  });
  setAccessToken(data.accessToken);
  setStoredTenantSlug(input.tenantSlug);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await api("/auth/logout", { method: "POST", auth: true });
  } catch {
    // clear local session even if API fails
  }
  setAccessToken(null);
  setStoredTenantSlug(null);
}

export async function refreshToken(): Promise<string | null> {
  try {
    const data = await api<{ accessToken: string }>("/auth/refresh", {
      method: "POST",
      auth: true,
    });
    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export type MeResponse = {
  user: AuthUser;
  tenant: {
    id: number;
    name: string;
    slug: string;
    locale: string;
    isDemo: boolean;
    subscriptionStatus?: string;
    planName?: string | null;
    planSlug?: string | null;
  };
};

export async function getMe(): Promise<MeResponse | null> {
  try {
    return await api<MeResponse>("/auth/me", { auth: true });
  } catch {
    return null;
  }
}

export async function getMeUser(): Promise<AuthUser | null> {
  const me = await getMe();
  return me?.user ?? null;
}

export type BranchInfo = {
  id: number;
  name: string;
  slug: string;
  locale: string;
  isDemo: boolean;
  organizationId: number;
};

export async function listBranches(tenantSlug?: string): Promise<BranchInfo[]> {
  try {
    return await api<BranchInfo[]>("/auth/branches", {
      auth: true,
      tenantSlug,
    });
  } catch {
    return [];
  }
}

export async function switchBranch(
  input: { slug?: string; tenantId?: number },
  tenantSlug?: string,
): Promise<LoginResponse> {
  const data = await api<LoginResponse>("/auth/switch-branch", {
    method: "POST",
    body: input,
    auth: true,
    tenantSlug,
  });
  setAccessToken(data.accessToken);
  if (data.tenant?.slug) {
    setStoredTenantSlug(data.tenant.slug);
  }
  return data;
}

export async function registerSalon(input: RegisterSalonInput) {
  return api<{ accessToken?: string; tenant: { slug: string; name: string } }>(
    "/auth/register-salon",
    { method: "POST", body: input },
  );
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("florece_access_token");
}
