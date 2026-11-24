import { API_URL } from './api';

/** Origen del sitio web, que es quien sirve logos y fotos (`/demo/...`, `/storage/...`). */
function sitioWeb(): string {
  const env = process.env.EXPO_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, '');
  if (API_URL.endsWith('/backend')) return API_URL.slice(0, -'/backend'.length);
  return API_URL.replace(/:3001$/, ':3000');
}

const PLACEHOLDERS = new Set(['your-logo.png', 'your-banner.jpg', 'placeholder.webp', 'default.png']);

/** Igual que `resolveAsset` de la web, pero siempre absoluto. */
export function imagenUrl(valor: string | null | undefined, carpetaLegacy: string): string | null {
  if (!valor || PLACEHOLDERS.has(valor)) return null;
  if (/^https?:\/\//.test(valor)) return valor;
  if (valor.startsWith('/')) return `${sitioWeb()}${valor}`;
  if (valor.includes('/')) return `${sitioWeb()}/storage/${valor.replace(/^\/+/, '')}`;
  return `${sitioWeb()}/storage/${carpetaLegacy}/${valor}`;
}
