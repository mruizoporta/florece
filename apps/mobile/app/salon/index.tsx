import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, useFocusEffect, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { canManageAgenda, canManageCaja, canManageSalon, isStylist, type FeatureKey, type PlanFeatures } from '@florece/shared';
import { Dialog } from '../../src/components/Dialog';
import { Hero, Sheet, StatusStrip, heroStyles } from '../../src/components/Hero';
import { SectionTitle } from '../../src/components/ui';
import { cargarFunciones, cargarResumen, type ResumenDia } from '../../src/lib/caja';
import { dinero } from '../../src/lib/format';
import { loadPublicSalon, type PublicSalon } from '../../src/lib/salon';
import { FLORECE_THEME } from '../../src/lib/brand';
import { cerrarSesion, useSesion } from '../../src/lib/staff';
import { useStatusBar } from '../../src/lib/statusBar';
import { color, font, shadow } from '../../src/theme';

type Roles = string[] | undefined;
type Seccion = {
  href: Href;
  titulo: string | ((r: Roles) => string);
  detalle: string;
  grupo: 'Día a día' | 'Clientas' | 'Negocio';
  puede: (r: Roles) => boolean;
  funcion?: FeatureKey;
};

const todos = () => true;
const recepcionOCaja = (r: Roles) => canManageAgenda(r) || canManageCaja(r);

// Mismas secciones y permisos que el menú de la web (AdminSidebar) y el API.
const SECCIONES: Seccion[] = [
  { href: '/salon/agenda', titulo: 'Agenda', detalle: 'Citas del día', grupo: 'Día a día', puede: todos },
  { href: '/salon/cobrar', titulo: 'Cobrar', detalle: 'Venta nueva', grupo: 'Día a día', puede: canManageCaja, funcion: 'pos' },
  { href: '/salon/ventas', titulo: 'Ventas', detalle: 'Tickets y cuentas abiertas', grupo: 'Día a día', puede: canManageCaja, funcion: 'pos' },
  { href: '/salon/caja', titulo: 'Caja', detalle: 'Apertura y cierre', grupo: 'Día a día', puede: canManageCaja, funcion: 'accounting' },
  { href: '/salon/clientes', titulo: 'Clientas', detalle: 'Fichas e historial', grupo: 'Clientas', puede: recepcionOCaja, funcion: 'customers' },
  { href: '/salon/vales', titulo: 'Bonos', detalle: 'Gift cards y paquetes', grupo: 'Clientas', puede: canManageCaja, funcion: 'pos' },
  { href: '/salon/inventario', titulo: 'Inventario', detalle: 'Stock y ajustes', grupo: 'Negocio', puede: canManageCaja, funcion: 'pos' },
  { href: '/salon/gastos', titulo: 'Gastos', detalle: 'Registrar egresos', grupo: 'Negocio', puede: canManageCaja, funcion: 'accounting' },
  {
    href: '/salon/nomina',
    titulo: (r) => (canManageCaja(r) ? 'Nómina' : 'Mis comisiones'),
    detalle: 'Comisiones y pagos',
    grupo: 'Negocio',
    puede: (r) => canManageCaja(r) || isStylist(r),
    funcion: 'accounting',
  },
  { href: '/salon/contabilidad', titulo: 'Contabilidad', detalle: 'Ingresos y utilidad', grupo: 'Negocio', puede: canManageCaja, funcion: 'accounting' },
];

