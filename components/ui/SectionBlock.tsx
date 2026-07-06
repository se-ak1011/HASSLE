import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { Colors, FontSizes, Fonts, Radius, Spacing } from '@/constants/theme';

type SectionBlockProps = {
  title?: string;
  count?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SectionBlock({ title, count, children, style }: SectionBlockProps) {
  return (
    <View style={[styles.section, style]}>
      {title ? (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {typeof count === 'number' ? <Text style={styles.count}>{count}</Text> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: Fonts.semibold,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  count: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    fontWeight: Fonts.medium,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    minWidth: 24,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
