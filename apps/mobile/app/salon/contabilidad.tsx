import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hero, Sheet, StatusStrip } from '../../src/components/Hero';
import { SectionTitle } from '../../src/components/ui';
import { cargarUtilidad, type Utilidad } from '../../src/lib/contabilidad';
import { PERIODOS, rango, type Periodo } from '../../src/lib/nomina';
import { dinero, mercadoDe } from '../../src/lib/format';
import { loadPublicSalon, type PublicSalon } from '../../src/lib/salon';
import { SesionVencida, useSesion } from '../../src/lib/staff';
import { useStatusBar } from '../../src/lib/statusBar';
import { color, font, shadow, space } from '../../src/theme';

const METODO: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  voucher: 'Bono',
  other: 'Otro',
};

export default function Contabilidad() {
  const router = useRouter();
  const sesion = useSesion();
  const insets = useSafeAreaInsets();
  useStatusBar('light');

  const [salon, setSalon] = useState<PublicSalon | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [datos, setDatos] = useState<Utilidad | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slug = sesion?.tenant.slug;
  const zona = mercadoDe(salon?.currency).timeZone;
  const plata = (n: number) => dinero(salon?.currency ?? 'C$', n);

  useEffect(() => {
    if (slug) void loadPublicSalon(slug).then(setSalon).catch(() => setSalon(null));
  }, [slug]);

  const refrescar = useCallback(async () => {
    if (!slug) return;
    setCargando(true);
    setError(null);
    try {
      setDatos(await cargarUtilidad(rango(periodo, zona)));
    } catch (err) {
      if (!(err instanceof SesionVencida)) setError(err instanceof Error ? err.message : 'No se pudo cargar la utilidad');
    } finally {
      setCargando(false);
    }
  }, [slug, periodo, zona]);

  useFocusEffect(
    useCallback(() => {
      void refrescar();
    }, [refrescar]),
  );

  const costo = datos ? (datos.cogs ?? 0) + (datos.supplies ?? 0) : 0;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={cargando && datos != null} onRefresh={() => void refrescar()} tintColor={color.gold} />}
      >
        <Hero
          theme={salon?.theme}
          eyebrow={sesion?.tenant.name}
          title="Contabilidad"
          subtitle={datos ? `Utilidad ${plata(datos.profit)}` : null}
          onBack={() => router.back()}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodosScroll} contentContainerStyle={styles.periodos}>
            {PERIODOS.map((p) => (
              <Pressable
                key={p.value}
                onPress={() => setPeriodo(p.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: periodo === p.value }}
                style={[styles.periodo, periodo === p.value && styles.periodoActivo]}
              >
                <Text style={[styles.periodoTexto, periodo === p.value && styles.periodoTextoActivo]}>{p.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Hero>
        <Sheet>
          {datos == null && !error ? <ActivityIndicator color={color.gold} /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {datos ? (
            <>
              <View style={styles.resumen}>
                <Dato etiqueta="Ingresos" valor={plata(datos.income)} detalle={`${datos.orderCount} tickets`} />
                <Dato etiqueta="Gastos" valor={plata(datos.expenses)} detalle={`${datos.expenseCount} movimientos`} />
              </View>
              <View style={styles.resumen}>
                <Dato
                  etiqueta="Costo de ventas"
                  valor={plata(costo)}
                  detalle={costo ? `Vendidos ${plata(datos.cogs ?? 0)} · Insumos ${plata(datos.supplies ?? 0)}` : 'Productos e insumos'}
                />
                <Dato etiqueta="Utilidad" valor={plata(datos.profit)} negativo={datos.profit < 0} />
              </View>

              <SectionTitle>Ingresos por forma de pago</SectionTitle>
              {datos.byMethod.length === 0 ? <Text style={styles.meta}>No hay cobros en el período.</Text> : null}
              {datos.byMethod.map((m) => (
                <View key={m.method} style={styles.fila}>
                  <Text style={styles.texto}>{METODO[m.method.toLowerCase()] ?? m.method}</Text>
                  <Text style={styles.monto}>{plata(m.amount)}</Text>
                </View>
              ))}

              <SectionTitle>Gastos por categoría</SectionTitle>
              {datos.byCategory.length === 0 ? <Text style={styles.meta}>No hay gastos en el período.</Text> : null}
              {datos.byCategory.map((c) => (
                <View key={c.categoryId} style={styles.fila}>
                  <Text style={styles.texto}>{c.name}</Text>
                  <Text style={styles.monto}>{plata(c.amount)}</Text>
                </View>
              ))}
            </>
          ) : null}
        </Sheet>
      </ScrollView>
      <StatusStrip theme={salon?.theme} />
    </View>
  );
}

function Dato({ etiqueta, valor, detalle, negativo }: { etiqueta: string; valor: string; detalle?: string; negativo?: boolean }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.datoEtiqueta}>{etiqueta.toUpperCase()}</Text>
      <Text style={[styles.datoValor, negativo && { color: color.danger }]}>{valor}</Text>
      {detalle ? <Text style={styles.meta}>{detalle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  scroll: { flexGrow: 1 },
  periodosScroll: { marginHorizontal: -space.screen, marginTop: 20, flexGrow: 0 },
  periodos: { gap: 8, paddingHorizontal: space.screen },
  periodo: { borderRadius: 999, borderWidth: 1, borderColor: 'rgba(224,201,160,0.35)', paddingHorizontal: 14, paddingVertical: 8 },
  periodoActivo: { backgroundColor: color.gold, borderColor: color.gold },
  periodoTexto: { fontFamily: font.medium, fontSize: 13, color: color.goldLight },
  periodoTextoActivo: { color: color.ink },
  resumen: { flexDirection: 'row', gap: 12 },
  dato: {
    flex: 1,
    backgroundColor: color.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: color.line,
    padding: 16,
    gap: 4,
    ...shadow,
  },
  datoEtiqueta: { fontFamily: font.bold, fontSize: 11, letterSpacing: 1.4, color: color.goldDeep },
  datoValor: { fontFamily: font.display, fontSize: 26, color: color.ink },
  fila: { flexDirection: 'row', justifyContent: 'space-between' },
  texto: { fontFamily: font.body, fontSize: 15, color: color.ink },
  monto: { fontFamily: font.bold, fontSize: 15, color: color.ink },
  meta: { fontFamily: font.body, fontSize: 13, color: color.muted },
  error: { color: color.danger, fontSize: 14, fontFamily: font.body },
});
