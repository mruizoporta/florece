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
import { Dialog } from '../../src/components/Dialog';
import { Hero, Sheet, StatusStrip } from '../../src/components/Hero';
import { Field, PrimaryButton, SearchIcon, SectionTitle } from '../../src/components/ui';
import { cargarCatalogo, METODOS, monto, type MetodoPago, type Vendible } from '../../src/lib/caja';
import { dinero } from '../../src/lib/format';
import { loadPublicSalon, type PublicSalon } from '../../src/lib/salon';
import { SesionVencida, useSesion } from '../../src/lib/staff';
import { useStatusBar } from '../../src/lib/statusBar';
import { cargarVales, ESTADO_VALE, venderVale, type Vale } from '../../src/lib/vales';
import { color, font, shadow } from '../../src/theme';

type Tipo = Vale['kind'];

export default function Vales() {
  const router = useRouter();
  const sesion = useSesion();
  const insets = useSafeAreaInsets();
  useStatusBar('light');

  const [salon, setSalon] = useState<PublicSalon | null>(null);
  const [vales, setVales] = useState<Vale[] | null>(null);
  const [servicios, setServicios] = useState<Vendible[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vendiendo, setVendiendo] = useState(false);
  const [tipo, setTipo] = useState<Tipo>('giftcard');
  const [titular, setTitular] = useState('');
  const [telefono, setTelefono] = useState('');
  const [montoGift, setMontoGift] = useState('');
  const [servicio, setServicio] = useState<number | null>(null);
  const [sesiones, setSesiones] = useState('5');
  const [precio, setPrecio] = useState('');
  const [metodo, setMetodo] = useState<MetodoPago>('cash');
  const [confirmar, setConfirmar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [vendido, setVendido] = useState<Vale | null>(null);

  const plata = (n: number) => dinero(salon?.currency ?? 'C$', n);
  const slug = sesion?.tenant.slug;

  useEffect(() => {
    if (!slug) return;
    void loadPublicSalon(slug).then(setSalon).catch(() => setSalon(null));
    void cargarCatalogo()
      .then((cat) => setServicios(cat.filter((c) => c.kind === 'service')))
      .catch(() => setServicios([]));
  }, [slug]);

  const recargar = useCallback(async () => {
    if (!slug) return;
    setCargando(true);
    setError(null);
    try {
      setVales(await cargarVales());
    } catch (err) {
      if (!(err instanceof SesionVencida)) setError(err instanceof Error ? err.message : 'No se pudieron cargar los bonos');
    } finally {
      setCargando(false);
    }
  }, [slug]);

  useFocusEffect(
    useCallback(() => {
      void recargar();
    }, [recargar]),
  );

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return vales ?? [];
    return (vales ?? []).filter((v) => v.code.toLowerCase().includes(q.replace(/[\s-]/g, '')) || v.holderName.toLowerCase().includes(q));
  }, [vales, busqueda]);

  const pendiente = (vales ?? [])
    .filter((v) => v.status === 'active')
    .reduce((s, v) => s + (v.kind === 'giftcard' ? v.balance : (v.price / v.sessionsTotal) * (v.sessionsTotal - v.sessionsUsed)), 0);

  const elegido = servicios.find((s) => s.refId === servicio);
  const nSesiones = Math.trunc(Number(sesiones)) || 0;
  const total = tipo === 'giftcard' ? monto(montoGift) : monto(precio);
  const listo =
    titular.trim().length > 0 &&
    total > 0 &&
    (tipo === 'giftcard' || (elegido != null && nSesiones >= 2 && nSesiones <= 100));

  async function vender() {
    setConfirmar(false);
    setGuardando(true);
    setError(null);
    try {
      const v = await venderVale({
        kind: tipo,
        holder_name: titular.trim(),
        holder_phone: telefono.trim() || null,
        ...(tipo === 'giftcard' ? { amount: total } : { service_item_id: servicio ?? 0, sessions: nSesiones, price: total }),
        method: metodo,
      });
      setVendido(v);
      setTitular('');
      setTelefono('');
      setMontoGift('');
      setPrecio('');
      setServicio(null);
      setVendiendo(false);
      await recargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo vender el bono');
    } finally {
      setGuardando(false);
    }
  }

  const colores = salon?.theme.custom ? { bg: salon.theme.button, text: salon.theme.buttonText } : undefined;
  const queVende = tipo === 'giftcard' ? 'esta gift card' : `${nSesiones} sesiones de ${elegido?.name ?? 'servicio'}`;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={cargando && vales != null} onRefresh={() => void recargar()} tintColor={color.gold} />}
      >
        <Hero
          theme={salon?.theme}
          eyebrow={sesion?.tenant.name}
          title="Bonos"
          subtitle={vales ? `${plata(pendiente)} por canjear` : null}
          onBack={() => (vendiendo ? setVendiendo(false) : router.back())}
        />
        <Sheet>
          {vendiendo ? (
            <>
              <SectionTitle>Vender bono</SectionTitle>
              <View style={styles.wrap}>
                <Chip label="Gift card" activo={tipo === 'giftcard'} onPress={() => setTipo('giftcard')} />
                <Chip label="Paquete de sesiones" activo={tipo === 'package'} onPress={() => setTipo('package')} />
              </View>
              <Field value={titular} onChangeText={setTitular} placeholder="Para quién es" autoCapitalize="words" />
              <Field value={telefono} onChangeText={setTelefono} placeholder="Teléfono (opcional)" keyboardType="phone-pad" />
              {tipo === 'giftcard' ? (
                <Field value={montoGift} onChangeText={setMontoGift} placeholder="Monto" keyboardType="decimal-pad" />
              ) : (
                <>
                  <SectionTitle>Servicio</SectionTitle>
                  <View style={styles.wrap}>
                    {servicios.map((s) => (
                      <Chip key={s.key} label={s.name} activo={s.refId === servicio} onPress={() => setServicio(s.refId)} />
                    ))}
                  </View>
                  <Field value={sesiones} onChangeText={setSesiones} placeholder="Sesiones (2 a 100)" keyboardType="decimal-pad" />
                  <Field value={precio} onChangeText={setPrecio} placeholder="Precio del paquete" keyboardType="decimal-pad" />
                  {elegido && nSesiones > 0 && total > 0 && elegido.price * nSesiones > total ? (
                    <Text style={styles.ahorro}>Ahorra {plata(elegido.price * nSesiones - total)} frente a pagar sesión por sesión.</Text>
                  ) : null}
                </>
              )}
              <SectionTitle>Forma de pago</SectionTitle>
              <View style={styles.wrap}>
                {METODOS.map((m) => (
                  <Chip key={m.value} label={m.label} activo={m.value === metodo} onPress={() => setMetodo(m.value)} />
                ))}
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <PrimaryButton
                label={total > 0 ? `Cobrar ${plata(total)}` : 'Cobrar'}
                tone="gold"
                colors={colores}
                disabled={!listo}
                loading={guardando}
                onPress={() => setConfirmar(true)}
              />
            </>
          ) : (
            <>
              <PrimaryButton label="Vender bono" tone="gold" colors={colores} onPress={() => setVendiendo(true)} />
              <Field value={busqueda} onChangeText={setBusqueda} placeholder="Código o nombre" autoCapitalize="none" icon={<SearchIcon />} />
              {vales == null && !error ? <ActivityIndicator color={color.gold} /> : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              {vales != null && filtrados.length === 0 ? (
                <Text style={styles.meta}>{busqueda ? `Ningún bono coincide con «${busqueda}».` : 'Todavía no se vendieron bonos.'}</Text>
              ) : null}
              {filtrados.map((v) => (
                <View key={v.id} style={[styles.tarjeta, v.status !== 'active' && styles.apagada]}>
                  <View style={styles.fila}>
                    <Text style={styles.codigo}>{v.code}</Text>
                    <Text style={[styles.estado, v.status === 'active' ? styles.vigente : null]}>{ESTADO_VALE[v.status]}</Text>
                  </View>
                  <Text style={styles.nombre} numberOfLines={1}>{v.holderName}</Text>
                  <Text style={styles.meta}>
                    {v.kind === 'giftcard'
                      ? `Gift card · saldo ${plata(v.balance)} de ${plata(v.price)}`
                      : `${v.serviceName ?? 'Paquete'} · ${v.sessionsTotal - v.sessionsUsed} de ${v.sessionsTotal} sesiones`}
                  </Text>
                </View>
              ))}
            </>
          )}
        </Sheet>
      </ScrollView>
      <StatusStrip theme={salon?.theme} />

      <Dialog
        visible={confirmar}
        eyebrow="Vender bono"
        title={`¿Cobrar ${plata(total)}?`}
        message={`En ${METODOS.find((m) => m.value === metodo)?.label.toLowerCase()} por ${queVende}, para ${titular.trim()}.`}
        onClose={() => setConfirmar(false)}
        actions={[
          { label: 'Cobrar', tone: 'primary', onPress: () => void vender() },
          { label: 'Volver', onPress: () => setConfirmar(false) },
        ]}
      />
      <Dialog
        visible={vendido != null}
        eyebrow="Bono vendido"
        title={vendido?.code ?? ''}
        message={vendido ? `Pasale este código a ${vendido.holderName}. Se canjea al cobrar.` : undefined}
        onClose={() => setVendido(null)}
        actions={[{ label: 'Listo', tone: 'primary', onPress: () => setVendido(null) }]}
      />
    </KeyboardAvoidingView>
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
  tarjeta: {
    backgroundColor: color.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: color.line,
    padding: 16,
    gap: 4,
    ...shadow,
  },
  apagada: { opacity: 0.6 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codigo: { fontFamily: font.bold, fontSize: 15, letterSpacing: 1.5, color: color.ink },
  estado: { fontFamily: font.medium, fontSize: 12, color: color.muted },
  vigente: { color: color.ok },
  nombre: { fontFamily: font.display, fontSize: 20, color: color.ink },
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
  ahorro: { fontFamily: font.medium, fontSize: 14, color: color.ok },
  meta: { fontFamily: font.body, fontSize: 13, color: color.muted },
  error: { color: color.danger, fontSize: 14, fontFamily: font.body },
});
