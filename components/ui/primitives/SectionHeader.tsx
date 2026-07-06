import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, FontSizes, Fonts, Spacing } from '@/constants/theme';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SectionHeader({ title, subtitle, action, style }: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'flex-end', flexDirection: 'row', gap: Spacing.md, justifyContent: 'space-between' },
  copy: { flex: 1, gap: Spacing.xs },
  title: { color: Colors.textPrimary, fontSize: FontSizes.md, fontWeight: Fonts.semibold, letterSpacing: -0.3 },
  subtitle: { color: Colors.textSubtle, fontSize: FontSizes.sm, lineHeight: 20 },
});
