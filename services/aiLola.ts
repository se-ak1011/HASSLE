import { supabase } from '@/services/supabase';
import { MENTAL_LOAD_CONDITIONS, PHYSICAL_CONDITIONS, UserPreferences } from '@/constants/types';

export type LolaMode =
  | 'onboarding_extract'
  | 'journal_reflect'
  | 'doctor_report'
  | 'daily_summary'
  | 'chat'
  | 'task_support'
  | 'pattern_detection'
  | 'future_letter'
  | 'body';

export type AiLolaRegion = 'US' | 'UK';

export type LolaRequest<TData = unknown> = {
  mode: LolaMode;
  data?: TData;
};

export type LolaResponse<TResult = unknown> = {
  ok: boolean;
  mode?: LolaMode;
  result?: TResult;
  error?: string;
  fallback?: boolean;
};

export type OnboardingExtractedProfile = {
  preferredName: string | null;
  countryRegion: AiLolaRegion | null;
  physicalConditions: string[];
  neurodivergentMentalLoadConditions: string[];
  family: string[];
  pets: string[];
  hobbies: string[];
  usualTasks: string[];
  difficultTasks: string[];
  reminders: string[];
  thingsThatHelp: string[];
  thingsThatMakeDaysHarder: string[];
  goals: string[];
  notes: string[];
};

export type OnboardingExtractData = {
  transcript: string;
  regionHint?: AiLolaRegion | null;
  existingProfile?: Partial<UserPreferences> | null;
};

const EMPTY_PROFILE: OnboardingExtractedProfile = {
  preferredName: null,
  countryRegion: null,
  physicalConditions: [],
  neurodivergentMentalLoadConditions: [],
  family: [],
  pets: [],
  hobbies: [],
  usualTasks: [],
  difficultTasks: [],
  reminders: [],
  thingsThatHelp: [],
  thingsThatMakeDaysHarder: [],
  goals: [],
  notes: [],
};

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
}


