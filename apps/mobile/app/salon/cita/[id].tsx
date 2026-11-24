import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { canManageAgenda, canManageCaja, isStylist, normalizeWaDigits } from '@florece/shared';
import { Dialog } from '../../../src/components/Dialog';
import { Hero, Sheet, StatusStrip } from '../../../src/components/Hero';
import { Monogram, PrimaryButton, SectionTitle } from '../../../src/components/ui';
import {
  cambiarEstado,
  cancelarCita,
  cargarCita,
  cargarEstados,
  reprogramarCita,
  tonoEstado,
  type CitaStaff,
  type Estado,
} from '../../../src/lib/agenda';
import { dinero, fechaLarga, horaDe, mercadoDe, proximosDias } from '../../../src/lib/format';
import { loadPublicSalon, loadSlots, type PublicSalon, type Slot } from '../../../src/lib/salon';
import { useSesion } from '../../../src/lib/staff';
import { abrirCuenta, agregarLinea, cargarTicket } from '../../../src/lib/ticket';
import { useStatusBar } from '../../../src/lib/statusBar';
import { color, font, shadow, space } from '../../../src/theme';

export default function CitaStaffDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const sesion = useSesion();
  useStatusBar('light');

  const [cita, setCita] = useState<CitaStaff | null>(null);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [salon, setSalon] = useState<PublicSalon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [reprogramando, setReprogramando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [abriendoCuenta, setAbriendoCuenta] = useState(false);

  const mercado = mercadoDe(salon?.currency);

  const cargar = useCallback(async () => {
    if (!id) return;
    try {
      setCita(await cargarCita(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la cita');
    }
  }, [id]);

  useEffect(() => {
    void cargar();
    void cargarEstados().then(setEstados).catch(() => setEstados([]));
  }, [cargar]);

  useEffect(() => {
    if (!sesion) return;
    void loadPublicSalon(sesion.tenant.slug).then(setSalon).catch(() => setSalon(null));
  }, [sesion]);

  async function accion(fn: () => Promise<unknown>) {
    setGuardando(true);
    setError(null);
    try {
      await fn();
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }


  if (!cita) {
    return (
      <View style={styles.centrado}>
        {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator color={color.gold} />}
      </View>
    );
  }

  const tono = tonoEstado(cita.status.color);
  const total = cita.services.reduce((sum, s) => sum + Number(s.service.item.price || 0), 0);
  const whatsapp = normalizeWaDigits(cita.phone, mercado.phoneCountry);
  const cancelada = cita.status.name === 'Cancelado';
  // Caja y Estilista solo miran; cambiar la cita es de Admin y Recepción (igual que el API).
  const gestiona = canManageAgenda(sesion?.user.roles);
  // La cuenta la abre caja o la estilista (como en la web); recepción no cobra.
  const cobra = canManageCaja(sesion?.user.roles) || isStylist(sesion?.user.roles);

  async function irACuenta() {
    if (!cita) return;
    setAbriendoCuenta(true);
    setError(null);
    try {
      const { order } = await abrirCuenta({
        name: cita.name,
        ...(cita.employeeId != null ? { employee_id: cita.employeeId } : {}),
        ...(cita.customerId != null ? { customer_id: Number(cita.customerId) } : {}),
      });
      // Si la cuenta ya existía, no se duplican los servicios que ya tiene.
      const ya = new Set((await cargarTicket(order.id)).items.map((l) => l.itemId));
      for (const s of cita.services) {
        const itemId = Number(s.service.item.id ?? s.service.itemId);
        if (ya.has(itemId)) continue;
        await agregarLinea(order.id, { kind: 'service', refId: itemId, qty: 1, employeeId: cita.employeeId });
      }
      router.push(`/salon/ticket/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir la cuenta');
    } finally {
      setAbriendoCuenta(false);
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Hero
          theme={salon?.theme}
          eyebrow={cita.status.name}
          title={cita.name}
          subtitle={`${fechaLarga(cita.startTime, mercado.timeZone, mercado.utcOffset)} · ${horaDe(cita.startTime)} – ${horaDe(cita.endTime)}`}
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/salon'))}
        />
        <Sheet>
          {cita.phone ? (
            <View style={styles.contacto}>
              <BotonContacto label="Llamar" onPress={() => void Linking.openURL(`tel:${cita.phone}`)} />
              {whatsapp ? (
                <BotonContacto
                  label="WhatsApp"
                  onPress={() => void Linking.openURL(`https://wa.me/${whatsapp}`)}
                />
              ) : null}
            </View>
          ) : null}

          {(cita.customerNoShows ?? 0) > 0 ? (
            <Text style={styles.aviso}>
              Faltó {cita.customerNoShows} {cita.customerNoShows === 1 ? 'vez' : 'veces'} sin avisar.
            </Text>
          ) : null}

          <View style={styles.tarjeta}>
            {cita.employee ? (
              <View style={styles.persona}>
                <Monogram
                  name={cita.employee.name}
                  size={40}
                  image={salon?.employees.find((p) => p.id === cita.employee?.id)?.image}
                />
                <View style={styles.flex}>
                  <Text style={styles.etiqueta}>LA ATIENDE</Text>
                  <Text style={styles.nombre}>{cita.employee.name}</Text>
                </View>
              </View>
            ) : null}
            {cita.services.map((s, i) => (
              <View key={i} style={styles.linea}>
                <View style={styles.flex}>
                  <Text style={styles.servicio}>{s.service.item.name}</Text>
                  <Text style={styles.meta}>{s.service.durationTime} min</Text>
                </View>
                <Text style={styles.precio}>
                  {dinero(salon?.currency ?? mercado.currencySymbol, Number(s.service.item.price))}
                </Text>
              </View>
            ))}
            <View style={styles.total}>
              <Text style={styles.totalEtiqueta}>Total</Text>
              <Text style={styles.totalValor}>
                {dinero(salon?.currency ?? mercado.currencySymbol, total)}
              </Text>
            </View>
            {cita.type ? <Text style={styles.meta}>Agendada desde: {cita.type.name}</Text> : null}
          </View>

          {!cancelada && gestiona ? (
            <>
              <SectionTitle>Estado</SectionTitle>
              <View style={styles.estados}>
                {estados
                  .filter((estado) => estado.name !== 'Cancelado')
                  .map((estado) => {
                    const activo = estado.id === cita.status.id;
                    const t = tonoEstado(estado.color);
                    return (
                      <Pressable
                        key={estado.id}
                        disabled={guardando || activo}
                        onPress={() => void accion(() => cambiarEstado(cita.id, estado.id))}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: activo }}
                        style={[
                          styles.estado,
                          activo && { backgroundColor: t.fondo, borderColor: t.texto },
                        ]}
                      >
                        <Text style={[styles.estadoTexto, activo && { color: t.texto }]}>{estado.name}</Text>
                      </Pressable>
                    );
                  })}
              </View>
            </>
          ) : cancelada ? (
            <Text style={[styles.estadoCancelada, { color: tono.texto }]}>Esta cita está cancelada.</Text>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {!cancelada && cobra ? (
            <PrimaryButton
              label={canManageCaja(sesion?.user.roles) ? 'Cobrar esta cita' : 'Abrir la cuenta'}
              tone="gold"
              loading={abriendoCuenta}
              onPress={() => void irACuenta()}
            />
          ) : null}

          {!cancelada && gestiona && salon && cita.employeeId ? (
            reprogramando ? (
              <Reprogramar
                cita={cita}
                salon={salon}
                onCancelar={() => setReprogramando(false)}
                onListo={async (body) => {
                  await accion(() => reprogramarCita(cita.id, body));
                  setReprogramando(false);
                }}
              />
            ) : (
              <PrimaryButton label="Reprogramar" onPress={() => setReprogramando(true)} />
            )
          ) : null}

          {!cancelada && gestiona ? (
            <Pressable onPress={() => setConfirmando(true)} accessibilityRole="button" style={styles.cancelar}>
              <Text style={styles.cancelarTexto}>Cancelar cita</Text>
            </Pressable>
          ) : null}
        </Sheet>
      </ScrollView>
      <StatusStrip theme={salon?.theme} />
      <Dialog
        visible={confirmando}
        eyebrow={`${horaDe(cita.startTime)} · ${cita.employee?.name ?? ''}`}
        title="¿Cancelar esta cita?"
        message={`La cita de ${cita.name} queda cancelada y el horario se libera para otra clienta.`}
        onClose={() => setConfirmando(false)}
        actions={[
          { label: 'Sí, cancelar la cita', tone: 'danger', onPress: () => void accion(() => cancelarCita(cita.id)) },
          { label: 'No, dejarla', onPress: () => undefined },
        ]}
      />
    </View>
  );
}

function BotonContacto({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.botonContacto, pressed && { opacity: 0.8 }]}
    >
      <Text style={styles.botonContactoTexto}>{label}</Text>
    </Pressable>
  );
}

