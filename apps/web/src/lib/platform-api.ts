import { PLATFORM_TENANT_SLUG } from "@florece/shared";
import { api } from "@/lib/api";

export function platformApi<T = unknown>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
  } = {},
) {
  return api<T>(`/platform${path}`, {
    ...options,
    auth: true,
    tenantSlug: PLATFORM_TENANT_SLUG,
  });
}
