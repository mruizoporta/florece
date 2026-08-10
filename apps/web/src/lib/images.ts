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

/** Absolute URL, public path (`/demo/...`), or storage filename. */
function resolveAsset(
  filename: string | null | undefined,
  buildStorageUrl: (name: string) => string,
): string | null {
  if (!filename || isPlaceholderAsset(filename)) return null;
  if (
    filename.startsWith("http://") ||
    filename.startsWith("https://") ||
    filename.startsWith("/")
  ) {
    return filename;
  }
  return buildStorageUrl(filename);
}

export function bannerUrl(filename?: string | null): string | null {
  return resolveAsset(
    filename,
    (name) => `${API_URL}/storage/banners/1920/${name}`,
  );
}

export function logoUrl(filename?: string | null): string | null {
  return resolveAsset(filename, (name) => `${API_URL}/storage/logo/128/${name}`);
}

export function itemImageUrl(filename?: string | null): string | null {
  return resolveAsset(filename, (name) => `${API_URL}/storage/items/512/${name}`);
}

export function employeeImageUrl(filename?: string | null): string | null {
  return resolveAsset(
    filename,
    (name) => `${API_URL}/storage/employees/300/${name}`,
  );
}

export function imageUrl(folder: string, filename?: string | null): string | null {
  return resolveAsset(filename, (name) => `${API_URL}/storage/${folder}/${name}`);
}
