import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';
import { staffApi } from './staff';

// Con la app abierta, el aviso también se muestra.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let pedido: Promise<string | null> | null = null;

/** Pide permiso (una vez) y devuelve el token de Expo, o null si no hay permiso o no se puede (simulador). */
export function tokenPush(): Promise<string | null> {
  pedido ??= (async () => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Avisos',
          importance: Notifications.AndroidImportance.HIGH,
        });
      }
      let { status } = await Notifications.getPermissionsAsync();
      if (status === 'undetermined') ({ status } = await Notifications.requestPermissionsAsync());
      if (status !== 'granted') return null;
      const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
      return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch {
      return null;
    }
  })();
  const actual = pedido;
  // Si falló, se puede volver a intentar más tarde.
  void actual.then((t) => {
    if (!t && pedido === actual) pedido = null;
  });
  return actual;
}

/** Avisos de la clienta para una cita (recordatorios, cambios, cancelación). */
export async function avisosDeCita(viewToken: string) {
  const token = await tokenPush();
  if (!token) return;
  await api('/v1/push/appointment', { method: 'POST', body: { token, viewToken } }).catch(() => undefined);
}

/** Avisos del salón para el usuario con sesión. */
export async function avisosDeStaff() {
  const token = await tokenPush();
  if (!token) return;
  await staffApi('/v1/push/staff', { method: 'POST', body: { token } }).catch(() => undefined);
}

/** Al cerrar sesión: este teléfono deja de recibir los avisos de ese usuario. */
export async function quitarAvisosDeStaff() {
  const token = await tokenPush().catch(() => null);
  if (!token) return;
  await staffApi('/v1/push/staff/remove', { method: 'POST', body: { token } }).catch(() => undefined);
}

/** Ruta que trae el aviso tocado (la pone el API). */
export function rutaDeAviso(response: Notifications.NotificationResponse | null): string | null {
  const url = response?.notification.request.content.data?.url;
  return typeof url === 'string' && url.startsWith('/') ? url : null;
}
