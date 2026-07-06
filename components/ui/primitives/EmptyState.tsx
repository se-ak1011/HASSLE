import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, FontSizes, Fonts, Spacing } from '@/constants/theme';

type EmptyStateProps = {
  title: string;
  body?: string;
  art?: ReactNode;
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({ title, body, art, action, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {art ? <View style={styles.art}>{art}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.xl },
  art: { marginBottom: Spacing.sm },
  title: { color: Colors.textPrimary, fontSize: FontSizes.md, fontWeight: Fonts.semibold, textAlign: 'center' },
  body: { color: Colors.textSubtle, fontSize: FontSizes.sm, lineHeight: 21, textAlign: 'center' },
  action: { marginTop: Spacing.md },
});
