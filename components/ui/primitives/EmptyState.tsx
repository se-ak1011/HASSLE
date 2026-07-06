import { ReactNode } from 'react';
import { ImageSourcePropType, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, FontSizes, Fonts, Radius, Spacing } from '@/constants/theme';
import { Button } from './Button';
import { LolaPanel } from '@/components/ui/LolaPanel';

type EmptyStateProps = {
  title: string;
  body?: string;
  art?: ReactNode;
  lola?: ImageSourcePropType;
  action?: ReactNode;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({ title, body, art, lola, action, actionLabel, onActionPress, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {lola ? <LolaPanel image={lola} size="small" /> : art ? <View style={styles.art}>{art}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
      {actionLabel && onActionPress ? (
        <Button title={actionLabel} onPress={onActionPress} variant="secondary" style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
    padding: Spacing.xl,
  },
  art: { marginBottom: Spacing.sm },
  title: { color: Colors.textPrimary, fontSize: FontSizes.md, fontWeight: Fonts.semibold, textAlign: 'center' },
  body: { color: Colors.textSubtle, fontSize: FontSizes.sm, lineHeight: 21, textAlign: 'center' },
  action: { marginTop: Spacing.md },
  button: { marginTop: Spacing.md },
});
