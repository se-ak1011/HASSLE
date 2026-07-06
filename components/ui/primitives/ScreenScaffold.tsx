import { ReactNode } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';

type ScreenScaffoldProps = {
  children: ReactNode;
  scroll?: boolean;
  depthLayer?: boolean;
  floatingContent?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function ScreenScaffold({
  children,
  scroll = true,
  depthLayer = false,
  floatingContent,
  style,
  contentStyle,
}: ScreenScaffoldProps) {
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;

  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      {depthLayer ? <View pointerEvents="none" style={styles.depthLayer} /> : null}
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
      {floatingContent ? <View style={styles.floating}>{floatingContent}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Colors.background, flex: 1 },
  depthLayer: {
    backgroundColor: Colors.primaryFaint,
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
    height: 180,
    left: 0,
    opacity: 0.35,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, gap: Spacing.lg, padding: Spacing.lg },
  floating: { bottom: Spacing.lg, left: Spacing.lg, position: 'absolute', right: Spacing.lg },
});
