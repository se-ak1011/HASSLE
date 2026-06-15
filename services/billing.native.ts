/**
 * Hassle — Billing (native).
 *
 * TEMPORARILY a no-op stub. RevenueCat (`react-native-purchases`) is NOT called
 * at runtime — we're ruling it out as a startup crash while still in the free
 * beta, where Plus unlocks free via the local flag / Supabase comps, so NOTHING
 * is lost by disabling it.
 *
 * The full RevenueCat implementation lives in git history and will be restored
 * when in-app purchases are wired for launch (see REVENUECAT_SETUP.md). Because
 * RevenueCat never runs unless `Purchases.configure()` is called, leaving the
 * native module linked but un-called is completely safe.
 */

import { Billing, PLUS_ENTITLEMENT } from './billing.types';

export { PLUS_ENTITLEMENT };
export type { PurchaseResult } from './billing.types';

export const billing: Billing = {
  isConfigured: false,
  async configure() {
    /* RevenueCat disabled in beta */
  },
  async hasPlusEntitlement() {
    return false;
  },
  async purchasePlus() {
    return { ok: false, error: 'not_configured' };
  },
  async restore() {
    return false;
  },
};
