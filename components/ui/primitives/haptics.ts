import * as ExpoHaptics from 'expo-haptics';

export type HapticPolicy = 'none' | 'light' | 'medium' | 'success' | 'warning' | 'error';

export async function triggerHaptic(policy: HapticPolicy = 'light') {
  if (policy === 'none') return;
  try {
    if (policy === 'success' || policy === 'warning' || policy === 'error') {
      const notificationType =
        policy === 'success'
          ? ExpoHaptics.NotificationFeedbackType.Success
          : policy === 'warning'
            ? ExpoHaptics.NotificationFeedbackType.Warning
            : ExpoHaptics.NotificationFeedbackType.Error;
      await ExpoHaptics.notificationAsync(notificationType);
      return;
    }

    await ExpoHaptics.impactAsync(
      policy === 'medium' ? ExpoHaptics.ImpactFeedbackStyle.Medium : ExpoHaptics.ImpactFeedbackStyle.Light,
    );
  } catch {
    // Haptics are best-effort and unavailable in some runtimes.
  }
}
