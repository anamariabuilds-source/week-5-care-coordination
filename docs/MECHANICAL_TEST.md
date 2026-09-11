# Mechanical Pass

## Production target

- URL tested: https://week-5-care-coordination.vercel.app/
- Scope: deployed classroom prototype using simulated data only.

## Before

- Existing Vitest suite: **14/14 passed**.
- Next.js production build: **passed**.
- The production application loaded and retained the manual Facility Verification Questionnaire fallback.
- Prohibited patient-level input remained blocked before Gemini.
- Client artifact and production HTML scans found no client-side Gemini API key exposure.

### Real bug 1 — unavailable model

- A valid simulated facility-note request reached the production server route.
- Gemini returned HTTP **404**, status **`NOT_FOUND`**.
- The upstream message reported that `gemini-2.5-flash` was no longer available to new users.

### Real bug 2 — incompatible response-format dialect

- After changing the model, the production request reached Gemini again.
- Gemini returned HTTP **400**, status **`INVALID_ARGUMENT`**.
- The upstream message rejected `"application/json"` at `generation_config.response_format.text.mime_type`.

## Fix

1. Replaced `gemini-2.5-flash` with `gemini-3.6-flash` while retaining the server-side GenerateContent route.
2. Removed the incompatible native Gemini structured-output configuration.
3. Instructed Gemini to return JSON-only text matching the Facility Verification proposal shape.
4. Defensively stripped optional Markdown code fences, parsed the result with `JSON.parse`, and validated it with the existing Zod schema.
5. Preserved prohibited-content blocking, mandatory human approval, and the fully usable manual fallback.

## Retest

- Vitest: **14/14 passed**.
- Next.js production build: **passed**.
- Valid simulated facility-level notes returned HTTP **200** with a Zod-validated structured proposal.
- Prohibited patient-level content returned HTTP **400** and remained blocked before Gemini.
- The manual questionnaire fallback remained available.
- Client artifact and production HTML scans found no Gemini secret exposure.

## Redeploy

- The corrected and cleaned implementation was pushed to `main` and redeployed through Vercel.
- Deploy 2 was verified at https://week-5-care-coordination.vercel.app/.
- The production app loaded, the final valid simulated facility-note request returned HTTP **200**, and the prohibited-input boundary remained enforced.

