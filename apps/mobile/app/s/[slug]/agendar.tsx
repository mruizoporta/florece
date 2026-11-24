import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { createAppointmentSchema } from '@florece/shared';
import { ZodError } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Field, Monogram, PrimaryButton } from '../../../src/components/ui';
import { dinero, fechaLarga, horaDe, mercadoDe, proximosDias } from '../../../src/lib/format';
import { api } from '../../../src/lib/api';
import { avisosDeCita } from '../../../src/lib/push';
import {
  joinWaitlist,
  loadPromotions,
  loadPublicSalon,
  loadSlots,
  type PublicPromotion,
  type CreatedAppointment,
  type PublicSalon,
  type Slot,
} from '../../../src/lib/salon';
import { rememberSalon, saveAppointment } from '../../../src/lib/storage';
import { FLORECE_THEME } from '../../../src/lib/brand';
import { useStatusBar } from '../../../src/lib/statusBar';
import { color, font, shadow, space } from '../../../src/theme';

const PASOS = ['servicios', 'estilista', 'horario', 'datos', 'listo'] as const;
type Paso = (typeof PASOS)[number];

const SUBTITULOS: Record<Paso, string> = {
  servicios: 'Podés elegir más de uno.',
  estilista: 'Elegí a tu profesional.',
  horario: 'Elegí el día y el horario que te quede.',
  datos: 'Para que el salón sepa quién viene.',
  listo: 'Mirá que todo esté bien antes de confirmar.',
};

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

const TITULOS: Record<Paso, string> = {
  servicios: '¿Qué te hacés?',
  estilista: '¿Con quién?',
  horario: 'Día y hora',
  datos: 'Tus datos',
  listo: 'Revisá tu cita',
};

