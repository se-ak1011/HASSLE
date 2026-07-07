import { supabase } from '@/services/supabase';
import { UserPreferences } from '@/constants/types';

export type AiLolaRegion = 'US' | 'UK';

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

export type AiLolaOnboardingPayload = {
  mode: 'onboarding_extract';
  transcript: string;
  regionHint: AiLolaRegion | null;
  existingProfile?: Partial<UserPreferences>;
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

function unwrapResponse(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object') return {};
  const record = data as Record<string, unknown>;
  for (const key of ['profile', 'data', 'result', 'onboardingProfile']) {
    const nested = record[key];
    if (nested && typeof nested === 'object') return nested as Record<string, unknown>;
  }
  return record;
}

export function normalizeAiLolaOnboardingResponse(data: unknown): OnboardingExtractedProfile {
  const record = unwrapResponse(data);
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

export async function extractOnboardingProfileWithLola(payload: AiLolaOnboardingPayload): Promise<OnboardingExtractedProfile> {
  const { data, error } = await supabase.functions.invoke('ai-lola', { body: payload });
  if (error) throw error;
  return normalizeAiLolaOnboardingResponse(data);
}
