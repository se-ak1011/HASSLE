import React from 'react';
import { View, StyleSheet, Pressable, Modal, Image } from 'react-native';
import { Text } from './AppText';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { Companion } from '@/constants/companion';
import { useRouter } from 'expo-router';

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

type LolaChip = {
  key: 'body' | 'mind' | 'life' | 'quiet';
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  style: object;
};

const CHIPS: LolaChip[] = [
  { key: 'body', label: 'Body', icon: 'accessibility-new', style: { left: 18, top: 134 } },
  { key: 'mind', label: 'Mind', icon: 'edit-note', style: { alignSelf: 'center', top: 24 } },
  { key: 'life', label: 'Life', icon: 'folder-special', style: { right: 18, top: 134 } },
  { key: 'quiet', label: 'Quiet Time', icon: 'spa', style: { alignSelf: 'center', bottom: 24 } },
];

export function CommandSheet({ visible, onClose, handlers = {}, context }: CommandSheetProps) {
  const ff = useFontFamily();
  const router = useRouter();

  function go(key: LolaChip['key']) {
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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close Lola actions" />
        <View style={styles.orbitCard}>
          <View style={styles.topBar}>
            <View>
              <Text style={[styles.greeting, { fontFamily: ff.bold }]}>{context === 'insights' ? 'Lola can help sort it.' : 'What would help today?'}</Text>
              <Text style={[styles.subGreeting, { fontFamily: ff.regular }]}>Choose a gentle starting point.</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
              <MaterialIcons name="close" size={22} color={Colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.orbitArea}>
            <Image source={Companion.Home} style={styles.lola} resizeMode="contain" accessibilityLabel="Lola" />
            {CHIPS.map((chip) => (
              <Pressable
                key={chip.key}
                style={({ pressed }) => [styles.chip, chip.style, pressed && styles.chipPressed]}
                onPress={() => go(chip.key)}
                accessibilityRole="button"
                accessibilityLabel={chip.label}
              >
                <MaterialIcons name={chip.icon} size={18} color={Colors.primary} />
                <Text style={[styles.chipText, { fontFamily: ff.semibold }]}>{chip.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', backgroundColor: Colors.overlay, padding: Spacing.lg },
  orbitCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, alignItems: 'flex-start' },
  greeting: { fontSize: FontSizes.xl, color: Colors.text, letterSpacing: -0.4 },
  subGreeting: { marginTop: 4, fontSize: FontSizes.sm, color: Colors.textSubtle },
  orbitArea: { height: 330, marginTop: Spacing.md, justifyContent: 'center', alignItems: 'center' },
  lola: { width: 190, height: 226 },
  chip: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 999, paddingHorizontal: Spacing.md, paddingVertical: 10, shadowColor: '#000000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  chipPressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  chipText: { fontSize: FontSizes.sm, color: Colors.text },
});
