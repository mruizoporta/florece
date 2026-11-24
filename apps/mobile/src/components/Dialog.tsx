import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, font, space } from '../theme';

export type DialogAction = {
  label: string;
  tone?: 'primary' | 'danger' | 'plain';
  onPress: () => void;
};

/** Hoja inferior con el estilo de la app, en lugar del Alert del sistema. */
export function Dialog({
  visible,
  eyebrow,
  title,
  message,
  actions,
  onClose,
}: {
  visible: boolean;
  eyebrow?: string;
  title: string;
  message?: string;
  actions: DialogAction[];
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.fondo} onPress={onClose} accessibilityLabel="Cerrar" />
      <View style={[styles.hoja, { paddingBottom: insets.bottom + 18 }]} accessibilityViewIsModal>
        <View style={styles.asa} />
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
        <Text style={styles.titulo}>{title}</Text>
        {message ? <Text style={styles.mensaje}>{message}</Text> : null}
        <View style={styles.acciones}>
          {actions.map((accion) => {
            const tono = accion.tone ?? 'plain';
            return (
              <Pressable
                key={accion.label}
                onPress={() => {
                  onClose();
                  accion.onPress();
                }}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.boton,
                  tono === 'primary' && styles.botonPrimario,
                  tono === 'danger' && styles.botonPeligro,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text
                  style={[
                    styles.botonTexto,
                    tono === 'primary' && styles.textoPrimario,
                    tono === 'danger' && styles.textoPeligro,
                  ]}
                >
                  {accion.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(22,20,18,0.55)' },
  hoja: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: color.base,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: space.screen,
    paddingTop: 12,
  },
  asa: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.line,
    marginBottom: 18,
  },
  eyebrow: { fontFamily: font.medium, fontSize: 11, letterSpacing: 2, color: color.goldDeep },
  titulo: { fontFamily: font.display, fontSize: 30, lineHeight: 36, color: color.ink, marginTop: 2 },
  mensaje: { fontFamily: font.body, fontSize: 15, lineHeight: 22, color: color.muted, marginTop: 4 },
  acciones: { gap: 10, marginTop: 22 },
  boton: {
    minHeight: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.card,
  },
  botonPrimario: { backgroundColor: color.ink, borderColor: color.ink },
  botonPeligro: { backgroundColor: '#8a3530', borderColor: '#8a3530' },
  botonTexto: { fontFamily: font.bold, fontSize: 16, color: color.ink },
  textoPrimario: { color: color.cream },
  textoPeligro: { color: '#fff7f2' },
});
