# Local First Worker

Postgres-first background jobs for small Next.js/Vercel teams that want to run work on local hardware first and wake a cloud backup worker only when needed.

Plain language: your local machine normally does the slow background work. If it goes down, a cloud worker can take the baton.

## What Problem Does This Solve?

Many small products have useful background work that does not need to finish instantly:

- generating upload previews
- converting files
- sending slow reports
- cleaning old temporary data
- running scheduled maintenance
- processing AI tasks with local hardware

Keeping cloud workers always awake for that work can be wasteful. Local First Worker lets a local worker own the queue by default, while keeping a backup worker ready to wake during outages.

## When Should I Not Use This?

Do not use this for:

- hard real-time jobs
- high-frequency trading or safety-critical automation
- multi-region worker fleets
- complex workflow replay needs like Temporal-style durable execution
- workloads where local hardware is not trusted

This project is intentionally smaller: one local-first worker system, one Postgres queue, optional backup providers.

## Packages

- `@local-first-worker/core`: job queue contracts, memory store, control plane, failover engine
- `@local-first-worker/postgres`: Postgres queue SQL and query-client store
- `@local-first-worker/worker`: job definitions and worker runtime
- `@local-first-worker/next`: Next.js App Router control-plane helpers
- `@local-first-worker/provider-railway`: Railway backup provider
- `@local-first-worker/monitor-webhook`: generic monitor webhook parsing

## Quick Start

```ts
import { createJobs } from '@local-first-worker/core';
import { postgresStore } from '@local-first-worker/postgres';

const jobs = createJobs({
  store: postgresStore(db),
});

await jobs.enqueue('generate-preview', { fileId: 'file_123' });
```

Run a local worker:

```ts
import { createWorker, defineJob } from '@local-first-worker/worker';

const generatePreview = defineJob('generate-preview', async (payload, ctx) => {
  ctx.logger.info('Generating preview', { payload });
});

await createWorker({
  store,
  workerId: 'office-mac-mini',
  jobs: [generatePreview],
}).start();
```

## How Local-First Failover Works

1. The app writes jobs into Postgres.
2. Local workers heartbeat and claim jobs while ownership is `local`.
3. Backup workers stay passive because claim gating blocks them.
4. A monitor reports local worker `down`.
5. The control plane switches ownership to `backup`.
6. A provider adapter wakes the backup worker.
7. When local is healthy again, failback waits for a cooldown before returning ownership to `local`.

## Database Tables

The Postgres helpers create:

- `lfw_jobs`
- `lfw_job_events`
- `lfw_control_state`
- `lfw_worker_heartbeats`

## Example

See `examples/next-postgres` for a small Next.js-style upload preview example with local and backup worker entrypoints.

Install it separately from the repository root:

```bash
cd examples/next-postgres
npm install
npm run dev
```

## Docs

- `docs/queue-core.md`
- `docs/worker-runtime.md`
- `docs/control-plane.md`
- `docs/failover.md`
- `docs/api-reference.md`
- `docs/failover-drill.md`
- `docs/release.md`
