/**
 * notificationService.ts
 *
 * Handles scheduling and cancelling local push notifications
 * for Hassle reminders. Uses expo-notifications.
 *
 * Designed to be low-pressure — reminders are off by default
 * and completely user-controlled.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ReminderFrequency } from '@/constants/types';
import { getActiveRegionConfig } from '@/localization/RegionContext';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Time-of-day message pools. Evening leans into "wrap up your day" — the nudge
// that brings people back to close the loop — and reassures that even logging
// just your energy counts (no typing required).
type Slot = 'morning' | 'midday' | 'evening';

// Built as a function (not a module const) so region-specific bodies resolve
// with the user's active region at schedule time, not at import time.
function reminderMessages(): Record<Slot, { title: string; body: string }[]> {
  return {
    morning: [
      { title: 'Morning 💜', body: "Whenever you're ready — set today's energy." },
      { title: 'New day', body: 'No pressure. A quick check-in when you can.' },
      { title: 'Hey there', body: "How's your energy today? Tap to start." },
    ],
    midday: [
      { title: 'Quick check-in', body: getActiveRegionConfig().copy.middayCheckOff },
      { title: 'Still here', body: 'A gentle nudge — no need to do much.' },
    ],
    evening: [
      { title: 'Winding down', body: 'How did today go? Tap to wrap up your day.' },
      { title: 'Before bed', body: 'Want to close out today? Even just your energy counts.' },
      { title: 'End of day', body: 'Whatever got done, got done. Tap to log it.' },
    ],
  };
}

function messageFor(slot: Slot) {
  const pool = reminderMessages()[slot];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Request notification permissions.
 * Returns true if granted, false otherwise.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Check current notification permission status without prompting.
 */
export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status as 'granted' | 'denied' | 'undetermined';
  } catch {
    return 'undetermined';
  }
}

/**
 * Cancel all scheduled Hassle notifications.
 */
export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // silent
  }
}

/**
 * Schedule daily reminders based on the chosen frequency. Every level includes
 * an evening wind-down — the nudge that helps people come back and close the day.
 *
 * low    → evening wind-down (19:30)
 * medium → morning (10:00) + evening (19:30)
 * high   → morning (09:00) + midday (14:00) + evening (19:30)
 */
export async function scheduleReminders(frequency: ReminderFrequency): Promise<boolean> {
  if (frequency === 'off') {
    await cancelAllReminders();
    return true;
  }

  const granted = await requestNotificationPermissions();
  if (!granted) return false;

  await cancelAllReminders();

  const schedules: { hour: number; minute: number; slot: Slot }[] = [];

  if (frequency === 'low') {
    schedules.push({ hour: 19, minute: 30, slot: 'evening' });
  } else if (frequency === 'medium') {
    schedules.push({ hour: 10, minute: 0, slot: 'morning' });
    schedules.push({ hour: 19, minute: 30, slot: 'evening' });
  } else if (frequency === 'high') {
    schedules.push({ hour: 9, minute: 0, slot: 'morning' });
    schedules.push({ hour: 14, minute: 0, slot: 'midday' });
    schedules.push({ hour: 19, minute: 30, slot: 'evening' });
  }

  try {
    for (const time of schedules) {
      const msg = messageFor(time.slot);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: msg.title,
          body: msg.body,
          sound: false,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: time.hour,
          minute: time.minute,
        },
      });
    }
    return true;
  } catch {
    return false;
  }
}
