import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AppState, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { revisarVersion, type EstadoVersion } from '../lib/version';
import { color, font, space } from '../theme';
import { PrimaryButton } from './ui';

/**
 * Revisa la versión al abrir la app y cada vez que vuelve al frente.
 * - Obligatoria: tapa toda la app hasta que actualicen.
 * - Sugerida: aviso que se puede cerrar (una vez por sesión).
 */
export function UpdateGate({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoVersion>({ tipo: 'al-dia' });
  const [cerrada, setCerrada] = useState(false);

  const revisar = useCallback(() => {
    void revisarVersion().then(setEstado);
  }, []);

  useEffect(() => {
    revisar();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') revisar();
    });
    return () => sub.remove();
  }, [revisar]);

  const abrirTienda = () => {
    if (estado.tipo !== 'al-dia') void Linking.openURL(estado.storeUrl);
  };

  if (estado.tipo === 'obligatoria') {
    return (
      <View style={styles.bloqueo}>
        <Text style={styles.marca}>Florece</Text>
        <Text style={styles.titulo}>Hay una versión nueva</Text>
        <Text style={styles.texto}>
          Para seguir usando Florece, actualizá la app a la versión {estado.nueva}.
        </Text>
        <View style={styles.boton}>
          <PrimaryButton label="Actualizar" tone="gold" onPress={abrirTienda} />
        </View>
      </View>
    );
  }

  return (
    <>
      {children}
      <Modal
        visible={estado.tipo === 'sugerida' && !cerrada}
        transparent
        animationType="fade"
        onRequestClose={() => setCerrada(true)}
      >
        <View style={styles.fondo}>
          <View style={styles.tarjeta}>
            <Text style={styles.tituloTarjeta}>Hay una versión nueva</Text>
            <Text style={styles.textoTarjeta}>
              Actualizá Florece para tener lo último y las correcciones.
            </Text>
            <PrimaryButton label="Actualizar" onPress={abrirTienda} />
            <Pressable onPress={() => setCerrada(true)} accessibilityRole="button" style={styles.despues}>
              <Text style={styles.despuesTexto}>Después</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bloqueo: {
    flex: 1,
    backgroundColor: color.ink,
    justifyContent: 'center',
    paddingHorizontal: space.screen * 1.5,
  },
  marca: { fontFamily: font.display, fontSize: 44, color: color.cream, marginBottom: 24 },
  titulo: { fontFamily: font.display, fontSize: 30, color: color.gold, marginBottom: 12 },
  texto: { fontFamily: font.body, fontSize: 16, lineHeight: 24, color: color.cream, marginBottom: 32 },
  boton: { alignSelf: 'stretch' },
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(22,20,18,0.55)',
    justifyContent: 'center',
    padding: space.screen,
  },
  tarjeta: { backgroundColor: color.card, borderRadius: 24, padding: 24, gap: 14 },
  tituloTarjeta: { fontFamily: font.display, fontSize: 26, color: color.ink },
  textoTarjeta: { fontFamily: font.body, fontSize: 15, lineHeight: 22, color: color.muted },
  despues: { alignSelf: 'center', paddingVertical: 8 },
  despuesTexto: { fontFamily: font.medium, fontSize: 15, color: color.muted },
});
