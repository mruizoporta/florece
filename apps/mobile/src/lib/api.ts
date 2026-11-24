import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PRODUCCION = 'https://floreceapp.com/backend';

function resolverBaseUrl(): string {
  const desdeEnv = process.env.EXPO_PUBLIC_API_URL;
  if (desdeEnv) return desdeEnv.replace(/\/$/, '');

  // La APK no tiene el servidor de Expo: habla con el API público.
  if (!__DEV__) return API_PRODUCCION;

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:3001`;

  return Platform.OS === 'android'
    ? 'http://10.0.2.2:3001'
    : 'http://localhost:3001';
}

export const API_URL = resolverBaseUrl();

type ApiOptions = {
  slug?: string;
  method?: 'GET' | 'POST';
  body?: unknown;
};

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.slug) {
    headers['X-Tenant-Slug'] = options.slug;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!response.ok) {
    throw new Error(mensajeDeApi(data) ?? `Error ${response.status}`);
  }
  return data as T;
}

export function mensajeDeApi(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const message = (data as { message?: unknown }).message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) {
    return message.filter((item) => typeof item === 'string').join('\n');
  }
  return null;
}
