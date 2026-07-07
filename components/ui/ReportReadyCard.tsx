import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { Colors, FontSizes, Fonts, Radius, Spacing } from '@/constants/theme';
import { InteractivePressable } from '@/components/ui/primitives/InteractivePressable';
import { MaterialIcons } from '@expo/vector-icons';

export type ReportStatus = 'not_enough' | 'building' | 'ready';

type Action = {
  label: string;
  onPress: () => void;
};

type ReportReadyCardProps = {
  title: string;
  subtitle: string;
  dateRange?: string;
  status: ReportStatus;
  primaryAction: Action;
  secondaryAction?: Action;
  style?: StyleProp<ViewStyle>;
};

const STATUS_ICON: Record<ReportStatus, React.ComponentProps<typeof MaterialIcons>['name']> = {
  not_enough: 'hourglass-empty',
  building: 'auto-graph',
  ready: 'picture-as-pdf',
};

const STATUS_ICON_COLOR: Record<ReportStatus, string> = {
  not_enough: Colors.textSubtle,
  building: Colors.accent,
  ready: Colors.primary,
};

export function ReportReadyCard({
  title,
  subtitle,
  dateRange,
  status,
  primaryAction,
  secondaryAction,
  style,
}: ReportReadyCardProps) {
  const iconName = STATUS_ICON[status];
  const iconColor = STATUS_ICON_COLOR[status];
  const isReady = status === 'ready';

  return (
    <View style={[styles.card, isReady && styles.cardReady, style]}>
      <View style={styles.top}>
        <View style={[styles.iconWrap, isReady && styles.iconWrapReady]}>
          <MaterialIcons name={iconName} size={20} color={iconColor} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, isReady && styles.titleReady]}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {dateRange ? <Text style={styles.dateRange}>{dateRange}</Text> : null}
        </View>
      </View>
      <View style={styles.actions}>
        <InteractivePressable
          accessibilityRole="button"
          onPress={primaryAction.onPress}
          haptics="light"
          style={[styles.btn, isReady ? styles.btnPrimary : styles.btnSecondary]}
        >
          <Text style={[styles.btnLabel, isReady ? styles.btnLabelPrimary : styles.btnLabelSecondary]}>
            {primaryAction.label}
          </Text>
        </InteractivePressable>
        {secondaryAction ? (
          <InteractivePressable
            accessibilityRole="button"
            onPress={secondaryAction.onPress}
            haptics="light"
            style={[styles.btn, styles.btnGhost]}
          >
            <Text style={[styles.btnLabel, styles.btnLabelGhost]}>{secondaryAction.label}</Text>
          </InteractivePressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardReady: {
    backgroundColor: Colors.primaryFaint,
    borderColor: Colors.primaryLight,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrapReady: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryLight,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.semibold,
    color: Colors.text,
    lineHeight: 24,
  },
  titleReady: {
    color: Colors.white,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    lineHeight: 21,
  },
  dateRange: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    paddingVertical: 10,
    borderWidth: 1,
    minHeight: 40,
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryLight,
  },
  btnSecondary: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.border,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderColor: Colors.border,
  },
  btnLabel: {
    fontSize: FontSizes.sm,
    fontWeight: Fonts.semibold,
  },
  btnLabelPrimary: {
    color: Colors.white,
  },
  btnLabelSecondary: {
    color: Colors.textPrimary,
  },
  btnLabelGhost: {
    color: Colors.textSubtle,
  },
});
