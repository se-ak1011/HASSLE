import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  ActivityIndicator,
  Switch,
  Dimensions,
} from 'react-native';
import { Text, TextInput } from '@/components/ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Fonts, Radius } from '@/constants/theme';
import { useDay } from '@/hooks/useDay';
import { useAlert } from '@/template';
import { exportLast7Days, exportClinicalReport } from '@/services/exportService';
import { useFontFamily } from '@/hooks/useFontFamily';
import { usePlus } from '@/contexts/PlusContext';
import { PaywallModal } from '@/components/ui/PaywallModal';
import {
  ReminderFrequency,
  REMINDER_FREQUENCY_LABELS,
  ONBOARDING_TASK_OPTIONS,
  DefaultDailyTask,
  PRESET_CONDITIONS,
} from '@/constants/types';
import {
  scheduleReminders,
  cancelAllReminders,
  requestNotificationPermissions,
} from '@/services/notificationService';

const SUPPORT_EMAIL = 'drainedstore@gmail.com';
const APP_VERSION = '1.0.0';

// Definite content width for the About card text. A pixel width (vs '100%')
// forces line-break measurement to wrap, which percentage widths don't always
// trigger for the first child of a flex container.
const ABOUT_TEXT_WIDTH = Dimensions.get('window').width - Spacing.lg * 2 - Spacing.md * 2;

// ─── Row Components ───────────────────────────────────────────────────────────

function SettingsRow({
  icon,
  label,
  sublabel,
  onPress,
  destructive,
  chevron = true,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  destructive?: boolean;
  chevron?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        pressed && onPress ? styles.rowPressed : null,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View
        style={[
          styles.rowIcon,
          destructive ? styles.rowIconDestructive : styles.rowIconDefault,
        ]}
      >
        <MaterialIcons
          name={icon as any}
          size={18}
          color={destructive ? Colors.flare : Colors.primary}
        />
      </View>
      <View style={styles.rowText}>
        <Text
          style={[styles.rowLabel, destructive ? styles.rowLabelDestructive : null]}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text style={styles.rowSublabel}>{sublabel}</Text>
        ) : null}
      </View>
      {chevron && onPress ? (
        <MaterialIcons name="chevron-right" size={20} color={Colors.textSubtle} />
      ) : null}
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

// ─── Reminder Settings Panel ──────────────────────────────────────────────────

