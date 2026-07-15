import { useRouter, usePathname } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Modal, View, StyleSheet, Pressable, ScrollView, Animated } from 'react-native';
import { Text } from './AppText';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '@/constants/theme';
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
  { label: 'Home',        icon: 'home',           route: '/(tabs)' },
  { label: 'Body',        icon: 'accessibility-new', route: '/body' },
  { label: 'Mind',        icon: 'edit-note',      route: '/reflect' },
  { label: 'Life',        icon: 'folder-special', route: '/life' },
  { label: 'Quiet Time',  icon: 'spa',            route: '/quiet-time' },
];

const MORE_ITEMS: NavItem[] = [
  { label: 'Talk to Lola',  icon: 'forum',          route: '/ai-coach' },
  { label: 'Library',       icon: 'menu-book',      route: '/library' },
  { label: 'Directory',     icon: 'local-hospital', route: '/directory' },
  { label: 'Doctor Report', icon: 'picture-as-pdf', route: '/report' },
  { label: 'Plus',          icon: 'auto-awesome',   route: '/plus' },
  { label: 'Settings',      icon: 'tune',           route: '/settings' },
  { label: 'Account',       icon: 'person-outline', route: '/account' },
];

const DRAWER_WIDTH = 280;
const SLIDE_DURATION = 220;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalise the pathname so both "/quiet-time" and "quiet-time" match. */
function routeMatches(pathname: string, route: string): boolean {
  // For tab routes like "/(tabs)/index" compare after stripping the group segment
  const norm = (s: string) =>
    s.replace(/\/\(tabs\)/, '').replace(/\/index$/, '').replace(/^\//, '');
  return norm(pathname) === norm(route);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NavDrawer({ visible, onClose }: NavDrawerProps) {
  const ff = useFontFamily();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // ── Slide animation ────────────────────────────────────────────────────────
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: SLIDE_DURATION,
        useNativeDriver: true,
      }).start();
    } else {
      // Instantly reset so next open starts from off-screen
      slideAnim.setValue(-DRAWER_WIDTH);
    }
  }, [visible, slideAnim]);

  function handleNav(route: string) {
    onClose();
    if (route === '/(tabs)') {
      router.replace('/(tabs)' as any);
      return;
    }
    router.push(route as any);
  }

  function renderItem(item: NavItem, labelStyle: object) {
    const active = routeMatches(pathname, item.route);
    return (
      <Pressable
        key={item.route}
        style={({ pressed }) => [
          styles.navRow,
          active && styles.navRowActive,
          pressed && !active && styles.navRowPressed,
        ]}
        onPress={() => handleNav(item.route)}
        accessibilityRole="menuitem"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: active }}
      >
        <MaterialIcons
          name={item.icon as any}
          size={20}
          color={active ? Colors.primary : Colors.textSubtle}
          style={styles.navIcon}
        />
        <Text
          style={[
            labelStyle,
            { fontFamily: ff.medium },
            active && styles.navLabelActive,
          ]}
        >
          {item.label}
        </Text>
        {active ? <View style={styles.activeDot} /> : null}
      </Pressable>
    );
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
        <Animated.View
          style={[
            styles.drawer,
            {
              paddingTop: insets.top,
              paddingBottom: Math.max(insets.bottom, Spacing.md),
              transform: [{ translateX: slideAnim }],
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
            {MAIN_ITEMS.map((item) => renderItem(item, styles.navLabel))}

            <View style={styles.divider} />

            {/* Utility destinations */}
            {MORE_ITEMS.map((item) => renderItem(item, styles.navLabelMore))}
          </ScrollView>
        </Animated.View>

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
  navRowActive: {
    backgroundColor: Colors.primaryFaint,
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
  navLabelActive: {
    color: Colors.primary,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.sm,
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
