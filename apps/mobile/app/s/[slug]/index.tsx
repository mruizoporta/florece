import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Monogram, PrimaryButton, SectionTitle } from '../../../src/components/ui';
import { useStatusBar } from '../../../src/lib/statusBar';
import { dinero } from '../../../src/lib/format';
import { FLORECE_THEME } from '../../../src/lib/brand';
import { loadPublicSalon, type PublicSalon } from '../../../src/lib/salon';
import { rememberSalon } from '../../../src/lib/storage';
import { color, font, shadow, space } from '../../../src/theme';

export default function Salon() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useStatusBar('light');
  const [salon, setSalon] = useState<PublicSalon | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let activo = true;
    setSalon(null);
    setError(null);
    void loadPublicSalon(slug)
      .then((data) => {
        if (!activo) return;
        setSalon(data);
        void rememberSalon({ slug: data.slug, name: data.name, city: data.city });
      })
      .catch((err: unknown) => {
        if (!activo) return;
        setError(err instanceof Error ? err.message : 'No encontramos ese salón');
      });
    return () => {
      activo = false;
    };
  }, [slug]);

  const tema = salon?.theme ?? FLORECE_THEME;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 12, backgroundColor: tema.hero }]}>
          {salon?.banner ? (
            <>
              <Image source={{ uri: salon.banner }} style={styles.banner} resizeMode="cover" />
              <View style={[styles.velo, { backgroundColor: tema.hero }]} />
            </>
          ) : (
            <View style={[styles.aro, { borderColor: tema.accentOnHero }]} />
          )}
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            hitSlop={12}
            style={[styles.volver, { borderColor: tema.heroMuted }]}
          >
            <Text style={[styles.volverTexto, { color: tema.heroText }]}>‹</Text>
          </Pressable>
          {salon ? (
            <>
              {salon.logo ? (
                <Image
                  source={{ uri: salon.logo }}
                  style={[styles.logo, { borderColor: tema.accentOnHero }]}
                  accessibilityLabel={`Logo de ${salon.name}`}
                />
              ) : null}
              <Text style={[styles.eyebrow, { color: tema.accentOnHero }]}>
                {(salon.city || 'Salón').toUpperCase()}
              </Text>
              <Text style={[styles.nombre, { color: tema.heroText }]}>{salon.name}</Text>
              {salon.about ? (
                <Text style={[styles.about, { color: tema.heroMuted }]}>{salon.about}</Text>
              ) : null}
            </>
          ) : (
            <View style={styles.heroCarga}>
              {error ? null : <ActivityIndicator color={tema.accentOnHero} />}
            </View>
          )}
        </View>

        <View style={styles.sheet}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {salon ? (
            <>
              <SectionTitle>Servicios</SectionTitle>
              {salon.services.length === 0 ? (
                <Text style={styles.vacio}>Este salón todavía no publicó servicios.</Text>
              ) : (
                <View style={styles.lista}>
                  {salon.services.map((servicio, i) => (
                    <View key={servicio.id} style={[styles.fila, i > 0 && styles.filaBorde]}>
                      <View style={styles.filaTexto}>
                        <Text style={styles.item}>{servicio.item.name}</Text>
                        <Text style={styles.meta}>{servicio.durationTime} min</Text>
                      </View>
                      <Text style={[styles.precio, { color: tema.accent }]}>
                        {dinero(salon.currency, Number(servicio.item.price))}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <SectionTitle>Equipo</SectionTitle>
              {salon.employees.length === 0 ? (
                <Text style={styles.vacio}>No hay profesionales publicados.</Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.equipo}
                  style={styles.equipoScroll}
                >
                  {salon.employees.map((persona) => (
                    <View key={persona.id} style={styles.persona}>
                      <Monogram name={persona.name} size={62} image={persona.image} />
                      <Text style={styles.personaNombre} numberOfLines={2}>{persona.name}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}
              {!salon.bookingOpen ? (
                <Text style={styles.vacio}>Este salón no recibe citas en línea.</Text>
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>
      {/* Mantiene legible la barra de estado clara al desplazar. */}
      <View style={[styles.franja, { height: insets.top, backgroundColor: tema.hero }]} />

      {salon?.bookingOpen ? (
        <View style={[styles.barra, { paddingBottom: insets.bottom + 14 }]}>
          <PrimaryButton
            label="Agendar cita"
            tone="gold"
            colors={tema.custom ? { bg: tema.button, text: tema.buttonText } : undefined}
            onPress={() => router.push(`/s/${salon.slug}/agendar`)}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  franja: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: color.ink },
  root: { flex: 1, backgroundColor: color.base },
  scroll: { flexGrow: 1, paddingBottom: 120 },
  banner: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  velo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.72 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  hero: {
    backgroundColor: color.ink,
    paddingHorizontal: space.screen,
    paddingBottom: 60,
    overflow: 'hidden',
  },
  aro: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    opacity: 0.22,
    right: -110,
    top: -40,
  },
  volver: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(224,201,160,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  volverTexto: { color: color.cream, fontSize: 26, marginTop: -3 },
  heroCarga: { height: 90, justifyContent: 'center' },
  eyebrow: { fontFamily: font.medium, fontSize: 11, letterSpacing: 2.4, color: color.gold },
  nombre: { fontFamily: font.display, fontSize: 44, lineHeight: 48, color: color.cream, marginTop: 6 },
  about: { fontFamily: font.body, fontSize: 15, lineHeight: 23, color: '#cfc7bd', marginTop: 12 },
  sheet: {
    flexGrow: 1,
    backgroundColor: color.base,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    padding: space.screen,
    paddingTop: 30,
    gap: 14,
  },
  lista: {
    backgroundColor: color.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: 18,
    marginBottom: 14,
    ...shadow,
  },
  fila: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  filaBorde: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
  filaTexto: { flex: 1, gap: 2 },
  item: { fontSize: 20, fontFamily: font.display, color: color.ink },
  meta: { fontSize: 13, fontFamily: font.body, color: color.muted },
  precio: { fontSize: 15, fontFamily: font.bold, color: color.goldDeep },
  equipoScroll: { marginHorizontal: -space.screen },
  equipo: { gap: 18, paddingHorizontal: space.screen },
  persona: { width: 76, alignItems: 'center', gap: 8 },
  personaNombre: { fontFamily: font.medium, fontSize: 13, color: color.ink, textAlign: 'center' },
  vacio: { color: color.muted, fontSize: 14, fontFamily: font.body },
  error: { color: color.danger, fontSize: 15, fontFamily: font.body },
  barra: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.screen,
    paddingTop: 14,
    backgroundColor: 'rgba(247,243,238,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.line,
  },
});