function ReminderSettingsPanel() {
  const { prefs, updateReminders } = useDay();
  const { showAlert } = useAlert();
  const ff = useFontFamily();

  const reminders = prefs?.reminders ?? { enabled: false, frequency: 'low' };
  const [saving, setSaving] = useState(false);

  const FREQ_OPTIONS: Exclude<ReminderFrequency, 'off'>[] = ['low', 'medium', 'high'];

  async function handleToggle(val: boolean) {
    if (saving) return;
    setSaving(true);
    try {
      if (val) {
        const granted = await requestNotificationPermissions();
        if (!granted) {
          showAlert(
            'Notifications blocked',
            'Please enable notifications for Hassle in your device settings to use reminders.'
          );
          setSaving(false);
          return;
        }
        await scheduleReminders(reminders.frequency);
        updateReminders({ ...reminders, enabled: true });
      } else {
        await cancelAllReminders();
        updateReminders({ ...reminders, enabled: false });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleFrequency(freq: Exclude<ReminderFrequency, 'off'>) {
    if (saving) return;
    setSaving(true);
    try {
      updateReminders({ ...reminders, frequency: freq });
      if (reminders.enabled) {
        await scheduleReminders(freq);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      {/* Toggle row */}
      <View style={[styles.row, styles.rowNoBorder]}>
        <View style={[styles.rowIcon, styles.rowIconDefault]}>
          <MaterialIcons name="notifications-none" size={18} color={Colors.primary} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowLabel, { fontFamily: ff.medium }]}>Enable reminders</Text>
          <Text style={styles.rowSublabel}>
            {reminders.enabled
              ? `Active — ${REMINDER_FREQUENCY_LABELS[reminders.frequency]}`
              : 'Off — no notifications will be sent'}
          </Text>
        </View>
        <Switch
          value={reminders.enabled}
          onValueChange={handleToggle}
          accessibilityLabel="Enable reminders"
          trackColor={{ false: Colors.border, true: Colors.primary }}
          thumbColor={Colors.white}
          disabled={saving}
        />
      </View>

      {/* Frequency options — only shown when enabled */}
      {reminders.enabled ? (
        <View style={styles.freqBlock}>
          <Text style={[styles.freqLabel, { fontFamily: ff.medium }]}>Frequency</Text>
          {FREQ_OPTIONS.map((freq) => (
            <Pressable
              key={freq}
              style={({ pressed }) => [
                styles.freqOption,
                reminders.frequency === freq && styles.freqOptionSelected,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => handleFrequency(freq)}
            >
              <View
                style={[
                  styles.freqRadio,
                  reminders.frequency === freq && styles.freqRadioSelected,
                ]}
              />
              <Text
                style={[
                  styles.freqOptionText,
                  reminders.frequency === freq && styles.freqOptionTextSelected,
                  { fontFamily: ff.medium },
                ]}
              >
                {REMINDER_FREQUENCY_LABELS[freq]}
              </Text>
            </Pressable>
          ))}
          <View style={styles.reminderNote}>
            <MaterialIcons name="info-outline" size={13} color={Colors.textSubtle} />
            <Text style={[styles.reminderNoteText, { fontFamily: ff.regular }]}>
              Reminders are short, low-pressure prompts. They never track or monitor you.
            </Text>
          </View>
        </View>
      ) : null}
    </Card>
  );
}

// ─── Default Tasks Panel ──────────────────────────────────────────────────────

function DefaultTasksPanel() {
  const { prefs, updateDefaultDailyTasks } = useDay();
  const ff = useFontFamily();

  const currentDefaults = prefs?.defaultDailyTasks ?? [];

  function toggleTask(task: DefaultDailyTask) {
    const already = currentDefaults.some((t) => t.name === task.name);
    const updated = already
      ? currentDefaults.filter((t) => t.name !== task.name)
      : [...currentDefaults, task];
    updateDefaultDailyTasks(updated);
  }

  return (
    <View style={styles.defaultTasksPanel}>
      <Text style={[styles.defaultTasksHint, { fontFamily: ff.regular }]}>
        These tasks appear automatically when you start each day.
        Tap to toggle them on or off.
      </Text>
      <View style={styles.defaultTasksGrid}>
        {ONBOARDING_TASK_OPTIONS.map((task) => {
          const selected = currentDefaults.some((t) => t.name === task.name);
          return (
            <Pressable
              key={task.name}
              style={({ pressed }) => [
                styles.defaultTaskChip,
                selected && styles.defaultTaskChipSelected,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => toggleTask(task)}
            >
              {selected ? (
                <MaterialIcons name="check" size={13} color={Colors.background} />
              ) : null}
              <Text
                style={[
                  styles.defaultTaskChipText,
                  selected && styles.defaultTaskChipTextSelected,
                  { fontFamily: ff.medium },
                ]}
              >
                {task.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.defaultTasksCount, { fontFamily: ff.regular }]}>
        {currentDefaults.length === 0
          ? 'No default tasks — add tasks manually each day'
          : `${currentDefaults.length} task${currentDefaults.length === 1 ? '' : 's'} added automatically each morning`}
      </Text>
    </View>
  );
}

// ─── Profile Panel (name + conditions) ───────────────────────────────────────

function ProfilePanel() {
  const { prefs, updateProfile } = useDay();
  const ff = useFontFamily();
  const [name, setName] = useState(prefs?.name ?? '');
  const conditions = prefs?.conditions ?? [];

  function toggleCondition(c: string) {
    const next = conditions.includes(c)
      ? conditions.filter((x) => x !== c)
      : [...conditions, c];
    updateProfile({ conditions: next });
  }

  return (
    <View style={[styles.card, styles.profileCard]}>
      <Text style={[styles.profileLabel, { fontFamily: ff.semibold }]}>What should we call you?</Text>
      <TextInput
        style={[styles.profileInput, { fontFamily: ff.regular }]}
        value={name}
        onChangeText={setName}
        onEndEditing={() => updateProfile({ name: name.trim() })}
        placeholder="Your name (optional)"
        placeholderTextColor={Colors.textSubtle}
        returnKeyType="done"
        maxLength={40}
      />

      <Text style={[styles.profileLabel, { fontFamily: ff.semibold, marginTop: Spacing.lg }]}>
        Conditions
      </Text>
      <Text style={[styles.profileHint, { fontFamily: ff.regular }]}>
        Optional, and just for you. Stays on your device — never displayed anywhere public.
      </Text>
      <View style={styles.conditionsWrap}>
        {PRESET_CONDITIONS.map((c) => {
          const selected = conditions.includes(c);
          return (
            <Pressable
              key={c}
              onPress={() => toggleCondition(c)}
              style={[styles.conditionChip, selected && styles.conditionChipSelected]}
            >
              <Text
                style={[
                  styles.conditionChipText,
                  { fontFamily: ff.medium },
                  selected && styles.conditionChipTextSelected,
                ]}
              >
                {c}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { resetAllData } = useDay();
  const ff = useFontFamily();
  const { isPlus } = usePlus();
  const [exporting, setExporting] = useState(false);
  const [exportingClinical, setExportingClinical] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  async function handleClinicalExport() {
    if (!isPlus) {
      setShowPaywall(true);
      return;
    }
    if (exportingClinical) return;
    setExportingClinical(true);
    try {
      const result = await exportClinicalReport(30);
      if (!result.success) {
        if (result.error === 'no_data') {
          showAlert(
            'Nothing to export yet',
            'Complete at least one day first. Once you end a day, it will appear in your report.'
          );
        } else if (result.error === 'sharing_unavailable') {
          showAlert('Sharing not available', 'Your device does not support file sharing.');
        } else {
          showAlert('Export failed', 'Something went wrong generating the report. Please try again.');
        }
      }
    } finally {
      setExportingClinical(false);
    }
  }

  function handleClearData() {
    showAlert(
      'Clear all data?',
      'This will permanently remove your history, reflections, custom tags, and learned task costs. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear everything',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            showAlert(
              'Done',
              'All local data has been cleared. The app is back to a fresh state.'
            );
          },
        },
      ]
    );
  }

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const result = await exportLast7Days();
      if (!result.success) {
        if (result.error === 'no_data') {
          showAlert(
            'Nothing to export yet',
            'Complete at least one day first. Once you end a day, it will appear in your export.'
          );
        } else if (result.error === 'sharing_unavailable') {
          showAlert('Sharing not available', 'Your device does not support file sharing.');
        } else {
          showAlert('Export failed', 'Something went wrong generating the report. Please try again.');
        }
      }
    } finally {
      setExporting(false);
    }
  }

  function handleContactSupport() {
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=Hassle%20App%20Support`;
    Linking.openURL(mailto).catch(() => {
      showAlert(
        'Could not open email',
        `Please contact us directly at ${SUPPORT_EMAIL}`
      );
    });
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { fontFamily: ff.bold }]}>Settings</Text>
          <Text style={[styles.subtitle, { fontFamily: ff.regular }]}>
            Simple controls for a simple app.
          </Text>
        </View>

        {/* Profile */}
        <SectionHeader title="You" />
        <ProfilePanel />

        {/* Data storage info */}
        <SectionHeader title="Your data" />
        <View style={[styles.card, styles.infoCard]}>
          <View style={styles.infoIconRow}>
            <View style={styles.infoIconCircle}>
              <MaterialIcons name="phone-iphone" size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoTextBlock}>
              <Text style={[styles.infoTitle, { fontFamily: ff.semibold }]}>Stored on this device</Text>
              <Text style={[styles.infoDesc, { fontFamily: ff.regular }]}>
                Everything you enter — tasks, energy levels, reflections, and
                patterns — is saved locally on your device. Nothing is sent to
                any server.
              </Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <Text style={[styles.infoFootnote, { fontFamily: ff.regular }]}>
            Account sync may come in a future version. For now, your data stays
            with you.
          </Text>
        </View>

        {/* Default daily tasks */}
        <SectionHeader title="Default daily tasks" />
        <Card>
          <DefaultTasksPanel />
        </Card>

        {/* Reminders */}
        <SectionHeader title="Reminders" />
        <ReminderSettingsPanel />

        {/* Data management */}
        <SectionHeader title="Data" />
        <Card>
          <SettingsRow
            icon="delete-sweep"
            label="Clear all app data"
            sublabel="Removes history, reflections, custom tags, and learned costs"
            onPress={handleClearData}
            destructive
          />
        </Card>

        {/* Hassle Plus */}
        <SectionHeader title="Hassle Plus" />
        <Card>
          <Pressable
            style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
            onPress={() => setShowPaywall(true)}
          >
            <View style={[styles.rowIcon, styles.rowIconDefault]}>
              <MaterialIcons name="auto-awesome" size={18} color={Colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{isPlus ? 'Plus is active' : 'Hassle Plus'}</Text>
              <Text style={styles.rowSublabel}>
                {isPlus
                  ? 'Thank you for supporting Hassle 💜'
                  : 'The core app stays free. Plus adds extra tools and supports development.'}
              </Text>
            </View>
            <MaterialIcons
              name={isPlus ? 'check-circle' : 'chevron-right'}
              size={20}
              color={isPlus ? Colors.success : Colors.textSubtle}
            />
          </Pressable>
        </Card>

        {/* Export */}
        <SectionHeader title="Export" />
        <Card>
          <Pressable
            style={({ pressed }) => [
              styles.row,
              pressed && !exporting ? styles.rowPressed : null,
            ]}
            onPress={handleExport}
            disabled={exporting}
          >
            <View style={[styles.rowIcon, styles.rowIconDefault]}>
              {exporting ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <MaterialIcons name="picture-as-pdf" size={18} color={Colors.primary} />
              )}
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>
                {exporting ? 'Generating report\u2026' : 'Export last 7 days'}
              </Text>
              <Text style={styles.rowSublabel}>
                {exporting
                  ? 'Building your PDF, this will only take a moment.'
                  : 'Summary PDF — energy, tasks, symptoms. Share with your care team.'}
              </Text>
            </View>
            {!exporting ? (
              <MaterialIcons name="chevron-right" size={20} color={Colors.textSubtle} />
            ) : null}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.row,
              pressed && !exportingClinical ? styles.rowPressed : null,
            ]}
            onPress={handleClinicalExport}
            disabled={exportingClinical}
          >
            <View style={[styles.rowIcon, styles.rowIconDefault]}>
              {exportingClinical ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <MaterialIcons name="description" size={18} color={Colors.primary} />
              )}
            </View>
            <View style={styles.rowText}>
              <View style={styles.rowLabelRow}>
                <Text style={styles.rowLabel}>
                  {exportingClinical ? 'Generating report…' : 'Doctor-visit report'}
                </Text>
                {!isPlus ? (
                  <View style={styles.plusTag}>
                    <Text style={[styles.plusTagText, { fontFamily: ff.semibold }]}>PLUS</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.rowSublabel}>
                Last 30 days — trends plus a symptom &amp; reflection log for appointments.
              </Text>
            </View>
            {!exportingClinical ? (
              <MaterialIcons
                name={isPlus ? 'chevron-right' : 'lock'}
                size={isPlus ? 20 : 16}
                color={Colors.textSubtle}
              />
            ) : null}
          </Pressable>
        </Card>

        {/* Support */}
        <SectionHeader title="Support" />
        <Card>
          <SettingsRow
            icon="mail-outline"
            label="Contact support"
            sublabel={SUPPORT_EMAIL}
            onPress={handleContactSupport}
          />
        </Card>

        {/* About */}
        <SectionHeader title="About Hassle" />
        <View style={[styles.card, styles.aboutCard]}>
          <Text style={styles.aboutText}>
            {"Hassle is a daily planner built for bodies that don't\ncooperate."}
          </Text>
          <Text style={styles.aboutText}>
            It helps you track your energy, understand what things actually cost
            you, and plan your day without pretending you have more capacity
            than you do.
          </Text>
          <Text style={styles.aboutText}>
            Designed for chronic illness, fatigue, and neurodivergent brains,
            it works with your body — not against it.
          </Text>
          <View style={styles.aboutDivider} />
          <Text style={styles.aboutFootnote}>
            No productivity pressure. No guilt. Just honest tracking and
            realistic days.
          </Text>
        </View>

        {/* Privacy note */}
        <SectionHeader title="Privacy" />
        <View style={[styles.card, styles.privacyCard]}>
          <View style={styles.privacyRow}>
            <MaterialIcons name="lock-outline" size={16} color={Colors.textSubtle} />
            <Text style={styles.privacyText}>
              No analytics. No tracking. No accounts. Your data never leaves
              your device.
            </Text>
          </View>
        </View>

        {/* Version */}
        <Text style={[styles.version, { fontFamily: ff.regular }]}>Version {APP_VERSION}</Text>
      </ScrollView>

      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingBottom: Spacing.xxxl,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: Fonts.bold,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  sectionHeader: {
    fontSize: FontSizes.xs,
    fontWeight: Fonts.semibold,
    color: Colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  card: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  // ── Profile panel ──────────────────────────────────────────────────────────
  profileCard: {
    padding: Spacing.md,
  },
  profileLabel: {
    fontSize: FontSizes.base,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  profileHint: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  profileInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.base,
    color: Colors.text,
  },
  conditionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  conditionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
  },
  conditionChipSelected: {
    backgroundColor: Colors.primaryFaint,
    borderColor: Colors.primary,
  },
  conditionChipText: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
  },
  conditionChipTextSelected: {
    color: Colors.primaryLight,
  },
  // ── Info card ──────────────────────────────────────────────────────────────
  infoCard: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  infoIconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  infoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    flexShrink: 0,
  },
  infoTextBlock: {
    flex: 1,
    gap: 4,
  },
  infoTitle: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.semibold,
    color: Colors.text,
    lineHeight: 22,
  },
  infoDesc: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  infoFootnote: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  // ── Settings rows ─────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowNoBorder: {
    borderBottomWidth: 0,
  },
  rowPressed: {
    backgroundColor: Colors.surfaceElevated,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowIconDefault: {
    backgroundColor: Colors.primaryFaint,
  },
  rowIconDestructive: {
    backgroundColor: Colors.flareFaint,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.medium,
    color: Colors.text,
  },
  rowLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  plusTag: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  plusTagText: {
    fontSize: 9,
    color: Colors.background,
    letterSpacing: 0.8,
  },
  rowLabelDestructive: {
    color: Colors.flare,
  },
  rowSublabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    lineHeight: 18,
  },
  // ── Reminder settings ──────────────────────────────────────────────────────
  freqBlock: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  freqLabel: {
    fontSize: FontSizes.xs,
    fontWeight: Fonts.medium,
    color: Colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  freqOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  freqOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaint,
  },
  freqRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceDark,
    flexShrink: 0,
  },
  freqRadioSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  freqOptionText: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    fontWeight: Fonts.medium,
    flex: 1,
  },
  freqOptionTextSelected: {
    color: Colors.primary,
  },
  reminderNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: Spacing.xs,
  },
  reminderNoteText: {
    flex: 1,
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  // ── Default tasks panel ────────────────────────────────────────────────────
  defaultTasksPanel: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  defaultTasksHint: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  defaultTasksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  defaultTaskChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radius.lg,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  defaultTaskChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  defaultTaskChipText: {
    fontSize: FontSizes.sm,
    fontWeight: Fonts.medium,
    color: Colors.text,
  },
  defaultTaskChipTextSelected: {
    color: Colors.background,
  },
  defaultTasksCount: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  // ── About card ─────────────────────────────────────────────────────────────
  aboutCard: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  aboutText: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    lineHeight: 24,
    maxWidth: ABOUT_TEXT_WIDTH,
  },
  aboutDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  aboutFootnote: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  // ── Privacy card ───────────────────────────────────────────────────────────
  privacyCard: {
    padding: Spacing.md,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  privacyText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    lineHeight: 20,
  },
  // ── Version ────────────────────────────────────────────────────────────────
  version: {
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    fontStyle: 'italic',
  },
  futureNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  futureNoteText: {
    flex: 1,
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
