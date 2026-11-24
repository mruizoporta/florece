import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Field, PrimaryButton, SearchIcon, SectionTitle } from '../src/components/ui';
import { useStatusBar } from '../src/lib/statusBar';
import { esCodigoSalon } from '../src/lib/links';
import { searchSalons, type SalonHit } from '../src/lib/salon';
import { loadRecentSalons, type RecentSalon } from '../src/lib/storage';
import { color, font, shadow, space } from '../src/theme';

export default function Inicio() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useStatusBar('light');
  const [recientes, setRecientes] = useState<RecentSalon[]>([]);
  const [consulta, setConsulta] = useState('');
  const [codigo, setCodigo] = useState('');
  const [resultados, setResultados] = useState<SalonHit[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);

  useEffect(() => {
    void loadRecentSalons().then(setRecientes);
  }, []);

  useEffect(() => {
    const q = consulta.trim();
    if (q.length < 2) {
      setResultados([]);
      setErrorBusqueda(null);
      return;
    }
    const timer = setTimeout(() => {
      setBuscando(true);
      setErrorBusqueda(null);
      void searchSalons(q)
        .then(setResultados)
        .catch((error: unknown) => {
          setResultados([]);
          setErrorBusqueda(
            error instanceof Error ? error.message : 'No se pudo buscar',
          );
        })
        .finally(() => setBuscando(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [consulta]);

  function irAlSalon(slug: string) {
    router.push(`/s/${slug}`);
  }

  function abrirCodigo() {
    const slug = codigo.trim().toLowerCase();
    if (!esCodigoSalon(slug)) {
      setErrorCodigo('El código es el del salón, por ejemplo demo.');
      return;
    }
    setErrorCodigo(null);
    irAlSalon(slug);
  }

  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 40 }]}>
          <View style={[styles.aro, styles.aroGrande]} />
          <View style={[styles.aro, styles.aroChico]} />
          <Text style={styles.eyebrow}>RESERVAS DE BELLEZA</Text>
          <Text style={styles.marca}>Florece</Text>
          <Text style={styles.lema}>Tu próxima cita, a un toque.</Text>
        </View>

        <View style={styles.sheet}>
          <View style={styles.bloque}>
            <SectionTitle>Buscá tu salón</SectionTitle>
            <Field
              value={consulta}
              onChangeText={setConsulta}
              placeholder="Nombre del salón"
              autoCapitalize="words"
              icon={<SearchIcon />}
            />
            {buscando ? <ActivityIndicator color={color.gold} /> : null}
            {errorBusqueda ? <Text style={styles.error}>{errorBusqueda}</Text> : null}
            {consulta.trim().length >= 2 && !buscando && resultados.length === 0 && !errorBusqueda ? (
              <Text style={styles.vacio}>No hay un salón con ese nombre.</Text>
            ) : null}
            {resultados.map((salon) => (
              <Card
                key={salon.slug}
                title={salon.name}
                subtitle={salon.city || salon.slug}
                onPress={() => irAlSalon(salon.slug)}
              />
            ))}
          </View>

          <View style={styles.separador}>
            <View style={styles.linea} />
            <Text style={styles.o}>o con el código del salón</Text>
            <View style={styles.linea} />
          </View>

          <View style={styles.bloque}>
            <Field
              value={codigo}
              onChangeText={(texto) => {
                setCodigo(texto);
                setErrorCodigo(null);
              }}
              placeholder="Ej. demo"
              autoCapitalize="none"
            />
            {errorCodigo ? <Text style={styles.error}>{errorCodigo}</Text> : null}
            <PrimaryButton label="Entrar al salón" onPress={abrirCodigo} disabled={!codigo.trim()} />
          </View>

          <View style={styles.bloque}>
            <SectionTitle>Tus salones</SectionTitle>
            {recientes.length === 0 ? (
              <Text style={styles.vacio}>
                Cuando abras un salón, queda guardado acá para volver rápido.
              </Text>
            ) : (
              recientes.map((salon) => (
                <Card
                  key={salon.slug}
                  title={salon.name}
                  subtitle={salon.city || salon.slug}
                  onPress={() => irAlSalon(salon.slug)}
                />
              ))
            )}
          </View>

          <Pressable
            onPress={() => router.push('/citas')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.citas, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.citasTexto}>
              <Text style={styles.citasTitulo}>Mis citas</Text>
              <Text style={styles.citasSub}>Las reservas que hiciste desde este teléfono</Text>
            </View>
            <Text style={styles.citasFlecha}>›</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/salon')}
            accessibilityRole="button"
            style={styles.staff}
          >
            <Text style={styles.staffTexto}>
              ¿Trabajás en un salón? <Text style={styles.staffLink}>Entrá acá</Text>
            </Text>
          </Pressable>

          <Pressable
            onPress={() => void Linking.openURL('https://floreceapp.com/privacidad')}
            accessibilityRole="link"
            style={styles.staff}
          >
            <Text style={styles.privacidad}>Política de privacidad</Text>
          </Pressable>
        </View>
      </ScrollView>
      {/* Mantiene legible la barra de estado clara al desplazar. */}
      <View style={[styles.franja, { height: insets.top }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  franja: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: color.ink },
  safe: { flex: 1, backgroundColor: color.base },
  scroll: { flexGrow: 1, backgroundColor: color.ink },
  hero: {
    backgroundColor: color.ink,
    paddingHorizontal: space.screen,
    paddingBottom: 64,
    overflow: 'hidden',
  },
  aro: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(196,165,116,0.22)', borderRadius: 999 },
  aroGrande: { width: 300, height: 300, right: -120, top: -60 },
  aroChico: { width: 180, height: 180, right: -40, top: 30, borderColor: 'rgba(196,165,116,0.14)' },
  eyebrow: { fontFamily: font.medium, fontSize: 11, letterSpacing: 2.4, color: color.gold },
  marca: { fontFamily: font.display, fontSize: 58, color: color.cream, marginTop: 6, lineHeight: 64 },
  lema: { fontFamily: font.displayItalic, fontSize: 22, color: color.goldLight, marginTop: 2 },
  sheet: {
    flexGrow: 1,
    backgroundColor: color.base,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    padding: space.screen,
    paddingTop: 30,
    paddingBottom: 48,
    gap: 26,
  },
  bloque: { gap: 12 },
  separador: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: -6 },
  linea: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: color.goldLight },
  o: { fontFamily: font.displayItalic, fontSize: 17, color: color.goldDeep },
  vacio: { color: color.muted, fontSize: 14, lineHeight: 21, fontFamily: font.body },
  error: { color: color.danger, fontSize: 14, fontFamily: font.body },
  citas: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.ink,
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 20,
    ...shadow,
  },
  citasTexto: { flex: 1, gap: 2 },
  citasTitulo: { fontFamily: font.display, fontSize: 24, color: color.cream },
  citasSub: { fontFamily: font.body, fontSize: 13, color: '#b5afa8' },
  staff: { alignItems: 'center', paddingVertical: 4 },
  staffTexto: { fontFamily: font.body, fontSize: 14, color: color.muted },
  privacidad: { fontFamily: font.body, fontSize: 12, color: color.muted, textDecorationLine: 'underline' },
  staffLink: { fontFamily: font.bold, color: color.goldDeep },
  citasFlecha: { fontSize: 30, color: color.gold, marginTop: -4 },
});
