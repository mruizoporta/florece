import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { canManageCaja } from '@florece/shared';
import { Hero, Sheet, StatusStrip } from '../../src/components/Hero';
import { SectionTitle } from '../../src/components/ui';
import {
  cargarDetalleNomina,
  cargarMiDia,
  cargarNomina,
  PERIODOS,
  rango,
  type DetalleNomina,
  type MiDia,
  type Periodo,
  type ResumenNomina,
} from '../../src/lib/nomina';
import { dinero, mercadoDe } from '../../src/lib/format';
import { loadPublicSalon, type PublicSalon } from '../../src/lib/salon';
import { SesionVencida, useSesion } from '../../src/lib/staff';
import { useStatusBar } from '../../src/lib/statusBar';
import { color, font, shadow, space } from '../../src/theme';

export default function Nomina() {
  const router = useRouter();
  const sesion = useSesion();
  const insets = useSafeAreaInsets();
  useStatusBar('light');

  const [salon, setSalon] = useState<PublicSalon | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [resumen, setResumen] = useState<ResumenNomina | null>(null);
  const [abierto, setAbierto] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<DetalleNomina | null>(null);
  const [miDia, setMiDia] = useState<MiDia | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slug = sesion?.tenant.slug;
  // Caja y Admin ven a todo el equipo; la estilista solo sus comisiones (igual que el API).
  const equipo = canManageCaja(sesion?.user.roles);
  const miId = sesion?.user.employeeId ?? null;
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
      const r = rango(periodo, zona);
      if (equipo) {
        setResumen(await cargarNomina(r));
        setAbierto(null);
        setDetalle(null);
      } else if (miId != null) {
        const [hoy, mio] = await Promise.all([cargarMiDia(), cargarDetalleNomina(miId, r)]);
        setMiDia(hoy);
        setDetalle(mio);
      } else {
        setError('Tu usuario no está vinculado a un profesional del equipo.');
      }
    } catch (err) {
      if (!(err instanceof SesionVencida)) setError(err instanceof Error ? err.message : 'No se pudo cargar la nómina');
    } finally {
      setCargando(false);
    }
  }, [slug, periodo, zona, equipo, miId]);

  useFocusEffect(
    useCallback(() => {
      void refrescar();
    }, [refrescar]),
  );

  async function abrir(id: number) {
    if (abierto === id) {
      setAbierto(null);
      return;
    }
    setAbierto(id);
    setDetalle(null);
    try {
      setDetalle(await cargarDetalleNomina(id, rango(periodo, zona)));
    } catch (err) {
      if (!(err instanceof SesionVencida)) setError(err instanceof Error ? err.message : 'No se pudo cargar el detalle');
    }
  }

  const listo = equipo ? resumen != null : detalle != null;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={cargando && listo} onRefresh={() => void refrescar()} tintColor={color.gold} />}
      >
        <Hero
          theme={salon?.theme}
          eyebrow={sesion?.tenant.name}
          title={equipo ? 'Nómina' : 'Mis comisiones'}
          subtitle={equipo && resumen ? `A pagar ${plata(resumen.totals.total)}` : !equipo && detalle ? `${plata(detalle.commission)} en comisiones` : null}
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
          {!listo && !error ? <ActivityIndicator color={color.gold} /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {equipo && resumen ? (
            <>
              <View style={styles.resumen}>
                <Dato etiqueta="Base" valor={plata(resumen.totals.baseProrated)} />
                <Dato etiqueta="Comisiones" valor={plata(resumen.totals.commission)} />
              </View>
              <Text style={styles.meta}>
                {resumen.days} {resumen.days === 1 ? 'día' : 'días'} · ventas de servicios {plata(resumen.totals.serviceSales)}
              </Text>
              <SectionTitle>Por profesional</SectionTitle>
              {resumen.employees.length === 0 ? <Text style={styles.meta}>No hay profesionales activos.</Text> : null}
              {resumen.employees.map((e) => (
                <View key={e.employeeId} style={styles.tarjeta}>
                  <Pressable
                    onPress={() => void abrir(e.employeeId)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: abierto === e.employeeId }}
                    style={styles.filaEmpleado}
                  >
                    <View style={styles.textos}>
                      <Text style={styles.nombre} numberOfLines={1}>{e.name}</Text>
                      <Text style={styles.meta}>
                        Base {plata(e.baseProrated)} · comisión {plata(e.commission)} ({e.commissionRate}%)
                      </Text>
                      {e.paid ? <Text style={[styles.etiqueta, { color: color.ok }]}>Pagado</Text> : null}
                      {e.pendingAdvances ? <Text style={[styles.etiqueta, { color: color.goldDeep }]}>Adelanto {plata(e.pendingAdvances)}</Text> : null}
                    </View>
                    <Text style={styles.monto}>{plata(e.total)}</Text>
                  </Pressable>
                  {abierto === e.employeeId ? (
                    detalle && detalle.employee.id === e.employeeId ? <Lineas detalle={detalle} plata={plata} zona={zona} /> : <ActivityIndicator color={color.gold} />
                  ) : null}
                </View>
              ))}
              <Text style={styles.nota}>Los pagos y adelantos se registran en floreceapp.com.</Text>
            </>
          ) : null}

          {!equipo && detalle ? (
            <>
              {miDia ? (
                <>
                  <SectionTitle>Hoy</SectionTitle>
                  <View style={styles.resumen}>
                    <Dato etiqueta="Confirmada" valor={plata(miDia.confirmedCommission)} />
                    <Dato etiqueta="Pendiente" valor={plata(miDia.pendingCommission)} />
                  </View>
                </>
              ) : null}
              <SectionTitle>Período</SectionTitle>
              <View style={styles.resumen}>
                <Dato etiqueta="Base" valor={plata(detalle.baseProrated)} />
                <Dato etiqueta="Total" valor={plata(detalle.total)} />
              </View>
              <View style={styles.tarjeta}>
                <Lineas detalle={detalle} plata={plata} zona={zona} />
              </View>
            </>
          ) : null}
        </Sheet>
      </ScrollView>
      <StatusStrip theme={salon?.theme} />
    </View>
  );
}

