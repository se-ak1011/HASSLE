/**
 * Companion — contextual illustration mapping for Lola's poses.
 *
 * Each key represents a screen context. To change a companion pose
 * app-wide, edit only this file. Screens should never hardcode image
 * paths — always reference a key from this map.
 */

export const Companion = {
  /** Home screen — the main tappable navigation presence. Swap this one key when the dedicated Home Lola lands. */
  Home: require('@/assets/companion/wave.png'),

  /** App-level splash/onboarding visual. Swap when the character sheet asset lands; native splash config stays untouched. */
  Splash: require('@/assets/companion/wave.png'),

  /** First launch / onboarding welcome */
  FirstLaunch: require('@/assets/companion/wave.png'),

  /** Quiet Time screen — calm, listening presence */
  QuietTime: require('@/assets/companion/listening.png'),

  /** I'm Struggling / emotional support context */
  Struggling: require('@/assets/companion/comfort.png'),

  /** Doctor Report / paperwork context */
  Report: require('@/assets/companion/paperwork.png'),

  /** Directory — exploring and navigating */
  Directory: require('@/assets/companion/walking.png'),

  /** Library / Research — reading and learning */
  Library: require('@/assets/companion/reading.png'),

  /** Insights / Patterns screen */
  Insights: require('@/assets/companion/clipboard.png'),

  /** Wrap Up Today / end-of-day check-in */
  WrapUp: require('@/assets/companion/journal.png'),

  /** Reflect screen — journaling and writing */
  Reflect: require('@/assets/companion/writing.png'),

  /** Gentle Movement screen */
  GentleMovement: require('@/assets/companion/stretch.png'),

  /** Flare Day — rest and recovery */
  Flare: require('@/assets/companion/blanket.png'),

  /** AI loading / thinking state */
  Loading: require('@/assets/companion/coffee.png'),

  /** Body support / pacing / tasks */
  Body: require('@/assets/companion/support.png'),
  BodyPain: require('@/assets/companion/comfort.png'),
  BodyFatigue: require('@/assets/companion/blanket.png'),
  BodySymptoms: require('@/assets/companion/clipboard.png'),
  BodyMedication: require('@/assets/companion/coffee.png'),
  BodySelfCare: require('@/assets/companion/stretch.png'),

  /** Life admin hub */
  Life: require('@/assets/companion/walking.png'),

  /** Settings / Account / generic screens */
  Settings: require('@/assets/companion/standing.png'),
} as const;

export type CompanionKey = keyof typeof Companion;
