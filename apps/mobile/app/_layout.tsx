import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  CormorantGaramond_500Medium_Italic,
  CormorantGaramond_600SemiBold,
  useFonts,
} from '@expo-google-fonts/cormorant-garamond';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as Notifications from 'expo-notifications';
import { routeFromUrl } from '../src/lib/links';
import { rutaDeAviso } from '../src/lib/push';
import { color, font } from '../src/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const [fuentes, falloFuentes] = useFonts({
    CormorantGaramond_500Medium_Italic,
    CormorantGaramond_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });
  const listo = fuentes || Boolean(falloFuentes);

  useEffect(() => {
    if (listo) void SplashScreen.hideAsync();
  }, [listo]);

  useEffect(() => {
    if (!listo) return;
    function abrir(url: string | null) {
      const ruta = routeFromUrl(url);
      if (ruta) router.replace(ruta);
    }

    void Linking.getInitialURL().then(abrir);
    const sub = Linking.addEventListener('url', ({ url }) => abrir(url));

    // Tocar un aviso abre la cita (salón) o "Mis citas" (clienta).
    function abrirAviso(response: Notifications.NotificationResponse | null) {
      const ruta = rutaDeAviso(response);
      if (ruta) router.push(ruta as never);
    }
    abrirAviso(Notifications.getLastNotificationResponse());
    const subAviso = Notifications.addNotificationResponseReceivedListener(abrirAviso);
    return () => {
      sub.remove();
      subAviso.remove();
    };
  }, [router, listo]);

  // En Android, el texto montado antes de cargar la fuente se queda con la del sistema.
  if (!listo) return null;

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: color.base },
          headerTintColor: color.ink,
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: font.display, fontSize: 22 },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: color.base },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="citas" options={{ title: 'Mis citas' }} />
        <Stack.Screen name="s/[slug]" options={{ headerShown: false }} />
        <Stack.Screen name="salon" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
