import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { canManageCaja, canManageSalon } from '@florece/shared';
import { Dialog, type DialogAction } from '../../../src/components/Dialog';
import { Hero, Sheet, StatusStrip } from '../../../src/components/Hero';
import { Field, PrimaryButton, SearchIcon, SectionTitle } from '../../../src/components/ui';
import { cargarCatalogo, cargarProfesionales, METODOS, monto, nombreMetodo, type MetodoPago, type Vendible } from '../../../src/lib/caja';
import { dinero } from '../../../src/lib/format';
import { loadPublicSalon, type PublicSalon } from '../../../src/lib/salon';
import { SesionVencida, useSesion } from '../../../src/lib/staff';
import { useStatusBar } from '../../../src/lib/statusBar';
import {
  agregarLinea,
  anularTicket,
  aplicarBono,
  aplicarCupon,
  cambiarLinea,
  cargarTicket,
  descuentoManual,
  editable,
  esServicio,
  ESTADOS,
  finalizarTicket,
  guardarPagos,
  modoDescuento,
  nombreLinea,
  quitarBono,
  quitarDescuento,
  quitarLinea,
  totalLinea,
  type Ticket,
} from '../../../src/lib/ticket';
import { color, font, shadow, space } from '../../../src/theme';

const redondear = (n: number) => Math.round(n * 100) / 100;

