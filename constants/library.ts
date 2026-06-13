/**
 * Hassle — Library content.
 *
 * Article-style entries for the in-app reading library (a Hassle Plus feature).
 * Every entry links out to a REAL, verified source — peer-reviewed studies,
 * clinical guidelines, or, where labelled, lived-experience essays.
 *
 * Editorial rules:
 *  - Information, not medical advice. Articles inform and link out; they never
 *    instruct on treatment.
 *  - Where evidence is mixed (e.g. pacing for pain intensity), say so in `note`.
 *  - Citations verified June 2026. Re-check before adding/altering any source.
 */

export type SourceKind = 'study' | 'guideline' | 'essay';

export interface LibrarySource {
  label: string;
  url: string;
  kind: SourceKind;
}

export interface LibraryArticle {
  id: string;
  /** Short category chip, e.g. "Pacing". */
  tag: string;
  title: string;
  /** Plain-language summary written for a tired reader. */
  body: string;
  /** Optional honesty caveat shown as a callout (mixed/contested evidence). */
  note?: string;
  sources: LibrarySource[];
}

export const LIBRARY_DISCLAIMER =
  'This is information, not medical advice. It’s here to help you understand and talk things through with your clinician — not to replace them.';

export const LIBRARY: LibraryArticle[] = [
  {
    id: 'pacing-spoons',
    tag: 'Pacing',
    title: 'Spoons, and the art of pacing',
    body: '“Spoons” is a way of describing the limited energy a chronic illness leaves you each day — coined by Christine Miserandino in 2003, explaining lupus to a friend by handing her a fistful of spoons. Each task costs a spoon, and when they’re gone, they’re gone. The medical version is activity pacing: spreading effort out and easing off before you hit the wall, instead of pushing through and crashing.',
    sources: [
      {
        label: 'Christine Miserandino — “The Spoon Theory” (2003)',
        url: 'https://www.butyoudontlooksick.com/articles/written-by-christine/the-spoon-theory/',
        kind: 'essay',
      },
    ],
  },
  {
    id: 'pem-boombust',
    tag: 'ME/CFS',
    title: 'Why “pushing through” backfires',
    body: 'In ME/CFS, overdoing it on a good day can trigger a delayed crash — post-exertional malaise (PEM) — that can last days. That’s why “push through it” so often makes things worse. In 2021 the UK’s NICE guideline stopped recommending graded exercise therapy (GET) for ME/CFS, and now advises staying within your energy limits rather than climbing a fixed exercise ladder.',
    note: 'Important: any programme based on fixed, incremental exercise increases (GET) is no longer recommended for ME/CFS. Be cautious of older advice that still promotes it.',
    sources: [
      {
        label: 'NICE Guideline NG206 — ME/CFS: diagnosis and management (2021)',
        url: 'https://www.nice.org.uk/guidance/ng206',
        kind: 'guideline',
      },
    ],
  },
  {
    id: 'pacing-pain',
    tag: 'Chronic pain',
    title: 'What pacing can (and can’t) do for pain',
    body: 'Pacing helps many people with chronic pain feel more in control and function better day to day. But it’s worth being honest with yourself about what it does: the research shows pacing reliably helps with fatigue, stiffness, and smoothing out the boom–bust swings — it doesn’t reliably lower pain intensity itself. Avoiding all activity, on the other hand, consistently makes things worse.',
    note: 'The evidence here is genuinely mixed. Pacing is a tool for living better alongside pain, not a cure for it.',
    sources: [
      {
        label:
          'Andrews, Strong & Meredith (2012) — Activity pacing, avoidance, endurance & functioning in chronic pain. Arch Phys Med Rehabil.',
        url: 'https://doi.org/10.1016/j.apmr.2012.05.029',
        kind: 'study',
      },
      {
        label:
          'Guy, McKinstry & Bruce (2019) — Effectiveness of pacing as a learned strategy: a systematic review. Am J Occup Ther.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31120836/',
        kind: 'study',
      },
    ],
  },
  {
    id: 'rest-sleep',
    tag: 'Rest',
    title: 'When sleep doesn’t refresh you',
    body: 'If you wake up feeling like you never slept, you’re not imagining it. In ME/CFS, unrefreshing sleep is almost universal — and crucially, the fatigue often isn’t relieved by rest or sleep the way it is for other people. That’s exactly why budgeting your energy matters more than telling yourself to “just catch up on sleep.”',
    sources: [
      {
        label:
          'Maksoud et al. (2021) — Systematic Review of Sleep Characteristics in ME/CFS. Healthcare, 9(5):568.',
        url: 'https://doi.org/10.3390/healthcare9050568',
        kind: 'study',
      },
    ],
  },
  {
    id: 'mind-body',
    tag: 'Mental health',
    title: 'You’re not failing — this is common',
    body: 'Living with chronic pain or illness and also struggling with your mood is the norm, not a personal weakness. In the largest review to date, roughly 2 in 5 adults with chronic pain also had depression or anxiety — far higher than the general population. It’s a reason to be gentle with yourself, and worth mentioning to your clinician.',
    sources: [
      {
        label:
          'Aaron et al. (2025) — Prevalence of Depression and Anxiety Among Adults With Chronic Pain. JAMA Network Open.',
        url: 'https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2831134',
        kind: 'study',
      },
    ],
  },
];
