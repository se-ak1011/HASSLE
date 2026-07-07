import { useRouter } from 'expo-router';
import { Modal, View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Text } from './AppText';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Fonts, Radius } from '@/constants/theme';
import { useFontFamily } from '@/hooks/useFontFamily';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NavDrawerProps = {
  visible: boolean;
  onClose: () => void;
};

type NavItem = {
  label: string;
  icon: string;
  route: string;
};

// ─── Navigation items ─────────────────────────────────────────────────────────

const MAIN_ITEMS: NavItem[] = [
  { label: 'Home',          icon: 'home',            route: '/(tabs)/index' },
  { label: 'Insights',      icon: 'show-chart',      route: '/(tabs)/patterns' },
  { label: 'Reflect',       icon: 'edit-note',       route: '/(tabs)/reflect' },
  { label: 'Research',      icon: 'menu-book',       route: '/library' },
  { label: 'Directory',     icon: 'local-hospital',  route: '/directory' },
  { label: 'Doctor Report', icon: 'picture-as-pdf',  route: '/report' },
];

const MORE_ITEMS: NavItem[] = [
  { label: 'Plus',     icon: 'auto-awesome',   route: '/(tabs)/plus' },
  { label: 'Settings', icon: 'tune',           route: '/(tabs)/settings' },
  { label: 'Account',  icon: 'person-outline', route: '/account' },
];

const DRAWER_WIDTH = 280;

// ─── Component ────────────────────────────────────────────────────────────────

export function NavDrawer({ visible, onClose }: NavDrawerProps) {
  const ff = useFontFamily();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  function handleNav(route: string) {
    onClose();
    router.push(route as any);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>

        {/* ── Drawer panel (left) ──────────────────────────────────────────── */}
        <View
          style={[
            styles.drawer,
            {
              paddingTop: insets.top,
              paddingBottom: Math.max(insets.bottom, Spacing.md),
            },
          ]}
        >
          {/* Brand + close */}
          <View style={styles.topBar}>
            <Text style={[styles.brand, { fontFamily: ff.bold }]}>hassle</Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
            >
              <MaterialIcons name="close" size={22} color={Colors.textSubtle} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.navScroll}
            contentContainerStyle={styles.navContent}
          >
            {/* Main destinations */}
            {MAIN_ITEMS.map((item) => (
              <Pressable
                key={item.route}
                style={({ pressed }) => [styles.navRow, pressed && styles.navRowPressed]}
                onPress={() => handleNav(item.route)}
                accessibilityRole="menuitem"
                accessibilityLabel={item.label}
              >
                <MaterialIcons
                  name={item.icon as any}
                  size={20}
                  color={Colors.textSubtle}
                  style={styles.navIcon}
                />
                <Text style={[styles.navLabel, { fontFamily: ff.medium }]}>{item.label}</Text>
              </Pressable>
            ))}

            <View style={styles.divider} />

            {/* Utility destinations */}
            {MORE_ITEMS.map((item) => (
              <Pressable
                key={item.route}
                style={({ pressed }) => [styles.navRow, pressed && styles.navRowPressed]}
                onPress={() => handleNav(item.route)}
                accessibilityRole="menuitem"
                accessibilityLabel={item.label}
              >
                <MaterialIcons
                  name={item.icon as any}
                  size={20}
                  color={Colors.textSubtle}
                  style={styles.navIcon}
                />
                <Text style={[styles.navLabelMore, { fontFamily: ff.medium }]}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── Dismiss overlay (right) ──────────────────────────────────────── */}
        <Pressable
          style={styles.dismissArea}
          onPress={onClose}
          accessibilityLabel="Close menu"
          accessibilityRole="button"
        />

      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.overlay,
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: Colors.surface,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: Colors.hairline,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.hairline,
    marginBottom: Spacing.xs,
  },
  brand: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    letterSpacing: 2.5,
    textTransform: 'lowercase',
  },
  navScroll: {
    flex: 1,
  },
  navContent: {
    paddingVertical: Spacing.xs,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    minHeight: 48,
  },
  navRowPressed: {
    opacity: 0.55,
    backgroundColor: Colors.surfaceElevated,
  },
  navIcon: {
    width: 26,
    textAlign: 'center',
    marginRight: Spacing.md,
  },
  navLabel: {
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    flex: 1,
  },
  navLabelMore: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.hairline,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  dismissArea: {
    flex: 1,
  },
});
