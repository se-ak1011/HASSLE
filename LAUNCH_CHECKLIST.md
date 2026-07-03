# Hassle — Launch Checklist

Status legend: ✅ done in code · 🟡 needs you (dashboard/console) · ⬜ not started

## 1. Backend (Supabase)
- ✅ Client, RLS schema, auth + sync code wired.
- 🟡 Run `supabase/migrations/0001_init_sync.sql` (sync tables + RLS).
- 🟡 Run `supabase/migrations/0002_comps.sql` (tester comps + RLS).
- 🟡 Enable **Apple** and **Google** providers + redirect URL `hassle://auth-callback`
  (see `SUPABASE_SETUP.md`).
- ⬜ Sign in on a dev build and confirm a row appears in Auth → Users, and that
  sync writes to `days`/`preferences`.

## 2. Give testers Plus free forever
1. Tester signs in once (Account & sync).
2. Supabase → Authentication → Users → copy their **User UID**.
3. SQL Editor:
   ```sql
   insert into public.comps (user_id, note) values ('<their-uid>', 'Beta tester');
   ```
4. They get Plus free, forever, on next open. Delete the row to revoke.
   (During the open beta, Plus is free for everyone anyway via the local unlock.)

## 3. Billing (RevenueCat — NOT Stripe)
- ✅ Entitlement seam (`services/billing.ts`) + multi-source `PlusContext`.
- 🟡 Follow `REVENUECAT_SETUP.md`: create the £4.99/mo + 14-day-trial product,
  the `plus` entitlement, install `react-native-purchases`, flip `isConfigured`.
- ⬜ Repoint the paywall button from `unlock()` → `billing.purchasePlus()` and add
  a **Restore purchases** link (Apple requires it).
- ⚠️ **Before charging anyone:** the current "Start free trial" button just grants
  Plus locally for free. That's intended for the beta — swap it for real IAP
  before a paid launch, or everyone gets Plus free.

## 4. Privacy & App Store data
- ✅ `PRIVACY_POLICY.md` drafted (local-first, optional sync, no tracking).
- ✅ GitHub Pages URLs prepared in `/docs`.
- 🟡 Enable GitHub Pages deployment, then put the live privacy URL in App Store Connect.
- 🟡 **App Privacy "nutrition labels"** in App Store Connect. With sync enabled, declare:
  - **Health & Fitness** — *App Functionality*, linked to user, **not** used for tracking.
  - **User Content** (notes/tasks) — App Functionality, linked, not for tracking.
  - **Identifiers** (user id) + **Contact Info** (email, unless Hide My Email) —
    App Functionality, linked, not for tracking.
  - No data used for tracking; no third-party SDKs.

## 5. Build & quality
- ⬜ `npx tsc --noEmit` clean (I can't run it in this environment — do this first;
  it's the one thing most likely to surface issues).
- ⬜ Run the test suite, if any.
- ⬜ `eas build --profile production` for iOS; smoke-test on a real device:
  onboarding (incl. name), check-in, tasks, move/coming-up, reflect, patterns,
  Plus tab → library/directory/report, **PDF save + print**, sign-in, sync.

## 6. App Store Connect listing
- 🟡 App name, subtitle, description, keywords done in `STORE_LISTINGS.md`; support,
  marketing, and privacy URLs now point to GitHub Pages.
- ⬜ Screenshots (the Lola pages photograph well).
- ⬜ Age rating questionnaire; category (Health & Fitness or Medical — Health &
  Fitness is usually the safer/faster review).
- ⬜ Paid Apps agreement signed (needed for IAP).

## 7. TestFlight → Submit
- ⬜ Upload build, internal/external TestFlight testers.
- ⬜ Address review notes (health apps: don't make medical claims — the library's
  "information, not medical advice" framing already helps here).

## 8. Legal & required paperwork
- ✅ `PRIVACY_POLICY.md` + `TERMS_OF_SERVICE.md` drafted.
- ✅ GitHub Pages files added under `/docs` for `/`, `/privacy/`, and `/terms/`.
- 🟡 Enable Pages so these URLs go live:
  - `https://se-ak1011.github.io/HASSLE/`
  - `https://se-ak1011.github.io/HASSLE/privacy/`
  - `https://se-ak1011.github.io/HASSLE/terms/`
- 🟡 Put the URLs in: App Store Connect (Privacy Policy URL), Play Console, and the
  Google OAuth consent screen (privacy + terms links).
- 🔴 **Account deletion (required for App Store, guideline 5.1.1(v)):** because we
  offer sign-in, the app must let users delete their account in-app. Today we have
  "Clear all app data" (local) + sign-out, but **not** account deletion. Needs a
  small Supabase **Edge Function** (service_role) to delete the auth user + their
  rows, plus a "Delete account" button. Not blocking for TestFlight; **blocking for
  public launch.** (Ask me to build it when you're ready.)
- ⬜ EULA: Apple's standard EULA applies by default; our Terms cover the rest. No
  action unless you want a custom EULA.
- ⬜ (Optional) Add in-app Privacy/Terms links in Settings once URLs are live.

## 9. Quick reference — the two gates
**READY FOR TESTING (free TestFlight beta):**
1. `npx tsc --noEmit` clean (after `expo install react-native-purchases`)
2. Supabase migrations 0001 + 0002 run; Google sign-in works on a dev build
3. `eas build` dev/preview → smoke-test every feature on a real device
4. Comp yourself via the `comps` table → confirm Plus
(Subscriptions can stay in beta-free mode. Apple sign-in optional for internal testers.)

**READY FOR LAUNCH (public App Store) — all of the above plus:**
1. Apple Sign In enabled + flip `APPLE_SIGNIN_ENABLED = true`
2. Account deletion shipped (Edge Function) — §8
3. RevenueCat: Monthly product + `plus` entitlement + current Offering; swap to the
   `appl_…` key; test a sandbox purchase
4. Privacy + Terms live on GitHub Pages (or your own domain); URLs in ASC / Play / Google consent; App Privacy labels
5. Listing copy (`STORE_LISTINGS.md`) + screenshots; Paid Apps agreement
6. Production build → submit (Android later)
