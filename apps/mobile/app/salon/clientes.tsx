import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hero, Sheet, StatusStrip } from '../../src/components/Hero';
import { Field, SearchIcon } from '../../src/components/ui';
import { buscarClientes, type Cliente } from '../../src/lib/clientes';
import { loadPublicSalon, type PublicSalon } from '../../src/lib/salon';
import { SesionVencida, useSesion } from '../../src/lib/staff';
import { useStatusBar } from '../../src/lib/statusBar';
import { color, font, shadow } from '../../src/theme';

export default function Clientes() {
  const router = useRouter();
  const sesion = useSesion();
  const insets = useSafeAreaInsets();
  useStatusBar('light');

  const [salon, setSalon] = useState<PublicSalon | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const slug = sesion?.tenant.slug;

  useEffect(() => {
    if (slug) void loadPublicSalon(slug).then(setSalon).catch(() => setSalon(null));
  }, [slug]);

  const cargar = useCallback(
    async (texto: string) => {
      if (!slug) return;
      setError(null);
      try {
        setClientes(await buscarClientes(texto));
      } catch (err) {
        if (!(err instanceof SesionVencida)) setError(err instanceof Error ? err.message : 'No se pudieron cargar las clientas');
      }
    },
    [slug],
  );

  // Espera a que se deje de escribir antes de buscar.
  useEffect(() => {
    const t = setTimeout(() => void cargar(busqueda), busqueda ? 300 : 0);
    return () => clearTimeout(t);
  }, [busqueda, cargar]);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Hero theme={salon?.theme} eyebrow={sesion?.tenant.name} title="Clientas" onBack={() => router.back()} />
        <Sheet>
          <Field value={busqueda} onChangeText={setBusqueda} placeholder="Nombre, correo o teléfono" icon={<SearchIcon />} />
          {clientes == null && !error ? <ActivityIndicator color={color.gold} /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {clientes != null && clientes.length === 0 ? (
            <Text style={styles.meta}>{busqueda ? `Nadie coincide con «${busqueda}».` : 'Todavía no hay clientas.'}</Text>
          ) : null}
          {(clientes ?? []).map((c) => (
            <Pressable
              key={c.id}
              onPress={() => router.push(`/salon/cliente/${c.id}`)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.fila, pressed && { opacity: 0.85 }]}
            >
              <View style={styles.textos}>
                <Text style={styles.nombre} numberOfLines={1}>{c.name}</Text>
                <Text style={styles.meta} numberOfLines={1}>{c.phone || c.email || 'Sin contacto'}</Text>
              </View>
              <Text style={styles.citas}>
                {c.appointmentsCount} {c.appointmentsCount === 1 ? 'cita' : 'citas'}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
          {clientes != null && clientes.length >= 50 ? <Text style={styles.meta}>Se muestran las 50 más recientes. Buscá para encontrar otras.</Text> : null}
        </Sheet>
      </ScrollView>
      <StatusStrip theme={salon?.theme} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  scroll: { flexGrow: 1 },
  fila: {
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
  textos: { flex: 1, gap: 2 },
  nombre: { fontFamily: font.display, fontSize: 20, color: color.ink },
  citas: { fontFamily: font.medium, fontSize: 13, color: color.goldDeep },
  chevron: { fontSize: 24, color: color.gold, marginTop: -3 },
  meta: { fontFamily: font.body, fontSize: 13, color: color.muted },
  error: { color: color.danger, fontSize: 14, fontFamily: font.body },
});
