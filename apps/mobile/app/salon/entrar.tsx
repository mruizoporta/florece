import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Field, PrimaryButton, SectionTitle } from '../../src/components/ui';
import { Hero, Sheet, StatusStrip } from '../../src/components/Hero';
import { iniciarSesion } from '../../src/lib/staff';
import { useStatusBar } from '../../src/lib/statusBar';
import { color, font } from '../../src/theme';

export default function EntrarSalon() {
  const router = useRouter();
  useStatusBar('light');
  const [codigo, setCodigo] = useState('');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salones, setSalones] = useState<{ slug: string; name: string }[]>([]);

  async function entrar(slug = codigo.trim().toLowerCase()) {
    if (!correo.trim() || !clave) {
      setError('Escribí tu correo y tu contraseña.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const resultado = await iniciarSesion({
        email: correo.trim().toLowerCase(),
        password: clave,
        tenantSlug: slug || undefined,
      });
      if (resultado.ok) {
        setClave('');
        router.replace('/salon');
      } else {
        setSalones(resultado.salons);
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : '';
      setError(
        /invalid credentials/i.test(mensaje)
          ? 'El correo o la contraseña no coinciden.'
          : mensaje || 'No se pudo entrar.',
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Hero
          eyebrow="Para el salón"
          title="Tu agenda, en el bolsillo"
          subtitle="Entrá con tu usuario de Florece."
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
        <Sheet>
          {salones.length > 0 ? (
            <>
              <SectionTitle>¿A qué salón entrás?</SectionTitle>
              {salones.map((salon) => (
                <Card
                  key={salon.slug}
                  title={salon.name}
                  subtitle={salon.slug}
                  onPress={() => void entrar(salon.slug)}
                />
              ))}
              <Pressable onPress={() => setSalones([])} accessibilityRole="button" style={styles.link}>
                <Text style={styles.linkTexto}>Volver</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Field
                label="Correo"
                value={correo}
                onChangeText={setCorreo}
                placeholder="tu@correo.com"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              <Field
                label="Contraseña"
                value={clave}
                onChangeText={setClave}
                placeholder="••••••••"
                autoCapitalize="none"
                secureTextEntry
                autoComplete="password"
              />
              <Field
                label="Código del salón (opcional)"
                value={codigo}
                onChangeText={setCodigo}
                placeholder="Si trabajás en más de uno"
                autoCapitalize="none"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.boton}>
                <PrimaryButton label="Entrar" onPress={() => void entrar()} loading={enviando} />
              </View>
              <Pressable
                onPress={() => void Linking.openURL('https://floreceapp.com/olvide-contrasena')}
                accessibilityRole="link"
                style={styles.link}
              >
                <Text style={styles.linkTexto}>¿Olvidaste tu contraseña?</Text>
              </Pressable>
            </>
          )}
        </Sheet>
      </ScrollView>
      <StatusStrip />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.base },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  boton: { marginTop: 6 },
  error: { color: color.danger, fontSize: 14, fontFamily: font.body },
  link: { alignItems: 'center', paddingVertical: 10 },
  linkTexto: { fontFamily: font.bold, fontSize: 15, color: color.goldDeep },
});
