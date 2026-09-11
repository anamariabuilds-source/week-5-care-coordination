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
