import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { Colors, FontSizes, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { HapticPolicy } from './haptics';
import { InteractivePressable } from './InteractivePressable';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'quiet';

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  haptics?: HapticPolicy;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({ title, onPress, variant = 'primary', disabled, loading, haptics, icon, style, textStyle }: ButtonProps) {
  const selectedHaptics = haptics ?? (variant === 'destructive' ? 'warning' : 'light');
  return (
    <InteractivePressable
      accessibilityRole="button"
      disabled={disabled}
      haptics={selectedHaptics}
      loading={loading}
      onPress={onPress}
      style={[styles.base, styles[variant], style]}
      contentStyle={styles.content}
    >
      {icon}
      <Text style={[styles.label, styles[`${variant}Label`], textStyle]}>{title}</Text>
    </InteractivePressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: Radius.full,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: TouchTarget.minHeight,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: Fonts.semibold,
  },
  primary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  secondary: { backgroundColor: Colors.surfaceElevated, borderColor: Colors.border },
  destructive: { backgroundColor: Colors.dangerFaint, borderColor: Colors.danger },
  quiet: { backgroundColor: 'transparent', borderColor: 'transparent' },
  primaryLabel: { color: Colors.background },
  secondaryLabel: { color: Colors.textPrimary },
  destructiveLabel: { color: Colors.danger },
  quietLabel: { color: Colors.textSecondary },
});
