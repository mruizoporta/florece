import { API_URL } from "./api";

const PLACEHOLDERS = new Set([
  "your-logo.png",
  "your-banner.jpg",
  "placeholder.webp",
  "image_left.jpg",
  "image_right.jpg",
  "image_parallax.jpg",
  "default.png",
]);

export function isPlaceholderAsset(filename?: string | null): boolean {
  if (!filename) return true;
  return PLACEHOLDERS.has(filename);
}

/**
 * Public storage URL on the same origin (nginx `/storage` or Nest static).
 * Avoid `/backend/storage` so browsers hit the persistent disk mount.
 */
function publicStorageBase(): string {
  if (typeof window !== "undefined") return "/storage";
  const app = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  return app ? `${app}/storage` : "/storage";
}

/** Absolute URL, public path (`/demo/...`, `/storage/...`), or legacy filename. */
function resolveAsset(
  filename: string | null | undefined,
  buildLegacyUrl: (name: string) => string,
): string | null {
  if (!filename || isPlaceholderAsset(filename)) return null;
  if (
    filename.startsWith("http://") ||
    filename.startsWith("https://") ||
    filename.startsWith("/")
  ) {
    return filename;
  }
  // New uploads are stored as `/storage/{slug}/{kind}/file` — if DB only has relative:
  if (filename.includes("/")) {
    return `${publicStorageBase()}/${filename.replace(/^\/+/, "")}`;
  }
  return buildLegacyUrl(filename);
}

export function bannerUrl(filename?: string | null): string | null {
  return resolveAsset(
    filename,
    (name) => `${publicStorageBase()}/banners/1920/${name}`,
  );
}

export function logoUrl(filename?: string | null): string | null {
  return resolveAsset(
    filename,
    (name) => `${publicStorageBase()}/logo/128/${name}`,
  );
}

export function itemImageUrl(filename?: string | null): string | null {
  return resolveAsset(
    filename,
    (name) => `${publicStorageBase()}/items/512/${name}`,
  );
}

export function employeeImageUrl(filename?: string | null): string | null {
  return resolveAsset(
    filename,
    (name) => `${publicStorageBase()}/employees/300/${name}`,
  );
}

export function imageUrl(folder: string, filename?: string | null): string | null {
  return resolveAsset(
    filename,
    (name) => `${publicStorageBase()}/${folder}/${name}`,
  );
}

/** @deprecated Prefer public `/storage` paths; kept for rare API-relative needs */
export function legacyApiStorageUrl(path: string): string {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
