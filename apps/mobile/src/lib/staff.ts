import { useSyncExternalStore } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_URL, mensajeDeApi } from './api';

export type StaffUser = {
  id: number;
  name: string;
  email: string;
  roles: string[];
  employeeId: number | null;
};

export type StaffSession = {
  accessToken: string;
  refreshToken: string;
  user: StaffUser;
  tenant: { slug: string; name: string };
};

type AuthResponse = Omit<StaffSession, 'tenant'> & {
  tenant: { slug: string; name: string };
};

export type LoginResult =
  | { ok: true }
  | { ok: false; salons: { slug: string; name: string }[] };

const CLAVE = 'florece.staff.session';
const MOVIL = { 'X-Florece-Client': 'mobile' };

let sesion: StaffSession | null = null;
let cargada = false;
const oyentes = new Set<() => void>();

function avisar() {
  oyentes.forEach((fn) => fn());
}

async function guardar(nueva: StaffSession | null) {
  sesion = nueva;
  if (nueva) await SecureStore.setItemAsync(CLAVE, JSON.stringify(nueva));
  else await SecureStore.deleteItemAsync(CLAVE);
  avisar();
}

function desdeRespuesta(data: AuthResponse): StaffSession {
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      roles: data.user.roles ?? [],
      employeeId: data.user.employeeId ?? null,
    },
    tenant: { slug: data.tenant.slug, name: data.tenant.name },
  };
}

export async function cargarSesion(): Promise<StaffSession | null> {
  if (cargada) return sesion;
  try {
    const raw = await SecureStore.getItemAsync(CLAVE);
    sesion = raw ? (JSON.parse(raw) as StaffSession) : null;
  } catch {
    sesion = null;
  }
  cargada = true;
  avisar();
  return sesion;
}

/** Sesión actual; `undefined` mientras se lee del almacenamiento seguro. */
export function useSesion(): StaffSession | null | undefined {
  return useSyncExternalStore(
    (fn) => {
      oyentes.add(fn);
      return () => oyentes.delete(fn);
    },
    () => (cargada ? sesion : undefined),
  );
}

async function postAuth<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...MOVIL },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!response.ok) {
    const error = new Error(mensajeDeApi(data) ?? `Error ${response.status}`) as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }
  return data as T;
}

export async function iniciarSesion(input: {
  email: string;
  password: string;
  tenantSlug?: string;
}): Promise<LoginResult> {
  const data = await postAuth<AuthResponse | { needsSalon: true; salons: { slug: string; name: string }[] }>(
    '/auth/login',
    { ...input, tenantSlug: input.tenantSlug || undefined },
  );
  if ('needsSalon' in data) return { ok: false, salons: data.salons };
  await guardar(desdeRespuesta(data));
  return { ok: true };
}

export async function cerrarSesion() {
  const actual = sesion;
  // Import tardío: push.ts usa staffApi de este archivo.
  if (actual) await import('./push').then((m) => m.quitarAvisosDeStaff()).catch(() => undefined);
  await guardar(null);
  if (actual) {
    try {
      await postAuth('/auth/logout', { refreshToken: actual.refreshToken });
    } catch {
      // La sesión local ya se borró; si el API no responde, el token vence solo.
    }
  }
}

// El API invalida el refresh token al usarlo: un solo refresh a la vez.
let renovando: Promise<boolean> | null = null;

function renovar(): Promise<boolean> {
  if (!renovando) {
    renovando = (async () => {
      const actual = sesion;
      if (!actual) return false;
      try {
        const data = await postAuth<AuthResponse>('/auth/refresh', {
          refreshToken: actual.refreshToken,
        });
        await guardar(desdeRespuesta(data));
        return true;
      } catch (err) {
        // Solo un rechazo del API cierra la sesión; sin conexión se conserva.
        if ((err as { status?: number }).status === 401) await guardar(null);
        return false;
      }
    })().finally(() => {
      renovando = null;
    });
  }
  return renovando;
}

export class SesionVencida extends Error {
  constructor() {
    super('Tu sesión venció. Entrá de nuevo.');
  }
}

export async function staffApi<T>(
  path: string,
  options: { method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown } = {},
  reintento = true,
): Promise<T> {
  const actual = sesion;
  if (!actual) throw new SesionVencida();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${actual.accessToken}`,
    'X-Tenant-Slug': actual.tenant.slug,
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 && reintento) {
    if (await renovar()) return staffApi<T>(path, options, false);
    throw new SesionVencida();
  }

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!response.ok) throw new Error(mensajeDeApi(data) ?? `Error ${response.status}`);
  return data as T;
}
