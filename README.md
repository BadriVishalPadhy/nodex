# Nodex

**Nodex** is a self-hostable, n8n-style **workflow automation platform**. Build workflows that start from a trigger (an inbound webhook or a manual run) and fan out into an ordered chain of actions — send a Telegram message, post to a Discord channel, send an email, or hand off to an AI agent that can schedule follow-up messages on your behalf.

It is built as a TypeScript monorepo and runs as a set of small, independently-scalable services wired together by PostgreSQL and Kafka using the transactional-outbox pattern, so a triggered workflow is processed reliably, stage by stage, with at-least-once delivery and idempotent execution.

---

## Features

- **Workflow builder** — create a workflow with one trigger and an ordered list of action nodes from the web dashboard.
- **Triggers** — inbound **webhook** (`/hooks/catch/:userId/:workflow`) or **manual** execution from the dashboard.
- **Actions** — Telegram, Discord (incoming webhooks), Email (SendGrid), and an **AI Agent**.
- **AI Agent** — powered by Groq (Llama 3.3 70B). It reads the trigger context and can call a `set_timer` tool to schedule a message on any channel the workflow is configured for.
- **Scheduled messages** — schedule a one-off message to a channel at a future time; a background scheduler delivers it.
- **Template interpolation** — reference trigger payload fields inside action config with `{field}` / `{nested.field}` syntax.
- **Reliable processing** — transactional outbox → Kafka, sequential per-run stages, bounded retries with a dead-letter topic, and idempotent execution so redelivered messages never double-fire a side effect.
- **JWT auth** — email/password signup & signin with bcrypt-hashed passwords and an httpOnly session cookie.

---

## Architecture

```
                         ┌──────────────┐
   Browser ──────────────▶     web      │  Next.js dashboard (port 3000)
                         └──────┬───────┘
                                │ REST (cookie auth)
                         ┌──────▼───────┐
                         │    server    │  Express API (port 8000)
                         │  auth + CRUD │  workflows, schedules, manual runs
                         └──────┬───────┘
                                │ writes WorkFlowRun + WorkFlowOutBox
   External event              │
   (HTTP POST) ──────▶┌────────▼─────┐
                      │   webhooks   │  Inbound triggers (port 4000)
                      └────────┬─────┘
                               │
                        ┌──────▼───────┐   polls outbox (FOR UPDATE SKIP LOCKED)
                        │  PostgreSQL  │◀──────────────┐
                        └──────────────┘               │
                                               ┌───────┴──────┐
                                               │  processor   │  outbox → Kafka
                                               └───────┬──────┘
                                                       │ produces stage 0
                                                ┌──────▼──────┐
                                                │    Kafka    │  OUTBOX / OUTBOX_DLQ
                                                └──────┬──────┘
                                                       │ consumes, runs stage,
                                                       │ enqueues stage+1
                                                ┌──────▼──────┐
                                                │   workers   │  executes actions:
                                                │             │  Telegram / Discord /
                                                │  + scheduler│  Email / AI Agent
                                                └─────────────┘
```

**Flow:** a trigger creates a `WorkFlowRun` and a `WorkFlowOutBox` row in one transaction. The **processor** atomically claims outbox rows and publishes a stage-0 message to the Kafka `OUTBOX` topic. The **worker** consumes it, executes the action node whose `sortingOrder` matches the current stage, records a `ProcessedStage` marker (idempotency), then enqueues the next stage. Transient failures are retried up to 5× and then routed to `OUTBOX_DLQ`. A separate scheduler loop in the worker polls `ScheduledMessage` every 30s and delivers due messages.

---

## Tech stack

| Layer        | Technology                                                            |
|--------------|-----------------------------------------------------------------------|
| Monorepo     | Turborepo, pnpm workspaces                                            |
| Frontend     | Next.js (App Router), React, Tailwind CSS                             |
| Backend      | Node.js, Express 5, TypeScript                                        |
| Database     | PostgreSQL via Prisma ORM                                             |
| Messaging    | Apache Kafka (KafkaJS; TLS for Aiven)                                 |
| AI           | Groq SDK (Llama 3.3 70B, OpenAI-compatible tool calling)             |
| Integrations | Telegram Bot API, Discord webhooks, SendGrid                          |
| Infra        | Docker, Docker Compose                                                |

---

## Repository structure

```
apps/
  web/        Next.js dashboard (auth UI, workflow builder, run/delete, schedules)
  server/     Express REST API — auth, workflow CRUD, manual execute, schedules
  webhooks/   Inbound webhook receiver that enqueues workflow runs
  processor/  Outbox poller that publishes runs to Kafka
  workers/    Kafka consumer that executes action stages + scheduler loop
packages/
  db/                 Prisma schema + generated client (@repo/db)
  ui/                 Shared React components
  eslint-config/      Shared ESLint config
  typescript-config/  Shared tsconfig bases
```

---

## Getting started

### Prerequisites

- Node.js ≥ 18 and pnpm 9
- PostgreSQL
- A Kafka cluster (e.g. Aiven; TLS certs supported)
- Optional: Groq, Telegram bot, Discord webhook, and SendGrid credentials for the respective actions

### Local development

```bash
pnpm install

# Configure environment
cp .env.example .env        # then fill in real values

# Generate the Prisma client and push the schema
pnpm --filter @repo/db exec prisma generate
pnpm --filter @repo/db exec prisma db push

# Run everything in watch mode
pnpm dev
```

### Environment variables

See [`.env.example`](./.env.example). Key variables:

| Variable               | Purpose                                              |
|------------------------|------------------------------------------------------|
| `DATABASE_URL`         | PostgreSQL connection string                         |
| `JWT_SECRET`           | Secret for signing auth tokens (**required**)        |
| `KAFKA_BROKER`         | Kafka broker URI (**required** for processor/worker) |
| `GROQ_API_KEY`         | Enables the AI Agent action                          |
| `TELEGRAM_BOT_TOKEN`   | Enables the Telegram action                          |
| `SENDGRID_API_KEY`     | Enables the Email action                             |
| `NEXT_PUBLIC_API_URL`  | API base URL the web app calls                       |

> For Aiven Kafka, place `ca.pem`, `service.cert`, and `service.key` in a `certs/` directory at the repo root. These are **secrets** — they are gitignored and mounted into the processor/worker containers read-only at runtime; never commit them or bake them into images.

### Run with Docker Compose

```bash
# Requires a populated .env (KAFKA_BROKER is mandatory) and certs/ for Aiven
docker compose up --build
```

This starts PostgreSQL, runs schema migration + seed, and brings up the web, server, webhooks, processor, and worker services.

---

## Security notes

- Auth tokens are httpOnly cookies; `Secure`/`SameSite=None` are enabled in production.
- Inbound webhooks verify that the target workflow exists and belongs to the user in the URL.
- The AI Agent can only send to destinations already configured in the workflow's action nodes.
- Kafka TLS keys are mounted at runtime, never committed or baked into images.

---

## License

This project is provided as-is for educational and personal use.
