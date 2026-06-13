import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client.
 *
 * URL + anon key are PUBLIC by design (they ship in the app). Security comes
 * from Row-Level Security on every table — see supabase/migrations — so the
 * anon key can only ever touch the signed-in user's own rows. The service_role
 * secret must never live in the client.
 *
 * Values come from EXPO_PUBLIC_* env (.env), with the project defaults as a
 * fallback so the app works out of the box.
 */

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://zimfzvjnlzgmwiegzpcw.supabase.co';

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppbWZ6dmpubHpnbXdpZWd6cGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzODA3MjYsImV4cCI6MjA5Njk1NjcyNn0.o5e-yzoabPG0R2cQ11PlFnuWrrEUjnArYtXH6FEkZF0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // No URL-based session detection in React Native.
    detectSessionInUrl: false,
  },
});
