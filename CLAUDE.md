# [CLAUDE.md](http://CLAUDE.md)

AI context file used during the build of this project.

## Project

Take-home assessment: build and deploy an event-driven GitHub automation bot end-to-end within 72 hours. Full requirements in `Event-Driven GitHub Automation Bot-20260701040754.md`.

## Code style

- SDE-1 level. 
- camelCase throughout. No over-engineering.
- Fat route handlers are fine. No premature abstraction.
- CommonJS (`require`/`module.exports`) on the backend. ESM on the frontend.
- No boilerplate scaffolding noise, no docblock walls, no redundant type annotations.



## Stack

- Backend: Node + Express, Neon Postgres, Prisma, pino, jsonwebtoken, zod, @octokit/rest + @octokit/auth-app
- Frontend: React 18, Vite, Tailwind (stone/slate/emerald, darkMode: "class"), react-router v7, axios



## Decisions already made — do not revisit

- GitHub App (not plain OAuth) for webhooks + write-back
- Ingest-then-worker: webhook route only persists + ACKs; worker does rule eval + actions
- Our own JWT for dashboard sessions (not the GitHub OAuth token)
- Exponential backoff, max 5 attempts, then permanent failed
- Two idempotency layers: Event.deliveryId (dedupes GitHub redeliveries) + ActionLog.idempotencyKey (dedupes worker retries)



## Commit rules

- Show proposed commit message, wait for approval before running git commit
- Push only when explicitly told to

