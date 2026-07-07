import { LolaMode, LolaPrompt, OnboardingExtractData } from './types.ts';

const BASE_SYSTEM_PROMPT = [
  'You are Lola, the supportive AI companion inside Hassle.',
  'Be gentle, practical, disability-aware, neurodivergence-aware, and concise.',
  'Do not diagnose, replace medical care, or invent facts.',
  'Use only the user-provided data.',
].join(' ');

const ONBOARDING_SCHEMA = `Return only JSON with this exact shape:
{
  "preferredName": string | null,
  "countryRegion": "US" | "UK" | null,
  "physicalConditions": string[],
  "neurodivergentMentalLoadConditions": string[],
  "family": string[],
  "pets": string[],
  "hobbies": string[],
  "usualTasks": string[],
  "difficultTasks": string[],
  "reminders": string[],
  "thingsThatHelp": string[],
  "thingsThatMakeDaysHarder": string[],
  "goals": string[],
  "notes": string[]
}`;

function stringifyData(data: unknown): string {
  return JSON.stringify(data ?? {}, null, 2);
}

function onboardingPrompt(data: unknown): LolaPrompt {
  const payload = (data ?? {}) as Partial<OnboardingExtractData>;
  return {
    system: `${BASE_SYSTEM_PROMPT} Extract structured onboarding profile information. Leave unknown fields null or empty arrays. ${ONBOARDING_SCHEMA}`,
    user: stringifyData({
      transcript: payload.transcript ?? '',
      regionHint: payload.regionHint ?? null,
      existingProfile: payload.existingProfile ?? null,
    }),
  };
}

function templatePrompt(mode: LolaMode, instruction: string, data: unknown): LolaPrompt {
  return {
    system: `${BASE_SYSTEM_PROMPT} ${instruction} Return helpful structured JSON for the app to render.`,
    user: stringifyData(data),
  };
}

export function buildPrompt(mode: LolaMode, data: unknown): LolaPrompt {
  switch (mode) {
    case 'onboarding_extract':
      return onboardingPrompt(data);
    case 'journal_reflect':
      return templatePrompt(mode, 'Reflect on a journal entry with validation, patterns, and one small next step.', data);
    case 'doctor_report':
      return templatePrompt(mode, 'Summarise user-approved symptoms, patterns, and context for a medical appointment.', data);
    case 'daily_summary':
      return templatePrompt(mode, 'Summarise the day in a calm way, highlighting wins, costs, and tomorrow supports.', data);
    case 'chat':
      return templatePrompt(mode, 'Respond conversationally as Lola while staying grounded in the supplied app context.', data);
    case 'task_support':
      return templatePrompt(mode, 'Suggest accessible task support, pacing, adaptations, and lower-energy alternatives.', data);
    case 'pattern_detection':
      return templatePrompt(mode, 'Detect gentle patterns from supplied history without overclaiming or diagnosing.', data);
    case 'future_letter':
      return templatePrompt(mode, 'Draft a compassionate future letter based only on supplied user-approved context.', data);
  }
}
