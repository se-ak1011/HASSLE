# Hassle — Localisation Audit & Refactor Plan

Goal: support multiple regions from one codebase. Initially 🇺🇸 US (default) + 🇬🇧 UK,
architected so 🇨🇦 CA / 🇦🇺 AU / 🇮🇪 IE are trivial to add later. **No UI redesign, no
functionality change** — architectural refactor only.

Status: **AUDIT COMPLETE.** Refactor not yet started (awaiting sign-off on architecture
+ the decisions at the end).

---

## 1. Headline findings

1. **No i18n framework exists.** Every user-facing string is an inline JSX literal.
   `UserPreferences` has no region field. There is no locale concept anywhere.
   Total user-facing strings to externalise: **~300+** across ~30 files.

2. **Far less *hard* UK data than the brief assumes — this is good news.** The app was
   already written with mostly *neutral* medical language: it says **"clinician"**,
   **"doctor"**, **"pharmacy"**, **"care team"**, **"appointments"** — NOT "GP", "A&E",
   "chemist", "NHS". So the GP↔PCP / A&E↔ER / chemist↔pharmacy swaps mostly don't have
   existing UK strings to fix — they're terminology we design *into* the resource files
   for future content.

3. **`directory.tsx` is a "coming soon" placeholder.** There is **no** specialist
   directory data, **no** hardcoded emergency numbers (999/911), and **no** support-org
   lists anywhere in the app *today*. The "emergency contacts / crisis numbers /
   organisations" requirement is therefore **forward-looking**: we build the data
   structure now so it's region-aware from day one, but there's nothing to migrate yet.

4. **The genuinely region-specific content that exists today is small and specific:**
   | What | Where | US ← → UK |
   |---|---|---|
   | Pricing (GBP-primary, wrong for US-default) | `constants/pricing.ts` | `$6.99` primary ← → `£4.99` primary |
   | Clinical guideline source | `constants/library.ts:56,60-61` | CDC/IOM ← → NICE NG206 |
   | UK institution source | `constants/library.ts:157-158` | US source ← → Brighton & Sussex Med School |
   | Idiom "School run" | `constants/types.ts:163` | "School drop-off" ← → "School run" |
   | Idiom "Tick anything off" | `services/notificationService.ts:36` | "Check anything off" ← → "Tick..." |
   | Spelling "judgement" | `app/(tabs)/index.tsx:143`, `app/checkin.tsx:93` | "judgment" ← → "judgement" |
   | Spelling "realise" | `app/onboarding.tsx:136` | "realize" ← → "realise" |
   | Spelling (labelled/programme/recognised) | `constants/library.ts` (several) | US ← → UK |
   | Date order + calendar week-start | `services/dates.ts`, `components/ui/MoveTaskModal.tsx` | Mon/Day, Sunday-first ← → Day/Mon, Monday-first |

5. **Dates are already device-locale-driven** (`toLocaleDateString(undefined, …)`), so
   US vs UK ordering *auto-adapts to the phone* — but there is **no app-level override**,
   so a US user with a UK phone (or vice-versa) won't follow the in-app region toggle.
   The calendar week-start is hardcoded to US Sunday (`MoveTaskModal` has no `firstDay`).

---

## 2. Proposed architecture (dependency-light, typed)

```
localization/
  region.ts        # Region type + list + default ('US'); maps region -> BCP47 locale
  strings.ts       # t(key, vars?) reader; useT() hook; falls back to en-US
  resources.ts     # region content loader; useResources() hook
  RegionContext.tsx# provider; reads/writes prefs.region; re-renders app on change

locales/
  en-US.json       # UI STRINGS (the ~300 externalised copy strings)
  en-GB.json       # only the strings that DIFFER from en-US (rest inherit)

resources/
  us.json          # region CONTENT: terminology, pricing, crisis/emergency,
  uk.json          #   support orgs, clinical sources, professional titles, help links
```

**Principles**
- `en-GB.json` / `uk.json` only need to hold the *overrides* — anything absent falls
  back to the US default, so adding CA/AU/IE later = one small overrides file each.
