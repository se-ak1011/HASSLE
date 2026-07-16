// Legal + safety copy, in one place. The in-app Legal screen (app/legal.tsx)
// renders these, and the same privacy text should be hosted at a public URL for
// App Store Connect (set PRIVACY_POLICY_URL once it's live).

export const SUPPORT_EMAIL = 'drainedstore@gmail.com';

// Public legal pages (GitHub Pages, served from /docs). Used for the App Store
// Connect listing and any external links; the in-app Legal screen mirrors them.
export const PRIVACY_POLICY_URL = 'https://se-ak1011.github.io/HASSLE/privacy/';
export const TERMS_URL = 'https://se-ak1011.github.io/HASSLE/terms/';

// Shown wherever Lola gives health-adjacent output (AI, reports) and in Settings.
export const MEDICAL_DISCLAIMER =
  "Hassle is a self-management companion — not a medical device, a diagnosis, or a substitute for professional care. Nothing here, including anything Lola says, is medical advice. Please keep following your own clinicians. If you're in crisis or think you may be in danger, contact your local emergency services or a crisis line right away.";

// Short one-liner for tight spaces (e.g. under the AI composer).
export const MEDICAL_DISCLAIMER_SHORT =
  'Lola isn’t a doctor and this isn’t medical advice. In an emergency, contact your local emergency services.';

export type LegalSection = { heading: string; body: string[] };

export const PRIVACY_POLICY: LegalSection[] = [
  {
    heading: 'The short version',
    body: [
      'Hassle is built to be private. There is no analytics and no advertising or tracking of any kind. Your entries live on your device by default, and you only share them if you choose to.',
    ],
  },
  {
    heading: 'What we store, and where',
    body: [
      'By default, everything you log — energy, symptoms, notes, journals, letters, your garden — is stored locally on your device only.',
      'If you choose to create an optional account and turn on sync, that data is stored in our secure backend (Supabase) so it can sync across your devices. Sync is off until you turn it on.',
    ],
  },
  {
    heading: 'Accounts and sign-in',
    body: [
      'Accounts are optional. If you create one, you sign in with Apple or Google, and we store the account identifier and basic profile they provide (such as name or email) to keep your data linked to you.',
      'You can delete your account and all synced data at any time from Settings. Deleting your account removes your data from our backend.',
    ],
  },
  {
    heading: 'AI features',
    body: [
      'When you use an AI feature (talking to Lola, summaries, or a doctor report), the text you send is processed by our AI provider, Anthropic, to generate a response. It is used only to produce that response and is not used to train models.',
      'Please avoid sharing information you would not want processed by a third party, and see the Health & safety note below.',
    ],
  },
  {
    heading: 'Notifications',
    body: [
      'If you turn on reminders or seal a letter to yourself, we schedule local notifications on your device. These are optional and controlled entirely by you.',
    ],
  },
  {
    heading: 'Your choices',
    body: [
      'You can export your data, clear all app data, or delete your account at any time in Settings. Clearing app data removes everything stored on the device.',
    ],
  },
  {
    heading: 'Children',
    body: [
      'Hassle is not directed at children and is intended for people aged 13 and over.',
    ],
  },
  {
    heading: 'Contact',
    body: [`Questions about your privacy? Email ${SUPPORT_EMAIL}.`],
  },
];

export const TERMS: LegalSection[] = [
  {
    heading: 'Using Hassle',
    body: [
      'Hassle is provided to help you track and plan around your energy and health. It is offered as-is, without warranties, and you use it at your own discretion.',
    ],
  },
  {
    heading: 'Not a medical service',
    body: [MEDICAL_DISCLAIMER],
  },
  {
    heading: 'Your content',
    body: [
      'What you log is yours. We do not sell your data or use it for advertising. You are responsible for the information you choose to enter and share.',
    ],
  },
  {
    heading: 'Changes',
    body: [
      'We may update the app and these terms over time. Significant changes will be reflected here.',
      `Questions? Email ${SUPPORT_EMAIL}.`,
    ],
  },
];
