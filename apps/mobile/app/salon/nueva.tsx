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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hero, Sheet, StatusStrip } from '../../src/components/Hero';
import { Field, PrimaryButton, SectionTitle } from '../../src/components/ui';
import { crearCita, crearWalkIn } from '../../src/lib/agenda';
import { dinero, horaDe, mercadoDe, proximosDias } from '../../src/lib/format';
import { loadPublicSalon, loadSlots, type PublicSalon, type Slot } from '../../src/lib/salon';
import { useSesion } from '../../src/lib/staff';
import { useStatusBar } from '../../src/lib/statusBar';
import { color, font, space } from '../../src/theme';

type Modo = 'agendar' | 'ahora';

export default function NuevaCita() {
  const { fecha: fechaInicial } = useLocalSearchParams<{ fecha?: string }>();
  const router = useRouter();
  const sesion = useSesion();
  const insets = useSafeAreaInsets();
  useStatusBar('light');

  const [salon, setSalon] = useState<PublicSalon | null>(null);
  const mercado = mercadoDe(salon?.currency);
  const dias = useMemo(() => proximosDias(21, mercado.timeZone, mercado.utcOffset), [mercado.timeZone, mercado.utcOffset]);

  const [modo, setModo] = useState<Modo>('agendar');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [servicios, setServicios] = useState<number[]>([]);
  const [empleado, setEmpleado] = useState<number | null>(null);
  const [fecha, setFecha] = useState(fechaInicial ?? '');
  const [hora, setHora] = useState('');
  const [huecos, setHuecos] = useState<Slot[] | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sesion) return;
    void loadPublicSalon(sesion.tenant.slug).then(setSalon).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el salón');
    });
  }, [sesion]);

  useEffect(() => {
    if (!fecha && dias[0]) setFecha(dias[0].ymd);
  }, [dias, fecha]);

  const elegidos = salon?.services.filter((s) => servicios.includes(s.id)) ?? [];
  const duracion = elegidos.reduce((m, s) => m + s.durationTime, 0);

  useEffect(() => {
    setHora('');
    if (modo !== 'agendar' || !salon || !empleado || !fecha || duracion < 1) {
      setHuecos(null);
      return;
    }
    let activo = true;
    setHuecos(null);
    void loadSlots(salon.slug, empleado, fecha, duracion)
      .then((data) => activo && setHuecos(data.slots ?? []))
      .catch(() => activo && setHuecos([]));
    return () => {
      activo = false;
    };
  }, [modo, salon, empleado, fecha, duracion]);

  const listo =
    nombre.trim().length > 0 && servicios.length > 0 && empleado != null && (modo === 'ahora' || Boolean(hora));

  async function guardar() {
    if (!listo || empleado == null) return;
    setGuardando(true);
    setError(null);
    try {
      if (modo === 'ahora') {
        await crearWalkIn({
          name: nombre.trim(),
          phone: telefono.trim() || undefined,
          employee_id: empleado,
          service_ids: servicios,
        });
      } else {
        await crearCita({
          name: nombre.trim(),
          phone: telefono.trim() || null,
          employeeId: empleado,
          date: fecha,
          time: horaDe(hora),
          serviceIds: servicios,
        });
      }
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la cita');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 110 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Hero
          theme={salon?.theme}
          eyebrow={sesion?.tenant.name}
          title="Nueva cita"
          subtitle={modo === 'ahora' ? 'La clienta ya está en el salón.' : 'Agendá un horario.'}
          onBack={() => router.back()}
        >
          <View style={styles.modos}>
            {(['agendar', 'ahora'] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => setModo(m)}
                accessibilityRole="radio"
                accessibilityState={{ checked: modo === m }}
                style={[styles.modo, modo === m && styles.modoActivo, modo === m && salon?.theme.custom ? { backgroundColor: salon.theme.button } : null]}
              >
                <Text
                  style={[
                    styles.modoTexto,
                    { color: salon?.theme.heroText ?? color.goldLight },
                    modo === m && styles.modoTextoActivo,
                    modo === m && salon?.theme.custom ? { color: salon.theme.buttonText } : null,
                  ]}
                >
                  {m === 'agendar' ? 'Agendar' : 'Llegó ahora'}
                </Text>
              </Pressable>
            ))}
          </View>
        </Hero>

        <Sheet>
          {!salon && !error ? <ActivityIndicator color={color.gold} /> : null}
          {salon ? (
            <>
              <SectionTitle>Clienta</SectionTitle>
              <Field value={nombre} onChangeText={setNombre} placeholder="Nombre" autoCapitalize="words" />
              <Field
                value={telefono}
                onChangeText={setTelefono}
                placeholder="WhatsApp o teléfono (opcional)"
                keyboardType="phone-pad"
              />

              <SectionTitle>Servicios</SectionTitle>
              <View style={styles.wrap}>
                {salon.services.map((s) => {
                  const activo = servicios.includes(s.id);
                  return (
                    <Chip
                      key={s.id}
                      activo={activo}
                      onPress={() =>
                        setServicios((prev) => (activo ? prev.filter((x) => x !== s.id) : [...prev, s.id]))
                      }
                      label={`${s.item.name} · ${dinero(salon.currency, Number(s.item.price))}`}
                    />
                  );
                })}
              </View>

              <SectionTitle>Profesional</SectionTitle>
              <View style={styles.wrap}>
                {salon.employees.map((p) => (
                  <Chip key={p.id} activo={p.id === empleado} onPress={() => setEmpleado(p.id)} label={p.name} />
                ))}
              </View>

              {modo === 'agendar' ? (
                <>
                  <SectionTitle>Día</SectionTitle>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.diasScroll}
                    contentContainerStyle={styles.dias}
                  >
                    {dias.map((d) => (
                      <Chip key={d.ymd} activo={d.ymd === fecha} onPress={() => setFecha(d.ymd)} label={d.label} />
                    ))}
                  </ScrollView>
                  <SectionTitle>Hora</SectionTitle>
                  {!empleado || servicios.length === 0 ? (
                    <Text style={styles.meta}>Elegí servicio y profesional para ver los horarios.</Text>
                  ) : huecos == null ? (
                    <ActivityIndicator color={color.gold} />
                  ) : huecos.length === 0 ? (
                    <Text style={styles.meta}>No hay horarios libres ese día.</Text>
                  ) : (
                    <View style={styles.wrap}>
                      {huecos.map((h) => (
                        <Chip key={h.start} activo={h.start === hora} onPress={() => setHora(h.start)} label={horaDe(h.start)} />
                      ))}
                    </View>
                  )}
                </>
              ) : null}
            </>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </Sheet>
      </ScrollView>
      <StatusStrip theme={salon?.theme} />

      <View style={[styles.barra, { paddingBottom: insets.bottom + 14 }]}>
        <PrimaryButton
          label={modo === 'ahora' ? 'Registrar llegada' : 'Agendar cita'}
          tone="gold"
            colors={salon?.theme.custom ? { bg: salon.theme.button, text: salon.theme.buttonText } : undefined}
          disabled={!listo}
          loading={guardando}
          onPress={() => void guardar()}
        />
      </View>
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
  modos: {
    flexDirection: 'row',
    marginTop: 20,
    backgroundColor: 'rgba(255,253,249,0.06)',
    borderRadius: 999,
    padding: 4,
  },
  modo: { flex: 1, borderRadius: 999, paddingVertical: 10, alignItems: 'center' },
  modoActivo: { backgroundColor: color.gold },
  modoTexto: { fontFamily: font.bold, fontSize: 14, color: color.goldLight },
  modoTextoActivo: { color: color.ink },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  diasScroll: { marginHorizontal: -space.screen, flexGrow: 0 },
  dias: { gap: 8, paddingHorizontal: space.screen, alignItems: 'flex-start' },
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
  meta: { fontFamily: font.body, fontSize: 14, color: color.muted },
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
