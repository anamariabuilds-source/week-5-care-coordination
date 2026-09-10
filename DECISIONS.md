# Implementation Decisions

## Commit 1 — Application foundation

- Use the Next.js App Router with TypeScript and plain CSS so the classroom slice remains small and inspectable.
- Keep the four required views together on one page for the initial shell; later behavior can be added without introducing unnecessary routes.
- Place the simulated-data warning in the root layout so it remains visible throughout the application.
- Use invented placeholder facility content only and explicitly label it as simulated.
- Keep this milestone static. Workflow authority, consent behavior, questionnaire behavior, appointment transitions, confirmation evidence, and AI remain deferred to later approved commits.

Tomorrow's first move: define simulated case and facility fixtures plus Zod schemas for the Facility Verification Record, consent, and confirmation evidence.
