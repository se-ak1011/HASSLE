/**
 * Hassle — Billing seam (RevenueCat).
 *
 * NOT wired yet: `react-native-purchases` isn't installed, and StoreKit IAP
 * requires a dev/standalone build (it can't run in Expo Go). This stub keeps the
 * app building and returns "not configured" everywhere, so the rest of the
 * entitlement logic (PlusContext) works today via the local unlock + Supabase
 * comp grant.
 *
 * To go live (see REVENUECAT_SETUP.md):
 *   1. `npx expo install react-native-purchases`
 *   2. Configure the SDK once at startup with your public API key + (optionally)
 *      the Supabase user id as the RevenueCat app-user-id.
 *   3. Flip `isConfigured` to true and uncomment the SDK calls below.
 *   4. Point the paywall's primary button at `billing.purchasePlus()`.
 *
 * Entitlement identifier expected in RevenueCat: "plus".
 */

// import Purchases from 'react-native-purchases';

export const PLUS_ENTITLEMENT = 'plus';

export const billing = {
  /** Flip to true once react-native-purchases is installed + configured. */
  isConfigured: false,

  /** True if the user currently holds the "plus" entitlement. */
  async hasPlusEntitlement(): Promise<boolean> {
    if (!this.isConfigured) return false;
    // const info = await Purchases.getCustomerInfo();
    // return typeof info.entitlements.active[PLUS_ENTITLEMENT] !== 'undefined';
    return false;
  },

  /** Starts the purchase flow (incl. the 14-day intro trial). */
  async purchasePlus(): Promise<{ ok: boolean; error?: string }> {
    if (!this.isConfigured) return { ok: false, error: 'not_configured' };
    // const offerings = await Purchases.getOfferings();
    // const pkg = offerings.current?.availablePackages?.[0];
    // if (!pkg) return { ok: false, error: 'no_offering' };
    // const { customerInfo } = await Purchases.purchasePackage(pkg);
    // return { ok: typeof customerInfo.entitlements.active[PLUS_ENTITLEMENT] !== 'undefined' };
    return { ok: false, error: 'not_configured' };
  },

  /** Restores prior purchases (App Store "Restore"). */
  async restore(): Promise<boolean> {
    if (!this.isConfigured) return false;
    // const info = await Purchases.restorePurchases();
    // return typeof info.entitlements.active[PLUS_ENTITLEMENT] !== 'undefined';
    return false;
  },
};
