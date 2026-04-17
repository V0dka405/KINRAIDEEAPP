// ============================================================
// components/UI.tsx  –  KinRaiDee React Native
// แปลงจาก Web (Tailwind) → React Native StyleSheet
// ============================================================
import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants';

// ─── Button ─────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize    = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps {
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  variant = 'primary',
  size = 'md',
  children,
  style,
  textStyle,
  disabled = false,
  loading = false,
}) => {
  const btnStyle: ViewStyle[] = [styles.btnBase, variantStyles[variant], sizeStyles[size]];
  const txtStyle: TextStyle[] = [styles.btnTextBase, variantTextStyles[variant], sizeTextStyles[size]];

  if (disabled) btnStyle.push(styles.btnDisabled);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[...btnStyle, style]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      touchSoundDisabled={true}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? '#fff' : COLORS.primary} />
        : (typeof children === 'string'
            ? <Text style={[...txtStyle, textStyle]}>{children}</Text>
            : children)
      }
    </TouchableOpacity>
  );
};

// ─── Card ────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

// ─── SectionHeader ───────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  actionLabel?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, onPress, actionLabel }) => (
  <View style={styles.sectionHeader}>
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
    {onPress && actionLabel && (
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.sectionAction}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── PriceTag ────────────────────────────────────────────────
export const PriceTag: React.FC<{ level: number }> = ({ level }) => {
  const marks = '฿'.repeat(level);
  const empty = '฿'.repeat(4 - level);
  return (
    <Text style={styles.priceTag}>
      <Text style={{ color: COLORS.primary }}>{marks}</Text>
      <Text style={{ color: 'rgba(0,0,0,0.2)' }}>{empty}</Text>
    </Text>
  );
};

// ─── StarRating ──────────────────────────────────────────────
export const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 12 }) => (
  <Text style={{ fontSize: size, color: '#F59E0B' }}>
    {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}
    <Text style={{ color: COLORS.secondary, fontSize: size - 2 }}>  {rating.toFixed(1)}</Text>
  </Text>
);

// ─── Divider ─────────────────────────────────────────────────
export const Divider: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.divider, style]} />
);

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  btnBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  btnDisabled: { opacity: 0.5 },
  btnTextBase: { fontWeight: '600' },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.dark,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 2,
  },
  sectionAction: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },

  priceTag: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },

  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 12,
  },
});

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary:   { backgroundColor: COLORS.primary },
  secondary: { backgroundColor: COLORS.secondary },
  outline:   { backgroundColor: 'transparent', borderWidth: 2, borderColor: COLORS.dark },
  ghost:     { backgroundColor: 'transparent' },
};

const variantTextStyles: Record<ButtonVariant, TextStyle> = {
  primary:   { color: '#FFFFFF' },
  secondary: { color: '#FFFFFF' },
  outline:   { color: COLORS.dark },
  ghost:     { color: COLORS.secondary },
};

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm:   { paddingHorizontal: 16, paddingVertical: 8 },
  md:   { paddingHorizontal: 24, paddingVertical: 14 },
  lg:   { paddingHorizontal: 32, paddingVertical: 18 },
  icon: { padding: 12, width: 48, height: 48 },
};

const sizeTextStyles: Record<ButtonSize, TextStyle> = {
  sm:   { fontSize: 13 },
  md:   { fontSize: 15 },
  lg:   { fontSize: 18 },
  icon: { fontSize: 14 },
};