function normaliseLabel(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function hasOption(options: string[], label: string): boolean {
  const normalized = normaliseLabel(label);
  return options.some((option) => normaliseLabel(option) === normalized);
}

function addIfAvailable(target: string[], options: string[], label: string) {
  const match = options.find((option) => normaliseLabel(option) === normaliseLabel(label));
  if (match && !target.includes(match)) target.push(match);
}

function canonicalConditions(values: string[], options: string[]): string[] {
  const canonical: string[] = [];
  const add = (label: string) => addIfAvailable(canonical, options, label);

  for (const value of values) {
    const normalized = normaliseLabel(value);
    if (!normalized) continue;

    if (/\baudhd\b/.test(normalized)) {
      if (hasOption(options, 'AuDHD')) add('AuDHD');
      else {
        add('ADHD');
        add('Autism');
      }
      continue;
    }

    if (/\b(me|cfs|me cfs|chronic fatigue)\b/.test(normalized)) {
      add('ME/CFS');
      continue;
    }

    if (/\b(fibro|fibromyalgia)\b/.test(normalized)) {
      add('Fibromyalgia');
      continue;
    }

    if (/\b(eds|ehlers danlos|hypermobility)\b/.test(normalized)) {
      add('EDS / hypermobility');
      continue;
    }

    if (/\b(pots|dysautonomia)\b/.test(normalized)) {
      add('POTS / dysautonomia');
      continue;
    }

    const direct = options.find((option) => normaliseLabel(option) === normalized);
    if (direct && !canonical.includes(direct)) canonical.push(direct);
  }

  return canonical;
}

function asRegion(value: unknown): AiLolaRegion | null {
  if (value === 'US') return 'US';
  if (value === 'UK' || value === 'GB') return 'UK';
  return null;
}

function unwrapResult(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  const record = data as Record<string, unknown>;
  if (record.ok === true && 'result' in record) return record.result;
  for (const key of ['profile', 'data', 'result', 'onboardingProfile']) {
    const nested = record[key];
    if (nested && typeof nested === 'object') return nested;
  }
  return record;
}

export function normalizeOnboardingExtractResult(data: unknown): OnboardingExtractedProfile {
  const record = (unwrapResult(data) ?? {}) as Record<string, unknown>;
  return {
    ...EMPTY_PROFILE,
    preferredName: asNullableString(record.preferredName ?? record.name),
    countryRegion: asRegion(record.countryRegion ?? record.region),
    physicalConditions: canonicalConditions(asStringArray(record.physicalConditions), PHYSICAL_CONDITIONS),
    neurodivergentMentalLoadConditions: canonicalConditions(
      asStringArray(record.neurodivergentMentalLoadConditions ?? record.mentalLoadConditions),
      MENTAL_LOAD_CONDITIONS
    ),
    family: asStringArray(record.family),
    pets: asStringArray(record.pets),
    hobbies: asStringArray(record.hobbies),
    usualTasks: asStringArray(record.usualTasks),
    difficultTasks: asStringArray(record.difficultTasks),
    reminders: asStringArray(record.reminders),
    thingsThatHelp: asStringArray(record.thingsThatHelp),
    thingsThatMakeDaysHarder: asStringArray(record.thingsThatMakeDaysHarder),
    goals: asStringArray(record.goals),
    notes: asStringArray(record.notes),
  };
}

export async function invokeLola<TResult = unknown, TData = unknown>(request: LolaRequest<TData>): Promise<LolaResponse<TResult>> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-lola', { body: request });
    if (error) {
      if (__DEV__) console.warn('[ai-lola] invoke failed', { mode: request.mode, message: error.message });
      return { ok: false, mode: request.mode, error: error.message, fallback: true };
    }
    if (data && typeof data === 'object' && 'ok' in data) return data as LolaResponse<TResult>;
    if (data && typeof data === 'object' && 'result' in data) {
      return { ok: true, mode: request.mode, result: (data as { result: TResult }).result };
    }
    if (data && typeof data === 'object' && 'data' in data) {
      return { ok: true, mode: request.mode, result: (data as { data: TResult }).data };
    }
    return { ok: true, mode: request.mode, result: data as TResult };
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Lola could not connect right now';
    if (__DEV__) console.warn('[ai-lola] unexpected failure', { mode: request.mode, message });
    return { ok: false, mode: request.mode, error: message, fallback: true };
  }
}

export async function extractOnboardingProfileWithLola(data: OnboardingExtractData): Promise<OnboardingExtractedProfile> {
  const response = await invokeLola<OnboardingExtractedProfile, OnboardingExtractData>({
    mode: 'onboarding_extract',
    data,
  });
  if (!response.ok) throw new Error(response.error ?? 'Lola could not organise onboarding');
  return normalizeOnboardingExtractResult(response.result);
}

export async function reflectWithLola<TData = unknown>(data: TData): Promise<LolaResponse> {
  return invokeLola({ mode: 'journal_reflect', data });
}

export async function summarizeDoctorReportWithLola<TData = unknown>(data: TData): Promise<LolaResponse> {
  return invokeLola({ mode: 'doctor_report', data });
}

export async function summarizeDayWithLola<TData = unknown>(data: TData): Promise<LolaResponse> {
  return invokeLola({ mode: 'daily_summary', data });
}

export async function getTaskSupportWithLola<TData = unknown>(data: TData): Promise<LolaResponse> {
  return invokeLola({ mode: 'task_support', data });
}

export async function detectPatternsWithLola<TData = unknown>(data: TData): Promise<LolaResponse> {
  return invokeLola({ mode: 'pattern_detection', data });
}

export async function writeFutureLetterWithLola<TData = unknown>(data: TData): Promise<LolaResponse> {
  return invokeLola({ mode: 'future_letter', data });
}

export type BodyLolaCategory = 'pain' | 'fatigue' | 'symptoms' | 'medication' | 'self-care';

export type BodyLolaData = {
  category: BodyLolaCategory;
  selected: {
    primary: string[];
    secondary?: string[];
  };
  transcript: string;
  voiceRequested?: boolean;
  instruction: string;
};

export async function tellLolaAboutBody(data: BodyLolaData): Promise<LolaResponse> {
  return invokeLola({ mode: 'body', data });
}
