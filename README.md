# BatonKit

![BatonKit local worker handing off a baton to a cloud worker](docs/assets/batonkit-hero.png)

Postgres-first background jobs for small Next.js/Vercel teams that want to run work on local hardware first and wake a cloud backup worker only when needed.

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

Create the database tables:

```ts
await db.query(createQueueMigrationSql());
await db.query(createControlPlaneMigrationSql());
```

Enqueue a job from your app:

```ts
await jobs.enqueue('generate-preview', { fileId: 'file_123' });
```

If you provide your own job ID for idempotency or tracing, BatonKit preserves that ID and rejects later duplicate enqueues that reuse it.

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

Run a local worker on your own machine:

```ts
import { createWorker, defineJob } from '@batonkit/worker';

const generatePreview = defineJob('generate-preview', async (payload, ctx) => {
  ctx.logger.info('Generating preview', { payload });
});

const localWorker = createWorker({
  store: localStore,
  control,
  platform: 'local',
  workerId: 'office-mac-mini',
  jobs: [generatePreview],
  heartbeatIntervalMs: 30_000,
});

await localWorker.start();
```

Run a backup worker in the cloud with the same job definitions:

```ts
const backupWorker = createWorker({
  store: backupStore,
  control,
  platform: 'backup',
  workerId: 'railway-backup-worker',
  jobs: [generatePreview],
  heartbeatIntervalMs: 30_000,
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
7. When local is healthy again, failback waits for a cooldown.
8. A scheduled call to `reconcileFailback(...)` returns ownership to `local` after the cooldown.

Provider note: BatonKit always calls the provider's `park()` hook when ownership returns to `local`, but what that means depends on the platform adapter. For example, the Railway adapter currently refreshes the backup worker control door and leaves service suspension or scale-down to Railway-side configuration.

## Monitoring Dependency

BatonKit is not tied to HetrixTools, UptimeRobot, or any single monitoring dashboard.

The built-in `@batonkit/monitor-webhook` helper accepts generic payloads with either:

- `status: "down" | "failed" | "offline"`
- `status: "up" | "recovered" | "online"`
- `event: ...` with the same values

If your monitoring tool sends a different shape, add a tiny adapter in your route handler before calling BatonKit's failover logic.

## Stable 1.0 Boundaries

- BatonKit is a stable `1.0.0` package for small-team local-first background jobs with Postgres-backed queueing and optional Railway backup failover.
- You must run the migration SQL yourself before enqueueing jobs.
- You must wire the monitor webhook and call `applyFailoverEvent(...)` from your app.
- You must run a periodic `reconcileFailback(...)` call if you use non-zero failback cooldowns.
- The Next.js control route requires `Authorization: Bearer <secret>` for `GET` and `POST` unless you explicitly pass `publicRead: true`.
- Workers only claim job names registered in their `jobs` list, so run one worker process per set of job handlers you want that process to own.

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

BatonKit is being prepared as stable `1.0.0`. It has passing unit tests, real Postgres integration coverage, pack smoke tests, a simulated failover drill, a reusable Railway live drill harness, and completed Railway lab proof runs.

Before production use, rerun the Railway-backed drill in your own environment and confirm your monitor, migrations, worker process manager, and failback scheduler are wired.

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
- `docs/stable-next-postgres-tutorial.md`
- `docs/operations-runbook.md`
- `docs/release.md`
