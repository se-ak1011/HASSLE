import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { Companion } from '@/constants/companion';
import { NavDrawer } from '@/components/ui/NavDrawer';

const LIFE_ITEMS = [
  { label: 'Doctor Report', detail: 'Prepare the notes you can take to a clinician.', icon: 'picture-as-pdf', route: '/report' },
  { label: 'Directory', detail: 'Find care and support people when this is ready.', icon: 'local-hospital', route: '/directory' },
  { label: 'Library', detail: 'Plain-language resources for later.', icon: 'menu-book', route: '/library' },
  { label: 'Plus', detail: 'Research and extra tools that support Hassle.', icon: 'auto-awesome', route: '/plus' },
];

export default function LifeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ff = useFontFamily();
  const [showNavDrawer, setShowNavDrawer] = useState(false);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <Pressable onPress={() => setShowNavDrawer(true)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Open menu">
          <MaterialIcons name="menu" size={24} color={Colors.textSubtle} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: ff.semibold }]}>Life</Text>
        <Pressable onPress={() => router.push('/settings' as any)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Settings">
          <MaterialIcons name="tune" size={22} color={Colors.textSubtle} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={Companion.Life} style={styles.heroImg} resizeMode="contain" />
          <Text style={[styles.title, { fontFamily: ff.bold }]}>Life admin, in one place.</Text>
          <Text style={[styles.subtitle, { fontFamily: ff.regular }]}>Reports, care-finding, resources, and Plus live here.</Text>
        </View>

        <View style={styles.list}>
          {LIFE_ITEMS.map((item) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => router.push(item.route as any)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <View style={styles.iconBubble}>
                <MaterialIcons name={item.icon as any} size={20} color={Colors.primary} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, { fontFamily: ff.semibold }]}>{item.label}</Text>
                <Text style={[styles.rowDetail, { fontFamily: ff.regular }]}>{item.detail}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.border} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <NavDrawer visible={showNavDrawer} onClose={() => setShowNavDrawer(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { fontSize: FontSizes.lg, color: Colors.text },
  scroll: { paddingHorizontal: Spacing.lg },
  hero: { alignItems: 'center', paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  heroImg: { width: 160, height: 190 },
  title: { marginTop: Spacing.md, fontSize: FontSizes.xxl, color: Colors.text, textAlign: 'center' },
  subtitle: { marginTop: Spacing.sm, fontSize: FontSizes.base, lineHeight: 24, color: Colors.textSubtle, textAlign: 'center' },
  list: { gap: Spacing.sm, marginTop: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  rowPressed: { opacity: 0.7 },
  iconBubble: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryFaint },
  rowCopy: { flex: 1, gap: 3 },
  rowTitle: { fontSize: FontSizes.base, color: Colors.text },
  rowDetail: { fontSize: FontSizes.sm, lineHeight: 20, color: Colors.textSubtle },
});
