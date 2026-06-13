# Supabase setup (one-time)

The app code is already wired (`services/supabase.ts`, `services/syncService.ts`,
`contexts/AccountContext.tsx`). These are the dashboard/console steps only you can do.

## 1. Create the database tables

Supabase dashboard → **SQL Editor** → paste the contents of
`supabase/migrations/0001_init_sync.sql` → **Run**.

This creates `preferences`, `days`, `scheduled_tasks` and—critically—turns on
**Row-Level Security** so the public anon key can only ever touch the signed-in
user's own rows.

## 2. Add the app redirect URL

Dashboard → **Authentication → URL Configuration → Redirect URLs**, add:

```
hassle://auth-callback
```

(The app's URL scheme is `hassle`, set in `app.json`.)

## 3. Sign in with Apple  ✅ you have the developer account

Dashboard → **Authentication → Providers → Apple** → enable.
You'll need, from the Apple Developer portal:
- a **Services ID** (this becomes the OAuth client id),
- a **Sign in with Apple Key** (.p8) + its Key ID + your Team ID.

Paste those into the Supabase Apple provider form. Supabase's page has the exact
field-by-field guide. Apple's redirect/return URL is:
`https://zimfzvjnlzgmwiegzpcw.supabase.co/auth/v1/callback`

## 4. Sign in with Google  — yes, your Google Developer Console is the place

"Google Auth" just means a Google **OAuth client**, which you create in the
**Google Cloud Console** (the same console you already have):

1. Google Cloud Console → create/select a project.
2. **APIs & Services → OAuth consent screen** → configure (External, add app
   name + your email). You can leave it in "Testing" while developing.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
4. Application type: **Web application**.
5. Under **Authorized redirect URIs**, add exactly:
   ```
   https://zimfzvjnlzgmwiegzpcw.supabase.co/auth/v1/callback
   ```
6. Copy the generated **Client ID** and **Client secret**.
7. Supabase dashboard → **Authentication → Providers → Google** → enable, paste
   the Client ID + secret → save.

That's it — no extra Google libraries needed; we use the OAuth web flow via the
system browser.

## 5. Testing note

The OAuth flow opens the system browser and returns to `hassle://auth-callback`.
This works in a **dev/standalone build** (the kind you already make for TestFlight).
In plain Expo Go the custom scheme can be flaky, so test sign-in on a dev build.
Apple specifically requires a real build, not the simulator's Expo Go.

If a provider isn't configured yet, tapping its button fails gracefully with a
message — the rest of the app (fully usable offline) is unaffected.