- Region lives in `UserPreferences.region` (persisted like `energyMode`), default `'US'`.
- Changing region in Settings updates a React context → whole app re-renders instantly.
- Decouple **condition IDs from display names** (`conditions.ts` ↔ `types.ts` are
  currently coupled by string key) so names can be localised without breaking the link.
- Dates/calendar read locale from the active region (`en-US`/`en-GB`), not the device.
- **Strings vs Resources split:** `locales/` = wording of the SAME concept
  (translation/spelling). `resources/` = region-specific *facts* (a phone number, an
  org name, a guideline body, a price). Never hardcode either in a component.

---

## 3. Master checklist — every file requiring localisation

Legend: **[S]** externalise strings · **[R]** region-specific content → resources ·
**[F]** formatting/locale logic · **[—]** no action.

### Screens (`app/`)
- [ ] `app/(tabs)/_layout.tsx` — **[S]** 5 tab titles (Today/Reflect/Patterns/Plus/Settings)
- [ ] `app/(tabs)/index.tsx` — **[S]** ~45 strings; **fix "judgement"→"judgment" (L143)**
- [ ] `app/(tabs)/patterns.tsx` — **[S]** ~25 strings + plural helpers (day/days, task/tasks)
- [ ] `app/(tabs)/plus.tsx` — **[S]** ~14 strings; pricing via resources
- [ ] `app/(tabs)/reflect.tsx` — **[S]** ~38 strings (guided prompts, flare cards, empty states)
- [ ] `app/(tabs)/settings.tsx` — **[S]** ~55 strings **+ ADD "Country / Region" setting** (insert after L477; copy the reminder-frequency radio pattern L189-215)
- [ ] `app/onboarding.tsx` — **[S]** ~40 strings; **fix "realise"→"realize" (L136)**
- [ ] `app/checkin.tsx` — **[S]** ~20 strings; **fix "judgement"→"judgment" (L93)**
- [ ] `app/account.tsx` — **[S]** ~25 strings
- [ ] `app/report.tsx` — **[S]** ~20 strings
- [ ] `app/directory.tsx` — **[S]** ~9 strings; **[R]** design data model region-aware (no data to migrate yet)
- [ ] `app/library.tsx` — **[S]** ~8 shell strings (content lives in constants/library.ts)
- [ ] `app/_layout.tsx` — **[S]** 2 strings ("Loading… 🦴", "(Maybe)")
- [ ] `app/+not-found.tsx` — **[S]** 3 strings (leftover template; low priority)
- [—] `app/index.tsx` — routing only

### Components (`components/`)
- [ ] `components/ui/PaywallModal.tsx` — **[S]** ~14 + **[R]** pricing (flip to USD-primary) ⚠️
- [ ] `components/ui/AddTaskModal.tsx` — **[S]** ~13 (placeholder "pharmacy" wording)
- [ ] `components/ui/CompletionModal.tsx` — **[S]** ~11 (OPTIONS copy table L21-49)
- [ ] `components/ui/MoveTaskModal.tsx` — **[S]** ~9 + **[F]** calendar `firstDay` (Sunday/Monday), relative-day labels
- [ ] `components/ui/EnergyBar.tsx` — **[S]** ~7 (spoon/spoons, stat labels)
- [ ] `components/ui/TaskCard.tsx` — **[S]** ~7 (badges, a11y labels) + **[F]** date
- [ ] `components/ErrorBoundary.tsx` — **[S]** ~7
- [—] `components/ui/AppText.tsx` — font wrapper, no copy
- [ ] `template/ui/context.tsx` — **[S]** 1 (default 'OK' alert button); rest passed in by callers
- [~] `template/auth/*` — dozens of auth error strings behind `@ts-nocheck` vendored SDK; **defer** unless login UI renders them verbatim

### Constants (`constants/`)
- [ ] `constants/pricing.ts` — **[R]** GBP-primary → region pricing (ideally store-driven) ⚠️ HIGH
- [ ] `constants/library.ts` — **[S]** ~40 article strings + **[R]** NICE/BSMS → US sources ⚠️ HIGH
- [ ] `constants/types.ts` — **[S]/[R]** seed content (PREMADE_TASKS incl. "School run", ONBOARDING_TASK_OPTIONS, HEADER_QUOTES, REMINDER_FREQUENCY_LABELS, PRESET_CONDITIONS, BUILT_IN_TAGS)
- [ ] `constants/conditions.ts` — **[S]/[R]** ~90 condition/symptom-tag strings; decouple keys from names
- [—] `constants/lola.ts`, `constants/theme.ts`, `constants/Colors.ts` — technical, no copy

