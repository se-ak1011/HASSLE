import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { Colors, FontSizes, Fonts, Radius, Spacing } from '@/constants/theme';
import { InteractivePressable } from './InteractivePressable';

export type ChipKind = 'action' | 'filter' | 'status' | 'context';

type ChipProps = {
  label: string;
  kind?: ChipKind;
  selected?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function Chip({ label, kind = 'context', selected = false, disabled, icon, onPress, style }: ChipProps) {
  const interactive = kind === 'action' || kind === 'filter';
  return (
    <InteractivePressable
      accessibilityRole={interactive ? 'button' : undefined}
      disabled={disabled || !interactive}
      haptics={interactive ? 'light' : 'none'}
      onPress={onPress}
      style={[styles.chip, styles[kind], selected && styles.selected, style]}
      contentStyle={styles.content}
    >
      {icon}
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </InteractivePressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    borderWidth: 1,
    minHeight: 34,
    paddingHorizontal: Spacing.md,
  },
  content: { alignItems: 'center', flexDirection: 'row', gap: Spacing.xs, justifyContent: 'center' },
  action: { backgroundColor: Colors.primaryFaint, borderColor: Colors.primary },
  filter: { backgroundColor: Colors.surface, borderColor: Colors.border },
  status: { backgroundColor: Colors.accentFaint, borderColor: Colors.border },
  context: { backgroundColor: Colors.surfaceElevated, borderColor: Colors.hairline },
  selected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  label: { color: Colors.textSecondary, fontSize: FontSizes.xs, fontWeight: Fonts.medium },
  selectedLabel: { color: Colors.background },
});
