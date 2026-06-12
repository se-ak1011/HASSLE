import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Fonts, Radius } from '@/constants/theme';
import { PREMADE_TASKS } from '@/constants/types';
import { useDay } from '@/hooks/useDay';
import { formatCost } from '@/services/formatCost';
import { useFontFamily } from '@/hooks/useFontFamily';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Tab = 'manual' | 'premade';

export function AddTaskModal({ visible, onClose }: Props) {
  const { addTask, prefs, updateTaskDefault, day } = useDay();
  const ff = useFontFamily();
  const [tab, setTab] = useState<Tab>('premade');
  const nameInputRef = useRef<TextInput>(null);

  // Manual
  const [name, setName] = useState('');
  const [cost, setCost] = useState(3);

  // Pre-made selection
  const [selectedPremade, setSelectedPremade] = useState<
    (typeof PREMADE_TASKS)[0] | null
  >(null);
  const [premadeCost, setPremadeCost] = useState(3);
  const [saveDefault, setSaveDefault] = useState(false);

  const isFlare = day?.isFlareDay ?? false;
  const flareMultiplier = isFlare ? 1.5 : 1;

  function handleAddManual() {
    if (!name.trim()) return;
    addTask(name.trim(), cost);
    setName('');
    setCost(3);
    onClose();
  }

  function handleSelectPremade(task: (typeof PREMADE_TASKS)[0]) {
    const savedCost = prefs?.taskDefaults[task.name] ?? task.baseCost;
    setSelectedPremade(task);
    setPremadeCost(savedCost);
    setSaveDefault(false);
  }

  function handleAddPremade() {
    if (!selectedPremade) return;
    addTask(selectedPremade.name, premadeCost, selectedPremade.category, true);
    updateTaskDefault(selectedPremade.name, premadeCost, saveDefault);
    setSelectedPremade(null);
    onClose();
  }

  const handleModalShow = useCallback(() => {
    if (tab === 'manual') {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [tab]);

  function handleClose() {
    setName('');
    setCost(3);
    setSelectedPremade(null);
    onClose();
  }

  const COST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
  const energyMode = day?.energyMode ?? 'spoon';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      onShow={handleModalShow}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { fontFamily: ff.bold }]}>Add a task</Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <MaterialIcons name="close" size={22} color={Colors.textMuted} />
            </Pressable>
          </View>

          {/* Flare notice inside modal */}
          {isFlare ? (
            <View style={styles.flareNotice}>
              <MaterialIcons name="warning-amber" size={14} color={Colors.flare} />
              <Text style={[styles.flareNoticeText, { fontFamily: ff.medium }]}>
                Flare day — costs shown include ×1.5 modifier
              </Text>
            </View>
          ) : null}

          {/* Tabs */}
          <View style={styles.tabs}>
            {(['premade', 'manual'] as Tab[]).map((t) => (
              <Pressable
                key={t}
                style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
                onPress={() => {
                  setTab(t);
                  setSelectedPremade(null);
                  if (t === 'manual') {
                    setTimeout(() => nameInputRef.current?.focus(), 80);
                  }
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    tab === t && styles.tabTextActive,
                    { fontFamily: tab === t ? ff.semibold : ff.medium },
                  ]}
                >
                  {t === 'premade' ? 'Quick add' : 'Custom'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Pre-made list */}
          {tab === 'premade' && !selectedPremade ? (
            <ScrollView
              style={styles.listScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.premadeList}>
                {PREMADE_TASKS.map((task) => {
                  const baseCost =
                    prefs?.taskDefaults[task.name] ?? task.baseCost;
                  const effCost = Math.round(baseCost * flareMultiplier);
                  return (
                    <Pressable
                      key={task.name}
                      style={({ pressed }) => [
                        styles.premadeItem,
                        pressed && styles.premadeItemPressed,
                      ]}
                      onPress={() => handleSelectPremade(task)}
                    >
                      <View style={styles.premadeInfo}>
                        <Text style={[styles.premadeName, { fontFamily: ff.medium }]}>{task.name}</Text>
                        <Text style={[styles.premadeCat, { fontFamily: ff.regular }]}>{task.category}</Text>
                      </View>
                      <View style={styles.premadeCostWrap}>
                        <Text style={[styles.premadeCostBadge, isFlare && styles.premadeCostFlare, { fontFamily: ff.medium }]}>
                          {formatCost(effCost, energyMode)}
                        </Text>
                        {isFlare ? (
                          <Text style={[styles.premadeBaseCost, { fontFamily: ff.regular }]}>{formatCost(baseCost, energyMode, { base: true })}</Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          ) : null}

          {/* Pre-made edit */}
          {tab === 'premade' && selectedPremade ? (
            <View style={styles.editPremade}>
              <Pressable
                style={styles.backBtn}
                onPress={() => setSelectedPremade(null)}
              >
                <MaterialIcons name="arrow-back" size={18} color={Colors.textMuted} />
                <Text style={[styles.backText, { fontFamily: ff.medium }]}>Back</Text>
              </Pressable>
              <Text style={[styles.editTitle, { fontFamily: ff.bold }]}>{selectedPremade.name}</Text>
              <Text style={[styles.editCat, { fontFamily: ff.regular }]}>{selectedPremade.category}</Text>

              <Text style={[styles.costLabel, { fontFamily: ff.medium }]}>
                Base cost — how much does this usually take?
              </Text>
              <View style={styles.costGrid}>
                {COST_OPTIONS.map((v) => (
                  <Pressable
                    key={v}
                    style={[
                      styles.costChip,
                      premadeCost === v && styles.costChipActive,
                    ]}
                    onPress={() => setPremadeCost(v)}
                  >
                    <Text
                      style={[
                        styles.costChipText,
                        premadeCost === v && styles.costChipTextActive,
                        { fontFamily: ff.medium },
                      ]}
                    >
                      {v}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {isFlare ? (
                <View style={styles.flareEffectRow}>
                  <Text style={[styles.flareEffectLabel, { fontFamily: ff.medium }]}>Effective cost today</Text>
                  <Text style={[styles.flareEffectValue, { fontFamily: ff.bold }]}>
                    {formatCost(Math.round(premadeCost * 1.5), energyMode)}
                  </Text>
                </View>
              ) : null}

              <View style={styles.saveDefaultRow}>
                <Text style={[styles.saveDefaultLabel, { fontFamily: ff.regular }]}>
                  Save as my default for this task
                </Text>
                <Switch
                  value={saveDefault}
                  onValueChange={setSaveDefault}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>

              <Pressable
                style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
                onPress={handleAddPremade}
              >
                <Text style={[styles.addBtnText, { fontFamily: ff.semibold }]}>Add to today</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Manual entry */}
          {tab === 'manual' ? (
            <View style={styles.manualForm}>
              <Text style={[styles.inputLabel, { fontFamily: ff.medium }]}>What needs doing today?</Text>
              <TextInput
                ref={nameInputRef}
                style={[styles.input, { fontFamily: ff.regular }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Call the pharmacy..."
                placeholderTextColor={Colors.textSubtle}
                returnKeyType="done"
                blurOnSubmit={false}
                onSubmitEditing={() => nameInputRef.current?.focus()}
              />

              <Text style={[styles.costLabel, { fontFamily: ff.medium }]}>
                Base cost — how much will this usually take?
              </Text>
              <View style={styles.costGrid}>
                {COST_OPTIONS.map((v) => (
                  <Pressable
                    key={v}
                    style={[styles.costChip, cost === v && styles.costChipActive]}
                    onPress={() => setCost(v)}
                  >
                    <Text
                      style={[
                        styles.costChipText,
                        cost === v && styles.costChipTextActive,
                        { fontFamily: ff.medium },
                      ]}
                    >
                      {v}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {isFlare ? (
                <View style={styles.flareEffectRow}>
                  <Text style={[styles.flareEffectLabel, { fontFamily: ff.medium }]}>Effective cost today</Text>
                  <Text style={[styles.flareEffectValue, { fontFamily: ff.bold }]}>
                    {formatCost(Math.round(cost * 1.5), energyMode)}
                  </Text>
                </View>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  styles.addBtn,
                  !name.trim() && styles.addBtnDisabled,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={handleAddManual}
                disabled={!name.trim()}
              >
                <Text style={[styles.addBtnText, { fontFamily: ff.semibold }]}>Add to today</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: Fonts.bold,
    color: Colors.text,
  },
  flareNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.flareFaint,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.flare,
  },
  flareNoticeText: {
    fontSize: FontSizes.xs,
    color: Colors.flare,
    fontWeight: Fonts.medium,
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceDark,
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
    zIndex: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  tabBtnActive: {
    backgroundColor: Colors.surfaceElevated,
  },
  tabText: {
    fontSize: FontSizes.sm,
    fontWeight: Fonts.medium,
    color: Colors.textSubtle,
  },
  tabTextActive: {
    color: Colors.text,
    fontWeight: Fonts.semibold,
  },
  listScroll: {
    maxHeight: 340,
  },
  premadeList: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  premadeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  premadeItemPressed: {
    opacity: 0.7,
  },
  premadeInfo: {
    flex: 1,
  },
  premadeName: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.medium,
    color: Colors.text,
    marginBottom: 2,
  },
  premadeCat: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
  },
  premadeCostWrap: {
    alignItems: 'flex-end',
    marginLeft: Spacing.md,
  },
  premadeCostBadge: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    fontWeight: Fonts.medium,
  },
  premadeCostFlare: {
    color: Colors.flare,
  },
  premadeBaseCost: {
    fontSize: FontSizes.xs,
    color: Colors.textSubtle,
    marginTop: 1,
  },
  editPremade: {
    gap: Spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  backText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: Fonts.medium,
  },
  editTitle: {
    fontSize: FontSizes.xl,
    fontWeight: Fonts.bold,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  editCat: {
    fontSize: FontSizes.sm,
    color: Colors.textSubtle,
    marginTop: -Spacing.sm,
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: Fonts.medium,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  costLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSizes.base,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  costGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  costChip: {
    width: 48,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  costChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  costChipText: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.medium,
    color: Colors.text,
  },
  costChipTextActive: {
    color: Colors.background,
    fontWeight: Fonts.semibold,
  },
  flareEffectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.flareFaint,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.flare,
  },
  flareEffectLabel: {
    fontSize: FontSizes.sm,
    color: Colors.flare,
    fontWeight: Fonts.medium,
  },
  flareEffectValue: {
    fontSize: FontSizes.md,
    color: Colors.flare,
    fontWeight: Fonts.bold,
  },
  saveDefaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveDefaultLabel: {
    fontSize: FontSizes.base,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.md,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addBtnDisabled: {
    opacity: 0.35,
  },
  addBtnText: {
    fontSize: FontSizes.base,
    fontWeight: Fonts.semibold,
    color: Colors.background,
  },
  manualForm: {
    gap: Spacing.md,
  },
});
