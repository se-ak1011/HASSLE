import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from 'react-native';
import { Text, TextInput } from './AppText';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Fonts, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { useAlert } from '@/template';
import { Companion } from '@/constants/companion';

// ─── Types ────────────────────────────────────────────────────────────────────

export type IntentSheetHandler = {
  openFlareWorkflow?: () => void;
  openAddTask?: () => void;
  openMoveTask?: () => void;
  openEndDay?: () => void;
  openReflect?: () => void;
};

interface Props {
  visible: boolean;
  onClose: () => void;
  handlers?: IntentSheetHandler;
}

// ─── Suggestion Chips ─────────────────────────────────────────────────────────

const CHIPS = [
  { label: "I'm struggling", key: 'struggling' },
  { label: 'Took medication', key: 'medication' },
  { label: 'Need to move something', key: 'move' },
  { label: 'Pain increased', key: 'pain' },
  { label: 'Brain fog', key: 'fog' },
  { label: "Didn't sleep", key: 'sleep' },
  { label: 'Finished for today', key: 'finished' },
];

const INPUT_PLACEHOLDERS = [
  "I can't face the shower.",
  "I've taken my medication.",
  "Today's a flare.",
  'I cancelled physio.',
  "I'm exhausted.",
  "I'm done for today.",
];

// ─── Component ────────────────────────────────────────────────────────────────

export function IntentSheet({ visible, onClose, handlers = {} }: Props) {
  const ff = useFontFamily();
  const { showAlert } = useAlert();
  const [text, setText] = useState('');

  const placeholder = INPUT_PLACEHOLDERS[0];

  function handleChip(chip: (typeof CHIPS)[0]) {
    setText(chip.label);
  }

  function handleContinue() {
    const trimmed = text.trim().toLowerCase();

    if (!trimmed) {
      onClose();
      return;
    }

    if (
      trimmed.includes("struggling") ||
      trimmed.includes("flare") ||
      trimmed.includes("pain increased")
    ) {
      onClose();
      setText('');
      handlers.openFlareWorkflow?.();
      return;
    }

    if (trimmed.includes("medication") || trimmed.includes("took")) {
      onClose();
      setText('');
      handlers.openReflect?.();
      return;
    }

    if (trimmed.includes("move") || trimmed.includes("cancel") || trimmed.includes("reschedule")) {
      onClose();
      setText('');
      handlers.openMoveTask?.();
      return;
    }

    if (
      trimmed.includes("finished") ||
      trimmed.includes("done for today") ||
      trimmed.includes("done for the day")
    ) {
      onClose();
      setText('');
      handlers.openEndDay?.();
      return;
    }

    // Everything else
    showAlert('Coming soon', 'Hassle will be able to understand this soon. For now, use the other options on the home screen.');
  }

  function handleClose() {
    setText('');
    onClose();
  }

  const hasText = text.trim().length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={sheetStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={sheetStyles.sheet}>

            {/* Header row: heading + Lola + close */}
            <View style={sheetStyles.headerRow}>
              <View style={sheetStyles.headerText}>
                <Text style={[sheetStyles.heading, { fontFamily: ff.bold }]}>
                  What happened?
                </Text>
                <Text style={[sheetStyles.subheading, { fontFamily: ff.regular }]}>
                  Tap one below, or say it yourself.
                </Text>
              </View>
              <Image
                source={Companion.Loading}
                style={sheetStyles.lola}
                resizeMode="contain"
                accessibilityLabel="Lola is listening"
              />
              <Pressable
                onPress={handleClose}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={sheetStyles.closeBtn}
              >
                <MaterialIcons name="close" size={22} color={Colors.textMuted} />
              </Pressable>
            </View>

            {/* Input */}
            <TextInput
              style={[sheetStyles.input, { fontFamily: ff.regular }]}
              value={text}
              onChangeText={setText}
              multiline
              numberOfLines={4}
              placeholder={placeholder}
              placeholderTextColor={Colors.textSubtle}
              textAlignVertical="top"
              autoFocus={false}
            />

            {/* Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={sheetStyles.chipsScroll}
              contentContainerStyle={sheetStyles.chipsRow}
              keyboardShouldPersistTaps="always"
            >
              {CHIPS.map((chip) => (
                <Pressable
                  key={chip.key}
                  style={({ pressed }) => [
                    sheetStyles.chip,
                    text === chip.label && sheetStyles.chipActive,
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={() => handleChip(chip)}
                  accessibilityRole="button"
                  accessibilityLabel={chip.label}
                >
                  <Text
                    style={[
                      sheetStyles.chipText,
                      text === chip.label && sheetStyles.chipTextActive,
                      { fontFamily: ff.medium },
                    ]}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Continue */}
            <Pressable
              style={({ pressed }) => [
                sheetStyles.continueBtn,
                !hasText && sheetStyles.continueBtnSubtle,
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleContinue}
              accessibilityRole="button"
              accessibilityLabel={hasText ? 'That happened' : 'Nothing for now'}
            >
              <Text style={[sheetStyles.continueBtnText, { fontFamily: ff.semibold }]}>
                {hasText ? 'That happened' : 'Nothing for now'}
              </Text>
            </Pressable>

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const sheetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  heading: {
    fontSize: FontSizes.xxl,
    fontWeight: Fonts.bold,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  subheading: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  lola: {
    width: 52,
    height: 64,
    marginTop: 2,
  },
  closeBtn: {
    paddingLeft: Spacing.sm,
    paddingTop: 2,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 110,
    lineHeight: 28,
    marginBottom: Spacing.md,
  },
  chipsScroll: {
    marginBottom: Spacing.lg,
  },
  chipsRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  chip: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaint,
  },
  chipText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  chipTextActive: {
    color: Colors.primaryLight,
  },
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
  },
  continueBtnSubtle: {
    backgroundColor: Colors.surfaceElevated,
  },
  continueBtnText: {
    fontSize: FontSizes.base,
    color: Colors.text,
    fontWeight: Fonts.semibold,
  },
});
