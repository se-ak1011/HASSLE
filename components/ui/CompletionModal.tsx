import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import { Text } from './AppText';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Fonts, Radius, Shadow } from '@/constants/theme';
import { CompletionFeeling } from '@/constants/types';
import { useFontFamily } from '@/hooks/useFontFamily';

interface Props {
  visible: boolean;
  taskName: string;
  onSelect: (feeling: CompletionFeeling, feedback: string) => void;
  onDismiss: () => void;
}

const OPTIONS: {
  feeling: CompletionFeeling;
  label: string;
  emoji: string;
  desc: string;
  feedback: string;
}[] = [
  {
    feeling: 'easier',
    label: 'Easier than expected',
    emoji: '✨',
    desc: 'I had a bit more in me',
    feedback: 'Noted. That took less than expected.',
  },
  {
    feeling: 'right',
    label: 'About right',
    emoji: '🌿',
    desc: 'Felt as expected',
    feedback: 'Got it. That felt about right.',
  },
  {
    feeling: 'harder',
    label: 'Harder than expected',
    emoji: '💧',
    desc: 'Cost me more than I thought',
    feedback: 'Noted. That took more out of you.',
  },
];

export function CompletionModal({
  visible,
  taskName,
  onSelect,
  onDismiss,
}: Props) {
  const ff = useFontFamily();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={[styles.prompt, { fontFamily: ff.bold }]}>How did that feel?</Text>
          <Text style={[styles.taskName, { fontFamily: ff.regular }]}>{taskName}</Text>

          <View style={styles.options}>
            {OPTIONS.map((opt) => (
              <Pressable
                key={opt.feeling}
                style={({ pressed }) => [
                  styles.option,
                  pressed && styles.optionPressed,
                ]}
                onPress={() => onSelect(opt.feeling, opt.feedback)}
              >
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, { fontFamily: ff.medium }]}>{opt.label}</Text>
                  <Text style={[styles.optionDesc, { fontFamily: ff.regular }]}>{opt.desc}</Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={Colors.textSubtle}
                />
              </Pressable>
            ))}
          </View>

          <View style={styles.dismissWrap}>
            <Text style={[styles.dismissHint, { fontFamily: ff.regular }]}>
              Skipping will mark it as "about right".
            </Text>
            <Pressable style={styles.dismissBtn} onPress={onDismiss}>
              <Text style={[styles.dismissText, { fontFamily: ff.medium }]}>Skip for now</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadow.medium,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  prompt: {
    fontSize: FontSizes.xl,
    fontWeight: Fonts.bold,
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: Spacing.xs,
  },
  taskName: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
    fontStyle: 'italic',
  },
  options: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionPressed: {
    opacity: 0.7,
    backgroundColor: Colors.surfaceDark,
  },
  optionEmoji: {
    fontSize: 22,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.medium,
    color: Colors.text,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  dismissWrap: {
    alignItems: 'center',
    gap: 4,
  },
  dismissHint: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    fontStyle: 'italic',
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  dismissText: {
    fontSize: FontSizes.base,
    color: Colors.textSubtle,
    fontWeight: Fonts.medium,
  },
});
