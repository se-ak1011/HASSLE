export type LolaMode =
  | 'onboarding_extract'
  | 'journal_reflect'
  | 'doctor_report'
  | 'daily_summary'
  | 'chat'
  | 'task_support'
  | 'pattern_detection'
  | 'future_letter';

export type LolaRequest<TData = unknown> = {
  mode: LolaMode;
  data?: TData;
};

export type LolaSuccessResponse<T = unknown> = {
  ok: true;
  mode: LolaMode;
  result: T;
};

export type LolaErrorResponse = {
  ok: false;
  mode?: LolaMode;
  error: string;
  fallback: true;
};

export type OnboardingExtractData = {
  transcript: string;
  regionHint?: 'US' | 'UK' | null;
  existingProfile?: Record<string, unknown> | null;
};

export type OnboardingExtractResult = {
  preferredName: string | null;
  countryRegion: 'US' | 'UK' | null;
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

export type LolaPrompt = {
  system: string;
  user: string;
};
