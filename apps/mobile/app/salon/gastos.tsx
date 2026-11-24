import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hero, Sheet, StatusStrip } from '../../src/components/Hero';
import { Field, PrimaryButton, SectionTitle } from '../../src/components/ui';
import { METODOS, monto, nombreMetodo, type MetodoPago } from '../../src/lib/caja';
import { dinero, hoyEn, mercadoDe } from '../../src/lib/format';
import { cargarCategorias, cargarGastos, registrarGasto, type Categoria, type Gasto } from '../../src/lib/gastos';
import { loadPublicSalon, type PublicSalon } from '../../src/lib/salon';
import { SesionVencida, useSesion } from '../../src/lib/staff';
import { useStatusBar } from '../../src/lib/statusBar';
import { color, font, shadow } from '../../src/theme';

function ayerDe(ymd: string): string {
  return new Date(Date.parse(`${ymd}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
}

export default function Gastos() {
  const router = useRouter();
  const sesion = useSesion();
  const insets = useSafeAreaInsets();
  useStatusBar('light');

  const [salon, setSalon] = useState<PublicSalon | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [gastos, setGastos] = useState<Gasto[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categoria, setCategoria] = useState<number | null>(null);
  const [importe, setImporte] = useState('');
  const [metodo, setMetodo] = useState<MetodoPago>('cash');
  const [dia, setDia] = useState<'hoy' | 'ayer'>('hoy');
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const mercado = mercadoDe(salon?.currency);
  const plata = (n: number) => dinero(salon?.currency ?? 'C$', n);
  const slug = sesion?.tenant.slug;
  const hoy = hoyEn(mercado.timeZone);
  const inicioMes = `${hoy.slice(0, 8)}01`;

  useEffect(() => {
    if (slug) void loadPublicSalon(slug).then(setSalon).catch(() => setSalon(null));
  }, [slug]);

  const refrescar = useCallback(async () => {
    if (!slug) return;
    setCargando(true);
    setError(null);
    try {
      const [cats, lista] = await Promise.all([cargarCategorias(), cargarGastos(inicioMes, hoy)]);
      setCategorias(cats);
      setCategoria((c) => c ?? cats[0]?.id ?? null);
      setGastos(lista);
    } catch (err) {
      if (!(err instanceof SesionVencida)) setError(err instanceof Error ? err.message : 'No se pudieron cargar los gastos');
    } finally {
      setCargando(false);
    }
  }, [slug, inicioMes, hoy]);

  useFocusEffect(
    useCallback(() => {
      void refrescar();
    }, [refrescar]),
  );

  const importeNum = monto(importe);
  const listo = categoria != null && importeNum > 0;

  async function guardar() {
    if (!listo || categoria == null) return;
    setGuardando(true);
    setError(null);
    setAviso(null);
    try {
      const ymd = dia === 'hoy' ? hoy : ayerDe(hoy);
      await registrarGasto({
        categoryId: categoria,
        amount: importeNum,
        method: metodo,
        // Mediodía del día elegido en la hora del salón, como la web.
        spentAt: new Date(`${ymd}T12:00:00${mercado.utcOffset}`).toISOString(),
        note: nota.trim() || undefined,
      });
      setImporte('');
      setNota('');
      setAviso('Gasto registrado');
      await refrescar();
    } catch (err) {
      if (!(err instanceof SesionVencida)) setError(err instanceof Error ? err.message : 'No se pudo registrar el gasto');
    } finally {
      setGuardando(false);
    }
  }

  const deHoy = useMemo(
    () => (gastos ?? []).filter((g) => hoyEn(mercado.timeZone, new Date(g.spentAt)) === hoy),
    [gastos, hoy, mercado.timeZone],
  );
  const sumar = (lista: Gasto[]) => lista.reduce((s, g) => s + Number(g.amount), 0);
  const fecha = (iso: string) =>
    new Date(iso).toLocaleDateString('es', { timeZone: mercado.timeZone, weekday: 'short', day: 'numeric' });

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={cargando && gastos != null} onRefresh={() => void refrescar()} tintColor={color.gold} />}
      >
        <Hero
          theme={salon?.theme}
          eyebrow={sesion?.tenant.name}
          title="Gastos"
          subtitle={gastos ? `${plata(sumar(gastos))} este mes` : null}
          onBack={() => router.back()}
        />
        <Sheet>
          {gastos == null && !error ? <ActivityIndicator color={color.gold} /> : null}

          <SectionTitle>Registrar gasto</SectionTitle>
          {categorias.length === 0 && gastos != null ? (
            <Text style={styles.meta}>No hay categorías de gasto. La administración las crea en la web.</Text>
          ) : null}
          <View style={styles.wrap}>
            {categorias.map((c) => (
              <Chip key={c.id} label={c.name} activo={c.id === categoria} onPress={() => setCategoria(c.id)} />
            ))}
          </View>
          <Field value={importe} onChangeText={setImporte} placeholder="Monto" keyboardType="decimal-pad" />
          <View style={styles.wrap}>
            {METODOS.map((m) => (
              <Chip key={m.value} label={m.label} activo={m.value === metodo} onPress={() => setMetodo(m.value)} />
            ))}
          </View>
          <View style={styles.wrap}>
            <Chip label="Hoy" activo={dia === 'hoy'} onPress={() => setDia('hoy')} />
            <Chip label="Ayer" activo={dia === 'ayer'} onPress={() => setDia('ayer')} />
          </View>
          <Field value={nota} onChangeText={setNota} placeholder="Nota (opcional)" />
          <PrimaryButton label="Registrar gasto" disabled={!listo} loading={guardando} onPress={() => void guardar()} />
          {aviso ? <Text style={styles.ok}>{aviso}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {gastos != null ? (
            <>
              <View style={styles.resumen}>
                <Dato etiqueta="Hoy" valor={plata(sumar(deHoy))} />
                <Dato etiqueta="Este mes" valor={plata(sumar(gastos))} />
              </View>
              <SectionTitle>Gastos del mes</SectionTitle>
              {gastos.length === 0 ? <Text style={styles.meta}>Todavía no hay gastos este mes.</Text> : null}
              {gastos.map((g) => (
                <View key={g.id} style={styles.fila}>
                  <Text style={styles.fecha}>{fecha(g.spentAt)}</Text>
                  <View style={styles.textos}>
                    <Text style={styles.nombre} numberOfLines={1}>{g.category?.name ?? 'Gasto'}</Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {nombreMetodo(g.method)}
                      {g.note ? ` · ${g.note}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.monto}>{plata(Number(g.amount))}</Text>
                </View>
              ))}
            </>
          ) : null}
        </Sheet>
      </ScrollView>
      <StatusStrip theme={salon?.theme} />
    </KeyboardAvoidingView>
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

function Chip({ label, activo, onPress }: { label: string; activo: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      style={[styles.chip, activo && styles.chipActivo]}
    >
      <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  scroll: { flexGrow: 1 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActivo: { backgroundColor: color.ink, borderColor: color.ink },
  chipTexto: { fontFamily: font.medium, fontSize: 14, color: color.ink },
  chipTextoActivo: { color: color.goldLight },
  resumen: { flexDirection: 'row', gap: 12, marginTop: 8 },
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
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: color.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.line,
    padding: 14,
  },
  fecha: { fontFamily: font.bold, fontSize: 13, color: color.ink, width: 52 },
  textos: { flex: 1, gap: 2 },
  nombre: { fontFamily: font.display, fontSize: 19, color: color.ink },
  monto: { fontFamily: font.bold, fontSize: 15, color: color.ink },
  meta: { fontFamily: font.body, fontSize: 13, color: color.muted },
  ok: { fontFamily: font.medium, fontSize: 14, color: color.ok },
  error: { color: color.danger, fontSize: 14, fontFamily: font.body },
});
