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

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const REMINDER_MESSAGES = [
  { title: 'Quick check-in', body: 'Want to log anything from today?' },
  { title: 'Hey there', body: 'Just checking in. How are you doing?' },
  { title: 'No pressure', body: 'Tap to log today if you have a moment.' },
  { title: 'Gentle reminder', body: 'You started your day. Want to add a task or two?' },
  { title: 'Still here', body: 'Open Hassle for a quick check-in whenever you are ready.' },
];

function randomMessage() {
  return REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
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
 * Schedule daily reminders based on the chosen frequency.
 *
 * low    → once at 10:00
 * medium → 10:00 and 15:00
 * high   → 09:00, 12:00, and 16:00
 */
export async function scheduleReminders(frequency: ReminderFrequency): Promise<boolean> {
  if (frequency === 'off') {
    await cancelAllReminders();
    return true;
  }

  const granted = await requestNotificationPermissions();
  if (!granted) return false;

  await cancelAllReminders();

  const schedules: { hour: number; minute: number }[] = [];

  if (frequency === 'low') {
    schedules.push({ hour: 10, minute: 0 });
  } else if (frequency === 'medium') {
    schedules.push({ hour: 10, minute: 0 });
    schedules.push({ hour: 15, minute: 0 });
  } else if (frequency === 'high') {
    schedules.push({ hour: 9, minute: 0 });
    schedules.push({ hour: 12, minute: 0 });
    schedules.push({ hour: 16, minute: 0 });
  }

  try {
    for (const time of schedules) {
      const msg = randomMessage();
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