export default function InicioSalon() {
  const sesion = useSesion();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useStatusBar('light');

  const [salon, setSalon] = useState<PublicSalon | null>(null);
  const [funciones, setFunciones] = useState<PlanFeatures | null | undefined>(undefined);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [resumen, setResumen] = useState<ResumenDia | null>(null);

  const roles = sesion?.user.roles;
  const slug = sesion?.tenant.slug;

  useEffect(() => {
    if (!slug) return;
    void loadPublicSalon(slug).then(setSalon).catch(() => setSalon(null));
    void cargarFunciones().then(setFunciones);
  }, [slug]);

  // El API solo da el resumen a Admin, Recepción y Caja; se refresca al volver al inicio.
  const veResumen = canManageAgenda(roles) || canManageCaja(roles);
  useFocusEffect(
    useCallback(() => {
      if (slug && veResumen) void cargarResumen().then(setResumen).catch(() => setResumen(null));
    }, [slug, veResumen]),
  );

  if (sesion === undefined || (sesion && funciones === undefined)) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator color={color.gold} />
      </View>
    );
  }
  if (!sesion) return <Redirect href="/salon/entrar" />;
  const visibles = SECCIONES.filter((s) => s.puede(roles) && (!s.funcion || !funciones || funciones[s.funcion]));
  // Quien solo tiene la agenda entra directo a ella.
  if (visibles.length <= 1) return <Redirect href="/salon/agenda" />;
  const grupos = [...new Set(visibles.map((s) => s.grupo))];
  const tema = salon?.theme ?? FLORECE_THEME;
  const nombre = sesion.user.name.split(' ')[0];
  const rol = canManageSalon(roles)
    ? 'Administración'
    : [canManageAgenda(roles) && 'Recepción', canManageCaja(roles) && 'Caja', isStylist(roles) && 'Estilista'].filter(Boolean).join(' · ');

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        <Hero
          theme={salon?.theme}
          logo={salon?.logo}
          eyebrow={sesion.tenant.name}
          title={`Hola, ${nombre}`}
          subtitle={rol}
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
        />
        <Sheet>
          {resumen ? (
            <View style={styles.grupo}>
              <SectionTitle>Hoy</SectionTitle>
              <Pressable
                onPress={canManageCaja(roles) ? () => router.push('/salon/ventas') : undefined}
                disabled={!canManageCaja(roles)}
                accessibilityRole={canManageCaja(roles) ? 'button' : 'summary'}
                style={({ pressed }) => [styles.panel, { backgroundColor: tema.hero }, pressed && styles.presionada]}
              >
                <View style={[styles.panelAro, { borderColor: tema.accentOnHero }]} />
                <Text style={[styles.panelFecha, { color: tema.accentOnHero }]}>{fechaHoy().toUpperCase()}</Text>
                <Text style={[styles.panelEtiqueta, { color: tema.heroMuted }]}>Ingresos del día</Text>
                <Text style={[styles.panelMonto, { color: tema.heroText }]} numberOfLines={1} adjustsFontSizeToFit>
                  {dinero(salon?.currency ?? 'C$', resumen.incomeToday)}
                </Text>
              </Pressable>
              <View style={styles.datos}>
                <Dato etiqueta="Citas" valor={resumen.appointmentsToday} onPress={() => router.push('/salon/agenda')} />
                <View style={styles.separador} />
                <Dato etiqueta="En espera" valor={resumen.waiting} destacar onPress={() => router.push('/salon/agenda')} />
                <View style={styles.separador} />
                <Dato etiqueta="Pendientes" valor={resumen.pending} onPress={() => router.push('/salon/agenda')} />
              </View>
              <Top titulo="Servicios agendados" filas={resumen.topServices} acento={tema.custom ? tema.button : color.gold} />
              <Top titulo="Lo más vendido" filas={resumen.topProducts} acento={tema.custom ? tema.button : color.gold} />
            </View>
          ) : null}
          {grupos.map((grupo) => (
            <View key={grupo} style={styles.grupo}>
              <SectionTitle>{grupo}</SectionTitle>
              <View style={styles.rejilla}>
                {visibles
                  .filter((s) => s.grupo === grupo)
                  .map((s) => (
                    <Pressable
                      key={String(s.href)}
                      onPress={() => router.push(s.href)}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.tarjeta, pressed && styles.presionada]}
                    >
                      <View style={[styles.marca, { backgroundColor: tema.custom ? tema.button : color.gold }]} />
                      <Text style={styles.titulo}>{typeof s.titulo === 'function' ? s.titulo(roles) : s.titulo}</Text>
                      <Text style={styles.detalle}>{s.detalle}</Text>
                    </Pressable>
                  ))}
              </View>
            </View>
          ))}
          <Text style={styles.nota}>La configuración del salón, el equipo y los reportes completos están en floreceapp.com.</Text>
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
    </View>
  );
}

