/**
 * Companion — contextual illustration mapping for Lola's poses.
 *
 * Each key represents a screen context. To change a companion pose
 * app-wide, edit only this file. Screens should never hardcode image
 * paths — always reference a key from this map.
 */

export const Companion = {
  /** Home screen — the main tappable navigation presence. Swap this one key when the dedicated Home Lola lands. */
  Home: require('@/assets/companion/wave Background Removed.png'),

  /** App-level splash/onboarding visual. Swap when the character sheet asset lands; native splash config stays untouched. */
  Splash: require('@/assets/companion/lola-asleep Background Removed.png'),

  /** First launch / onboarding welcome */
  FirstLaunch: require('@/assets/companion/wave Background Removed.png'),

  /** Quiet Time screen — calm, listening presence */
  QuietTime: require('@/assets/companion/listening Background Removed.png'),

  /** I'm Struggling / emotional support context */
  Struggling: require('@/assets/companion/comfort Background Removed.png'),

  /** Doctor Report / paperwork context */
  Report: require('@/assets/companion/paperwork Background Removed.png'),

  /** Directory — exploring and navigating */
  Directory: require('@/assets/companion/walking Background Removed.png'),

  /** Library / Research — reading and learning */
  Library: require('@/assets/companion/reading Background Removed.png'),

  /** Insights / Patterns screen */
  Insights: require('@/assets/companion/clipboard Background Removed.png'),

  /** Wrap Up Today / end-of-day check-in */
  WrapUp: require('@/assets/companion/journal Background Removed.png'),

  /** Reflect screen — journaling and writing */
  Reflect: require('@/assets/companion/writing Background Removed.png'),

  /** Gentle Movement screen */
  GentleMovement: require('@/assets/companion/stretch Background Removed.png'),

  /** Flare Day — rest and recovery */
  Flare: require('@/assets/companion/blanket Background Removed.png'),

  /** AI loading / thinking state */
  Loading: require('@/assets/companion/coffee Background Removed.png'),

  /** Body support / pacing / tasks */
  Body: require('@/assets/companion/support Background Removed.png'),
  BodyPain: require('@/assets/companion/comfort Background Removed.png'),
  BodyFatigue: require('@/assets/companion/blanket Background Removed.png'),
  BodySymptoms: require('@/assets/companion/clipboard Background Removed.png'),
  BodyMedication: require('@/assets/companion/coffee Background Removed.png'),
  BodySelfCare: require('@/assets/companion/stretch Background Removed.png'),

  /** Life admin hub */
  Life: require('@/assets/companion/walking Background Removed.png'),

  /** Settings / Account / generic screens */
  Settings: require('@/assets/companion/standing Background Removed.png'),
} as const;

export type CompanionKey = keyof typeof Companion;
