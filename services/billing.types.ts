/**
 * Shared billing types — imported by both billing.ts (web/stub) and
 * billing.native.ts (real RevenueCat). Kept separate to avoid a circular
 * import between the two platform files.
 */

/**
 * RevenueCat entitlement identifier — must match the entitlement's *Identifier*
 * in the RevenueCat dashboard exactly (its display name is "plus").
 */
export const PLUS_ENTITLEMENT = 'Hassle Pro';

export interface PurchaseResult {
  ok: boolean;
  error?: string;
}

export interface Billing {
  /** True on platforms where a real store SDK is available. */
  isConfigured: boolean;
  /** Configure the SDK once. `appUserId` ties purchases to the account. */
  configure(appUserId?: string | null): Promise<void>;
  /** Whether the user currently holds the `plus` entitlement. */
  hasPlusEntitlement(): Promise<boolean>;
  /** Starts the purchase flow (incl. the intro trial). */
  purchasePlus(): Promise<PurchaseResult>;
  /** Restores prior purchases. */
  restore(): Promise<boolean>;
}
