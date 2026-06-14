# First build → TestFlight, from an iPad

Everything compiles in the **cloud** (EAS Build = Expo's cloud Macs), so no Mac
is needed. `eas.json` (build profiles) is already in the repo. You need:
- a free **Expo account** (expo.dev)
- your **Apple Developer account** (you have one) — EAS sets up the certificates
  for you, interactively.

The catch on iPad: you need a place to type a few commands. Pick a path:

---

## Path A — Check your builder first (easiest if it exists)
You're building in **OnSpace**. Many app builders have a built-in **"Build" /
"Publish" / "Export to App Store"** button that runs EAS for you. If OnSpace has
one, use it — it skips everything below. If not, use Path B.

## Path B — GitHub Codespaces (a real terminal in Safari) ✅ recommended
1. On expo.dev, **create a free account**.
2. On iPad Safari, go to **github.com/se-ak1011/hassle** → green **Code** button →
   **Codespaces** tab → **Create codespace on main**. (A cloud VS Code + terminal
   opens in the browser.)
3. In the Codespace **terminal**, run:
   ```
   npm install -g eas-cli
   eas login
   ```
4. **First, a test build you can install on your iPhone** (no TestFlight yet):
   ```
   eas build --platform ios --profile preview
   ```
   - When asked about credentials, **log in with your Apple ID and let EAS manage
     them** (it creates the signing cert + provisioning profile).
   - It'll ask to **register your iPhone** — follow the link on your phone once.
   - ~15–20 min later you get an **install link** — open it on your iPhone, install,
     and test the real app + sign-in.
5. **Then, the TestFlight build** (for external testers):
   ```
   eas build --platform ios --profile production
   eas submit --platform ios --profile production --latest
   ```
   - `submit` uploads to **App Store Connect → TestFlight**. EAS will ask for an
     App Store Connect API key (it can create one) — follow the prompts.
   - In App Store Connect → TestFlight, add testers (internal = instant; external
     = a quick Apple review).

## Path C — No terminal at all (EAS build from GitHub)
If you'd rather never touch a terminal: we add an **EAS Workflow / GitHub Action**
that runs the build on push or from a "Run workflow" button on github.com (works
on iPad). It needs an `EXPO_TOKEN` secret in the GitHub repo settings. Ask me to
set this up if you prefer it.

---

## Before the build — quick checks
- **Supabase:** make sure migrations `0001` + `0002` are run, and Google sign-in
  works (you've done the redirect URL).
- **Install the IAP package** (needed for the native build to compile the billing
  file): in the Codespace terminal, `npx expo install react-native-purchases`.
- **Typecheck:** `npx tsc --noEmit` — fix anything it flags (I can help fast).
- **Icon:** confirm it's the 1024×1024, fully-opaque version.

## Notes
- The first build is the slow part (cloud queue + compile). After that, rebuilds
  are routine.
- The Home Screen **widget** is a *follow-on* build — get this plain app onto
  TestFlight first, then we add the widget target (so a widget hiccup can't block
  the app).
- TestFlight builds expire after 90 days; just rebuild to refresh.
