import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  Image,
} from 'react-native';
import { Text } from './AppText';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Fonts, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { Lola } from '@/constants/lola';
import { useRouter } from 'expo-router';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CommandSheetHandlers = {
  openPlanToday?: () => void;
  openSomethingHappened?: () => void;
};

type CommandSheetProps = {
  visible: boolean;
  onClose: () => void;
  handlers?: CommandSheetHandlers;
};

// ─── Command definitions ──────────────────────────────────────────────────────

type Command = {
  key: string;
  label: string;
  icon: string;
  route: string | null;
};

const COMMANDS: Command[] = [
  { key: 'plan',      label: 'Plan today',           icon: 'event-note',    route: null },
  { key: 'happened',  label: 'Something happened',   icon: 'bolt',          route: null },
  { key: 'insights',  label: 'Insights',             icon: 'show-chart',    route: '/(tabs)/patterns' },
  { key: 'report',    label: 'Doctor report',        icon: 'picture-as-pdf', route: '/report' },
  { key: 'reflect',   label: 'Reflect',              icon: 'edit-note',     route: '/(tabs)/reflect' },
  { key: 'distract',  label: 'Just distract me',     icon: 'spa',           route: null },
  { key: 'settings',  label: 'Settings',             icon: 'tune',          route: '/(tabs)/settings' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function CommandSheet({ visible, onClose, handlers = {} }: CommandSheetProps) {
  const ff = useFontFamily();
  const router = useRouter();
  const [showDistract, setShowDistract] = useState(false);

  function handleClose() {
    setShowDistract(false);
    onClose();
  }

  function handleCommand(cmd: Command) {
    switch (cmd.key) {
      case 'plan':
        handleClose();
        handlers.openPlanToday?.();
        break;
      case 'happened':
        handleClose();
        handlers.openSomethingHappened?.();
        break;
      case 'distract':
        setShowDistract(true);
        break;
      default:
        if (cmd.route) {
          handleClose();
          router.push(cmd.route as any);
        }
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          {showDistract ? (
            // ── Distract placeholder ─────────────────────────────────────────
            <>
              <View style={styles.topBar}>
                <Pressable
                  onPress={() => setShowDistract(false)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Back to menu"
                >
                  <MaterialIcons name="arrow-back" size={22} color={Colors.textMuted} />
                </Pressable>
                <Pressable
                  onPress={handleClose}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <MaterialIcons name="close" size={22} color={Colors.textMuted} />
                </Pressable>
              </View>

              <View style={styles.distractContent}>
                <Image
                  source={Lola.sitting}
                  style={styles.distractLola}
                  resizeMode="contain"
                  accessibilityLabel="Lola"
                />
                <Text style={[styles.distractHeading, { fontFamily: ff.bold }]}>
                  Sometimes surviving today is enough.
                </Text>
                <Text style={[styles.distractBody, { fontFamily: ff.regular }]}>
                  Need five quiet minutes?
                </Text>
                <Text style={[styles.distractBody, { fontFamily: ff.regular }]}>
                  This space will eventually contain gentle distractions designed specifically for flare days.
                </Text>
              </View>
            </>
          ) : (
            // ── Command list ─────────────────────────────────────────────────
            <>
              <View style={styles.topBar}>
                <View style={styles.greetingBlock}>
                  <Text style={[styles.greeting, { fontFamily: ff.bold }]}>Hi.</Text>
                  <Text style={[styles.subGreeting, { fontFamily: ff.regular }]}>
                    What would help?
                  </Text>
                </View>
                <Image
                  source={Lola.sitting}
                  style={styles.lolaSmall}
                  resizeMode="contain"
                  accessibilityLabel="Lola"
                />
                <Pressable
                  onPress={handleClose}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <MaterialIcons name="close" size={22} color={Colors.textMuted} />
                </Pressable>
              </View>

              <View style={styles.commandList}>
                {COMMANDS.map((cmd, index) => (
                  <Pressable
                    key={cmd.key}
                    style={({ pressed }) => [
                      styles.commandRow,
                      index < COMMANDS.length - 1 && styles.commandRowBorder,
                      pressed && styles.commandRowPressed,
                    ]}
                    onPress={() => handleCommand(cmd)}
                    accessibilityRole="button"
                    accessibilityLabel={cmd.label}
                  >
                    <MaterialIcons
                      name={cmd.icon as any}
                      size={20}
                      color={Colors.textSubtle}
                      style={styles.commandIcon}
                    />
                    <Text style={[styles.commandLabel, { fontFamily: ff.medium }]}>
                      {cmd.label}
                    </Text>
                    <MaterialIcons name="chevron-right" size={18} color={Colors.border} />
                  </Pressable>
                ))}
              </View>
            </>
          )}

        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // ── Top bar ────────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  greetingBlock: {
    flex: 1,
    gap: Spacing.xs,
  },
  greeting: {
    fontSize: FontSizes.xxl,
    fontWeight: Fonts.bold,
    color: Colors.text,
    letterSpacing: -0.8,
    lineHeight: 42,
  },
  subGreeting: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    lineHeight: 24,
  },
  lolaSmall: {
    width: 52,
    height: 64,
    marginTop: 2,
  },

  // ── Command list ───────────────────────────────────────────────────────────
  commandList: {
    gap: 0,
  },
  commandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md + 2,
    minHeight: 56,
  },
  commandRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  commandRowPressed: {
    opacity: 0.65,
  },
  commandIcon: {
    marginRight: Spacing.md,
    width: 24,
    textAlign: 'center',
  },
  commandLabel: {
    flex: 1,
    fontSize: FontSizes.base,
    color: Colors.text,
    lineHeight: 24,
  },

  // ── Distract placeholder ───────────────────────────────────────────────────
  distractContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  distractLola: {
    width: 100,
    height: 120,
    marginBottom: Spacing.sm,
  },
  distractHeading: {
    fontSize: FontSizes.lg,
    fontWeight: Fonts.bold,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 34,
    paddingHorizontal: Spacing.md,
  },
  distractBody: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: Spacing.lg,
  },
  distractComingSoon: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