export default function Agendar() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [salon, setSalon] = useState<PublicSalon | null>(null);
  useStatusBar(salon ? 'light' : 'dark');
  const mercado = mercadoDe(salon?.currency);
  const dias = useMemo(
    () => proximosDias(14, mercado.timeZone, mercado.utcOffset),
    [mercado.timeZone, mercado.utcOffset],
  );
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [paso, setPaso] = useState<Paso>('servicios');
  const [servicios, setServicios] = useState<number[]>([]);
  const [empleadoId, setEmpleadoId] = useState<number | null>(null);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [huecos, setHuecos] = useState<Slot[]>([]);
  const [cargandoHuecos, setCargandoHuecos] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lista, setLista] = useState(false);
  const [promos, setPromos] = useState<PublicPromotion[]>([]);
  const [atiende, setAtiende] = useState(true);
  const [correo, setCorreo] = useState('');
  const [anotando, setAnotando] = useState(false);
  const [anotadaEn, setAnotadaEn] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    void loadPublicSalon(slug)
      .then(setSalon)
      .catch((err: unknown) => {
        setErrorCarga(err instanceof Error ? err.message : 'No encontramos ese salón');
      });
    void loadPromotions(slug)
      .then(setPromos)
      .catch(() => setPromos([]));
  }, [slug]);

  useEffect(() => {
    if (!salon || fecha || !dias[0]) return;
    setFecha(dias[0].ymd);
  }, [salon, dias, fecha]);

  const elegidos = salon?.services.filter((servicio) => servicios.includes(servicio.id)) ?? [];
  const duracion = elegidos.reduce((sum, servicio) => sum + servicio.durationTime, 0);
  const total = elegidos.reduce((sum, servicio) => sum + Number(servicio.item.price || 0), 0);
  const empleado = salon?.employees.find((persona) => persona.id === empleadoId);

  useEffect(() => {
    if (paso !== 'horario' || !slug || !empleadoId || !fecha || duracion < 1) return;
    let activo = true;
    setCargandoHuecos(true);
    setError(null);
    void loadSlots(slug, empleadoId, fecha, duracion)
      .then((data) => {
        if (!activo) return;
        setHuecos(data.slots ?? []);
        setAtiende(data.hasSchedule !== false);
      })
      .catch((err: unknown) => {
        if (!activo) return;
        setHuecos([]);
        setError(err instanceof Error ? err.message : 'No se pudieron cargar horarios');
      })
      .finally(() => {
        if (activo) setCargandoHuecos(false);
      });
    return () => {
      activo = false;
    };
  }, [paso, slug, empleadoId, fecha, duracion]);

  function toggleServicio(id: number) {
    setHora('');
    setServicios((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function puedeSeguir(): boolean {
    if (paso === 'servicios') return servicios.length > 0;
    if (paso === 'estilista') return empleadoId != null;
    if (paso === 'horario') return Boolean(fecha && hora);
    if (paso === 'datos') return nombre.trim().length > 0;
    return true;
  }

  function siguiente() {
    const index = PASOS.indexOf(paso);
    if (index < PASOS.length - 1) setPaso(PASOS[index + 1]);
  }

  function atras() {
    const index = PASOS.indexOf(paso);
    if (index > 0) setPaso(PASOS[index - 1]);
  }

  async function anotarEnEspera() {
    if (!slug || empleadoId == null) return;
    if (!nombre.trim() || !telefono.trim()) {
      setError('Poné tu nombre y teléfono para avisarte.');
      return;
    }
    setAnotando(true);
    setError(null);
    try {
      await joinWaitlist(slug, {
        name: nombre.trim(),
        phone: telefono.trim(),
        email: correo.trim() || null,
        date: fecha,
        employee_id: empleadoId,
        service_ids: servicios,
      });
      setAnotadaEn(fecha);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo anotar');
    } finally {
      setAnotando(false);
    }
  }

  async function confirmar() {
    if (!slug || !salon || empleadoId == null) return;
    setEnviando(true);
    setError(null);
    try {
      const payload = {
        name: nombre.trim(),
        phone: telefono.trim() || null,
        typeName: 'Web' as const,
        employeeId: empleadoId,
        date: fecha,
        time: horaDe(hora) || hora,
        serviceIds: servicios,
      };
      createAppointmentSchema.parse(payload);
      const creada = await api<CreatedAppointment>('/v1/appointments', {
        method: 'POST',
        slug,
        body: payload,
      });
      if (!creada.viewToken) {
        throw new Error('La cita se creó, pero no se pudo guardar en este teléfono.');
      }
      const nombres =
        creada.services
          ?.map((row) => row.service?.item?.name)
          .filter((name): name is string => Boolean(name)) ??
        elegidos.map((servicio) => servicio.item.name);
      await saveAppointment({
        viewToken: creada.viewToken,
        slug,
        salonName: salon.name,
        name: creada.name,
        status: creada.status?.name ?? 'Pendiente',
        employeeName: creada.employee?.name ?? empleado?.name ?? null,
        services: nombres,
        startTime: creada.startTime ?? null,
        endTime: creada.endTime ?? null,
      });
      await rememberSalon({ slug, name: salon.name, city: salon.city });
      setLista(true);
      void avisosDeCita(creada.viewToken);
    } catch (err) {
      if (err instanceof ZodError) {
        setError(err.issues[0]?.message ?? 'Revisá los datos de la cita');
      } else {
        setError(err instanceof Error ? err.message : 'No se pudo agendar');
      }
    } finally {
      setEnviando(false);
    }
  }

  const indice = PASOS.indexOf(paso);
  const tema = salon?.theme ?? FLORECE_THEME;
  const botonSalon = tema.custom ? { bg: tema.button, text: tema.buttonText } : undefined;
  const huecoElegido = huecos.find((hueco) => hueco.start === hora);

  if (errorCarga) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.error}>{errorCarga}</Text>
      </View>
    );
  }
  if (!salon) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator color={color.gold} />
      </View>
    );
  }
  if (!salon.bookingOpen) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.vacio}>Este salón no recibe citas en línea.</Text>
      </View>
    );
  }
  if (lista) {
    return (
      <View style={[styles.exito, { backgroundColor: tema.hero, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.aro, styles.aroGrande, { borderColor: tema.accentOnHero }]} />
        <View style={[styles.aro, styles.aroChico]} />
        <View style={styles.exitoCentro}>
          <View style={[styles.okCirculo, { borderColor: tema.accentOnHero }]}>
            <Text style={[styles.okCheck, { color: tema.accentOnHero }]}>✓</Text>
          </View>
          <Text style={[styles.okEyebrow, { color: tema.accentOnHero }]}>TODO LISTO</Text>
          <Text style={[styles.okTitulo, { color: tema.heroText }]}>Cita reservada</Text>
          <Text style={[styles.okSalon, { color: tema.accentOnHero }]}>{salon.name}</Text>

          <View style={styles.okTarjeta}>
            <View style={styles.okFila}>
              <Text style={[styles.okEtiqueta, { color: tema.accentOnHero }]}>CUÁNDO</Text>
              <Text style={[styles.okValor, { color: tema.heroText }]}>
                {fechaLarga(fecha, mercado.timeZone, mercado.utcOffset)} · {horaDe(hora)}
              </Text>
            </View>
            <View style={styles.okFila}>
              <Text style={[styles.okEtiqueta, { color: tema.accentOnHero }]}>SERVICIO</Text>
              <Text style={[styles.okValor, { color: tema.heroText }]}>
                {elegidos.map((servicio) => servicio.item.name).join(', ')}
                {empleado ? ` · con ${empleado.name}` : ''}
              </Text>
            </View>
          </View>
          <Text style={styles.okNota}>El salón te va a confirmar la cita.</Text>
        </View>
        <View style={styles.okBotones}>
          <PrimaryButton label="Ver mis citas" tone="gold" colors={botonSalon} onPress={() => router.replace('/citas')} />
          <Pressable onPress={() => router.replace('/')} accessibilityRole="button" style={styles.okInicio}>
            <Text style={[styles.okInicioTexto, { color: tema.heroMuted }]}>Volver al inicio</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 12, backgroundColor: tema.hero }]}>
          <View style={[styles.aro, styles.aroHero, { borderColor: tema.accentOnHero }]} />
          <View style={styles.heroFila}>
            <Pressable
              onPress={() => (indice > 0 ? atras() : router.back())}
              accessibilityRole="button"
              accessibilityLabel="Volver"
              hitSlop={12}
              style={[styles.volver, { borderColor: tema.heroMuted }]}
            >
              <Text style={[styles.volverTexto, { color: tema.heroText }]}>‹</Text>
            </Pressable>
            <Text style={[styles.heroSalon, { color: tema.accentOnHero }]} numberOfLines={1}>{salon.name}</Text>
          </View>
          <View style={styles.progreso}>
            {PASOS.map((p, i) => (
              <View key={p} style={[styles.segmento, i <= indice && { backgroundColor: tema.accentOnHero }]} />
            ))}
          </View>
          <Text style={[styles.paso, { color: tema.accentOnHero }]}>
            PASO {indice + 1} DE {PASOS.length}
          </Text>
          <Text style={[styles.titulo, { color: tema.heroText }]}>{TITULOS[paso]}</Text>
          <Text style={[styles.subtitulo, { color: tema.heroMuted }]}>{SUBTITULOS[paso]}</Text>
        </View>

        <View style={styles.sheet}>

        {paso === 'servicios' && promos.length > 0 ? (
          <View style={styles.promos}>
            <Text style={styles.promoEyebrow}>PROMOCIONES</Text>
            {promos.map((promo) => (
              <View key={promo.id} style={styles.promo}>
                <Text style={styles.promoNombre}>{promo.name}</Text>
                <Text style={styles.promoTexto}>{promo.summary}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {paso === 'servicios' && salon.services.length === 0 ? (
          <Text style={styles.vacio}>Este salón todavía no publicó servicios.</Text>
        ) : null}
        {paso === 'servicios'
          ? salon.services.map((servicio) => {
              const activo = servicios.includes(servicio.id);
              return (
                <Opcion acento={botonSalon} key={servicio.id} activo={activo} onPress={() => toggleServicio(servicio.id)}>
                  <View style={styles.opcionTexto}>
                    <Text style={styles.item}>{servicio.item.name}</Text>
                    <Text style={styles.meta}>{servicio.durationTime} min</Text>
                  </View>
                  <Text style={[styles.precio, { color: tema.accent }]}>
                    {dinero(salon.currency, Number(servicio.item.price))}
                  </Text>
                </Opcion>
              );
            })
          : null}

        {paso === 'estilista' && salon.employees.length === 0 ? (
          <Text style={styles.vacio}>No hay profesionales para agendar.</Text>
        ) : null}
        {paso === 'estilista'
          ? salon.employees.map((persona) => (
              <Opcion
                key={persona.id}
                activo={empleadoId === persona.id}
                onPress={() => {
                  setEmpleadoId(persona.id);
                  setHora('');
                }}
              >
                <Monogram name={persona.name} image={persona.image} />
                <Text style={[styles.item, styles.flex]}>{persona.name}</Text>
              </Opcion>
            ))
          : null}

        {paso === 'horario' ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.diasScroll}
              contentContainerStyle={styles.dias}
            >
              {dias.map((dia) => {
                const activo = fecha === dia.ymd;
                return (
                  <Pressable
                    key={dia.ymd}
                    onPress={() => {
                      setFecha(dia.ymd);
                      setHora('');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={dia.label}
                    accessibilityState={{ selected: activo }}
                    style={[styles.dia, activo && styles.diaActivo]}
                  >
                    <Text style={[styles.diaSemana, activo && styles.diaTextoActivo]}>
                      {diaSemana(dia.ymd)}
                    </Text>
                    <Text style={[styles.diaNumero, activo && styles.diaTextoActivo]}>
                      {Number(dia.ymd.slice(8))}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {cargandoHuecos ? <ActivityIndicator color={color.gold} /> : null}
            <View style={styles.huecos}>
              {huecos.map((hueco) => {
                const activo = hora === hueco.start;
                return (
                  <Pressable
                    key={hueco.start}
                    onPress={() => setHora(hueco.start)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activo }}
                    style={[styles.chip, activo && styles.chipActivo]}
                  >
                    <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>
                      {horaDe(hueco.start)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {!cargandoHuecos && huecos.length === 0 ? (
              <Text style={styles.vacio}>
                {atiende
                  ? 'No hay horarios libres ese día.'
                  : `${empleado?.name ?? 'La profesional'} no atiende ese día. Probá con otra fecha.`}
              </Text>
            ) : null}
            {!cargandoHuecos && huecos.length === 0 && atiende ? (
              anotadaEn === fecha ? (
                <View style={styles.resumen}>
                  <Text style={styles.resumenTitulo}>¡Listo! Si se libera un horario ese día te avisamos.</Text>
                </View>
              ) : (
                <View style={styles.resumen}>
                  <Text style={styles.resumenTitulo}>¿Te avisamos si se libera un horario?</Text>
                  <Field label="Nombre" value={nombre} onChangeText={setNombre} placeholder="Tu nombre" />
                  <Field
                    label="WhatsApp o teléfono"
                    value={telefono}
                    onChangeText={setTelefono}
                    placeholder="8888 8888"
                    keyboardType="phone-pad"
                  />
                  <Field
                    label="Correo (opcional)"
                    value={correo}
                    onChangeText={setCorreo}
                    placeholder="tu@correo.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <PrimaryButton
                    label="Avisame si se libera"
                    onPress={() => void anotarEnEspera()}
                    loading={anotando}
                  />
                </View>
              )
            ) : null}
          </>
        ) : null}

        {paso === 'datos' ? (
          <>
            <Field label="Nombre" value={nombre} onChangeText={setNombre} placeholder="Tu nombre" />
            <Field
              label="Teléfono"
              value={telefono}
              onChangeText={setTelefono}
              placeholder="8888 8888"
              keyboardType="phone-pad"
            />
          </>
        ) : null}

        {paso === 'listo' ? (
          <View style={styles.ticket}>
            <View style={styles.ticketArriba}>
              <View style={styles.fechaBloque}>
                <Text style={styles.fechaMes}>{MESES[Number(fecha.slice(5, 7)) - 1] ?? ''}</Text>
                <Text style={styles.fechaDia}>{Number(fecha.slice(8, 10))}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.ticketFecha}>
                  {fechaLarga(fecha, mercado.timeZone, mercado.utcOffset)}
                </Text>
                <Text style={styles.ticketHora}>
                  {horaDe(hora)}
                  {huecoElegido ? ` – ${horaDe(huecoElegido.end)}` : ''}
                </Text>
                <Text style={styles.meta}>{duracion} min</Text>
              </View>
            </View>

            {empleado ? (
              <View style={styles.ticketPersona}>
                <Monogram name={empleado.name} size={40} image={empleado.image} />
                <View style={styles.flex}>
                  <Text style={styles.lineaEtiqueta}>TE ATIENDE</Text>
                  <Text style={styles.ticketNombre}>{empleado.name}</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.corte}>
              <View style={[styles.muesca, styles.muescaIzq]} />
              <View style={styles.punteada} />
              <View style={[styles.muesca, styles.muescaDer]} />
            </View>

            <View style={styles.ticketServicios}>
              {elegidos.map((servicio) => (
                <View key={servicio.id} style={styles.ticketLinea}>
                  <Text style={styles.ticketServicio}>{servicio.item.name}</Text>
                  <Text style={styles.ticketPrecio}>
                    {dinero(salon.currency, Number(servicio.item.price))}
                  </Text>
                </View>
              ))}
              <View style={styles.total}>
                <Text style={styles.totalEtiqueta}>Total</Text>
                <Text style={styles.totalValor}>{dinero(salon.currency, total)}</Text>
              </View>
            </View>

            <View style={styles.ticketPie}>
              <Text style={styles.lineaEtiqueta}>A NOMBRE DE</Text>
              <Text style={styles.ticketCliente}>
                {nombre}
                {telefono ? ` · ${telefono}` : ''}
              </Text>
            </View>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </ScrollView>
      <View style={[styles.franja, { height: insets.top, backgroundColor: tema.hero }]} />

      <View style={[styles.acciones, { paddingBottom: insets.bottom + 14 }]}>
        {paso !== 'servicios' ? (
          <Pressable onPress={atras} accessibilityRole="button" hitSlop={8} style={styles.atras}>
            <Text style={styles.atrasTexto}>Atrás</Text>
          </Pressable>
        ) : null}
        <View style={styles.flex}>
          {paso === 'listo' ? (
            <PrimaryButton
              label="Confirmar cita"
              tone="gold"
              colors={botonSalon}
              onPress={() => void confirmar()}
              loading={enviando}
            />
          ) : (
            <PrimaryButton
              label={paso === 'servicios' && total > 0 ? `Seguir · ${dinero(salon.currency, total)}` : 'Seguir'}
              onPress={siguiente}
              disabled={!puedeSeguir()}
            />
          )}
        </View>
      </View>
    </View>
  );
}

function diaSemana(ymd: string): string {
  return new Date(`${ymd}T12:00:00Z`)
    .toLocaleDateString('es', { weekday: 'short', timeZone: 'UTC' })
    .replace('.', '')
    .toUpperCase();
}

function Opcion({
  activo,
  onPress,
  children,
  acento,
}: {
  acento?: { bg: string; text: string };
  activo: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: activo }}
      style={({ pressed }) => [
        styles.opcion,
        activo && styles.opcionActiva,
        activo && acento ? { borderColor: acento.bg } : null,
        pressed && styles.pressed,
      ]}
    >
      {children}
      <View style={[styles.check, activo && styles.checkActivo, activo && acento ? { backgroundColor: acento.bg, borderColor: acento.bg } : null]}>
        {activo ? <Text style={[styles.checkMarca, acento ? { color: acento.text } : null]}>✓</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  scroll: { flexGrow: 1 },
  franja: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: color.ink },
  hero: {
    backgroundColor: color.ink,
    paddingHorizontal: space.screen,
    paddingBottom: 56,
    overflow: 'hidden',
  },
  aroHero: { width: 260, height: 260, right: -100, top: -50 },
  heroFila: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 },
  volver: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(224,201,160,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  volverTexto: { color: color.cream, fontSize: 26, marginTop: -3 },
  heroSalon: { flex: 1, fontFamily: font.displayItalic, fontSize: 19, color: color.goldLight },
  subtitulo: { fontFamily: font.body, fontSize: 14, color: '#b5afa8', marginTop: 2 },
  sheet: {
    flexGrow: 1,
    backgroundColor: color.base,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    padding: space.screen,
    paddingTop: 28,
    gap: 12,
  },
  centrado: {
    flex: 1,
    padding: space.screen,
    justifyContent: 'center',
    gap: 16,
    backgroundColor: color.base,
  },
  progreso: { flexDirection: 'row', gap: 6 },
  segmento: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(224,201,160,0.18)' },
  segmentoActivo: { backgroundColor: color.gold },
  paso: { color: color.gold, fontSize: 11, fontFamily: font.medium, letterSpacing: 2, marginTop: 18 },
  titulo: { fontFamily: font.display, fontSize: 40, lineHeight: 46, color: color.cream, marginTop: 2 },
  opcion: {
    backgroundColor: color.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: color.line,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  opcionActiva: { borderColor: color.gold, backgroundColor: '#fbf6ee' },
  pressed: { opacity: 0.85 },
  opcionTexto: { flex: 1, gap: 2 },
  item: { fontSize: 20, fontFamily: font.display, color: color.ink },
  meta: { fontSize: 13, fontFamily: font.body, color: color.muted },
  precio: { fontSize: 15, fontFamily: font.bold, color: color.goldDeep },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: color.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActivo: { backgroundColor: color.gold, borderColor: color.gold },
  checkMarca: { color: color.ink, fontSize: 13, fontFamily: font.bold },
  diasScroll: { marginHorizontal: -space.screen, flexGrow: 0 },
  dias: { gap: 10, paddingHorizontal: space.screen, alignItems: 'flex-start' },
  dia: {
    width: 62,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.card,
    alignItems: 'center',
    gap: 2,
  },
  diaActivo: { backgroundColor: color.ink, borderColor: color.ink },
  diaSemana: { fontFamily: font.medium, fontSize: 11, letterSpacing: 1, color: color.muted },
  diaNumero: { fontFamily: font.display, fontSize: 26, color: color.ink },
  diaTextoActivo: { color: color.goldLight },
  promos: { backgroundColor: color.ink, borderRadius: 22, padding: 18, gap: 10 },
  promoEyebrow: { fontFamily: font.medium, fontSize: 11, letterSpacing: 2, color: color.gold },
  promo: { gap: 2 },
  promoNombre: { fontSize: 20, fontFamily: font.display, color: color.cream },
  promoTexto: { fontSize: 13, fontFamily: font.body, color: '#cfc7bd' },
  huecos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  chip: {
    width: '31%',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chipActivo: { backgroundColor: color.gold, borderColor: color.gold },
  chipTexto: { color: color.ink, fontFamily: font.medium, fontSize: 15 },
  chipTextoActivo: { color: color.ink },
  resumen: {
    backgroundColor: color.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: color.line,
    padding: 18,
    gap: 14,
    ...shadow,
  },
  resumenTitulo: { fontFamily: font.display, fontSize: 21, color: color.ink },
  lineaEtiqueta: { fontFamily: font.medium, fontSize: 11, letterSpacing: 1.6, color: color.goldDeep },
  ticket: {
    backgroundColor: color.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: color.line,
    ...shadow,
  },
  ticketArriba: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, paddingBottom: 14 },
  fechaBloque: {
    width: 66,
    borderRadius: 18,
    backgroundColor: color.ink,
    alignItems: 'center',
    paddingVertical: 12,
  },
  fechaMes: { fontFamily: font.medium, fontSize: 11, letterSpacing: 1.4, color: color.gold },
  fechaDia: { fontFamily: font.display, fontSize: 32, lineHeight: 36, color: color.cream },
  ticketFecha: { fontFamily: font.body, fontSize: 15, color: color.ink },
  ticketHora: { fontFamily: font.display, fontSize: 30, lineHeight: 34, color: color.ink },
  ticketPersona: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 18,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.line,
  },
  ticketNombre: { fontFamily: font.display, fontSize: 20, color: color.ink },
  corte: { height: 28, justifyContent: 'center', marginTop: 10 },
  punteada: {
    marginHorizontal: 22,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: color.line,
  },
  muesca: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: color.base,
    borderWidth: 1,
    borderColor: color.line,
  },
  muescaIzq: { left: -14 },
  muescaDer: { right: -14 },
  ticketServicios: { paddingHorizontal: 18, gap: 10 },
  ticketLinea: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  ticketServicio: { flex: 1, fontFamily: font.display, fontSize: 20, color: color.ink },
  ticketPrecio: { fontFamily: font.medium, fontSize: 15, color: color.ink },
  ticketPie: {
    backgroundColor: color.warm,
    borderBottomLeftRadius: 23,
    borderBottomRightRadius: 23,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginTop: 18,
    gap: 2,
  },
  ticketCliente: { fontFamily: font.medium, fontSize: 15, color: color.ink },
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
  acciones: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    paddingHorizontal: space.screen,
    paddingTop: 14,
    backgroundColor: 'rgba(247,243,238,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.line,
  },
  flex: { flex: 1 },
  atras: { paddingVertical: 14, paddingHorizontal: 6 },
  atrasTexto: { color: color.goldDeep, fontFamily: font.bold, fontSize: 15 },
  vacio: { color: color.muted, fontSize: 15, lineHeight: 22, fontFamily: font.body },
  error: { color: color.danger, fontSize: 14, fontFamily: font.body },
  exito: {
    flex: 1,
    backgroundColor: color.ink,
    paddingHorizontal: space.screen,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  aro: { position: 'absolute', borderWidth: 1, borderColor: color.gold, borderRadius: 999, opacity: 0.22 },
  aroGrande: { width: 420, height: 420, left: -160, top: -120 },
  aroChico: { width: 260, height: 260, right: -110, bottom: 120, borderColor: 'rgba(196,165,116,0.12)' },
  exitoCentro: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 },
  okCirculo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: color.gold,
    backgroundColor: 'rgba(196,165,116,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  okCheck: { color: color.gold, fontSize: 38 },
  okEyebrow: { fontFamily: font.medium, fontSize: 11, letterSpacing: 2.4, color: color.gold },
  okTitulo: { fontSize: 46, lineHeight: 52, fontFamily: font.display, color: color.cream, textAlign: 'center' },
  okSalon: { fontSize: 22, fontFamily: font.displayItalic, color: color.goldLight, textAlign: 'center' },
  okTarjeta: {
    alignSelf: 'stretch',
    marginTop: 26,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(224,201,160,0.25)',
    backgroundColor: 'rgba(255,253,249,0.04)',
    padding: 18,
    gap: 14,
  },
  okFila: { gap: 3 },
  okEtiqueta: { fontFamily: font.medium, fontSize: 11, letterSpacing: 1.6, color: color.gold },
  okValor: { fontFamily: font.body, fontSize: 16, color: color.cream },
  okNota: { fontFamily: font.body, fontSize: 13, color: '#9d958c', marginTop: 14, textAlign: 'center' },
  okBotones: { gap: 6 },
  okInicio: { alignItems: 'center', paddingVertical: 14 },
  okInicioTexto: { fontFamily: font.bold, fontSize: 15, color: color.goldLight },
});
