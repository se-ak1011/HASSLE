import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Elevation, Radius, Spacing } from '@/constants/theme';

type CardProps = {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  elevated?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Card({ children, header, footer, elevated = false, padded = true, style, contentStyle }: CardProps) {
  return (
    <View style={[styles.card, elevated && styles.elevated, style]}>
      {header ? <View style={styles.header}>{header}</View> : null}
      <View style={[padded && styles.content, contentStyle]}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  elevated: {
    backgroundColor: Colors.surfaceElevated,
    ...Elevation.soft,
  },
  header: {
    borderBottomColor: Colors.hairline,
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
  },
  content: {
    padding: Spacing.md,
  },
  footer: {
    borderTopColor: Colors.hairline,
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
  },
});
