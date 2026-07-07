# ai-lola

Single Supabase Edge Function for Hassle AI features.

## Request shape

```json
{
  "mode": "onboarding_extract",
  "data": {}
}
```

Supported modes:

- `onboarding_extract`
- `journal_reflect`
- `doctor_report`
- `daily_summary`
- `chat`
- `task_support`
- `pattern_detection`
- `future_letter`

## Secrets

This function reads `ANTHROPIC_API_KEY` from Supabase Edge Function secrets using `Deno.env.get`. Do not place provider keys in the mobile app.

Optional: `ANTHROPIC_MODEL` can override the default model.

## Prompt organisation

- `index.ts` handles HTTP, CORS, request validation, safe fallbacks, and Anthropic transport.
- `prompt.ts` owns mode-specific prompt templates.
- `types.ts` owns request/response and mode types.
