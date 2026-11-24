import { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dialog } from '../../src/components/Dialog';
import { Hero, Sheet, StatusStrip } from '../../src/components/Hero';
import { Field, PrimaryButton, SectionTitle } from '../../src/components/ui';
import { abrirCaja, cajaActual, cerrarCaja, historialCaja, monto, type SesionCaja } from '../../src/lib/caja';
import { dinero, mercadoDe } from '../../src/lib/format';
import { loadPublicSalon, type PublicSalon } from '../../src/lib/salon';
import { SesionVencida, useSesion } from '../../src/lib/staff';
import { useStatusBar } from '../../src/lib/statusBar';
import { color, font, shadow } from '../../src/theme';

export default function Caja() {
  const router = useRouter();
  const sesion = useSesion();
  const insets = useSafeAreaInsets();
  useStatusBar('light');

  const [salon, setSalon] = useState<PublicSalon | null>(null);
  const [actual, setActual] = useState<SesionCaja | null | undefined>(undefined);
  const [historial, setHistorial] = useState<SesionCaja[]>([]);
  const [fondo, setFondo] = useState('');
  const [contado, setContado] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cerrada, setCerrada] = useState<SesionCaja | null>(null);

  const mercado = mercadoDe(salon?.currency);
  const plata = (n: number) => dinero(salon?.currency ?? 'C$', n);
  const slug = sesion?.tenant.slug;

  const recargar = useCallback(async () => {
    if (!slug) return;
    setError(null);
    try {
      const [cur, lista, s] = await Promise.all([cajaActual(), historialCaja(), loadPublicSalon(slug).catch(() => null)]);
      setActual(cur);
      setHistorial(lista.filter((x) => x.status !== 'open').slice(0, 5));
      if (s) setSalon(s);
    } catch (err) {
      if (!(err instanceof SesionVencida)) setError(err instanceof Error ? err.message : 'No se pudo cargar la caja');
    }
  }, [slug]);

  useFocusEffect(
    useCallback(() => {
      void recargar();
    }, [recargar]),
  );

  const fecha = (iso: string) =>
    new Date(iso).toLocaleString('es', {
      timeZone: mercado.timeZone,
      weekday: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

  const fondoNum = fondo.trim() === '' ? 0 : monto(fondo);
  const contadoNum = monto(contado);

  async function abrir() {
    if (!(fondoNum >= 0)) return;
    setOcupado(true);
    setError(null);
    try {
      await abrirCaja(fondoNum);
      setFondo('');
      await recargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir la caja');
    } finally {
      setOcupado(false);
    }
  }

  async function cerrar() {
    if (!actual || !(contadoNum >= 0)) return;
    setOcupado(true);
    setError(null);
    try {
      setCerrada(await cerrarCaja(actual.id, contadoNum));
      setContado('');
      await recargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar la caja');
    } finally {
      setOcupado(false);
    }
  }

  const diferenciaTexto = (d: number) => (Math.abs(d) < 0.005 ? 'Cuadra exacto' : d > 0 ? `Sobra ${plata(d)}` : `Falta ${plata(-d)}`);
  const colores = salon?.theme.custom ? { bg: salon.theme.button, text: salon.theme.buttonText } : undefined;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
        <Hero
          theme={salon?.theme}
          eyebrow={sesion?.tenant.name}
          title="Caja"
          subtitle={actual === undefined ? null : actual ? 'Abierta' : 'Cerrada'}
          onBack={() => router.back()}
        />
        <Sheet>
          {actual === undefined && !error ? <ActivityIndicator color={color.gold} /> : null}

          {actual ? (
            <>
              <View style={styles.tarjeta}>
                <Fila etiqueta="Abierta" valor={fecha(actual.openedAt)} />
                {actual.openedBy ? <Fila etiqueta="Por" valor={actual.openedBy.name} /> : null}
                <Fila etiqueta="Fondo inicial" valor={plata(actual.openingFloat)} />
              </View>
              <SectionTitle>Cerrar caja</SectionTitle>
              <Text style={styles.meta}>Contá el efectivo que hay en la caja. El sistema calcula cuánto debería haber.</Text>
              <Field value={contado} onChangeText={setContado} placeholder="Efectivo contado" keyboardType="decimal-pad" />
              <PrimaryButton
                label="Cerrar caja"
                colors={colores}
                disabled={contado.trim() === '' || !(contadoNum >= 0)}
                loading={ocupado}
                onPress={() => void cerrar()}
              />
            </>
          ) : actual === null ? (
            <>
              <SectionTitle>Abrir caja</SectionTitle>
              <Text style={styles.meta}>Anotá con cuánto efectivo empieza el día.</Text>
              <Field value={fondo} onChangeText={setFondo} placeholder="Fondo inicial (0 si no hay)" keyboardType="decimal-pad" />
              <PrimaryButton label="Abrir caja" colors={colores} disabled={!(fondoNum >= 0)} loading={ocupado} onPress={() => void abrir()} />
            </>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {historial.length > 0 ? (
            <>
              <SectionTitle>Cierres anteriores</SectionTitle>
              {historial.map((h) => (
                <View key={h.id} style={styles.tarjeta}>
                  <Fila etiqueta={h.closedAt ? fecha(h.closedAt) : fecha(h.openedAt)} valor={h.countedCash != null ? plata(h.countedCash) : '—'} />
                  {h.difference != null ? (
                    <Text style={[styles.meta, { color: Math.abs(h.difference) < 0.005 ? color.ok : color.danger }]}>
                      {diferenciaTexto(h.difference)}
                    </Text>
                  ) : null}
                </View>
              ))}
            </>
          ) : null}
        </Sheet>
      </ScrollView>
      <StatusStrip theme={salon?.theme} />
      <Dialog
        visible={cerrada != null}
        eyebrow="Caja cerrada"
        title={cerrada?.difference != null ? diferenciaTexto(cerrada.difference) : 'Listo'}
        message={
          cerrada
            ? `Debía haber ${plata(cerrada.expectedCash ?? 0)} y se contaron ${plata(cerrada.countedCash ?? 0)}.`
            : undefined
        }
        onClose={() => setCerrada(null)}
        actions={[{ label: 'Listo', tone: 'primary', onPress: () => setCerrada(null) }]}
      />
    </KeyboardAvoidingView>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.fila}>
      <Text style={styles.meta}>{etiqueta}</Text>
      <Text style={styles.valor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  scroll: { flexGrow: 1 },
  tarjeta: {
    backgroundColor: color.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: color.line,
    padding: 16,
    gap: 8,
    ...shadow,
  },
  fila: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  valor: { fontFamily: font.bold, fontSize: 15, color: color.ink },
  meta: { fontFamily: font.body, fontSize: 14, color: color.muted },
  error: { color: color.danger, fontSize: 14, fontFamily: font.body },
});
