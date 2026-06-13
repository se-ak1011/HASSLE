
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

/**
 * Supabase client — lazily initialised to avoid SSR crashes.
 *
 * `react-native-url-polyfill` and AsyncStorage both reference `window`, which
 * doesn't exist when Expo Router renders statically on the server. By deferring
 * the import and construction to the first actual call we keep the module safe
 * to import anywhere while still getting a real client on device.
 *
 * URL + anon key are PUBLIC by design (they ship in the app). Security comes
 * from Row-Level Security on every table — see supabase/migrations — so the
 * anon key can only ever touch the signed-in user's own rows. The service_role
 * secret must never live in the client.
 */

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://zimfzvjnlzgmwiegzpcw.supabase.co';

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppbWZ6dmpubHpnbXdpZWd6cGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzODA3MjYsImV4cCI6MjA5Njk1NjcyNn0.o5e-yzoabPG0R2cQ11PlFnuWrrEUjnArYtXH6FEkZF0';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;

  // These imports reference `window` / browser globals, so they must only run
  // on the native/client side — never during SSR static rendering.
  // The error message "Definition for rule '@typescript-eslint/no-require-imports' was not found"
  // indicates an ESLint configuration issue, not a TypeScript syntax error.
  // The comments are ESLint directives and do not affect TypeScript compilation.
  // Removing them is the minimal change to resolve the *apparent* error from the perspective of a linter setup.
  require('react-native-url-polyfill/auto');
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;

  _client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return _client;
}

/**
 * Proxy that forwards every property access to the lazily-created client.
 * Consumers can use `supabase.from(...)`, `supabase.auth`, etc. exactly as
 * before — the lazy init is transparent.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    // Skip proxy overhead during SSR (no-ops will be handled by callers
    // checking for a signed-in user before making any DB calls).
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      // Return a safe no-op for auth so AccountContext doesn't crash.
      if (prop === 'auth') {
        return {
          getSession: async () => ({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          getUser: async () => ({ data: { user: null }, error: null }),
          signInWithOAuth: async () => ({ data: null, error: new Error('SSR') }),
          signOut: async () => ({ error: null }),
          setSession: async () => ({ data: null, error: null }),
          exchangeCodeForSession: async () => ({ data: null, error: null }),
        };
      }
      return () => ({});
    }
    return getClient()[prop as keyof SupabaseClient];
  },
});
