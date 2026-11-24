import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { normalizeWaDigits } from '@florece/shared';
import { Hero, Sheet, StatusStrip } from '../../../src/components/Hero';
import { SectionTitle } from '../../../src/components/ui';
import { cargarCliente, type FichaCliente } from '../../../src/lib/clientes';
import { fechaLarga, horaDe, mercadoDe } from '../../../src/lib/format';
import { loadPublicSalon, type PublicSalon } from '../../../src/lib/salon';
import { SesionVencida, useSesion } from '../../../src/lib/staff';
import { useStatusBar } from '../../../src/lib/statusBar';
import { color, font, shadow } from '../../../src/theme';

export default function ClienteDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const sesion = useSesion();
  const insets = useSafeAreaInsets();
  useStatusBar('light');

  const [salon, setSalon] = useState<PublicSalon | null>(null);
  const [ficha, setFicha] = useState<FichaCliente | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mercado = mercadoDe(salon?.currency);
  const slug = sesion?.tenant.slug;

  useFocusEffect(
    useCallback(() => {
      if (!slug || !id) return;
      void loadPublicSalon(slug).then(setSalon).catch(() => setSalon(null));
      void cargarCliente(id)
        .then(setFicha)
        .catch((err: unknown) => {
          if (!(err instanceof SesionVencida)) setError(err instanceof Error ? err.message : 'No se pudo cargar la clienta');
        });
    }, [slug, id]),
  );

  const whatsapp = ficha?.phone ? normalizeWaDigits(ficha.phone, mercado.phoneCountry) : null;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        <Hero
          theme={salon?.theme}
          eyebrow="Clienta"
          title={ficha?.name ?? ' '}
          subtitle={ficha ? `${ficha.appointmentsCount} ${ficha.appointmentsCount === 1 ? 'cita' : 'citas'}` : null}
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/salon/clientes'))}
        />
        <Sheet>
          {!ficha && !error ? <ActivityIndicator color={color.gold} /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {ficha ? (
            <>
              {ficha.phone ? (
                <View style={styles.contacto}>
                  <Boton label="Llamar" onPress={() => void Linking.openURL(`tel:${ficha.phone}`)} />
                  {whatsapp ? <Boton label="WhatsApp" onPress={() => void Linking.openURL(`https://wa.me/${whatsapp}`)} /> : null}
                </View>
              ) : null}
              <View style={styles.tarjeta}>
                <Fila etiqueta="Teléfono" valor={ficha.phone ?? '—'} />
                <Fila etiqueta="Correo" valor={ficha.email ?? '—'} />
              </View>
              {ficha.allergies ? (
                <View style={styles.alerta}>
                  <Text style={styles.alertaTitulo}>Alergias y cuidados</Text>
                  <Text style={styles.texto}>{ficha.allergies}</Text>
                </View>
              ) : null}

              <SectionTitle>Historial de citas</SectionTitle>
              {ficha.appointments.length === 0 ? <Text style={styles.meta}>Sin citas todavía.</Text> : null}
              {ficha.appointments.map((c) => (
                <View key={c.id} style={styles.tarjeta}>
                  <View style={styles.fila}>
                    <Text style={styles.valor}>
                      {fechaLarga(c.startTime, mercado.timeZone, mercado.utcOffset)} · {horaDe(c.startTime)}
                    </Text>
                    {c.status ? <Text style={styles.meta}>{c.status.name}</Text> : null}
                  </View>
                  <Text style={styles.texto}>{c.services.map((s) => s.service.item.name).join(', ') || 'Servicio'}</Text>
                  {c.employee ? <Text style={styles.meta}>con {c.employee.name}</Text> : null}
                </View>
              ))}
            </>
          ) : null}
        </Sheet>
      </ScrollView>
      <StatusStrip theme={salon?.theme} />
    </View>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.fila}>
      <Text style={styles.meta}>{etiqueta}</Text>
      <Text style={styles.valor} numberOfLines={1}>{valor}</Text>
    </View>
  );
}

function Boton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.boton, pressed && { opacity: 0.8 }]}>
      <Text style={styles.botonTexto}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  scroll: { flexGrow: 1 },
  contacto: { flexDirection: 'row', gap: 10 },
  boton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: color.ink,
    paddingVertical: 12,
  },
  botonTexto: { fontFamily: font.bold, fontSize: 15, color: color.ink },
  tarjeta: {
    backgroundColor: color.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: color.line,
    padding: 16,
    gap: 6,
    ...shadow,
  },
  alerta: { backgroundColor: '#f6e9d3', borderRadius: 14, padding: 14, gap: 4 },
  alertaTitulo: { fontFamily: font.bold, fontSize: 14, color: color.goldDeep },
  fila: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  valor: { flexShrink: 1, fontFamily: font.bold, fontSize: 14, color: color.ink },
  texto: { fontFamily: font.body, fontSize: 14, color: color.ink },
  meta: { fontFamily: font.body, fontSize: 13, color: color.muted },
  error: { color: color.danger, fontSize: 14, fontFamily: font.body },
});
