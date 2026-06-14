/**
 * Hassle — Billing (web / default stub).
 *
 * This file is used on web (and anywhere the native store SDK isn't available).
 * It NEVER imports `react-native-purchases`, so the Expo Router web/SSR preview
 * bundles cleanly with no native dependency.
 *
 * The real implementation lives in `billing.native.ts`, which Metro picks
 * automatically on iOS/Android via the `.native` platform extension. Consumers
 * just `import { billing } from '@/services/billing'`.
 */

import { Billing, PLUS_ENTITLEMENT } from './billing.types';

export { PLUS_ENTITLEMENT };
export type { PurchaseResult } from './billing.types';

export const billing: Billing = {
  isConfigured: false,
  async configure() {
    /* no store on web */
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