function Reprogramar({
  cita,
  salon,
  onCancelar,
  onListo,
}: {
  cita: CitaStaff;
  salon: PublicSalon;
  onCancelar: () => void;
  onListo: (body: { employee_id: number; date: string; time: string }) => Promise<void>;
}) {
  const mercado = mercadoDe(salon.currency);
  const dias = useMemo(() => proximosDias(21, mercado.timeZone, mercado.utcOffset), [mercado.timeZone, mercado.utcOffset]);
  const [empleado, setEmpleado] = useState(cita.employeeId!);
  const diaCita = cita.startTime.slice(0, 10);
  const [fecha, setFecha] = useState(
    dias.some((d) => d.ymd === diaCita) ? diaCita : (dias[0]?.ymd ?? ''),
  );
  const [hora, setHora] = useState('');
  const [huecos, setHuecos] = useState<Slot[] | null>(null);
  const duracion = cita.services.reduce((m, s) => m + s.service.durationTime, 0) || 30;

  useEffect(() => {
    let activo = true;
    setHuecos(null);
    setHora('');
    void loadSlots(salon.slug, empleado, fecha, duracion)
      .then((data) => activo && setHuecos(data.slots ?? []))
      .catch(() => activo && setHuecos([]));
    return () => {
      activo = false;
    };
  }, [salon.slug, empleado, fecha, duracion]);

  return (
    <View style={styles.reprogramar}>
      <Text style={styles.reprogramarTitulo}>Nuevo horario</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {salon.employees.map((persona) => (
          <Chip key={persona.id} label={persona.name.split(' ')[0]} activo={persona.id === empleado} onPress={() => setEmpleado(persona.id)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {dias.map((dia) => (
          <Chip key={dia.ymd} label={dia.label} activo={dia.ymd === fecha} onPress={() => setFecha(dia.ymd)} />
        ))}
      </ScrollView>
      {huecos == null ? <ActivityIndicator color={color.gold} /> : null}
      {huecos?.length === 0 ? <Text style={styles.meta}>No hay horarios libres ese día.</Text> : null}
      <View style={styles.huecos}>
        {huecos?.map((hueco) => (
          <Chip key={hueco.start} label={horaDe(hueco.start)} activo={hora === hueco.start} onPress={() => setHora(hueco.start)} />
        ))}
      </View>
      <PrimaryButton
        label="Guardar nuevo horario"
        tone="gold"
            colors={salon?.theme.custom ? { bg: salon.theme.button, text: salon.theme.buttonText } : undefined}
        disabled={!hora}
        onPress={() => void onListo({ employee_id: empleado, date: fecha, time: horaDe(hora) })}
      />
      <Pressable onPress={onCancelar} accessibilityRole="button" style={styles.cancelar}>
        <Text style={styles.linkTexto}>Dejarlo como está</Text>
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
  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.base, padding: space.screen },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  flex: { flex: 1 },
  contacto: { flexDirection: 'row', gap: 10 },
  botonContacto: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: color.gold,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: color.card,
  },
  botonContactoTexto: { fontFamily: font.bold, fontSize: 15, color: color.goldDeep },
  aviso: {
    fontFamily: font.medium,
    fontSize: 13,
    color: '#8a3530',
    backgroundColor: '#f4e0de',
    padding: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  tarjeta: {
    backgroundColor: color.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: color.line,
    padding: 18,
    gap: 14,
    ...shadow,
  },
  persona: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.line,
  },
  etiqueta: { fontFamily: font.medium, fontSize: 11, letterSpacing: 1.6, color: color.goldDeep },
  nombre: { fontFamily: font.display, fontSize: 20, color: color.ink },
  linea: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  servicio: { fontFamily: font.display, fontSize: 20, color: color.ink },
  meta: { fontFamily: font.body, fontSize: 13, color: color.muted },
  precio: { fontFamily: font.medium, fontSize: 15, color: color.ink },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.line,
    paddingTop: 14,
  },
  totalEtiqueta: { fontFamily: font.display, fontSize: 22, color: color.ink },
  totalValor: { fontFamily: font.bold, fontSize: 22, color: color.goldDeep },
  estados: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  estado: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.card,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  estadoTexto: { fontFamily: font.medium, fontSize: 14, color: color.ink },
  estadoCancelada: { fontFamily: font.medium, fontSize: 15 },
  error: { color: color.danger, fontSize: 14, fontFamily: font.body },
  cancelar: { alignItems: 'center', paddingVertical: 12 },
  cancelarTexto: { fontFamily: font.bold, fontSize: 15, color: color.danger },
  linkTexto: { fontFamily: font.bold, fontSize: 15, color: color.goldDeep },
  reprogramar: {
    backgroundColor: color.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: color.gold,
    padding: 16,
    gap: 12,
  },
  reprogramarTitulo: { fontFamily: font.display, fontSize: 22, color: color.ink },
  chips: { gap: 8 },
  huecos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.base,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipActivo: { backgroundColor: color.ink, borderColor: color.ink },
  chipTexto: { fontFamily: font.medium, fontSize: 14, color: color.ink },
  chipTextoActivo: { color: color.goldLight },
});
