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
- 🟡 Fill placeholders, **host it at a public URL**, put that URL in App Store Connect.
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
- ⬜ App name, subtitle, description, keywords, support URL, marketing URL.
- ⬜ Screenshots (the Lola pages photograph well).
- ⬜ Age rating questionnaire; category (Health & Fitness or Medical — Health &
  Fitness is usually the safer/faster review).
- ⬜ Paid Apps agreement signed (needed for IAP).

## 7. TestFlight → Submit
- ⬜ Upload build, internal/external TestFlight testers.
- ⬜ Address review notes (health apps: don't make medical claims — the library's
  "information, not medical advice" framing already helps here).
