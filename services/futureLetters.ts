/**
 * futureLetters.ts
 *
 * "Letters to yourself" — write a letter, seal it, and open it later (in a
 * month, 6 months, a year, or 3 years). Letters live locally on the device.
 *
 * The seal is date-based and authoritative: a letter is sealed until its
 * openAt date, whether or not notifications are allowed. If notifications are
 * granted, we also schedule a gentle nudge for the day it unseals.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { requestNotificationPermissions } from '@/services/notificationService';

const STORAGE_KEY = 'hassle_future_letters_v1';

export type SealDuration = '1m' | '6m' | '1y' | '3y';

export type FutureLetter = {
  id: string;
  body: string;
  createdAt: number; // ms epoch
  openAt: number; // ms epoch — sealed until this moment
  duration: SealDuration;
  notificationId?: string | null;
};

export const SEAL_OPTIONS: { key: SealDuration; label: string; months: number }[] = [
  { key: '1m', label: '1 month', months: 1 },
  { key: '6m', label: '6 months', months: 6 },
  { key: '1y', label: '1 year', months: 12 },
  { key: '3y', label: '3 years', months: 36 },
];

function addMonths(from: Date, months: number): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function isOpen(letter: FutureLetter, now = Date.now()): boolean {
  return now >= letter.openAt;
}

export function openDateLabel(letter: FutureLetter): string {
  return new Date(letter.openAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

export async function loadLetters(): Promise<FutureLetter[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as FutureLetter[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function saveLetters(list: FutureLetter[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // silent — the letter still lives in memory for this session
  }
}

async function scheduleUnsealNotification(openAt: number): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return null;
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'A letter is ready 💜',
        body: 'A letter you sealed for yourself can be opened now.',
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(openAt),
      },
    });
  } catch {
    return null;
  }
}

export async function addLetter(body: string, duration: SealDuration): Promise<FutureLetter> {
  const now = new Date();
  const months = SEAL_OPTIONS.find(o => o.key === duration)?.months ?? 1;
  const openAt = addMonths(now, months).getTime();
  const notificationId = await scheduleUnsealNotification(openAt);
  const letter: FutureLetter = {
    id: `letter_${now.getTime()}_${Math.floor(Math.random() * 1e6)}`,
    body: body.trim(),
    createdAt: now.getTime(),
    openAt,
    duration,
    notificationId,
  };
  const list = await loadLetters();
  const next = [letter, ...list];
  await saveLetters(next);
  return letter;
}

export async function deleteLetter(id: string): Promise<FutureLetter[]> {
  const list = await loadLetters();
  const target = list.find(l => l.id === id);
  if (target?.notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(target.notificationId);
    } catch {
      // silent
    }
  }
  const next = list.filter(l => l.id !== id);
  await saveLetters(next);
  return next;
}

/** Count of letters currently sealed (not yet openable). */
export function sealedCount(list: FutureLetter[], now = Date.now()): number {
  return list.filter(l => !isOpen(l, now)).length;
}

/** Count of letters that have unsealed and are ready to read. */
export function openCount(list: FutureLetter[], now = Date.now()): number {
  return list.filter(l => isOpen(l, now)).length;
}
