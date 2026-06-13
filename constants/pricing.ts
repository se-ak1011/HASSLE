/**
 * Hassle Plus — pricing constants.
 *
 * Kept in one place so the paywall, store config, and any future billing
 * integration read the same source of truth. The USD figure mirrors Apple's
 * price tier for £4.99 (≈ $6.99) and is shown as approximate.
 */

export const PLUS_PRICE_GBP = '£4.99';
export const PLUS_PRICE_USD = '$6.99'; // ≈ Apple tier for £4.99; shown as approximate
export const PLUS_PERIOD = 'month';
export const PLUS_TRIAL_DAYS = 14;

/** e.g. "£4.99/month" */
export const PLUS_PRICE_LABEL = `${PLUS_PRICE_GBP}/${PLUS_PERIOD}`;