function Lineas({ detalle, plata, zona }: { detalle: DetalleNomina; plata: (n: number) => string; zona: string }) {
  if (detalle.lines.length === 0) return <Text style={styles.meta}>Sin servicios cobrados en el período.</Text>;
  return (
    <View style={styles.lineas}>
      {detalle.lines.map((l) => (
        <View key={l.id} style={styles.linea}>
          <View style={styles.textos}>
            <Text style={styles.lineaNombre} numberOfLines={1}>
              {l.quantity > 1 ? `${l.quantity} × ` : ''}{l.serviceName}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {l.finalizedAt ? new Date(l.finalizedAt).toLocaleDateString('es', { timeZone: zona, day: 'numeric', month: 'short' }) : ''}
              {l.customerName || l.orderName ? ` · ${l.customerName ?? l.orderName}` : ''} · {plata(l.lineTotal)}
            </Text>
          </View>
          <Text style={styles.comision}>{plata(l.commission)}</Text>
        </View>
      ))}
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
  tarjeta: {
    backgroundColor: color.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: color.line,
    padding: 14,
    gap: 10,
  },
  filaEmpleado: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textos: { flex: 1, gap: 2 },
  nombre: { fontFamily: font.display, fontSize: 20, color: color.ink },
  etiqueta: { fontFamily: font.bold, fontSize: 12 },
  monto: { fontFamily: font.bold, fontSize: 16, color: color.ink },
  lineas: { gap: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line, paddingTop: 10 },
  linea: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lineaNombre: { fontFamily: font.medium, fontSize: 14, color: color.ink },
  comision: { fontFamily: font.bold, fontSize: 14, color: color.ok },
  meta: { fontFamily: font.body, fontSize: 13, color: color.muted },
  nota: { fontFamily: font.body, fontSize: 13, color: color.muted, textAlign: 'center', marginTop: 8 },
  error: { color: color.danger, fontSize: 14, fontFamily: font.body },
});
