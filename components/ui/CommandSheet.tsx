import React from 'react';
import { View, StyleSheet, Pressable, Modal } from 'react-native';
import { Text } from './AppText';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { Companion } from '@/constants/companion';
import { useRouter } from 'expo-router';
import { CompanionChip, CompanionZone } from './CompanionZone';

export type CommandSheetHandlers = {
  openBody?: () => void;
  openPlanToday?: () => void;
  openSomethingHappened?: () => void;
};

type CommandSheetProps = {
  visible: boolean;
  onClose: () => void;
  handlers?: CommandSheetHandlers;
  context?: 'insights';
};

type LolaChipKey = 'body' | 'mind' | 'life' | 'quiet';

export function CommandSheet({ visible, onClose, handlers = {}, context }: CommandSheetProps) {
  const ff = useFontFamily();
  const router = useRouter();

  function go(key: LolaChipKey) {
    onClose();
    if (key === 'body') {
      if (handlers.openBody) handlers.openBody();
      else if (handlers.openPlanToday) handlers.openPlanToday();
      else router.push('/(tabs)?body=1' as any);
      return;
    }
    if (key === 'mind') {
      if (handlers.openSomethingHappened) handlers.openSomethingHappened();
      else router.push('/reflect' as any);
      return;
    }
    if (key === 'life') {
      router.push('/life' as any);
      return;
    }
    router.push('/quiet-time' as any);
  }

  const chips: CompanionChip[] = [
    { key: 'body', label: 'Body', icon: 'accessibility-new', position: 'left', onPress: () => go('body') },
    { key: 'mind', label: 'Mind', icon: 'edit-note', position: 'top', onPress: () => go('mind') },
    { key: 'life', label: 'Life', icon: 'folder-special', position: 'right', onPress: () => go('life') },
    { key: 'quiet', label: 'Quiet Time', icon: 'spa', position: 'bottom', onPress: () => go('quiet') },
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close Lola actions" />
        <View style={styles.sheet}>
          <View style={styles.topBar}>
            <View>
              <Text style={[styles.greeting, { fontFamily: ff.bold }]}>{context === 'insights' ? 'Lola can help sort it.' : 'What would help today?'}</Text>
              <Text style={[styles.subGreeting, { fontFamily: ff.regular }]}>Choose one gentle place to start.</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
              <MaterialIcons name="close" size={22} color={Colors.textMuted} />
            </Pressable>
          </View>

          <CompanionZone companion={Companion.Home} chips={chips} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', backgroundColor: Colors.overlay, padding: Spacing.lg },
  sheet: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, alignItems: 'flex-start' },
  greeting: { fontSize: FontSizes.xl, color: Colors.text, letterSpacing: -0.4 },
  subGreeting: { marginTop: 4, fontSize: FontSizes.sm, color: Colors.textSubtle },
});
