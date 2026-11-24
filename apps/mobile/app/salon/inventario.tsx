import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
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
import { Field, PrimaryButton, SearchIcon, SectionTitle } from '../../src/components/ui';
import { monto } from '../../src/lib/caja';
import { dinero, mercadoDe } from '../../src/lib/format';
import {
  ajustarStock,
  cargarMovimientos,
  cargarProductos,
  estadoStock,
  MOTIVOS_ENTRADA,
  MOTIVOS_SALIDA,
  TIPO_MOVIMIENTO,
  type Movimiento,
  type Producto,
} from '../../src/lib/inventario';
import { loadPublicSalon, type PublicSalon } from '../../src/lib/salon';
import { SesionVencida, useSesion } from '../../src/lib/staff';
import { useStatusBar } from '../../src/lib/statusBar';
import { color, font, shadow, space } from '../../src/theme';

type Filtro = 'all' | 'low' | 'out';
const ESTADO = {
  out: { label: 'Agotado', fondo: '#f5dede', texto: color.danger },
  low: { label: 'Stock bajo', fondo: '#f6e9d3', texto: '#8a5a12' },
  ok: { label: 'En stock', fondo: '#e1efe5', texto: color.ok },
};

export default function Inventario() {
  const router = useRouter();
  const sesion = useSesion();
  const insets = useSafeAreaInsets();
  useStatusBar('light');

  const [salon, setSalon] = useState<PublicSalon | null>(null);
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('all');
  const [busqueda, setBusqueda] = useState('');
  const [elegido, setElegido] = useState<Producto | null>(null);

  const plata = (n: number) => dinero(salon?.currency ?? 'C$', n);
  const slug = sesion?.tenant.slug;

  useEffect(() => {
    if (slug) void loadPublicSalon(slug).then(setSalon).catch(() => setSalon(null));
  }, [slug]);

  const refrescar = useCallback(async () => {
    if (!slug) return;
    setCargando(true);
    setError(null);
    try {
      setProductos((await cargarProductos()).filter((p) => p.item.status !== false));
    } catch (err) {
      if (!(err instanceof SesionVencida)) setError(err instanceof Error ? err.message : 'No se pudo cargar el inventario');
    } finally {
      setCargando(false);
    }
  }, [slug]);

  useFocusEffect(
    useCallback(() => {
      void refrescar();
    }, [refrescar]),
  );

  const cuentas = useMemo(() => {
    const lista = productos ?? [];
    return {
      low: lista.filter((p) => estadoStock(p) === 'low').length,
      out: lista.filter((p) => estadoStock(p) === 'out').length,
    };
  }, [productos]);

  const visibles = useMemo(() => {
    const aguja = busqueda.trim().toLowerCase();
    return (productos ?? [])
      .filter((p) => filtro === 'all' || estadoStock(p) === filtro)
      .filter((p) => !aguja || p.item.name.toLowerCase().includes(aguja));
  }, [productos, filtro, busqueda]);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={cargando && productos != null} onRefresh={() => void refrescar()} tintColor={color.gold} />}
      >
        <Hero
          theme={salon?.theme}
          eyebrow={sesion?.tenant.name}
          title="Inventario"
          subtitle={productos ? `${productos.length} productos` : null}
          onBack={() => router.back()}
        />
        <Sheet>
          {productos == null && !error ? <ActivityIndicator color={color.gold} /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {productos != null ? (
            <>
              <View style={styles.wrap}>
                <Chip label="Todos" activo={filtro === 'all'} onPress={() => setFiltro('all')} />
                <Chip label={`Stock bajo · ${cuentas.low}`} activo={filtro === 'low'} onPress={() => setFiltro('low')} />
                <Chip label={`Agotados · ${cuentas.out}`} activo={filtro === 'out'} onPress={() => setFiltro('out')} />
              </View>
              <Field value={busqueda} onChangeText={setBusqueda} placeholder="Buscar producto" icon={<SearchIcon />} />
              {visibles.length === 0 ? <Text style={styles.meta}>No hay productos en esta vista.</Text> : null}
              {visibles.map((p) => {
                const e = ESTADO[estadoStock(p)];
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setElegido(p)}
                    accessibilityRole="button"
                    accessibilityHint="Ajustar stock"
                    style={({ pressed }) => [styles.item, pressed && styles.presionado]}
                  >
                    <View style={styles.textos}>
                      <Text style={styles.nombre} numberOfLines={1}>{p.item.name}</Text>
                      <Text style={styles.meta}>
                        {plata(Number(p.item.price))} · mínimo {p.minStock}
                      </Text>
                    </View>
                    <View style={styles.derecha}>
                      <Text style={styles.stock}>{p.stock}</Text>
                      <Text style={[styles.pill, { backgroundColor: e.fondo, color: e.texto }]}>{e.label}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </>
          ) : null}
        </Sheet>
      </ScrollView>
      <StatusStrip theme={salon?.theme} />
      <Ajuste
        producto={elegido}
        onClose={() => setElegido(null)}
        onGuardado={() => {
          setElegido(null);
          void refrescar();
        }}
        plata={plata}
        timeZone={mercadoDe(salon?.currency).timeZone}
      />
    </View>
  );
}

function Ajuste({
  producto,
  onClose,
  onGuardado,
  plata,
  timeZone,
}: {
  producto: Producto | null;
  onClose: () => void;
  onGuardado: () => void;
  plata: (n: number) => string;
  timeZone: string;
}) {
  const insets = useSafeAreaInsets();
  const [entrada, setEntrada] = useState(false);
  const [cantidad, setCantidad] = useState('1');
  const [motivo, setMotivo] = useState('');
  const [costo, setCosto] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[] | null>(null);

  useEffect(() => {
    setEntrada(false);
    setCantidad('1');
    setMotivo('');
    setCosto('');
    setProveedor('');
    setError(null);
    setMovimientos(null);
    if (producto) void cargarMovimientos(producto.id).then(setMovimientos).catch(() => setMovimientos([]));
  }, [producto]);

  const qty = Math.trunc(Number(cantidad));
  const costoNum = monto(costo);
  const listo = Number.isFinite(qty) && qty > 0 && motivo.trim().length > 0 && (costo.trim() === '' || costoNum >= 0);

  async function guardar() {
    if (!producto || !listo) return;
    setGuardando(true);
    setError(null);
    try {
      await ajustarStock(producto.id, {
        entrada,
        cantidad: qty,
        motivo: motivo.trim(),
        costo: costo.trim() === '' ? null : costoNum,
        proveedor: proveedor.trim() || null,
      });
      onGuardado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo ajustar el stock');
    } finally {
      setGuardando(false);
    }
  }

  const fecha = (iso: string) =>
    new Date(iso).toLocaleDateString('es', { timeZone, day: 'numeric', month: 'short' });

  return (
    <Modal visible={producto != null} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.fondo} onPress={onClose} accessibilityLabel="Cerrar" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.hoja, { paddingBottom: insets.bottom + 18 }]} accessibilityViewIsModal>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.hojaContenido}>
            <Text style={styles.eyebrow}>AJUSTAR STOCK · HAY {producto?.stock ?? 0}</Text>
            <Text style={styles.titulo}>{producto?.item.name}</Text>
            <View style={styles.wrap}>
              <Chip label="Sacar" activo={!entrada} onPress={() => { setEntrada(false); setMotivo(''); }} />
              <Chip label="Ingresar" activo={entrada} onPress={() => { setEntrada(true); setMotivo(''); }} />
            </View>
            <Field label="Cantidad" value={cantidad} onChangeText={setCantidad} keyboardType="decimal-pad" />
            <SectionTitle>Motivo</SectionTitle>
            <View style={styles.wrap}>
              {(entrada ? MOTIVOS_ENTRADA : MOTIVOS_SALIDA).map((m) => (
                <Chip key={m} label={m} activo={motivo === m} onPress={() => setMotivo(m)} />
              ))}
            </View>
            <Field value={motivo} onChangeText={setMotivo} placeholder="O escribí el motivo" />
            {entrada ? (
              <>
                <Field label="Costo por unidad (opcional)" value={costo} onChangeText={setCosto} keyboardType="decimal-pad" />
                <Field label="Proveedor (opcional)" value={proveedor} onChangeText={setProveedor} autoCapitalize="words" />
              </>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton
              label={entrada ? `Ingresar ${qty > 0 ? qty : ''}` : `Sacar ${qty > 0 ? qty : ''}`}
              disabled={!listo}
              loading={guardando}
              onPress={() => void guardar()}
            />

            <SectionTitle>Últimos movimientos</SectionTitle>
            {movimientos == null ? <ActivityIndicator color={color.gold} /> : null}
            {movimientos?.length === 0 ? <Text style={styles.meta}>Sin movimientos.</Text> : null}
            {movimientos?.map((m) => (
              <View key={m.id} style={styles.mov}>
                <View style={styles.textos}>
                  <Text style={styles.movTipo}>
                    {TIPO_MOVIMIENTO[m.type] ?? m.type}
                    {m.createdAt ? ` · ${fecha(m.createdAt)}` : ''}
                  </Text>
                  {m.reason || m.supplier ? (
                    <Text style={styles.meta} numberOfLines={1}>
                      {[m.reason, m.supplier].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.movCant, { color: m.quantity < 0 ? color.danger : color.ok }]}>
                  {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                </Text>
                <Text style={styles.meta}>→ {m.stockAfter}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
  textos: { flex: 1, gap: 2 },
  nombre: { fontFamily: font.display, fontSize: 20, color: color.ink },
  derecha: { alignItems: 'flex-end', gap: 4 },
  stock: { fontFamily: font.display, fontSize: 24, color: color.ink },
  pill: {
    fontFamily: font.medium,
    fontSize: 11,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  meta: { fontFamily: font.body, fontSize: 13, color: color.muted },
  error: { color: color.danger, fontSize: 14, fontFamily: font.body },
  fondo: { flex: 1, backgroundColor: 'rgba(22,20,18,0.45)' },
  hoja: {
    backgroundColor: color.base,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
  },
  hojaContenido: { padding: space.screen, gap: 14 },
  eyebrow: { fontFamily: font.medium, fontSize: 11, letterSpacing: 2, color: color.goldDeep },
  titulo: { fontFamily: font.display, fontSize: 30, color: color.ink, marginTop: -6 },
  mov: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  movTipo: { fontFamily: font.medium, fontSize: 14, color: color.ink },
  movCant: { fontFamily: font.bold, fontSize: 15 },
});
