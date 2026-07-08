import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { HomeBackButton } from '@/components/ui/HomeBackButton';
import { LolaMenu } from '@/components/ui/LolaMenu';
import { Companion } from '@/constants/companion';

export default function BodyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <HomeBackButton />
        <Text style={[styles.headerTitle, { fontFamily: ff.semibold }]}>Body</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false}>
        <LolaMenu
          companion={Companion.GentleMovement}
          size="page"
          chips={[
            { key: 'coach', label: 'AI Coach', position: 'upperLeft', onPress: () => router.push('/ai-coach' as any), highlighted: true },
            { key: 'redesign', label: 'Redesign soon', position: 'upperRight', onPress: () => {} },
            { key: 'quiet', label: 'Quiet Time', position: 'lowerLeft', onPress: () => router.push('/quiet-time' as any) },
            { key: 'life', label: 'Life', position: 'lowerRight', onPress: () => router.push('/life' as any) },
          ]}
        />
        <View style={styles.card}>
          <Text style={[styles.title, { fontFamily: ff.bold }]}>Body support is being redesigned.</Text>
          <Text style={[styles.body, { fontFamily: ff.regular }]}>The old spoons, battery, and day-planning tracker is out of the main flow. Lola can hold this place until the new prompt is ready.</Text>
          <Pressable style={({ pressed }) => [styles.button, pressed && { opacity: 0.75 }]} onPress={() => router.push('/ai-coach' as any)} accessibilityRole="button" accessibilityLabel="Open AI Coach">
            <MaterialIcons name="auto-awesome" size={18} color={Colors.background} />
            <Text style={[styles.buttonText, { fontFamily: ff.semibold }]}>Talk to Lola</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { color: Colors.text, fontSize: FontSizes.lg },
  scroll: { paddingHorizontal: Spacing.lg },
  card: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.md },
  title: { color: Colors.text, fontSize: FontSizes.xxl, lineHeight: 34 },
  body: { color: Colors.textMuted, fontSize: FontSizes.base, lineHeight: 24 },
  button: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: 12 },
  buttonText: { color: Colors.background, fontSize: FontSizes.base },
});