export default function TicketDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ticketId = Number(id);
  const router = useRouter();
  const sesion = useSesion();
  const insets = useSafeAreaInsets();
  useStatusBar('light');

  const roles = sesion?.user.roles;
  const caja = canManageCaja(roles);
  const esAdmin = canManageSalon(roles);

  const [salon, setSalon] = useState<PublicSalon | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [catalogo, setCatalogo] = useState<Vendible[]>([]);
  const [profesionales, setProfesionales] = useState<{ id: number; name: string }[]>([]);
  const [modo, setModo] = useState<{ manualMode: 'off' | 'admin' | 'cashier'; manualMaxPct: number } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [agregando, setAgregando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [profesional, setProfesional] = useState<number | null>(sesion?.user.employeeId ?? null);
  const [cupon, setCupon] = useState('');
  const [bono, setBono] = useState('');
  const [manual, setManual] = useState<{ type: 'percent' | 'amount'; value: string; reason: string } | null>(null);
  const [metodo, setMetodo] = useState<MetodoPago>('cash');
  const [recibido, setRecibido] = useState('');
  const [dialogo, setDialogo] = useState<{ title: string; message?: string; actions: DialogAction[] } | null>(null);

  const plata = (n: number) => dinero(salon?.currency ?? 'C$', n);
  const slug = sesion?.tenant.slug;

  const recargar = useCallback(async () => {
    try {
      setTicket(await cargarTicket(ticketId));
    } catch (err) {
      if (!(err instanceof SesionVencida)) setError(err instanceof Error ? err.message : 'No se pudo cargar el ticket');
    }
  }, [ticketId]);

  useFocusEffect(
    useCallback(() => {
      void recargar();
    }, [recargar]),
  );

  useEffect(() => {
    if (!slug) return;
    void loadPublicSalon(slug).then(setSalon).catch(() => setSalon(null));
    void cargarCatalogo().then(setCatalogo).catch(() => undefined);
    void cargarProfesionales().then(setProfesionales).catch(() => undefined);
    if (caja) void modoDescuento().then(setModo);
  }, [slug, caja]);

  async function hacer(accion: () => Promise<unknown>, okMensaje?: string) {
    setOcupado(true);
    setError(null);
    setAviso(null);
    try {
      await accion();
      await recargar();
      if (okMensaje) setAviso(okMensaje);
      return true;
    } catch (err) {
      if (!(err instanceof SesionVencida)) setError(err instanceof Error ? err.message : 'No se pudo completar');
      await recargar();
      return false;
    } finally {
      setOcupado(false);
    }
  }

  const filtrados = useMemo(() => {
    const aguja = busqueda.trim().toLowerCase();
    return catalogo.filter((c) => !aguja || c.name.toLowerCase().includes(aguja)).slice(0, 30);
  }, [catalogo, busqueda]);

  if (!ticket) {
    return (
      <View style={styles.centrado}>
        {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator color={color.gold} />}
      </View>
    );
  }

  const abierto = editable(ticket);
  const total = Number(ticket.total ?? ticket.subtotal ?? 0);
  const subtotal = Number(ticket.subtotal ?? total);
  const pagado = ticket.payments.reduce((s, p) => s + Number(p.amount), 0);
  const falta = Math.max(0, redondear(total - pagado));
  const pagosComunes = ticket.payments.filter((p) => p.method !== 'voucher');
  const bonos = ticket.payments.filter((p) => p.method === 'voucher');
  const descuentos = (ticket.discounts ?? []).filter((d) => !d.dismissed);
  const sinProfesional = ticket.items.some((l) => esServicio(l) && l.employeeId == null && !l.employee);
  const puedeDescontar = caja && modo != null && (modo.manualMode === 'cashier' || (modo.manualMode === 'admin' && esAdmin));
  const recibidoNum = monto(recibido);
  const montoPago = recibido.trim() === '' ? falta : recibidoNum;
  const parcial = Number.isFinite(montoPago) && montoPago > 0 && montoPago < falta - 0.005;
  const vuelto = metodo === 'cash' && montoPago > falta ? redondear(montoPago - falta) : 0;

  function agregar(item: Vendible) {
    if (item.kind === 'service' && profesional == null) {
      setError('Elegí quién hace el servicio antes de agregarlo.');
      return;
    }
    void hacer(() => agregarLinea(ticket!.id, { kind: item.kind, refId: item.refId, qty: 1, employeeId: profesional }));
  }

  function elegirProfesional(lineaId: number) {
    setDialogo({
      title: '¿Quién lo hizo?',
      actions: [
        ...profesionales.map((p) => ({
          label: p.name,
          onPress: () => {
            setDialogo(null);
            void hacer(() => cambiarLinea(ticket!.id, lineaId, { employee_id: p.id }));
          },
        })),
        { label: 'Cancelar', onPress: () => setDialogo(null) },
      ],
    });
  }

  async function cobrar() {
    if (!ticket) return;
    const comunes = pagosComunes.map((p) => ({ method: p.method, amount: Number(p.amount) }));
    if (falta > 0) {
      const nuevo = parcial ? montoPago : falta;
      const ok = await hacer(() => guardarPagos(ticket.id, [...comunes, { method: metodo, amount: nuevo }]));
      if (!ok) return;
      setRecibido('');
      if (parcial) {
        setAviso(`Pago de ${plata(nuevo)} registrado. Falta ${plata(redondear(falta - nuevo))}.`);
        return;
      }
    }
    const ok = await hacer(() => finalizarTicket(ticket.id));
    if (ok) {
      setDialogo({
        title: 'Ticket cobrado',
        message: vuelto > 0 ? `Vuelto: ${plata(vuelto)}` : `Total: ${plata(total)}`,
        actions: [{ label: 'Listo', tone: 'primary', onPress: () => setDialogo(null) }],
      });
    }
  }

  function confirmarAnular() {
    setDialogo({
      title: ticket?.status === 'finalized' ? '¿Anular este ticket cobrado?' : '¿Anular esta cuenta?',
      message:
        ticket?.status === 'finalized'
          ? 'Se devuelve el stock y el saldo de bonos. El dinero devuelto sale de la caja.'
          : 'La cuenta se cierra sin cobrar.',
      actions: [
        {
          label: 'Anular',
          tone: 'danger',
          onPress: () => {
            setDialogo(null);
            void hacer(() => anularTicket(ticket!.id, 'Anulado desde la app'), 'Ticket anulado.');
          },
        },
        { label: 'Volver', onPress: () => setDialogo(null) },
      ],
    });
  }

  const colores = salon?.theme.custom ? { bg: salon.theme.button, text: salon.theme.buttonText } : undefined;
  const etiquetaCobro = sinProfesional
    ? 'Falta la profesional de un servicio'
    : ticket.items.length === 0
      ? 'Agregá algo para cobrar'
      : falta <= 0
        ? 'Cerrar ticket'
        : parcial
          ? `Registrar pago de ${plata(montoPago)}`
          : `Cobrar ${plata(falta)}`;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + (caja && abierto ? 120 : 40) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Hero
          theme={salon?.theme}
          eyebrow={`Ticket #${ticket.id} · ${ESTADOS[ticket.status] ?? ticket.status}`}
          title={ticket.name || 'Consumidor final'}
          subtitle={plata(total)}
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/salon'))}
        />
        <Sheet>
          {aviso ? <Text style={styles.ok}>{aviso}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <SectionTitle>Detalle</SectionTitle>
          {ticket.items.length === 0 ? <Text style={styles.meta}>Todavía no tiene ítems.</Text> : null}
          {ticket.items.map((l) => (
            <View key={l.id} style={styles.linea}>
              <View style={styles.lineaTextos}>
                <Text style={styles.lineaNombre} numberOfLines={2}>{nombreLinea(l)}</Text>
                {esServicio(l) || l.employee ? (
                  <Pressable
                    disabled={!abierto}
                    onPress={() => elegirProfesional(l.id)}
                    accessibilityRole="button"
                    hitSlop={6}
                  >
                    <Text style={[styles.meta, !l.employee && esServicio(l) && styles.falta]}>
                      {l.employee ? `con ${l.employee.name}` : 'Elegí la profesional ›'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
              {abierto ? (
                <Contador
                  valor={l.quantity}
                  disabled={ocupado}
                  onCambio={(q) =>
                    void hacer(() => (q <= 0 ? quitarLinea(ticket.id, l.id) : cambiarLinea(ticket.id, l.id, { quantity: q })))
                  }
                />
              ) : (
                <Text style={styles.meta}>×{l.quantity}</Text>
              )}
              <Text style={styles.lineaTotal}>{plata(totalLinea(l))}</Text>
            </View>
          ))}

          {abierto ? (
            agregando ? (
              <View style={styles.panel}>
                <View style={styles.panelArriba}>
                  <SectionTitle>Agregar</SectionTitle>
                  <Pressable onPress={() => setAgregando(false)} hitSlop={8} accessibilityRole="button">
                    <Text style={styles.enlace}>Listo</Text>
                  </Pressable>
                </View>
                {profesionales.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                    {profesionales.map((p) => (
                      <Chip key={p.id} label={p.name.split(' ')[0]} activo={p.id === profesional} onPress={() => setProfesional(p.id)} />
                    ))}
                  </ScrollView>
                ) : null}
                <Field value={busqueda} onChangeText={setBusqueda} placeholder="Buscar servicio o producto" icon={<SearchIcon />} />
                {filtrados.map((item) => (
                  <Pressable
                    key={item.key}
                    onPress={() => agregar(item)}
                    disabled={ocupado}
                    accessibilityRole="button"
                    accessibilityLabel={`Agregar ${item.name}`}
                    style={({ pressed }) => [styles.opcion, pressed && { opacity: 0.8 }]}
                  >
                    <Text style={styles.opcionNombre} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.meta}>{plata(item.price)}</Text>
                    <Text style={styles.mas}>+</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Pressable onPress={() => setAgregando(true)} accessibilityRole="button" style={styles.agregar}>
                <Text style={styles.agregarTexto}>+ Agregar servicio o producto</Text>
              </Pressable>
            )
          ) : null}

          <View style={styles.totales}>
            {descuentos.length > 0 || subtotal !== total ? <Fila etiqueta="Subtotal" valor={plata(subtotal)} /> : null}
            {descuentos.map((d) => (
              <View key={d.id} style={styles.fila}>
                <Text style={[styles.meta, { flex: 1 }]} numberOfLines={2}>
                  {d.label}
                  {d.reason ? ` · ${d.reason}` : ''}
                </Text>
                <Text style={[styles.meta, { color: color.ok }]}>−{plata(Number(d.amount))}</Text>
                {abierto && caja ? (
                  <Pressable
                    onPress={() => void hacer(() => quitarDescuento(ticket.id, d.id))}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar ${d.label}`}
                  >
                    <Text style={styles.quitar}>×</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
            <View style={styles.fila}>
              <Text style={styles.totalEtiqueta}>Total</Text>
              <Text style={styles.totalValor}>{plata(total)}</Text>
            </View>
            {ticket.payments.length > 0 ? (
              <>
                {ticket.payments.map((p, i) => (
                  <View key={p.id ?? i} style={styles.fila}>
                    <Text style={[styles.meta, { flex: 1 }]}>
                      {nombreMetodo(p.method)}
                      {p.method === 'voucher' && p.reference ? ` ${p.reference.split(':')[0]}` : ''}
                    </Text>
                    <Text style={styles.meta}>{plata(Number(p.amount))}</Text>
                    {abierto && caja ? (
                      <Pressable
                        onPress={() =>
                          void hacer(() =>
                            p.method === 'voucher'
                              ? quitarBono(ticket.id, (p.reference ?? '').split(':')[0])
                              : guardarPagos(
                                  ticket.id,
                                  pagosComunes.filter((x) => x !== p).map((x) => ({ method: x.method, amount: Number(x.amount) })),
                                ),
                          )
                        }
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Quitar pago"
                      >
                        <Text style={styles.quitar}>×</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
                {abierto ? <Fila etiqueta="Falta" valor={plata(falta)} fuerte /> : null}
              </>
            ) : null}
          </View>

          {abierto && caja ? (
            <>
              <SectionTitle>Descuentos y bonos</SectionTitle>
              {bonos.length === 0 ? (
                <View style={styles.enLinea}>
                  <View style={{ flex: 1 }}>
                    <Field value={cupon} onChangeText={setCupon} placeholder="Cupón" autoCapitalize="none" />
                  </View>
                  <BotonChico
                    label="Aplicar"
                    disabled={!cupon.trim() || ocupado}
                    onPress={() => void hacer(() => aplicarCupon(ticket.id, cupon.trim()), 'Cupón aplicado.').then((ok) => ok && setCupon(''))}
                  />
                </View>
              ) : null}
              <View style={styles.enLinea}>
                <View style={{ flex: 1 }}>
                  <Field value={bono} onChangeText={setBono} placeholder="Código de bono o gift card" autoCapitalize="none" />
                </View>
                <BotonChico
                  label="Usar"
                  disabled={!bono.trim() || ocupado}
                  onPress={() => void hacer(() => aplicarBono(ticket.id, bono.trim()), 'Bono aplicado.').then((ok) => ok && setBono(''))}
                />
              </View>
              {puedeDescontar && bonos.length === 0 ? (
                manual ? (
                  <View style={styles.panel}>
                    <View style={styles.chips}>
                      <Chip label="%" activo={manual.type === 'percent'} onPress={() => setManual({ ...manual, type: 'percent' })} />
                      <Chip label="Monto" activo={manual.type === 'amount'} onPress={() => setManual({ ...manual, type: 'amount' })} />
                    </View>
                    <Field
                      value={manual.value}
                      onChangeText={(v) => setManual({ ...manual, value: v })}
                      placeholder={manual.type === 'percent' ? `Porcentaje${esAdmin ? '' : ` (hasta ${modo?.manualMaxPct}%)`}` : 'Monto'}
                      keyboardType="decimal-pad"
                    />
                    <Field value={manual.reason} onChangeText={(v) => setManual({ ...manual, reason: v })} placeholder="Motivo" />
                    <View style={styles.enLinea}>
                      <BotonChico label="Cancelar" plano onPress={() => setManual(null)} />
                      <BotonChico
                        label="Aplicar descuento"
                        disabled={!(monto(manual.value) > 0) || !manual.reason.trim() || ocupado}
                        onPress={() =>
                          void hacer(
                            () => descuentoManual(ticket.id, { type: manual.type, value: monto(manual.value), reason: manual.reason.trim() }),
                            'Descuento aplicado.',
                          ).then((ok) => ok && setManual(null))
                        }
                      />
                    </View>
                  </View>
                ) : (
                  <Pressable onPress={() => setManual({ type: 'percent', value: '', reason: '' })} accessibilityRole="button">
                    <Text style={styles.enlace}>Dar un descuento a mano</Text>
                  </Pressable>
                )
              ) : null}

              {falta > 0 ? (
                <>
                  <SectionTitle>Pago</SectionTitle>
                  <View style={styles.chips}>
                    {METODOS.map((m) => (
                      <Chip key={m.value} label={m.label} activo={m.value === metodo} onPress={() => setMetodo(m.value)} />
                    ))}
                  </View>
                  <Field
                    value={recibido}
                    onChangeText={setRecibido}
                    placeholder={metodo === 'cash' ? `¿Con cuánto paga? (${plata(falta)})` : `Monto (${plata(falta)})`}
                    keyboardType="decimal-pad"
                  />
                  {vuelto > 0 ? <Text style={styles.vuelto}>Vuelto: {plata(vuelto)}</Text> : null}
                  {parcial ? <Text style={styles.meta}>Es menos que el total: se registra como pago parcial.</Text> : null}
                </>
              ) : null}
            </>
          ) : null}

          {abierto && !caja ? <Text style={styles.meta}>La cuenta la cobra caja.</Text> : null}

          {caja && ticket.status !== 'cancelled' && ticket.status !== 'prepaid' ? (
            <Pressable onPress={confirmarAnular} accessibilityRole="button" style={styles.anular}>
              <Text style={styles.anularTexto}>{ticket.status === 'finalized' ? 'Anular ticket' : 'Anular cuenta'}</Text>
            </Pressable>
          ) : null}
        </Sheet>
      </ScrollView>
      <StatusStrip theme={salon?.theme} />

      {caja && abierto ? (
        <View style={[styles.barra, { paddingBottom: insets.bottom + 14 }]}>
          <PrimaryButton
            label={etiquetaCobro}
            tone="gold"
            colors={colores}
            disabled={sinProfesional || ticket.items.length === 0 || (recibido.trim() !== '' && !(recibidoNum > 0))}
            loading={ocupado}
            onPress={() => void cobrar()}
          />
        </View>
      ) : null}

      <Dialog
        visible={dialogo != null}
        title={dialogo?.title ?? ''}
        message={dialogo?.message}
        actions={dialogo?.actions ?? []}
        onClose={() => setDialogo(null)}
      />
    </KeyboardAvoidingView>
  );
}

function Fila({ etiqueta, valor, fuerte }: { etiqueta: string; valor: string; fuerte?: boolean }) {
  return (
    <View style={styles.fila}>
      <Text style={fuerte ? styles.fuerte : styles.meta}>{etiqueta}</Text>
      <Text style={fuerte ? styles.fuerte : styles.meta}>{valor}</Text>
    </View>
  );
}

function Contador({ valor, onCambio, disabled }: { valor: number; onCambio: (n: number) => void; disabled?: boolean }) {
  return (
    <View style={styles.contador}>
      <Pressable disabled={disabled} onPress={() => onCambio(valor - 1)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Quitar uno" style={styles.contBoton}>
        <Text style={styles.contTexto}>−</Text>
      </Pressable>
      <Text style={styles.contValor}>{valor}</Text>
      <Pressable disabled={disabled} onPress={() => onCambio(valor + 1)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Agregar uno" style={styles.contBoton}>
        <Text style={styles.contTexto}>+</Text>
      </Pressable>
    </View>
  );
}

function Chip({ label, activo, onPress }: { label: string; activo: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: activo }} style={[styles.chip, activo && styles.chipActivo]}>
      <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{label}</Text>
    </Pressable>
  );
}

function BotonChico({ label, onPress, disabled, plano }: { label: string; onPress: () => void; disabled?: boolean; plano?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={[styles.botonChico, plano && styles.botonPlano, disabled && { opacity: 0.4 }]}
    >
      <Text style={[styles.botonChicoTexto, plano && { color: color.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.base, padding: 24 },
  scroll: { flexGrow: 1 },
  linea: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lineaTextos: { flex: 1, gap: 2 },
  lineaNombre: { fontFamily: font.display, fontSize: 20, color: color.ink },
  lineaTotal: { fontFamily: font.bold, fontSize: 15, color: color.ink, minWidth: 70, textAlign: 'right' },
  falta: { color: color.danger, fontFamily: font.medium },
  panel: {
    backgroundColor: color.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: color.line,
    padding: 14,
    gap: 10,
    ...shadow,
  },
  panelArriba: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.line,
  },
  opcionNombre: { flex: 1, fontFamily: font.medium, fontSize: 15, color: color.ink },
  mas: { fontFamily: font.bold, fontSize: 20, color: color.goldDeep, width: 20, textAlign: 'center' },
  agregar: { borderWidth: 1, borderStyle: 'dashed', borderColor: color.gold, borderRadius: 16, padding: 14, alignItems: 'center' },
  agregarTexto: { fontFamily: font.medium, fontSize: 15, color: color.goldDeep },
  totales: { gap: 8, paddingTop: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  totalEtiqueta: { fontFamily: font.display, fontSize: 24, color: color.ink },
  totalValor: { fontFamily: font.display, fontSize: 30, color: color.ink },
  fuerte: { fontFamily: font.bold, fontSize: 15, color: color.ink },
  quitar: { fontFamily: font.bold, fontSize: 20, color: color.danger, paddingHorizontal: 4 },
  enLinea: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  botonChico: { backgroundColor: color.ink, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 14 },
  botonPlano: { backgroundColor: 'transparent', borderWidth: 1, borderColor: color.line },
  botonChicoTexto: { fontFamily: font.bold, fontSize: 14, color: color.cream },
  enlace: { fontFamily: font.medium, fontSize: 15, color: color.goldDeep },
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
  anular: { alignItems: 'center', paddingVertical: 14, marginTop: 8 },
  anularTexto: { fontFamily: font.medium, fontSize: 15, color: color.danger },
  meta: { fontFamily: font.body, fontSize: 14, color: color.muted },
  vuelto: { fontFamily: font.bold, fontSize: 16, color: color.ok },
  ok: { fontFamily: font.medium, fontSize: 14, color: color.ok },
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
