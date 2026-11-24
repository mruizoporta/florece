import * as Linking from 'expo-linking';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Ruta interna si el enlace apunta a un salón de floreceapp.com o florece://s/{slug}. */
export function routeFromUrl(url: string | null): string | null {
  if (!url) return null;

  let parsed: Linking.ParsedURL;
  try {
    parsed = Linking.parse(url);
  } catch {
    return null;
  }

  const scheme = (parsed.scheme ?? '').toLowerCase();
  const host = (parsed.hostname ?? '').toLowerCase();
  const path = (parsed.path ?? '').replace(/^\/+/, '').replace(/^--\//, '').toLowerCase();

  let slug: string | undefined;
  let agendar = false;

  if (host === 's') {
    const [first, second] = path.split('/');
    slug = first;
    agendar = second === 'agendar';
  } else if (
    host === 'floreceapp.com' ||
    host === 'www.floreceapp.com' ||
    scheme === 'exp' ||
    scheme === 'exps'
  ) {
    const parts = path.split('/').filter(Boolean);
    const index = parts.indexOf('s');
    slug = index >= 0 ? parts[index + 1] : undefined;
    agendar = index >= 0 && parts[index + 2] === 'agendar';
  }

  if (!slug || !SLUG.test(slug)) return null;
  return agendar ? `/s/${slug}/agendar` : `/s/${slug}`;
}

export function esCodigoSalon(value: string): boolean {
  return SLUG.test(value.trim().toLowerCase());
}
