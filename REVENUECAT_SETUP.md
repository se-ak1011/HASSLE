# RevenueCat + In-App Purchase setup

**Why RevenueCat, not Stripe:** Apple requires digital subscriptions inside an
iOS app to use StoreKit (In-App Purchase). Stripe-in-app would be rejected.
RevenueCat wraps StoreKit (and Google Play Billing) behind one SDK + dashboard,
handles the free trial, restores, and entitlements, and is free under ~$2.5k/mo.

The app already has the seam: `services/billing.ts` and `contexts/PlusContext.tsx`.
You only need to install the SDK, create the products, and flip `isConfigured`.

## 1. App Store Connect — create the subscription
1. **Apps → Hassle → Subscriptions** → create a Subscription Group (e.g. "Hassle Plus").
2. Add a subscription: **£4.99 / month**, auto-renewing.
3. Add an **Introductory Offer → Free trial → 14 days** (new subscribers).
4. Fill the localization + review screenshot (Apple requires one).
5. (Android later) mirror this in Google Play Console.

## 2. RevenueCat dashboard
1. Create a project, add your iOS app (bundle id `com.hassle.app`).
2. Paste your App Store Connect **In-App Purchase key** (App Store Connect →
   Users and Access → Integrations).
3. Create an **Entitlement** with identifier **`plus`** (this exact string —
   it's what `billing.ts` checks via `PLUS_ENTITLEMENT`).
4. Create an **Offering** and attach the £4.99/mo product (with the trial) to it.
5. Copy your **public SDK key** (Apple).

## 3. Install + configure the SDK
```bash
npx expo install react-native-purchases
```
Add config once at startup (e.g. in `app/_layout.tsx`), keyed to the Supabase
user when signed in so comps/entitlements follow the account:
```ts
import Purchases from 'react-native-purchases';
Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_RC_IOS_KEY!, appUserID: supabaseUserId ?? null });
```

## 4. Turn the seam on
- In `services/billing.ts`: set `isConfigured = true` and uncomment the
  `Purchases.*` calls (they're already written in comments).
- In `components/ui/PaywallModal.tsx`: point the primary button at
  `billing.purchasePlus()`, then call the Plus context's `restore()` so the new
  entitlement flows into `isPlus`. (Today it calls the beta `unlock()`.)
- Add a "Restore purchases" link (App Store requires one) → `restore()`.

## 5. Test
- IAP only works on a **dev/standalone build**, not Expo Go.
- Use a **Sandbox tester** account (App Store Connect → Sandbox). Sandbox
  purchases don't charge real money, and the 14-day trial is time-compressed.

> Note: requires a paid Apple Developer account (you have one) and the app's
> Paid Apps agreement signed in App Store Connect.
