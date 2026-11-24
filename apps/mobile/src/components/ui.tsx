import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { color, font, shadow } from '../theme';

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  icon,
  secureTextEntry,
  autoComplete,
}: {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'decimal-pad';
  icon?: ReactNode;
  secureTextEntry?: boolean;
  autoComplete?: 'email' | 'password' | 'off';
}) {
  const [foco, setFoco] = useState(false);
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrap, foco && styles.inputFoco]}>
        {icon}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#a59c92"
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoComplete={autoComplete}
          onFocus={() => setFoco(true)}
          onBlur={() => setFoco(false)}
          accessibilityLabel={label ?? placeholder}
          style={styles.input}
        />
      </View>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  tone = 'dark',
  colors,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'dark' | 'gold';
  /** Colores del salón; si faltan, los de Florece. */
  colors?: { bg: string; text: string };
}) {
  const gold = tone === 'gold';
  const propio = colors && !disabled ? colors : null;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.primary,
        gold && styles.primaryGold,
        propio && { backgroundColor: propio.bg },
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={propio?.text ?? (gold ? color.ink : color.cream)} />
      ) : (
        <Text
          style={[
            styles.primaryText,
            gold && styles.primaryTextGold,
            propio && { color: propio.text },
            disabled && styles.disabledText,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Monogram({
  name,
  size = 44,
  image,
}: {
  name: string;
  size?: number;
  image?: string | null;
}) {
  const [fallo, setFallo] = useState(false);
  if (image && !fallo) {
    return (
      <Image
        source={{ uri: image }}
        onError={() => setFallo(true)}
        accessibilityIgnoresInvertColors
        style={[styles.mono, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }
  return (
    <View style={[styles.mono, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.monoText, { fontSize: size * 0.48 }]}>
        {name.trim().charAt(0).toUpperCase() || '·'}
      </Text>
    </View>
  );
}

/** Lupa dibujada con vistas: no depende de que la fuente tenga el glifo. */
export function SearchIcon() {
  return (
    <View style={styles.lupa} accessible={false}>
      <View style={styles.lupaAro} />
      <View style={styles.lupaMango} />
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.section}>{children.toUpperCase()}</Text>;
}

export function Card({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle?: string | null;
  onPress?: () => void;
}) {
  const body = (
    <View style={styles.card}>
      <Monogram name={title} />
      <View style={styles.cardText}>
        <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.cardSub} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {onPress ? <Text style={styles.chevron}>›</Text> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => pressed && styles.pressed}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { fontSize: 13, color: color.goldDeep, fontFamily: font.medium, letterSpacing: 0.3 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 16,
    paddingHorizontal: 16,
    gap: 10,
  },
  inputFoco: { borderColor: color.gold },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    fontFamily: font.body,
    color: color.ink,
  },
  primary: {
    backgroundColor: color.ink,
    borderRadius: 999,
    minHeight: 54,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryGold: { backgroundColor: color.gold },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { backgroundColor: '#e2d9cd' },
  disabledText: { color: '#9a9087' },
  primaryText: { color: color.cream, fontSize: 16, fontFamily: font.bold },
  primaryTextGold: { color: color.ink },
  mono: {
    backgroundColor: color.warm,
    borderWidth: 1,
    borderColor: color.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monoText: { fontFamily: font.display, color: color.goldDeep, marginTop: -2 },
  lupa: { width: 18, height: 18 },
  lupaAro: { width: 13, height: 13, borderRadius: 7, borderWidth: 1.8, borderColor: color.gold },
  lupaMango: {
    position: 'absolute',
    width: 7,
    height: 1.8,
    backgroundColor: color.gold,
    right: -1,
    bottom: 2,
    transform: [{ rotate: '45deg' }],
  },
  section: {
    fontSize: 12,
    fontFamily: font.bold,
    color: color.goldDeep,
    letterSpacing: 1.6,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: color.card,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: color.line,
    ...shadow,
  },
  cardText: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 20, fontFamily: font.display, color: color.ink },
  cardSub: { fontSize: 13, fontFamily: font.body, color: color.muted },
  chevron: { fontSize: 26, color: color.gold, marginTop: -3 },
});
