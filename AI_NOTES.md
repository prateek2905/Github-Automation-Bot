# AI Notes

## How I worked with AI

I used Claude (Sonnet) as an implementation partner, not an autopilot. The way I split it: I owned the architecture, the data model, and every reliability/security decision; I used the AI to move fast on implementation once I'd specified the design, and to handle the repetitive surface area (Tailwind markup, CRUD route scaffolding, Prisma boilerplate) so I could spend my time on the parts that actually decide whether this thing works unattended.

Concretely, the design was mine and I drove it top-down:

- I chose the **GitHub App over a plain OAuth app**, and I understood *why* that reshapes everything (webhooks configured once at the App level, installation tokens instead of user tokens, multi-repo as a byproduct) before any code was written.
- I designed the **ingest-then-worker split** and the **event/retry state machine** — persist-then-ACK, a polling worker, exponential backoff, crash recovery on boot. This is the core of the "don't silently lose events" requirement and it was a deliberate architectural call, not something the AI suggested.
- I designed the **data model** — the six tables, the two-level idempotency (`Event.deliveryId` for GitHub redeliveries, `ActionLog.idempotencyKey` for worker retries), and the unique constraints that enforce correctness at the DB layer.

The AI then implemented against that spec. I reviewed everything it produced, corrected the parts it got wrong (see below), and rejected approaches that didn't match the design. The frontend — React dashboard, rules UI, live-polling log — I handed off almost entirely to the AI and reviewed the output; it's important but it's the least load-bearing part of the grade, so that's where I let it run.

Rough split: I made effectively all of the architectural and data-model decisions and reviewed every change before it landed; AI made most of the frontend and i was more focused on the backend.

## Decisions I made myself

**GitHub App over plain OAuth.** A plain OAuth app requires creating a webhook per repo via API and uses the user's personal token for write-back — revocable, over-scoped, and tied to an individual. The App model gives one webhook URL, short-lived installation tokens scoped to declared permissions, and multi-repo for free. More setup, but the right primitive for something that runs unattended.

**Ingest-then-worker split.** Processing the event inline during the webhook request is the trap: if Slack is slow or GitHub rate-limits, the handler times out, GitHub sees a failure and redelivers, and you double-process. Persisting the event first and ACKing 200 decouples reliability from webhook response time. The worker owns retries and backoff; the dashboard surfaces permanent failures. It's more moving parts but it's the only shape that satisfies the reliability bar.

**Postgres + Prisma with DB-level idempotency.** The data is relational (User → Installation → Repo → Rule, Event → ActionLog), so I went relational. The decision I care about most here is pushing correctness into the schema: `deliveryId` unique dedupes GitHub's redeliveries at ingest, and `idempotencyKey` unique makes worker retries safe — both enforced by the database, not by application-level checks that race.

## What I'd add with more time

- **AI triage step**: run issue/PR text through a free LLM (Gemini/Groq) to suggest a label and priority, surfaced in the Slack message and dashboard. I left a clean seam for it in the worker.

