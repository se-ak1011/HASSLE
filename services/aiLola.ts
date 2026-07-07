import { supabase } from '@/services/supabase';
import { UserPreferences } from '@/constants/types';

export type LolaMode =
  | 'onboarding_extract'
  | 'journal_reflect'
  | 'doctor_report'
  | 'daily_summary'
  | 'chat'
  | 'task_support'
  | 'pattern_detection'
  | 'future_letter';

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
    physicalConditions: asStringArray(record.physicalConditions),
    neurodivergentMentalLoadConditions: asStringArray(
      record.neurodivergentMentalLoadConditions ?? record.mentalLoadConditions
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
  const { data, error } = await supabase.functions.invoke('ai-lola', { body: request });
  if (error) return { ok: false, mode: request.mode, error: error.message, fallback: true };
  if (data && typeof data === 'object' && 'ok' in data) return data as LolaResponse<TResult>;
  return { ok: true, mode: request.mode, result: data as TResult };
}

export async function extractOnboardingProfileWithLola(data: OnboardingExtractData): Promise<OnboardingExtractedProfile> {
  const response = await invokeLola<OnboardingExtractedProfile, OnboardingExtractData>({
    mode: 'onboarding_extract',
    data,
  });
  if (!response.ok) throw new Error(response.error ?? 'Lola could not organise onboarding');
  return normalizeOnboardingExtractResult(response.result);
}
