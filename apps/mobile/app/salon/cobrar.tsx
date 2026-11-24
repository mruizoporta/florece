import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hero, Sheet, StatusStrip } from '../../src/components/Hero';
import { Field, PrimaryButton, SearchIcon, SectionTitle } from '../../src/components/ui';
import { cajaActual, cargarCatalogo, cargarProfesionales, cotizar, type LineaCuenta, type Vendible } from '../../src/lib/caja';
import { agregarLinea, anularTicket, crearTicket } from '../../src/lib/ticket';
import { dinero } from '../../src/lib/format';
import { loadPublicSalon, type PublicSalon } from '../../src/lib/salon';
import { SesionVencida, useSesion } from '../../src/lib/staff';
import { useStatusBar } from '../../src/lib/statusBar';
import { color, font, shadow, space } from '../../src/theme';

export default function Cobrar() {
  const router = useRouter();
  const sesion = useSesion();
  const insets = useSafeAreaInsets();
  useStatusBar('light');

  const [salon, setSalon] = useState<PublicSalon | null>(null);
  const [catalogo, setCatalogo] = useState<Vendible[] | null>(null);
  const [profesionales, setProfesionales] = useState<{ id: number; name: string }[]>([]);
  const [cajaAbierta, setCajaAbierta] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [cuenta, setCuenta] = useState<LineaCuenta[]>([]);
  const [profesional, setProfesional] = useState<number | null>(null);
  const [cliente, setCliente] = useState('');
  const [totalPromo, setTotalPromo] = useState<number | null>(null);
  const [creando, setCreando] = useState(false);

  const slug = sesion?.tenant.slug;
  const plata = (n: number) => dinero(salon?.currency ?? 'C$', n);

  useEffect(() => {
    if (!slug) return;
    void loadPublicSalon(slug).then(setSalon).catch(() => setSalon(null));
    void Promise.all([cargarCatalogo(), cargarProfesionales().catch(() => [])])
      .then(([cat, pros]) => {
        setCatalogo(cat);
        setProfesionales(pros);
      })
      .catch((err: unknown) => {
        if (!(err instanceof SesionVencida)) setError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo');
      });
    void cajaActual()
      .then((s) => setCajaAbierta(Boolean(s)))
      .catch(() => setCajaAbierta(null));
  }, [slug]);

  const listaTotal = cuenta.reduce((s, l) => s + l.price * l.qty, 0);
  const unidades = cuenta.reduce((s, l) => s + l.qty, 0);
  const total = totalPromo ?? listaTotal;

  // Promociones automáticas: el servidor las calcula igual que en el ticket.
  useEffect(() => {
    setTotalPromo(null);
    if (cuenta.length === 0) return;
    let activo = true;
    const t = setTimeout(() => {
      void cotizar(cuenta)
        .then((q) => activo && setTotalPromo(Number(q.total)))
        .catch(() => undefined);
    }, 300);
    return () => {
      activo = false;
      clearTimeout(t);
    };
  }, [cuenta]);

  const filtrados = useMemo(() => {
    const aguja = busqueda.trim().toLowerCase();
    return (catalogo ?? []).filter((c) => !aguja || c.name.toLowerCase().includes(aguja));
  }, [catalogo, busqueda]);

  function agregar(item: Vendible) {
    setCuenta((prev) => {
      const ya = prev.find((l) => l.key === item.key);
      if (ya) return prev.map((l) => (l.key === item.key ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { ...item, qty: 1 }];
    });
  }

  /** Arma el ticket y sigue en la pantalla del ticket (descuentos, bonos, pagos y cobro). */
  async function continuar() {
    setCreando(true);
    setError(null);
    let id: number | null = null;
    try {
      id = Number((await crearTicket(cliente)).id);
      for (const l of cuenta) {
        await agregarLinea(id, { kind: l.kind, refId: l.refId, qty: l.qty, employeeId: profesional });
      }
      setCuenta([]);
      setCliente('');
      router.push(`/salon/ticket/${id}`);
    } catch (err) {
      if (id != null) await anularTicket(id, 'Venta desde la app no completada').catch(() => undefined);
      if (!(err instanceof SesionVencida)) setError(err instanceof Error ? err.message : 'No se pudo armar el ticket');
    } finally {
      setCreando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Hero
          theme={salon?.theme}
          eyebrow={sesion?.tenant.name}
          title="Cobrar"
          subtitle={cuenta.length ? `${unidades} ${unidades === 1 ? 'ítem' : 'ítems'} · ${plata(total)}` : 'Elegí servicios y productos.'}
          onBack={() => router.back()}
        />
        <Sheet>
          {cajaAbierta === false ? (
            <Pressable onPress={() => router.push('/salon/caja')} accessibilityRole="button" style={styles.aviso}>
              <Text style={styles.avisoTexto}>No hay una caja abierta. Abrila para que el efectivo cuadre al cierre ›</Text>
            </Pressable>
          ) : null}

          <Field value={cliente} onChangeText={setCliente} placeholder="Clienta (opcional)" autoCapitalize="words" />
          {profesionales.length > 0 ? (
            <>
              <SectionTitle>Profesional de los servicios</SectionTitle>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
                {profesionales.map((p) => (
                  <Chip key={p.id} label={p.name.split(' ')[0]} activo={p.id === profesional} onPress={() => setProfesional(p.id === profesional ? null : p.id)} />
                ))}
              </ScrollView>
            </>
          ) : null}

          <Field value={busqueda} onChangeText={setBusqueda} placeholder="Buscar servicio o producto" icon={<SearchIcon />} />
          {catalogo == null && !error ? <ActivityIndicator color={color.gold} /> : null}
          {catalogo != null && filtrados.length === 0 ? <Text style={styles.meta}>Nada coincide con «{busqueda}».</Text> : null}
          {filtrados.map((item) => {
            const enCuenta = cuenta.find((l) => l.key === item.key)?.qty ?? 0;
            const agotado = item.kind === 'product' && item.stock != null && item.stock <= enCuenta;
            return (
              <View key={item.key} style={[styles.item, agotado && enCuenta === 0 && styles.agotado]}>
                <Pressable
                  onPress={() => agregar(item)}
                  disabled={agotado}
                  accessibilityRole="button"
                  accessibilityLabel={`Agregar ${item.name}`}
                  style={({ pressed }) => [styles.itemToque, pressed && styles.presionado]}
                >
                  <View style={styles.itemTextos}>
                    <Text style={styles.itemNombre} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.meta}>
                      {plata(item.price)} · {item.kind === 'service' ? 'Servicio' : `${item.stock ?? 0} en stock`}
                    </Text>
                  </View>
                </Pressable>
                {enCuenta > 0 ? (
                  <Contador
                    valor={enCuenta}
                    onCambio={(q) =>
                      setCuenta((prev) =>
                        q <= 0 ? prev.filter((l) => l.key !== item.key) : prev.map((l) => (l.key === item.key ? { ...l, qty: agotado && q > enCuenta ? l.qty : q } : l)),
                      )
                    }
                  />
                ) : (
                  <Pressable onPress={() => agregar(item)} disabled={agotado} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Agregar ${item.name}`} style={styles.mas}>
                    <Text style={styles.masTexto}>+</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </Sheet>
      </ScrollView>
      <StatusStrip theme={salon?.theme} />

      {cuenta.length > 0 ? (
        <View style={[styles.barra, { paddingBottom: insets.bottom + 14 }]}>
          <PrimaryButton
            label={`Continuar · ${plata(total)}`}
            tone="gold"
            colors={salon?.theme.custom ? { bg: salon.theme.button, text: salon.theme.buttonText } : undefined}
            loading={creando}
            onPress={() => void continuar()}
          />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function Contador({ valor, onCambio }: { valor: number; onCambio: (n: number) => void }) {
  return (
    <View style={styles.contador}>
      <Pressable onPress={() => onCambio(valor - 1)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Quitar uno" style={styles.contBoton}>
        <Text style={styles.contTexto}>−</Text>
      </Pressable>
      <Text style={styles.contValor}>{valor}</Text>
      <Pressable onPress={() => onCambio(valor + 1)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Agregar uno" style={styles.contBoton}>
        <Text style={styles.contTexto}>+</Text>
      </Pressable>
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
  aviso: { backgroundColor: '#f6e9d3', borderRadius: 14, padding: 14 },
  avisoTexto: { fontFamily: font.medium, fontSize: 14, color: color.goldDeep },
  chipsScroll: { marginHorizontal: -space.screen, flexGrow: 0 },
  chips: { gap: 8, paddingHorizontal: space.screen },
  itemToque: { flex: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: color.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: color.line,
    padding: 14,
    ...shadow,
  },
  presionado: { opacity: 0.85 },
  agotado: { opacity: 0.45 },
  itemTextos: { flex: 1, gap: 2 },
  itemNombre: { fontFamily: font.display, fontSize: 20, color: color.ink },
  mas: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: color.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masTexto: { fontFamily: font.bold, fontSize: 17, color: color.goldDeep },
  contador: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contBoton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contTexto: { fontFamily: font.bold, fontSize: 16, color: color.ink, marginTop: -1 },
  contValor: { fontFamily: font.bold, fontSize: 15, color: color.ink, minWidth: 16, textAlign: 'center' },
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
  meta: { fontFamily: font.body, fontSize: 13, color: color.muted },
  error: { color: color.danger, fontSize: 14, fontFamily: font.body },
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
