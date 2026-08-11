/** Browser calls same-origin `/backend` (Next rewrite → Nest). Server can hit API directly. */
const API_URL =
  typeof window === "undefined"
    ? (process.env.API_PROXY_TARGET ??
      process.env.NEXT_PUBLIC_API_URL ??
      "http://127.0.0.1:3001")
    : (process.env.NEXT_PUBLIC_API_URL?.startsWith("http") &&
        process.env.NEXT_PUBLIC_USE_DIRECT_API === "true"
        ? process.env.NEXT_PUBLIC_API_URL
        : "/backend");

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiOptions = {
  tenantSlug?: string;
  auth?: boolean;
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("florece_access_token");
}

export function setAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("florece_access_token", token);
    document.cookie = `florece_access_token=${token}; path=/; max-age=604800; SameSite=Lax`;
  } else {
    localStorage.removeItem("florece_access_token");
    document.cookie = "florece_access_token=; path=/; max-age=0";
  }
}

export function getStoredTenantSlug(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("florece_tenant_slug");
}

export function setStoredTenantSlug(slug: string | null) {
  if (typeof window === "undefined") return;
  if (slug) localStorage.setItem("florece_tenant_slug", slug);
  else localStorage.removeItem("florece_tenant_slug");
}

export async function api<T = unknown>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { tenantSlug, auth = false, method = "GET", body, headers = {} } =
    options;

  const reqHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  if (body !== undefined) {
    reqHeaders["Content-Type"] = "application/json";
  }

  const slug = tenantSlug ?? getStoredTenantSlug();
  if (slug) {
    reqHeaders["X-Tenant-Slug"] = slug;
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      reqHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: reqHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
    });
  } catch {
    throw new ApiError(
      `No se pudo conectar con la API (${API_URL}). Asegurate de tener npm run dev:api en otro terminal.`,
      0,
    );
  }
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

/** Multipart upload (do not set Content-Type — browser sets boundary). */
export async function apiUpload<T = unknown>(
  path: string,
  form: FormData,
  options: { tenantSlug?: string; auth?: boolean } = {},
): Promise<T> {
  const { tenantSlug, auth = true } = options;
  const reqHeaders: Record<string, string> = {
    Accept: "application/json",
  };
  const slug = tenantSlug ?? getStoredTenantSlug();
  if (slug) reqHeaders["X-Tenant-Slug"] = slug;
  if (auth) {
    const token = getAccessToken();
    if (token) reqHeaders["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: reqHeaders,
      body: form,
      credentials: "include",
    });
  } catch {
    throw new ApiError(`No se pudo conectar con la API (${API_URL}).`, 0);
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data);
  }
  return data as T;
}

export { API_URL };
