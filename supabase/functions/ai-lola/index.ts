import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-3-5-sonnet-latest';
const SUPPORTED_MODES = [
  'onboarding_extract',
  'journal_reflect',
  'doctor_report',
  'daily_summary',
  'chat',
  'task_support',
  'pattern_detection',
  'future_letter',
] as const;

type LolaMode = (typeof SUPPORTED_MODES)[number];

type LolaRequest<TData = unknown> = {
  mode: LolaMode;
  data?: TData;
};

type LolaSuccessResponse<T = unknown> = {
  ok: true;
  mode: LolaMode;
  result: T;
};

type LolaErrorResponse = {
  ok: false;
  mode?: LolaMode;
  error: string;
  fallback: true;
};

type OnboardingExtractData = {
  transcript: string;
  regionHint?: 'US' | 'UK' | null;
  existingProfile?: Record<string, unknown> | null;
};

type LolaPrompt = {
  system: string;
  user: string;
};

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

function templatePrompt(instruction: string, data: unknown): LolaPrompt {
  return {
    system: `${BASE_SYSTEM_PROMPT} ${instruction} Return helpful structured JSON for the app to render.`,
    user: stringifyData(data),
  };
}

function buildPrompt(mode: LolaMode, data: unknown): LolaPrompt {
  switch (mode) {
    case 'onboarding_extract':
      return onboardingPrompt(data);
    case 'journal_reflect':
      return templatePrompt('Reflect on a journal entry with validation, patterns, and one small next step.', data);
    case 'doctor_report':
      return templatePrompt('Summarise user-approved symptoms, patterns, and context for a medical appointment.', data);
    case 'daily_summary':
      return templatePrompt('Summarise the day in a calm way, highlighting wins, costs, and tomorrow supports.', data);
    case 'chat':
      return templatePrompt('Respond conversationally as Lola while staying grounded in the supplied app context.', data);
    case 'task_support':
      return templatePrompt('Suggest accessible task support, pacing, adaptations, and lower-energy alternatives.', data);
    case 'pattern_detection':
      return templatePrompt('Detect gentle patterns from supplied history without overclaiming or diagnosing.', data);
    case 'future_letter':
      return templatePrompt('Draft a compassionate future letter based only on supplied user-approved context.', data);
  }
}

function jsonResponse(body: LolaSuccessResponse | LolaErrorResponse, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isLolaMode(mode: unknown): mode is LolaMode {
  return typeof mode === 'string' && (SUPPORTED_MODES as readonly string[]).includes(mode);
}

function normaliseRequest(raw: Record<string, unknown>): LolaRequest {
  // Backwards-compatible with the earlier temporary client payload.
  if (raw.mode === 'onboarding_extract' && !('data' in raw)) {
    return {
      mode: 'onboarding_extract',
      data: {
        transcript: raw.transcript,
        regionHint: raw.regionHint,
        existingProfile: raw.existingProfile,
      },
    };
  }
  return raw as LolaRequest;
}

function parseJsonFromText(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { text };
    try {
      return JSON.parse(match[0]);
    } catch {
      return { text };
    }
  }
}

async function callAnthropic(mode: LolaMode, data: unknown): Promise<unknown> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');

  const prompt = buildPrompt(mode, data);
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: Deno.env.get('ANTHROPIC_MODEL') ?? DEFAULT_MODEL,
      max_tokens: mode === 'onboarding_extract' ? 1200 : 1600,
      temperature: 0.2,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic request failed: ${response.status} ${text}`);
  }

  const body = await response.json();
  const text = body?.content?.find((part: { type?: string; text?: string }) => part?.type === 'text')?.text;
  if (typeof text !== 'string') throw new Error('Anthropic response did not include text content');
  return parseJsonFromText(text);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed', fallback: true }, 405);

  try {
    const raw = normaliseRequest(await req.json());
    if (!isLolaMode(raw.mode)) {
      return jsonResponse({ ok: false, error: 'Unsupported Lola mode', fallback: true }, 400);
    }

    const result = await callAnthropic(raw.mode, raw.data);
    return jsonResponse({ ok: true, mode: raw.mode, result });
  } catch (error) {
    console.error('[ai-lola]', error);
    return jsonResponse({ ok: false, error: 'Lola could not answer just now', fallback: true }, 200);
  }
});
