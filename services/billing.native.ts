/**
 * Hassle — Billing (native / RevenueCat).
 *
 * Metro loads this file on iOS/Android (the `.native` platform extension);
 * web uses billing.ts instead. So `react-native-purchases` is only ever bundled
 * into native builds — the web preview stays clean.
 *
 * All imports of `react-native-purchases` are lazy (inside each function via
 * `require()`) so the module is never evaluated at initialisation time. This
 * prevents the SSR bundler from walking into the native module and tripping over
 * `expo-modules-core`'s broken pnpm resolution.
 *
 * Requires `react-native-purchases` (`npx expo install react-native-purchases`)
 * and a dev/standalone build — IAP does not run in Expo Go.
 *
 * Dashboard prerequisites (see REVENUECAT_SETUP.md): an Offering marked
 * "current" containing the £4.99/mo product, and an entitlement named `plus`.
 */

import { Billing, PLUS_ENTITLEMENT } from './billing.types';

export { PLUS_ENTITLEMENT };
export type { PurchaseResult } from './billing.types';

// Public SDK key. The `test_…` key is RevenueCat's Test Store (lets you test
// the flow before App Store Connect products exist). Swap to your `appl_…` key
// for the real App Store launch. Read from env so it's easy to change.
const RC_KEY =
  process.env.EXPO_PUBLIC_RC_IOS_KEY ?? 'test_oeFBDgIxhShVpguNBARInVVcPwr';

// Lazily require the native module — evaluated only when a billing function is
// actually called on-device, never during SSR/web bundling.
function getPurchases() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('react-native-purchases').default as typeof import('react-native-purchases').default;
}

let configured = false;

function ensureConfigured(appUserId?: string | null) {
  if (configured) return;
  const Purchases = getPurchases();
  Purchases.configure({ apiKey: RC_KEY, appUserID: appUserId ?? null });
  configured = true;
}

export const billing: Billing = {
  isConfigured: true,

  async configure(appUserId) {
    try {
      ensureConfigured(appUserId);
    } catch {
      // silent — leave user on free tier if the SDK can't start
    }
  },

  async hasPlusEntitlement() {
    try {
      ensureConfigured();
      const Purchases = getPurchases();
      const info = await Purchases.getCustomerInfo();
      return typeof info.entitlements.active[PLUS_ENTITLEMENT] !== 'undefined';
    } catch {
      return false;
    }
  },

  async purchasePlus() {
    try {
      ensureConfigured();
      const Purchases = getPurchases();
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages?.[0];
      if (!pkg) return { ok: false, error: 'no_offering' };
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return { ok: typeof customerInfo.entitlements.active[PLUS_ENTITLEMENT] !== 'undefined' };
    } catch (e: any) {
      if (e?.userCancelled) return { ok: false, error: 'cancelled' };
      return { ok: false, error: e?.message ?? 'purchase_failed' };
    }
  },

  async restore() {
    try {
      ensureConfigured();
      const Purchases = getPurchases();
      const info = await Purchases.restorePurchases();
      return typeof info.entitlements.active[PLUS_ENTITLEMENT] !== 'undefined';
    } catch {
      return false;
    }
  },
};
