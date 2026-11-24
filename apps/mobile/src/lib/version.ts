import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';

type PorTienda = { minimum: string | null; latest: string | null; storeUrl: string };
type VersionesApi = { ios: PorTienda; android: PorTienda };

export type EstadoVersion =
  | { tipo: 'al-dia' }
  | { tipo: 'sugerida'; storeUrl: string; nueva: string }
  | { tipo: 'obligatoria'; storeUrl: string; nueva: string };

/** La versión instalada ("version" de app.json, la misma que muestra la tienda). */
export const VERSION_INSTALADA = Constants.expoConfig?.version ?? '0.0.0';

/** Compara "1.2.10" con "1.2.9" número por número. Negativo = a es más vieja. */
export function compararVersiones(a: string, b: string): number {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

export function estadoDeVersion(instalada: string, tienda: PorTienda): EstadoVersion {
  if (tienda.minimum && compararVersiones(instalada, tienda.minimum) < 0) {
    return { tipo: 'obligatoria', storeUrl: tienda.storeUrl, nueva: tienda.latest ?? tienda.minimum };
  }
  if (tienda.latest && compararVersiones(instalada, tienda.latest) < 0) {
    return { tipo: 'sugerida', storeUrl: tienda.storeUrl, nueva: tienda.latest };
  }
  return { tipo: 'al-dia' };
}

/** Pregunta al servidor. Sin conexión o con error, deja usar la app (nunca bloquea por fallar). */
export async function revisarVersion(): Promise<EstadoVersion> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return { tipo: 'al-dia' };
  try {
    const versiones = await api<VersionesApi>('/public/app-version');
    return estadoDeVersion(VERSION_INSTALADA, versiones[Platform.OS]);
  } catch {
    return { tipo: 'al-dia' };
  }
}
