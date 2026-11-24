import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { fechaLarga, horaDe } from '../src/lib/format';
import { loadAppointmentView } from '../src/lib/salon';
import {
  loadAppointments,
  replaceAppointments,
  type SavedAppointment,
} from '../src/lib/storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton, SectionTitle } from '../src/components/ui';
import { useStatusBar } from '../src/lib/statusBar';
import { color, font, shadow, space } from '../src/theme';

export default function Citas() {
  const [citas, setCitas] = useState<SavedAppointment[]>([]);
  const [lista, setLista] = useState(false);
  const router = useRouter();
  useStatusBar('light');
  const insets = useSafeAreaInsets();

  const refrescar = useCallback(() => {
    let activo = true;
    void (async () => {
      const guardadas = await loadAppointments();
      if (!activo) return;
      setCitas(guardadas);
      setLista(true);
      if (guardadas.length === 0) return;

      const actualizadas = await Promise.all(
        guardadas.map(async (cita) => {
          try {
            const vista = await loadAppointmentView(cita.viewToken);
            return {
              ...cita,
              salonName: vista.salon.name || cita.salonName,
              slug: vista.salon.slug || cita.slug,
              name: vista.name,
              status: vista.status,
              employeeName: vista.employeeName,
              services: vista.services,
              startTime: vista.startTime,
              endTime: vista.endTime,
            } satisfies SavedAppointment;
          } catch {
            return cita;
          }
        }),
      );
      if (!activo) return;
      actualizadas.sort((a, b) => (a.startTime ?? '') < (b.startTime ?? '') ? 1 : -1);
      setCitas(actualizadas);
      await replaceAppointments(actualizadas);
    })();
    return () => {
      activo = false;
    };
  }, []);

  useFocusEffect(refrescar);

  // Las horas vienen en hora local del salón; se comparan como texto contra la hora local del teléfono.
  const ahora = horaLocalIso();
  const porHora = (a: SavedAppointment, b: SavedAppointment) =>
    (a.startTime ?? '').localeCompare(b.startTime ?? '');
  const proximas = citas.filter((c) => (c.startTime ?? '') >= ahora).sort(porHora);
  const anteriores = citas.filter((c) => (c.startTime ?? '') < ahora).sort((a, b) => porHora(b, a));

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <View style={styles.aro} />
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            hitSlop={12}
            style={styles.volver}
          >
            <Text style={styles.volverTexto}>‹</Text>
          </Pressable>
          <Text style={styles.eyebrow}>TUS RESERVAS</Text>
          <Text style={styles.titulo}>Mis citas</Text>
          {lista && citas.length > 0 ? (
            <Text style={styles.resumen}>
              {proximas.length === 0
                ? 'No tenés citas próximas'
                : proximas.length === 1
                  ? 'Tenés 1 cita próxima'
                  : `Tenés ${proximas.length} citas próximas`}
            </Text>
          ) : null}
        </View>

        <View style={styles.sheet}>
          {!lista ? <ActivityIndicator color={color.gold} /> : null}
          {lista && citas.length === 0 ? (
            <View style={styles.vacioCaja}>
              <View style={styles.vacioIcono}>
                <Text style={styles.vacioIconoTexto}>✦</Text>
              </View>
              <Text style={styles.vacioTitulo}>Todavía no hay citas</Text>
              <Text style={styles.vacio}>
                Cuando reserves desde este teléfono, tus citas aparecen acá.
              </Text>
              <View style={styles.vacioBoton}>
                <PrimaryButton label="Buscar un salón" onPress={() => router.replace('/')} />
              </View>
            </View>
          ) : null}

          {proximas.length > 0 ? <SectionTitle>Próximas</SectionTitle> : null}
          {proximas.map((cita, i) => (
            <Tarjeta
              key={cita.viewToken}
              cita={cita}
              destacada={i === 0}
              onPress={() => router.push(`/s/${cita.slug}`)}
            />
          ))}

          {anteriores.length > 0 ? (
            <View style={proximas.length > 0 ? styles.separado : undefined}>
              <SectionTitle>Anteriores</SectionTitle>
            </View>
          ) : null}
          {anteriores.map((cita) => (
            <Tarjeta
              key={cita.viewToken}
              cita={cita}
              pasada
              onPress={() => router.push(`/s/${cita.slug}`)}
            />
          ))}
        </View>
      </ScrollView>
      <View style={[styles.franja, { height: insets.top }]} />
    </View>
  );
}

function horaLocalIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function Tarjeta({
  cita,
  destacada,
  pasada,
  onPress,
}: {
  cita: SavedAppointment;
  destacada?: boolean;
  pasada?: boolean;
  onPress: () => void;
}) {
  const fecha = cita.startTime?.slice(0, 10) ?? '';
  const oscura = Boolean(destacada);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint="Abre el salón"
      style={({ pressed }) => [
        styles.card,
        oscura && styles.cardOscura,
        pasada && styles.cardPasada,
        pressed && { opacity: 0.88 },
      ]}
    >
      <View style={styles.cardArriba}>
        <View style={[styles.fecha, oscura && styles.fechaOscura]}>
          <Text style={styles.fechaMes}>{MESES[Number(fecha.slice(5, 7)) - 1] ?? ''}</Text>
          <Text style={[styles.fechaDia, oscura && styles.fechaDiaOscura]}>
            {fecha ? Number(fecha.slice(8, 10)) : '·'}
          </Text>
        </View>
        <View style={styles.cuerpo}>
          <Text style={[styles.salon, oscura && styles.claro]} numberOfLines={1}>
            {cita.salonName}
          </Text>
          <Text style={[styles.cuando, oscura && styles.claro]}>
            {fechaLarga(cita.startTime)}
          </Text>
          <Text style={[styles.hora, oscura && styles.horaOscura]}>
            {horaDe(cita.startTime)}
            {horaDe(cita.endTime) ? ` – ${horaDe(cita.endTime)}` : ''}
          </Text>
        </View>
      </View>
      <View style={[styles.cardAbajo, oscura && styles.cardAbajoOscura]}>
        <View style={styles.cuerpo}>
          <Text style={[styles.detalle, oscura && styles.detalleOscuro]} numberOfLines={2}>
            {cita.services.join(', ') || 'Servicio'}
            {cita.employeeName ? ` · con ${cita.employeeName}` : ''}
          </Text>
        </View>
        <Text style={[styles.estado, oscura && styles.estadoOscuro]}>{cita.status}</Text>
      </View>
    </Pressable>
  );
}

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  franja: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: color.ink },
  scroll: { flexGrow: 1, paddingBottom: 48 },
  hero: {
    backgroundColor: color.ink,
    paddingHorizontal: space.screen,
    paddingBottom: 60,
    overflow: 'hidden',
  },
  aro: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: 'rgba(196,165,116,0.2)',
    right: -110,
    top: -40,
  },
  volver: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(224,201,160,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  volverTexto: { color: color.cream, fontSize: 26, marginTop: -3 },
  eyebrow: { fontFamily: font.medium, fontSize: 11, letterSpacing: 2.4, color: color.gold },
  titulo: { fontFamily: font.display, fontSize: 48, lineHeight: 54, color: color.cream, marginTop: 4 },
  resumen: { fontFamily: font.displayItalic, fontSize: 20, color: color.goldLight, marginTop: 2 },
  sheet: {
    flexGrow: 1,
    backgroundColor: color.base,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    padding: space.screen,
    paddingTop: 30,
    gap: 14,
  },
  separado: { marginTop: 14 },
  vacioCaja: { alignItems: 'center', gap: 8, paddingTop: 36 },
  vacioIcono: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: color.warm,
    borderWidth: 1,
    borderColor: color.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  vacioIconoTexto: { fontSize: 28, color: color.gold },
  vacioTitulo: { fontFamily: font.display, fontSize: 28, color: color.ink },
  vacio: { color: color.muted, fontSize: 15, lineHeight: 22, fontFamily: font.body, textAlign: 'center' },
  vacioBoton: { alignSelf: 'stretch', marginTop: 18 },
  card: {
    backgroundColor: color.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: color.line,
    padding: 18,
    gap: 16,
    ...shadow,
  },
  cardOscura: { backgroundColor: color.ink, borderColor: color.ink },
  cardPasada: { opacity: 0.72 },
  cardArriba: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  fecha: {
    width: 62,
    borderRadius: 18,
    backgroundColor: color.warm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  fechaOscura: { backgroundColor: 'rgba(196,165,116,0.14)' },
  fechaMes: { fontFamily: font.medium, fontSize: 11, letterSpacing: 1.4, color: color.gold },
  fechaDia: { fontFamily: font.display, fontSize: 30, color: color.ink, lineHeight: 34 },
  fechaDiaOscura: { color: color.cream },
  cuerpo: { flex: 1, gap: 2 },
  salon: { fontSize: 22, fontFamily: font.display, color: color.ink },
  claro: { color: color.cream },
  cuando: { fontSize: 14, fontFamily: font.body, color: color.ink },
  hora: { fontSize: 15, fontFamily: font.bold, color: color.goldDeep },
  horaOscura: { color: color.gold },
  cardAbajo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.line,
    paddingTop: 14,
  },
  cardAbajoOscura: { borderTopColor: 'rgba(224,201,160,0.25)' },
  detalle: { fontSize: 13, fontFamily: font.body, color: color.muted },
  detalleOscuro: { color: '#cfc7bd' },
  estado: {
    fontSize: 11,
    fontFamily: font.medium,
    color: color.goldDeep,
    backgroundColor: color.warm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  estadoOscuro: { color: color.ink, backgroundColor: color.gold },
});
