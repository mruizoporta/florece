import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hero, Sheet, StatusStrip } from '../../src/components/Hero';
import { SectionTitle } from '../../src/components/ui';
import { cargarVentas, nombreMetodo, type Venta } from '../../src/lib/caja';
import { dinero, hoyEn, mercadoDe } from '../../src/lib/format';
import { cuentasAbiertas, totalLinea, type Ticket } from '../../src/lib/ticket';
import { loadPublicSalon, type PublicSalon } from '../../src/lib/salon';
import { SesionVencida, useSesion } from '../../src/lib/staff';
import { useStatusBar } from '../../src/lib/statusBar';
import { color, font, shadow } from '../../src/theme';

export default function Ventas() {
  const router = useRouter();
  const sesion = useSesion();
  const insets = useSafeAreaInsets();
  useStatusBar('light');

  const [salon, setSalon] = useState<PublicSalon | null>(null);
  const [ventas, setVentas] = useState<Venta[] | null>(null);
  const [abiertas, setAbiertas] = useState<Ticket[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mercado = mercadoDe(salon?.currency);
  const simbolo = salon?.currency ?? 'C$';
  const plata = (n: number) => dinero(simbolo, n);
  const slug = sesion?.tenant.slug;

  const refrescar = useCallback(async () => {
    if (!slug) return;
    setCargando(true);
    setError(null);
    try {
      const [v, a] = await Promise.all([cargarVentas(), cuentasAbiertas().catch(() => [] as Ticket[])]);
      setVentas(v);
      setAbiertas(a);
    } catch (err) {
      if (!(err instanceof SesionVencida)) setError(err instanceof Error ? err.message : 'No se pudieron cargar las ventas');
    } finally {
      setCargando(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) void loadPublicSalon(slug).then(setSalon).catch(() => setSalon(null));
  }, [slug]);

  useFocusEffect(
    useCallback(() => {
      void refrescar();
    }, [refrescar]),
  );

  const hoy = hoyEn(mercado.timeZone);
  const deHoy = useMemo(
    () => (ventas ?? []).filter((v) => v.finalizedAt && hoyEn(mercado.timeZone, new Date(v.finalizedAt)) === hoy),
    [ventas, hoy, mercado.timeZone],
  );
  const total = deHoy.reduce((s, v) => s + Number(v.total), 0);
  const porMetodo = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const v of deHoy) for (const p of v.payments) mapa.set(p.method, (mapa.get(p.method) ?? 0) + Number(p.amount));
    return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
  }, [deHoy]);

  const hora = (iso: string) =>
    new Date(iso).toLocaleTimeString('es', { timeZone: mercado.timeZone, hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={cargando && ventas != null} onRefresh={() => void refrescar()} tintColor={color.gold} />}
      >
        <Hero theme={salon?.theme} eyebrow={sesion?.tenant.name} title="Ventas de hoy" subtitle={ventas ? plata(total) : null} onBack={() => router.back()} />
        <Sheet>
          {ventas == null && !error ? <ActivityIndicator color={color.gold} /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {ventas != null ? (
            <>
              <View style={styles.resumen}>
                <Dato etiqueta="Vendido" valor={plata(total)} />
                <Dato etiqueta="Tickets" valor={String(deHoy.length)} />
              </View>
              {porMetodo.length > 0 ? (
                <>
                  <SectionTitle>Por forma de pago</SectionTitle>
                  {porMetodo.map(([metodo, suma]) => (
                    <View key={metodo} style={styles.fila}>
                      <Text style={styles.texto}>{nombreMetodo(metodo)}</Text>
                      <Text style={styles.monto}>{plata(suma)}</Text>
                    </View>
                  ))}
                </>
              ) : null}

              {abiertas.length > 0 ? (
                <>
                  <SectionTitle>Cuentas abiertas</SectionTitle>
                  {abiertas.map((t) => (
                    <Pressable
                      key={t.id}
                      onPress={() => router.push(`/salon/ticket/${t.id}`)}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.ticket, styles.abierta, pressed && { opacity: 0.85 }]}
                    >
                      <View style={styles.ticketTextos}>
                        <Text style={styles.nombre} numberOfLines={1}>{t.name || 'Consumidor final'}</Text>
                        <Text style={styles.meta} numberOfLines={1}>
                          #{t.id} · {[...new Set(t.items.map((l) => l.employee?.name).filter(Boolean))].join(', ') || 'Sin profesional'}
                        </Text>
                      </View>
                      <Text style={styles.monto}>{plata(t.items.reduce((s, l) => s + totalLinea(l), 0))}</Text>
                      <Text style={styles.chevron}>›</Text>
                    </Pressable>
                  ))}
                </>
              ) : null}

              <SectionTitle>Tickets</SectionTitle>
              {deHoy.length === 0 ? <Text style={styles.meta}>Todavía no hay ventas hoy.</Text> : null}
              {deHoy.map((v) => (
                <Pressable
                  key={v.id}
                  onPress={() => router.push(`/salon/ticket/${v.id}`)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.ticket, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.hora}>{v.finalizedAt ? hora(v.finalizedAt) : ''}</Text>
                  <View style={styles.ticketTextos}>
                    <Text style={styles.nombre} numberOfLines={1}>{v.name || 'Consumidor final'}</Text>
                    <Text style={styles.meta}>
                      #{v.id} · {v.payments.map((p) => nombreMetodo(p.method)).join(' + ') || 'Sin pago'}
                    </Text>
                  </View>
                  <Text style={styles.monto}>{plata(Number(v.total))}</Text>
                </Pressable>
              ))}
            </>
          ) : null}
        </Sheet>
      </ScrollView>
      <StatusStrip theme={salon?.theme} />
    </View>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.datoEtiqueta}>{etiqueta.toUpperCase()}</Text>
      <Text style={styles.datoValor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  scroll: { flexGrow: 1 },
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
  datoValor: { fontFamily: font.display, fontSize: 28, color: color.ink },
  fila: { flexDirection: 'row', justifyContent: 'space-between' },
  texto: { fontFamily: font.body, fontSize: 15, color: color.ink },
  monto: { fontFamily: font.bold, fontSize: 15, color: color.ink },
  ticket: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: color.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.line,
    padding: 14,
  },
  abierta: { borderColor: color.gold },
  chevron: { fontSize: 24, color: color.gold, marginTop: -3 },
  hora: { fontFamily: font.bold, fontSize: 14, color: color.ink, width: 44 },
  ticketTextos: { flex: 1, gap: 2 },
  nombre: { fontFamily: font.display, fontSize: 19, color: color.ink },
  meta: { fontFamily: font.body, fontSize: 13, color: color.muted },
  error: { color: color.danger, fontSize: 14, fontFamily: font.body },
});