### Services (`services/`)
- [ ] `services/exportService.ts` — **[S]** ~40 PDF/HTML template strings + **[F]** `lang="en"`→locale, 4 date formatters ⚠️ HIGH
- [ ] `services/notificationService.ts` — **[S]** 16 push strings (incl. "Tick off" idiom)
- [ ] `services/dates.ts` — **[F]** add explicit locale override (US/UK) instead of device-only
- [ ] `services/formatCost.ts` — **[S]** spoon/% labels (region-neutral, just extract)
- [—] `services/storage.ts`, `services/widgetData.ts` — technical (pass-through data only)

### Contexts (`contexts/`)
- [ ] `contexts/AccountContext.tsx` — **[S]** 5 auth error strings
- [ ] `contexts/DayContext.tsx` — **[S]** 1 ('General' default category); seeds localised tags
- [—] `contexts/PlusContext.tsx` — technical

### New files to create
- [ ] `localization/region.ts`, `strings.ts`, `resources.ts`, `RegionContext.tsx`
- [ ] `locales/en-US.json`, `locales/en-GB.json`
- [ ] `resources/us.json`, `resources/uk.json`
- [ ] Wire `RegionProvider` into `app/_layout.tsx` provider stack

---

## 4. Region content model (resources/*.json starter shape)

```jsonc
{
  "region": "US",
  "locale": "en-US",
  "currency": { "code": "USD", "symbol": "$", "priceLabel": "$6.99/month" },
  "calendar": { "firstDay": 0 },              // 0 = Sunday (US); UK = 1 (Monday)
  "terminology": {
    "primaryCareDoctor": "Primary Care Physician",  // UK: "GP"
    "emergencyRoom": "Emergency Room",              // UK: "A&E"
    "pharmacy": "Pharmacy",                         // UK: "Chemist"
    "counselor": "Counselor",                       // UK: "Counsellor"
    "healthSystem": "your insurance / provider"     // UK: "the NHS"
  },
  "emergency": { "crisis": "911", "mentalHealth": "988", "nonEmergency": "211" },
  //           UK: crisis "999", mentalHealth "116 123" (Samaritans), nonEmergency "111"
  "clinicalSources": { "mecfs": { "label": "CDC — ME/CFS", "url": "https://www.cdc.gov/me-cfs/" } },
  //                   UK: { "label": "NICE Guideline NG206", "url": "https://www.nice.org.uk/guidance/ng206" }
  "organisations": []   // future: support orgs; US crisis lines vs Samaritans/Mind
}
```

---

## 5. Suggested phasing (so it's reviewable, not one giant diff)

- **Phase 0 — Foundation:** region.ts, RegionContext, prefs.region, Settings toggle, the
  strings/resources loaders. App behaves identically; nothing visibly changes yet.
- **Phase 1 — Region-specific content:** pricing (USD-primary), library clinical sources,
  the 2 idioms, spellings, date/calendar locale. This is the actual "US vs UK" behaviour.
- **Phase 2 — String externalisation:** migrate the ~300 neutral strings into
  `locales/en-US.json` screen-by-screen (mechanical; UI identical).
- **Phase 3 — Future-proofing hooks:** directory/emergency data model wired to resources
  (ready for when that feature ships).

---

## 6. Decisions needed before Phase 1 (see chat)

1. **Pricing:** show the **store-provided localised price** (RevenueCat `priceString`,
   auto-correct in every country) vs region-toggled hardcoded strings?
2. **US clinical sources:** OK for me to substitute **CDC ME/CFS** guidance for the UK's
   NICE NG206 (and a US source for the BSMS citation), for you to verify?
3. **Region vs device locale:** should the in-app Region setting **override** the phone's
   locale for dates/calendar, or only set content/terminology and let dates follow the phone?
4. **Scope now:** do all 4 phases, or land Phase 0+1 (the real US/UK behaviour) first and
   do the big string-table migration (Phase 2) after?
