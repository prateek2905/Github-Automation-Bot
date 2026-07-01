# GitHub Automation Bot

An event-driven bot that reacts to GitHub activity and acts on it — adding labels, posting comments, and sending Slack notifications — based on rules you configure in a dashboard.

## What it does

1. Sign in with GitHub and connect repositories via a GitHub App installation.
2. GitHub delivers webhooks to the bot when issues are opened, pull requests are created, or code is pushed.
3. The bot evaluates your configured rules against each event and runs the matching actions: add a label, post a comment, send a Slack message.
4. A live dashboard shows every event received and every action taken, with failure history and retry status.

## Architecture

- **Backend**: Node + Express on Render. Webhook receiver persists events immediately and ACKs 200; a background worker handles rule evaluation and external calls with exponential-backoff retry.
- **Frontend**: React + Vite + Tailwind on Vercel. Polls the event/action log every 4s.
- **Database**: Neon Postgres via Prisma. Stores users, installations, repos, rules, events, and action logs.
- **Auth**: GitHub App (JWT + installation tokens) for webhook delivery and write-back; GitHub OAuth for user sign-in; our own short-lived JWT for dashboard sessions.

## Run locally

### Prerequisites

- Node 18+
- A [Neon](https://neon.tech) Postgres database
- A [GitHub App](https://github.com/settings/apps/new) configured (see below)
- A [Slack Incoming Webhook](https://api.slack.com/messaging/webhooks) URL
- [smee.io](https://smee.io) or ngrok to proxy GitHub webhooks to localhost

### Backend

```bash
cd backend
cp .env.example .env
# fill in all values in .env
npm install
node node_modules/prisma/build/index.js migrate deploy
npm run dev
```

Start a webhook proxy (in a separate terminal):
```bash
npx smee-client --url https://smee.io/<your-channel> --target http://localhost:3000/webhook/github
```

Set the GitHub App's webhook URL to your smee.io channel URL during local dev.

### Frontend

```bash
cd frontend
cp .env.example .env
# set VITE_API_URL=http://localhost:3000
npm install
npm run dev
```

Open `http://localhost:5173`.

## Environment variables

See `backend/.env.example` for the full list with descriptions. Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon pooled Postgres connection string |
| `JWT_SECRET` | Random secret for signing session JWTs |
| `GITHUB_APP_ID` | Numeric App ID from GitHub App settings |
| `GITHUB_APP_PRIVATE_KEY_BASE64` | Base64-encoded `.pem` private key |
| `GITHUB_APP_CLIENT_ID` | OAuth client ID (user sign-in) |
| `GITHUB_APP_CLIENT_SECRET` | OAuth client secret |
| `GITHUB_APP_WEBHOOK_SECRET` | Shared secret for HMAC signature verification |
| `GITHUB_APP_SLUG` | App slug for the installation link |
| `SLACK_WEBHOOK_URL` | Incoming webhook URL from Slack |

Frontend: `VITE_API_URL` — public URL of the deployed backend.

## Deployment

- **Backend**: Render web service, root directory `backend`, build command `npm install && node node_modules/prisma/build/index.js generate && node node_modules/prisma/build/index.js migrate deploy`, start `node index.js`.
- **Frontend**: Vercel, root directory `frontend`, env var `VITE_API_URL=<render-url>`.
- **Keep-alive**: GitHub Actions cron (`.github/workflows/keepalive.yml`) pings `/health` every 10 minutes to prevent Render free-tier sleep.

Live URL: **https://prateek-gh-bot.vercel.app**

## Testing

### Happy path

1. Open an issue in a connected repo with title containing `bug`.
2. If you have a rule: event type `issues`, match field `title`, match type `contains`, match value `bug`, action `add label: bug` + `slack` — the bot should add the label and post to Slack within ~4 seconds.
3. Dashboard shows the event as `done` and the actions as `success`.

### Idempotency

Go to the GitHub App → Advanced → find the delivery → **Redeliver**. The label is not added again; the dashboard still shows one action entry.

### Forged webhook

```bash
curl -X POST https://github-automation-bot-pw55.onrender.com/webhook/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: issues" \
  -H "X-GitHub-Delivery: fake-id" \
  -H "X-Hub-Signature-256: sha256=invalidsignature" \
  -d '{"action":"opened"}'
```

Returns `401`. Nothing persisted.

### Failure + retry

Set `SLACK_WEBHOOK_URL` to an invalid URL in Render env vars. Open an issue that matches a slack rule. Dashboard shows action `failed`, attempts increment on each worker tick. Fix the URL — next retry succeeds.

### Auth gate

Remove the token from localStorage (or make a request without `Authorization` header). API returns `403`; dashboard redirects to `/login`.

## Demo repo

Point the GitHub App at any repo you own. Create a rule matching `issues` / `title` / `contains` / `bug` with label + Slack actions, open an issue titled `bug: something` — full flow completes in under 5 seconds.
