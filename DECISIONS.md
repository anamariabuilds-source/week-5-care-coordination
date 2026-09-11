# Implementation Decisions

## Commit 1 — Application foundation

- Use the Next.js App Router with TypeScript and plain CSS so the classroom slice remains small and inspectable.
- Keep the four required views together on one page for the initial shell; later behavior can be added without introducing unnecessary routes.
- Place the simulated-data warning in the root layout so it remains visible throughout the application.
- Use invented placeholder facility content only and explicitly label it as simulated.
- Keep this milestone static. Workflow authority, consent behavior, questionnaire behavior, appointment transitions, confirmation evidence, and AI remain deferred to later approved commits.

Tomorrow's first move: define simulated case and facility fixtures plus Zod schemas for the Facility Verification Record, consent, and confirmation evidence.

## Commit 2 — Data and structured signal

- Model the fixed Facility Verification Questionnaire separately from the stored Facility Verification Record.
- Preserve procedure, uncertainty, source, timestamp, and operator approval as validated fields rather than presentation-only labels.
- Treat empty operational facts as `null` and display them as **Not confirmed** instead of inventing defaults.
- Require a separate human operator action to change a pending manual record into an approved record.
- Include an explicitly stale approved fixture without creating a numeric freshness threshold.

Tomorrow's first move: implement and test deterministic workflow guards for provider next step, scoped consent, navigator request authority, confirmation evidence, and terminal refusal/revocation.

## Commit 3 — Core deterministic workflow

- Derive booking status from validated inputs so confirmation cannot remain stale after its evidence is removed.
- Treat refusal and revocation as terminal honored-choice states that disable all workflow contact actions.
- Keep support-person permission off by default and independent from scheduling consent.
- Represent facility denial and unsupported clinical-document transfer as explicit non-confirmed states.

Tomorrow's first move: prepare the first deterministic deployment, then add the bounded server-side Gemini proposal route without changing workflow authority.

## Commit 4 — Bounded AI integration

- Use a server-only Gemini REST request with `GEMINI_API_KEY`; never expose the key through a public environment variable.
- Accept one request property containing simulated facility-call notes and reject obvious patient/clinical-document content before any model call.
- Validate model JSON with Zod and keep proposals non-authoritative until two explicit steps: copy to review, then human approval.
- Preserve the complete manual questionnaire when the key, service, JSON, or validation fails.

Tomorrow's first move: configure the server-only Gemini key in Vercel, verify the integrated deployment, then add boundary-focused automated tests.

## Commit 5 — Tests and hardening

- Fix the production Gemini structured-output request to use the OpenAPI nullable schema dialect required by the `generateContent` endpoint.
- Cover load-bearing workflow, schema, confirmation invalidation, and AI-input boundaries with Vitest.
- Add an explicit demo control for removing confirmation evidence so the derived state visibly downgrades immediately.
- Keep rendering in React text nodes; no untrusted HTML rendering API is used.

Tomorrow's first move: verify the automatically deployed Commit 5 Gemini happy path and perform the planned high-value browser flows against Deploy 2.

## Temporary production diagnostic

- Log only sanitized Gemini upstream status, error status/message, model name, and JSON-parse outcome; never log notes, headers, credentials, or environment values.
- Use the stable `gemini-2.5-flash` model, which the official model documentation lists as supporting structured outputs.
- Remove the temporary diagnostic after the production failure is identified and fixed.

Tomorrow's first move: capture the sanitized Gemini production error, fix only its root cause, then remove the temporary diagnostic logging.

### Production diagnosis result

- The sanitized upstream response was HTTP 404 `NOT_FOUND`: `gemini-2.5-flash` was unavailable to new users and the API directed new users to `gemini-3.6-flash`.
- Keep GenerateContent and change only the model identifier because the official Gemini documentation lists `gemini-3.6-flash` as stable and supporting structured outputs.

Tomorrow's first move: verify the `gemini-3.6-flash` production response, then remove the temporary diagnostic logger after success.
