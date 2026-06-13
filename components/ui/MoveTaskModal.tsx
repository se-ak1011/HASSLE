import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { MaterialIcons } from '@expo/vector-icons';
import { Text } from './AppText';
import { Colors, Spacing, FontSizes, Fonts, Radius, Shadow } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { addDays, formatShortDate } from '@/services/dates';

interface Props {
  visible: boolean;
  taskName: string;
  onClose: () => void;
  onPick: (date: string) => void;
}

export function MoveTaskModal({ visible, taskName, onClose, onPick }: Props) {
  const ff = useFontFamily();
  const [showCalendar, setShowCalendar] = useState(false);

  const presets = [
    { label: 'Tomorrow', date: addDays(1) },
    { label: 'In a week', date: addDays(7) },
    { label: 'In 2 weeks', date: addDays(14) },
  ];

  function handleClose() {
    setShowCalendar(false);
    onClose();
  }

  function pick(date: string) {
    setShowCalendar(false);
    onPick(date);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { fontFamily: ff.bold }]}>Move to another day</Text>
              <Text style={[styles.taskName, { fontFamily: ff.regular }]}>{taskName}</Text>
            </View>
            <Pressable
              onPress={handleClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <MaterialIcons name="close" size={22} color={Colors.textMuted} />
            </Pressable>
          </View>

          {!showCalendar ? (
            <View style={styles.options}>
              {presets.map((p) => (
                <Pressable
                  key={p.label}
                  style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                  onPress={() => pick(p.date)}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.label}, ${formatShortDate(p.date)}`}
                >
                  <Text style={[styles.optionLabel, { fontFamily: ff.medium }]}>{p.label}</Text>
                  <Text style={[styles.optionDate, { fontFamily: ff.regular }]}>{formatShortDate(p.date)}</Text>
                </Pressable>
              ))}
              <Pressable
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                onPress={() => setShowCalendar(true)}
                accessibilityRole="button"
                accessibilityLabel="Pick a date"
              >
                <Text style={[styles.optionLabel, { fontFamily: ff.medium }]}>Pick a date…</Text>
                <MaterialIcons name="event" size={18} color={Colors.textSubtle} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.calendarWrap}>
              <Calendar
                minDate={addDays(1)}
                onDayPress={(d: { dateString: string }) => pick(d.dateString)}
                theme={{
                  calendarBackground: Colors.surface,
                  textSectionTitleColor: Colors.textSubtle,
                  monthTextColor: Colors.text,
                  dayTextColor: Colors.text,
                  todayTextColor: Colors.primaryLight,
                  textDisabledColor: Colors.border,
                  arrowColor: Colors.primaryLight,
                  selectedDayBackgroundColor: Colors.primary,
                  selectedDayTextColor: Colors.background,
                  textDayFontFamily: 'ChronicSans',
                  textMonthFontFamily: 'ChronicSans',
                  textDayHeaderFontFamily: 'ChronicSans',
                  textMonthFontSize: 17,
                  textDayFontSize: 15,
                  textDayHeaderFontSize: 12,
                }}
              />
              <Pressable
                style={({ pressed }) => [styles.backRow, pressed && { opacity: 0.7 }]}
                onPress={() => setShowCalendar(false)}
                accessibilityRole="button"
                accessibilityLabel="Back to quick options"
              >
                <MaterialIcons name="chevron-left" size={18} color={Colors.textSubtle} />
                <Text style={[styles.backText, { fontFamily: ff.medium }]}>Quick options</Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  headerText: {
    flex: 1,
    marginRight: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: Fonts.bold,
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: Spacing.xs,
  },
  taskName: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  options: {
    gap: Spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionPressed: {
    opacity: 0.7,
    backgroundColor: Colors.surfaceDark,
  },
  optionLabel: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.medium,
    color: Colors.text,
  },
  optionDate: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
  },
  calendarWrap: {
    gap: Spacing.md,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
  },
  backText: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    fontWeight: Fonts.medium,
  },
});
