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

- `index.ts` is intentionally self-contained so it can be pasted into the Supabase dashboard editor without missing local module imports. It handles HTTP, CORS, request validation, safe fallbacks, prompt templates, request/response types, and Anthropic transport.
- `prompt.ts` and `types.ts` are kept as source references for local development, but dashboard copy-paste deploys should use the full `index.ts`.