// Ej.: «jueves 6 de noviembre».
const fechaHoy = () => new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });

function Dato({ etiqueta, valor, destacar, onPress }: { etiqueta: string; valor: number; destacar?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${etiqueta}: ${valor}`}
      style={({ pressed }) => [styles.dato, pressed && styles.presionada]}
    >
      <Text style={[styles.datoValor, destacar && valor > 0 && styles.datoValorActivo]}>{valor}</Text>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
    </Pressable>
  );
}

function Top({ titulo, filas, acento }: { titulo: string; filas: ResumenDia['topServices']; acento: string }) {
  if (filas.length === 0) return null;
  const top = filas.slice(0, 3);
  const max = Math.max(...top.map((f) => f.quantity), 1);
  return (
    <View style={styles.top}>
      <Text style={styles.topTitulo}>{titulo}</Text>
      {top.map((f, i) => (
        <View key={f.name} style={styles.topFila}>
          <View style={styles.topLinea}>
            <Text style={styles.topPuesto}>{i + 1}</Text>
            <Text style={styles.topNombre} numberOfLines={1}>{f.name}</Text>
            <Text style={styles.topCantidad}>{f.quantity}</Text>
          </View>
          <View style={styles.barraFondo}>
            <View style={[styles.barra, { width: `${(f.quantity / max) * 100}%`, backgroundColor: acento }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.base },
  scroll: { flexGrow: 1 },
  avatar: { backgroundColor: 'rgba(196,165,116,0.14)' },
  avatarTexto: { fontFamily: font.display, fontSize: 20, color: color.goldLight, marginTop: -2 },
  grupo: { gap: 10 },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tarjeta: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: color.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: color.line,
    padding: 16,
    gap: 4,
    ...shadow,
  },
  presionada: { opacity: 0.85 },
  marca: { width: 24, height: 3, borderRadius: 2, marginBottom: 6 },
  titulo: { fontFamily: font.display, fontSize: 24, color: color.ink },
  detalle: { fontFamily: font.body, fontSize: 13, color: color.muted },
  panel: { borderRadius: 24, padding: 20, paddingTop: 18, overflow: 'hidden', gap: 2, ...shadow },
  panelAro: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 1, opacity: 0.25, right: -60, top: -70 },
  panelFecha: { fontFamily: font.bold, fontSize: 11, letterSpacing: 1.4, marginBottom: 10 },
  panelEtiqueta: { fontFamily: font.body, fontSize: 14 },
  panelMonto: { fontFamily: font.display, fontSize: 44, lineHeight: 50 },
  datos: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: color.line,
    paddingVertical: 6,
    ...shadow,
  },
  separador: { width: 1, alignSelf: 'stretch', marginVertical: 10, backgroundColor: color.line },
  dato: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  datoValor: { fontFamily: font.display, fontSize: 32, lineHeight: 38, color: color.ink },
  datoValorActivo: { color: color.goldDeep },
  datoEtiqueta: { fontFamily: font.medium, fontSize: 12, color: color.muted },
  top: { backgroundColor: color.card, borderRadius: 20, borderWidth: 1, borderColor: color.line, padding: 16, gap: 12, ...shadow },
  topTitulo: { fontFamily: font.display, fontSize: 20, color: color.ink },
  topFila: { gap: 6 },
  topLinea: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  topPuesto: { fontFamily: font.bold, fontSize: 12, color: color.goldDeep, width: 12 },
  topNombre: { flex: 1, fontFamily: font.body, fontSize: 15, color: color.ink },
  topCantidad: { fontFamily: font.bold, fontSize: 15, color: color.ink },
  barraFondo: { height: 4, borderRadius: 2, backgroundColor: color.warm, marginLeft: 22 },
  barra: { height: 4, borderRadius: 2 },
  nota: { fontFamily: font.body, fontSize: 13, color: color.muted, textAlign: 'center', marginTop: 8 },
});
