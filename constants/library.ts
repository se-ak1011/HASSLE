/**
 * Hassle — Library content.
 *
 * Article-style entries for the free in-app reading library.
 * Every entry links out to a REAL, verified source — peer-reviewed studies,
 * clinical guidelines, or, where labeled, lived-experience essays.
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
    note: 'Important: any program based on fixed, incremental exercise increases (GET) is no longer recommended for ME/CFS. Be cautious of older advice that still promotes it.',
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
  {
    id: 'autistic-burnout',
    tag: 'Autism',
    title: 'Autistic burnout is real',
    body: 'Autistic burnout is the deep, full-body exhaustion that builds from masking, sensory load, and a world that asks for more than your supports allow. It can bring brain fog, a temporary loss of skills, and heavier sensory overwhelm — and it is not laziness or “giving up.” What helps most isn’t pushing harder; it’s rest, lighter demands, and people who accept you without asking you to perform.',
    note: 'Defined largely from autistic people’s own accounts — recognized in research, though still being formally studied.',
    sources: [
      {
        label: 'Raymaker et al. (2020) — Defining Autistic Burnout. Autism in Adulthood.',
        url: 'https://doi.org/10.1089/aut.2019.0079',
        kind: 'study',
      },
    ],
  },
  {
    id: 'audhd',
    tag: 'AuDHD',
    title: 'When autism and ADHD travel together',
    body: 'Autism and ADHD overlap far more often than people once assumed — ADHD is among the most common companions to autism, found in roughly a third of autistic people in clinical samples. (Clinicians weren’t even allowed to diagnose both together until 2013.) If you feel pulled between needing routine and craving novelty, you’re not contradictory or “doing it wrong” — that push–pull is a recognized part of being AuDHD.',
    sources: [
      {
        label:
          'Rong et al. (2021) — Prevalence of ADHD in individuals with ASD: a meta-analysis. Research in Autism Spectrum Disorders.',
        url: 'https://www.sciencedirect.com/science/article/abs/pii/S1750946721000349',
        kind: 'study',
      },
    ],
  },
  {
    id: 'fibro-neurodivergence',
    tag: 'Fibromyalgia',
    title: 'Fibro and neurodivergence often overlap',
    body: 'Chronic pain and fatigue conditions like fibromyalgia show up much more often in neurodivergent people. In recent research, adults with chronic pain or fatigue were several times more likely to meet criteria for autism or ADHD, with hypermobile, bendy joints offered as one possible biological thread. If you’re living with fibro and AuDHD at once, that combination is a known pattern — not a coincidence you imagined.',
    note: 'This link is an emerging area of research — the strongest figures come from early case-control work, so it shows association, not proven cause.',
    sources: [
      {
        label:
          'Likely neurodivergence and variant connective tissue in chronic pain/fatigue: a case-control study (2026).',
        url: 'https://www.sciencedirect.com/science/article/abs/pii/S0022395626001202',
        kind: 'study',
      },
      {
        label: 'Brighton & Sussex Medical School — plain-language summary.',
        url: 'https://www.bsms.ac.uk/about/news/2026/new-study-reveals-high-rates-of-likely-undiagnosed-autism-and-adhd-in-people-with-chronic-pain-and-fatigue.aspx',
        kind: 'essay',
      },
    ],
  },
  {
    id: 'adhd-time',
    tag: 'ADHD',
    title: 'Time blindness and the “task wall”',
    body: 'For ADHD brains, struggling to sense time and to get started isn’t a character flaw — it’s a core part of how the condition works. Judging how long something takes, and finding the very first step, lean on executive functions that ADHD makes genuinely harder. That’s exactly why breaking the day into small, visible, low-cost pieces — which is what Hassle tries to do — tends to work better than willpower.',
    sources: [
      {
        label: 'Time Perception in Adult ADHD: Findings from a Decade — A Review (2023).',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9962130/',
        kind: 'study',
      },
    ],
  },
  {
    id: 'giftedness-2e',
    tag: 'Giftedness',
    title: 'Intensity, giftedness, and being “2e”',
    body: 'Many gifted and twice-exceptional people (gifted plus something like autism, ADHD, or chronic illness) describe living turned up to eleven — intense focus, deep feelings, senses that notice everything. Dąbrowski called these “overexcitabilities.” It can be a genuine strength and genuinely tiring, especially alongside neurodivergence. Naming it can help you plan for rest instead of wondering why everything lands so hard.',
    note: 'Worth knowing: the science on giftedness and “overexcitabilities” is debated and the evidence is mixed — treat it as a useful lens, not a hard fact.',
    sources: [
      {
        label:
          'Mendaglio & Tillier (2006) — Dąbrowski’s theory & giftedness: overexcitability research findings. J. for the Education of the Gifted.',
        url: 'https://journals.sagepub.com/doi/abs/10.1177/016235320603000104',
        kind: 'study',
      },
    ],
  },
];
