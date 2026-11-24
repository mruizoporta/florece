import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FLORECE_THEME, type SalonTheme } from '../lib/brand';
import { color, font, space } from '../theme';

/** Cabecera oscura con aro dorado, usada por las pantallas del salón. */
export function Hero({
  eyebrow,
  title,
  subtitle,
  onBack,
  right,
  children,
  theme = FLORECE_THEME,
  logo,
}: {
  theme?: SalonTheme;
  logo?: string | null;
  eyebrow?: string;
  title: string;
  subtitle?: string | null;
  onBack?: () => void;
  right?: ReactNode;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.hero, { paddingTop: insets.top + 12, backgroundColor: theme.hero }]}>
      <View style={[styles.aro, { borderColor: theme.accentOnHero }]} />
      {onBack || right || logo ? (
        <View style={styles.fila}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Volver"
              hitSlop={12}
              style={[styles.circulo, { borderColor: theme.heroMuted }]}
            >
              <Text style={[styles.volverTexto, { color: theme.heroText }]}>‹</Text>
            </Pressable>
          ) : logo ? (
            <Image source={{ uri: logo }} style={styles.logo} accessibilityLabel="Logo del salón" />
          ) : (
            <View />
          )}
          {right}
        </View>
      ) : null}
      {eyebrow ? <Text style={[styles.eyebrow, { color: theme.accentOnHero }]}>{eyebrow.toUpperCase()}</Text> : null}
      <Text style={[styles.titulo, { color: theme.heroText }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitulo, { color: theme.heroMuted }]}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

/** Hoja crema que se monta sobre el Hero. */
export function Sheet({ children }: { children: ReactNode }) {
  return <View style={styles.sheet}>{children}</View>;
}

/** Franja oscura detrás de la barra de estado para que siga legible al desplazar. */
export function StatusStrip({ theme = FLORECE_THEME }: { theme?: SalonTheme }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.franja, { height: insets.top, backgroundColor: theme.hero }]} />;
}

export const heroStyles = StyleSheet.create({
  circulo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(224,201,160,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const styles = StyleSheet.create({
  hero: {
    backgroundColor: color.ink,
    paddingHorizontal: space.screen,
    paddingBottom: 58,
    overflow: 'hidden',
  },
  aro: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    opacity: 0.25,
    right: -110,
    top: -40,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  circulo: heroStyles.circulo,
  logo: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff' },
  volverTexto: { color: color.cream, fontSize: 26, marginTop: -3 },
  eyebrow: { fontFamily: font.medium, fontSize: 11, letterSpacing: 2.4, color: color.gold },
  titulo: { fontFamily: font.display, fontSize: 44, lineHeight: 50, color: color.cream, marginTop: 4 },
  subtitulo: { fontFamily: font.displayItalic, fontSize: 19, color: color.goldLight, marginTop: 2 },
  sheet: {
    flexGrow: 1,
    backgroundColor: color.base,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    padding: space.screen,
    paddingTop: 28,
    gap: 14,
  },
  franja: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: color.ink },
});
