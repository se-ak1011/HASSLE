import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { Colors, FontSizes, Fonts, Radius, Spacing } from '@/constants/theme';
import { InteractivePressable } from '@/components/ui/primitives/InteractivePressable';

type ActionTileProps = {
  title: string;
  body: string;
  icon?: ReactNode;
  onPress: () => void;
  primary?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ActionTile({ title, body, icon, onPress, primary = false, style }: ActionTileProps) {
  return (
    <InteractivePressable
      accessibilityRole="button"
      onPress={onPress}
      haptics="light"
      style={[styles.pressable, style]}
      contentStyle={[styles.card, primary && styles.primaryCard]}
    >
      {icon ? <View>{icon}</View> : null}
      <View>
        <Text style={[styles.title, primary && styles.primaryTitle]}>{title}</Text>
        <Text style={[styles.body, primary && styles.primaryBody]}>{body}</Text>
      </View>
    </InteractivePressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flexGrow: 1,
    flexBasis: '47%',
  },
  card: {
    minHeight: 132,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  primaryCard: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryLight,
  },
  title: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.semibold,
    color: Colors.text,
    marginTop: Spacing.md,
  },
  primaryTitle: {
    color: Colors.background,
  },
  body: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  primaryBody: {
    color: Colors.textSecondary,
  },
});
