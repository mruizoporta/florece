import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { canManageAgenda, isStylist } from '@florece/shared';
import { Dialog } from '../../src/components/Dialog';
import { Hero, Sheet, StatusStrip, heroStyles } from '../../src/components/Hero';
import { PrimaryButton } from '../../src/components/ui';
import { cargarCitas, minutosDe, tonoEstado, type CitaStaff } from '../../src/lib/agenda';
import { fechaLarga, hoyEn, horaDe, mercadoDe } from '../../src/lib/format';
import { loadPublicSalon, type PublicSalon } from '../../src/lib/salon';
import { FLORECE_THEME } from '../../src/lib/brand';
import { cerrarSesion, SesionVencida, useSesion } from '../../src/lib/staff';
import { useStatusBar } from '../../src/lib/statusBar';
import { color, font, shadow, space } from '../../src/theme';

function sumarDias(ymd: string, dias: number): string {
  return new Date(Date.parse(`${ymd}T12:00:00Z`) + dias * 86_400_000).toISOString().slice(0, 10);
}

function duracionTexto(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export default function AgendaSalon() {
  const sesion = useSesion();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useStatusBar('light');

  const [salon, setSalon] = useState<PublicSalon | null>(null);
  const mercado = mercadoDe(salon?.currency);
  const hoy = hoyEn(mercado.timeZone);
  const [fecha, setFecha] = useState<string | null>(null);
  const dia = fecha ?? hoy;
  const [citas, setCitas] = useState<CitaStaff[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<number | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const gestiona = canManageAgenda(sesion?.user.roles);
  // Igual que el API: una estilista sin rol de agenda solo ve sus propias citas.
  const soloSuyas = !gestiona && isStylist(sesion?.user.roles);
  const tema = salon?.theme ?? FLORECE_THEME;
  const slug = sesion?.tenant.slug;

  useEffect(() => {
    if (!slug) return;
    void loadPublicSalon(slug).then(setSalon).catch(() => setSalon(null));
  }, [slug]);

  const refrescar = useCallback(async () => {
    if (!slug) return;
    setCargando(true);
    setError(null);
    try {
      setCitas(await cargarCitas(dia));
    } catch (err) {
      if (err instanceof SesionVencida) return;
      setError(err instanceof Error ? err.message : 'No se pudo cargar la agenda');
    } finally {
      setCargando(false);
    }
  }, [slug, dia]);

  useFocusEffect(
    useCallback(() => {
      void refrescar();
    }, [refrescar]),
  );

  const visibles = useMemo(
    () =>
      (citas ?? [])
        .filter((cita) => filtro == null || cita.employeeId === filtro)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [citas, filtro],
  );
  const activas = visibles.filter((cita) => cita.status.name !== 'Cancelado');

  if (sesion === undefined) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator color={color.gold} />
      </View>
    );
  }
  if (!sesion) return <Redirect href="/salon/entrar" />;


  const etiquetaDia =
    dia === hoy ? 'Hoy' : dia === sumarDias(hoy, 1) ? 'Mañana' : dia === sumarDias(hoy, -1) ? 'Ayer' : null;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + (gestiona ? 110 : 40) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={cargando && citas != null} onRefresh={() => void refrescar()} tintColor={color.gold} />
        }
      >
        <Hero
          theme={salon?.theme}
          logo={salon?.logo}
          eyebrow={sesion.tenant.name}
          title={soloSuyas ? 'Mi agenda' : 'Agenda'}
          onBack={router.canGoBack() ? () => router.back() : undefined}
          right={
            <Pressable
              onPress={() => setMenuAbierto(true)}
              accessibilityRole="button"
              accessibilityLabel="Cuenta"
              style={[heroStyles.circulo, styles.avatar, { borderColor: tema.heroMuted }]}
            >
              <Text style={[styles.avatarTexto, { color: tema.accentOnHero }]}>{sesion.user.name.charAt(0).toUpperCase()}</Text>
            </Pressable>
          }
        >
          <View style={styles.dias}>
            <Pressable
              onPress={() => setFecha(sumarDias(dia, -1))}
              accessibilityRole="button"
              accessibilityLabel="Día anterior"
              hitSlop={10}
              style={[heroStyles.circulo, { borderColor: tema.heroMuted }]}
            >
              <Text style={[styles.flecha, { color: tema.heroText }]}>‹</Text>
            </Pressable>
            <Pressable
              onPress={() => setFecha(null)}
              accessibilityRole="button"
              accessibilityHint="Vuelve a hoy"
              style={styles.diaCentro}
            >
              <Text style={[styles.diaEtiqueta, { color: tema.accentOnHero }]}>{(etiquetaDia ?? 'Día').toUpperCase()}</Text>
              <Text style={[styles.diaTexto, { color: tema.heroText }]}>{fechaLarga(dia, mercado.timeZone, mercado.utcOffset)}</Text>
            </Pressable>
            <Pressable
              onPress={() => setFecha(sumarDias(dia, 1))}
              accessibilityRole="button"
              accessibilityLabel="Día siguiente"
              hitSlop={10}
              style={[heroStyles.circulo, { borderColor: tema.heroMuted }]}
            >
              <Text style={[styles.flecha, { color: tema.heroText }]}>›</Text>
            </Pressable>
          </View>
        </Hero>

        <Sheet>
          {gestiona && salon && salon.employees.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filtrosScroll}
              contentContainerStyle={styles.filtros}
            >
              {[{ id: null as number | null, name: 'Todo el equipo' }, ...salon.employees].map((persona) => {
                const activo = filtro === persona.id;
                return (
                  <Pressable
                    key={persona.id ?? 'todos'}
                    onPress={() => setFiltro(persona.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activo }}
                    style={[styles.filtro, activo && styles.filtroActivo]}
                  >
                    <Text style={[styles.filtroTexto, activo && styles.filtroTextoActivo]}>
                      {persona.id == null ? persona.name : persona.name.split(' ')[0]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          {citas != null && activas.length > 0 ? (
            <Text style={styles.resumen}>
              {activas.length === 0
                ? 'Sin citas'
                : activas.length === 1
                  ? '1 cita'
                  : `${activas.length} citas`}
              {activas.length > 0
                ? ` · ${duracionTexto(activas.reduce((m, c) => m + minutosDe(c.endTime) - minutosDe(c.startTime), 0))} de trabajo`
                : ''}
            </Text>
          ) : null}

          {citas == null && cargando ? <ActivityIndicator color={color.gold} /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {citas != null && visibles.length === 0 && !error ? (
            <View style={styles.vacio}>
              <Text style={styles.vacioTitulo}>Día libre</Text>
              <Text style={styles.vacioTexto}>No hay citas agendadas para este día.</Text>
            </View>
          ) : null}

          {visibles.map((cita) => (
            <FilaCita
              key={cita.id}
              cita={cita}
              mostrarProfesional={gestiona && filtro == null}
              onPress={() => router.push(`/salon/cita/${cita.id}`)}
            />
          ))}
        </Sheet>
      </ScrollView>
      <StatusStrip theme={salon?.theme} />
      <Dialog
        visible={menuAbierto}
        eyebrow={sesion.tenant.name}
        title={sesion.user.name}
        message={sesion.user.email}
        onClose={() => setMenuAbierto(false)}
        actions={[
          { label: 'Ir a la app de clientas', onPress: () => router.replace('/') },
          { label: 'Cerrar sesión', tone: 'danger', onPress: () => void cerrarSesion() },
        ]}
      />

      {gestiona ? (
        <View style={[styles.barra, { paddingBottom: insets.bottom + 14 }]}>
          <PrimaryButton
            label="Nueva cita"
            tone="gold"
            colors={salon?.theme.custom ? { bg: salon.theme.button, text: salon.theme.buttonText } : undefined}
            onPress={() => router.push({ pathname: '/salon/nueva', params: { fecha: dia } })}
          />
        </View>
      ) : null}
    </View>
  );
}

function FilaCita({
  cita,
  mostrarProfesional,
  onPress,
}: {
  cita: CitaStaff;
  mostrarProfesional: boolean;
  onPress?: () => void;
}) {
  const tono = tonoEstado(cita.status.color);
  const cancelada = cita.status.name === 'Cancelado';
  const servicios = cita.services.map((s) => s.service.item.name).join(', ');
  const contenido = (
    <View style={[styles.fila, cancelada && styles.filaCancelada]}>
      <View style={styles.horaCol}>
        <Text style={styles.hora}>{horaDe(cita.startTime)}</Text>
        <Text style={styles.horaFin}>{horaDe(cita.endTime)}</Text>
      </View>
      <View style={[styles.tarjeta, { borderLeftColor: tono.texto }]}>
        <View style={styles.tarjetaArriba}>
          <Text style={[styles.cliente, cancelada && styles.tachado]} numberOfLines={1}>
            {cita.name}
          </Text>
          <Text style={[styles.estado, { backgroundColor: tono.fondo, color: tono.texto }]}>
            {cita.status.name}
          </Text>
        </View>
        <Text style={styles.servicios} numberOfLines={2}>
          {servicios || 'Servicio'}
        </Text>
        {mostrarProfesional && cita.employee ? (
          <Text style={styles.profesional}>con {cita.employee.name}</Text>
        ) : null}
      </View>
    </View>
  );
  if (!onPress) return contenido;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => pressed && { opacity: 0.85 }}>
      {contenido}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.base },
  scroll: { flexGrow: 1 },
  avatar: { backgroundColor: 'rgba(196,165,116,0.14)' },
  avatarTexto: { fontFamily: font.display, fontSize: 20, color: color.goldLight, marginTop: -2 },
  dias: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 },
  flecha: { color: color.cream, fontSize: 24, marginTop: -3 },
  diaCentro: { flex: 1, alignItems: 'center' },
  diaEtiqueta: { fontFamily: font.medium, fontSize: 11, letterSpacing: 2, color: color.gold },
  diaTexto: { fontFamily: font.displayItalic, fontSize: 19, color: color.cream },
  filtrosScroll: { marginHorizontal: -space.screen, flexGrow: 0 },
  filtros: { gap: 8, paddingHorizontal: space.screen, alignItems: 'flex-start' },
  filtro: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.card,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  filtroActivo: { backgroundColor: color.ink, borderColor: color.ink },
  filtroTexto: { fontFamily: font.medium, fontSize: 14, color: color.ink },
  filtroTextoActivo: { color: color.goldLight },
  resumen: { fontFamily: font.medium, fontSize: 12, letterSpacing: 1.2, color: color.goldDeep },
  error: { color: color.danger, fontSize: 14, fontFamily: font.body },
  vacio: { alignItems: 'center', paddingVertical: 48, gap: 4 },
  vacioTitulo: { fontFamily: font.display, fontSize: 28, color: color.ink },
  vacioTexto: { fontFamily: font.body, fontSize: 14, color: color.muted },
  fila: { flexDirection: 'row', gap: 12 },
  filaCancelada: { opacity: 0.55 },
  horaCol: { width: 52, paddingTop: 14, alignItems: 'flex-end' },
  hora: { fontFamily: font.bold, fontSize: 15, color: color.ink },
  horaFin: { fontFamily: font.body, fontSize: 12, color: color.muted },
  tarjeta: {
    flex: 1,
    backgroundColor: color.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: color.line,
    borderLeftWidth: 3,
    padding: 14,
    gap: 3,
    ...shadow,
  },
  tarjetaArriba: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cliente: { flex: 1, fontFamily: font.display, fontSize: 21, color: color.ink },
  tachado: { textDecorationLine: 'line-through' },
  estado: {
    fontFamily: font.medium,
    fontSize: 11,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  servicios: { fontFamily: font.body, fontSize: 13, color: color.ink },
  profesional: { fontFamily: font.body, fontSize: 13, color: color.muted },
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
