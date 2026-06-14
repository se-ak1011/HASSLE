/**
 * Hassle — Conditions → symptom tags.
 *
 * When someone picks conditions during onboarding, we pre-load a small set of
 * relevant symptom tags so the check-in tag picker feels tailored from day one.
 * Everything stays optional and editable.
 *
 * Symptom lists are drawn from common, well-documented presentations of each
 * condition (sources reviewed June 2026: NHS, EDS Society, Lupus Research
 * Alliance, MS Society, plus the app's lived-experience input). They are NOT a
 * diagnostic checklist — just helpful starting tags.
 *
 * Keys must match the strings in PRESET_CONDITIONS exactly.
 */

export const CONDITION_SYMPTOM_TAGS: Record<string, string[]> = {
  Fibromyalgia: ['pain', 'fatigue', 'brain fog', 'poor sleep', 'stiffness'],
  'ME/CFS': ['post-exertional malaise', 'fatigue', 'brain fog', 'crash', 'unrefreshing sleep'],
  'EDS / Hypermobility': ['joint pain', 'subluxation', 'fatigue', 'brain fog', 'dizzy'],
  POTS: ['dizzy', 'tachycardia', 'lightheaded', 'faint'],
  ADHD: ['overwhelmed', 'distracted', 'hyperfocused', 'executive dysfunction'],
  Autism: ['overstimulated', 'shutdown', 'sensory overload', 'social fatigue'],
  Anxiety: ['anxious', 'panic', 'racing thoughts'],
  Depression: ['low mood', 'numb', 'hopeless'],
  Endometriosis: ['pelvic pain', 'period', 'cramping'],
  'Chronic Migraine': ['migraine', 'light sensitivity', 'nausea'],
  'Long COVID': ['fatigue', 'breathlessness', 'brain fog'],
  Lupus: ['fatigue', 'joint pain', 'rash', 'light sensitivity'],
  MS: ['fatigue', 'numbness', 'muscle weakness', 'brain fog', 'dizzy'],
};

/** General tags everyone gets, regardless of conditions. */
export const GENERAL_DEFAULT_TAGS: string[] = [
  'pain',
  'fatigue',
  'brain fog',
  'rested',
  'decent day',
  'low mood',
  'anxious',
  'nauseous',
  'overstimulated',
];

/**
 * Builds the symptom tags to pre-load for the chosen conditions: the general
 * defaults plus each condition's tags, de-duplicated case-insensitively (order
 * preserved). Built-in tags are stripped later by `dedupeCustomTags`.
 */
export function symptomTagsForConditions(conditions: string[]): string[] {
  const all = [...GENERAL_DEFAULT_TAGS];
  for (const c of conditions) {
    const tags = CONDITION_SYMPTOM_TAGS[c];
    if (tags) all.push(...tags);
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of all) {
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}
