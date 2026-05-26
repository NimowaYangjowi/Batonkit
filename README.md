# BatonKit

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

Keeping cloud workers always awake for that work can be wasteful. BatonKit lets a local worker own the queue by default, while keeping a backup worker ready to wake during outages.

## When Should I Not Use This?

Do not use this for:

- hard real-time jobs
- high-frequency trading or safety-critical automation
- multi-region worker fleets
- complex workflow replay needs like Temporal-style durable execution
- workloads where local hardware is not trusted

This project is intentionally smaller: one local-first worker system, one Postgres queue, optional backup providers.

## Packages

- `@batonkit/core`: job queue contracts, memory store, control plane, failover engine
- `@batonkit/postgres`: Postgres queue SQL and query-client store
- `@batonkit/worker`: job definitions and worker runtime
- `@batonkit/next`: Next.js App Router control-plane helpers
- `@batonkit/provider-railway`: Railway backup provider
- `@batonkit/monitor-webhook`: generic monitor webhook parsing

## Quick Start

Install the packages:

```bash
npm install @batonkit/core @batonkit/postgres @batonkit/worker @batonkit/next
```

Create a shared Postgres-backed queue and control plane:

Plain language: in the snippets below, `db` means your app's Postgres query client. It is the database connection object that BatonKit uses to read and write the shared work queue and the shared baton state.

```ts
import { createGatedStore, createJobs } from '@batonkit/core';
import {
  createControlPlaneMigrationSql,
  createQueueMigrationSql,
  postgresControlStore,
  postgresStore,
} from '@batonkit/postgres';

const baseStore = postgresStore(db);
const control = postgresControlStore(db);

const localStore = createGatedStore(baseStore, control, 'local');
const backupStore = createGatedStore(baseStore, control, 'backup');
const jobs = createJobs({ store: localStore });
```

Plain language: `baseStore` is the shared Postgres work queue, `control` is the shared baton traffic light, `localStore` is the local worker's view of the queue, and `backupStore` is the cloud backup worker's view.

Create the database tables:

```ts
await db.query(createQueueMigrationSql());
await db.query(createControlPlaneMigrationSql());
```

Enqueue a job from your app:

```ts
await jobs.enqueue('generate-preview', { fileId: 'file_123' });
```

Add a Next.js control route:

```ts
// app/api/batonkit/control/route.ts
import { createControlPlaneHandlers } from '@batonkit/next';
import { postgresControlStore } from '@batonkit/postgres';

export const { GET, POST } = createControlPlaneHandlers({
  control: postgresControlStore(db),
  secret: process.env.BATONKIT_CONTROL_SECRET!,
});
```

Plain language: this route is the secure door that lets your monitor or your backup worker report "local is down" or "local is healthy again" into the shared baton state.

Run a local worker on your own machine:

```ts
import { createWorker, defineJob } from '@batonkit/worker';

const generatePreview = defineJob('generate-preview', async (payload, ctx) => {
  ctx.logger.info('Generating preview', { payload });
});

const localWorker = createWorker({
  store: localStore,
  workerId: 'office-mac-mini',
  jobs: [generatePreview],
});

await localWorker.start();
```

Run a backup worker in the cloud with the same job definitions:

```ts
const backupWorker = createWorker({
  store: backupStore,
  workerId: 'railway-backup-worker',
  jobs: [generatePreview],
});

await backupWorker.start();
```

The backup worker will stay passive while local ownership is active because `backupStore` is claim-gated by the shared control plane.

## How Local-First Failover Works

1. The app writes jobs into Postgres.
2. Local workers heartbeat and claim jobs while ownership is `local`.
3. Backup workers stay passive because claim gating blocks them.
4. A monitor reports local worker `down`.
5. The control plane switches ownership to `backup`.
6. A provider adapter wakes the backup worker.
7. When local is healthy again, failback waits for a cooldown before returning ownership to `local`.

## Monitoring Dependency

BatonKit is not tied to HetrixTools, UptimeRobot, or any single monitoring dashboard.

Plain language: the package only needs a simple "local machine is down" or "local machine is back" signal. The monitor can be any tool that can send a webhook your app can translate into those two meanings.

The built-in `@batonkit/monitor-webhook` helper accepts generic payloads with either:

- `status: "down" | "failed" | "offline"`
- `status: "up" | "recovered" | "online"`
- `event: ...` with the same values

If your monitoring tool sends a different shape, add a tiny adapter in your route handler before calling BatonKit's failover logic.

## Database Tables

The Postgres helpers create:

- `lfw_jobs`
- `lfw_job_events`
- `lfw_control_state`
- `lfw_worker_heartbeats`

## Test The Package Locally

From this repository:

```bash
npm run build
npm run typecheck
npm run test
npm run lint
npm audit --omit=dev
```

Run a real Postgres integration test with Docker:

```bash
npm run test:postgres
```

Pack the npm packages and install them into a temporary consumer project:

```bash
npm run test:pack
```

Run the failover drill against a local simulated backup worker endpoint:

```bash
npm run drill:failover
```

Run the Railway live drill harness against a real Postgres URL or a local drill database:

```bash
npm run drill:railway-live
```

Run the real Railway-backed failover drill using the deployed backup worker:

```bash
npm run drill:railway-live:remote
```

## Current Maturity

BatonKit is not production-stable yet. It is a developer-preview package skeleton with passing unit tests, real Postgres integration coverage, pack smoke tests, a simulated failover drill, a reusable Railway live drill harness, and a completed Railway lab proof run.

Before a public beta, rerun the Railway-backed drill in your own environment and review the public API names.

## Example

See `examples/next-postgres` for a small Next.js-style upload preview example with local and backup worker entrypoints.

That example intentionally uses in-memory stores to keep the shape easy to inspect. For a real multi-process app, use the Postgres-backed `postgresStore(...)` and `postgresControlStore(...)` path shown in the Quick Start above.

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
