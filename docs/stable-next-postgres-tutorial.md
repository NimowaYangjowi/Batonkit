# Stable Next.js + Postgres Tutorial

This tutorial shows the smallest stable `1.0.0` BatonKit shape for a Next.js app, a shared Postgres queue, one local worker, and one optional backup worker.

Plain language: this is the copy-paste path for making one app write background work into Postgres while a local worker usually does the work.

## 1. Install Packages

```bash
npm install @batonkit/core@1.0.0 @batonkit/postgres@1.0.0 @batonkit/worker@1.0.0 @batonkit/next@1.0.0 @batonkit/monitor-webhook@1.0.0
```

Add the Railway provider only if your backup worker lives on Railway:

```bash
npm install @batonkit/provider-railway@1.0.0
```

## 2. Configure Environment

```bash
export DATABASE_URL="postgres://user:password@localhost:5432/app"
export BATONKIT_CONTROL_SECRET="$(openssl rand -hex 32)"
```

Plain language: `DATABASE_URL` is the shared notebook where jobs and baton ownership are written. `BATONKIT_CONTROL_SECRET` is the key for the private control door.

## 3. Create The Tables

Run the migration SQL once before enqueueing jobs:

```ts
import {
  createControlPlaneMigrationSql,
  createQueueMigrationSql,
} from '@batonkit/postgres';

await db.query(createQueueMigrationSql());
await db.query(createControlPlaneMigrationSql());
```

Plain language: this creates the job tickets table and the baton ownership table.

## 4. Create The Queue

```ts
import { createGatedStore, createJobs } from '@batonkit/core';
import { postgresControlStore, postgresStore } from '@batonkit/postgres';

const baseStore = postgresStore(db);
const control = postgresControlStore(db);
const localStore = createGatedStore(baseStore, control, 'local');

export const jobs = createJobs({ store: localStore });
export { control };
```

## 5. Enqueue Work From The App

```ts
await jobs.enqueue('generate-preview', {
  fileId: 'file_123',
});
```

If you already have an idempotency key, pass it as the job ID:

```ts
await jobs.enqueue(
  'generate-preview',
  { fileId: 'file_123' },
  { id: 'job_file_123_preview' }
);
```

Plain language: if the app already named this job, BatonKit will not let another job quietly reuse the same name.

## 6. Add A Next.js Control Route

```ts
// app/api/batonkit/control/route.ts
import { createControlPlaneHandlers } from '@batonkit/next';
import { control } from '@/lib/batonkit';

const secret = process.env.BATONKIT_CONTROL_SECRET;
if (!secret) {
  throw new Error('Missing BATONKIT_CONTROL_SECRET');
}

export const { GET, POST } = createControlPlaneHandlers({
  control,
  secret,
});
```

The route requires `Authorization: Bearer <secret>` for reads and writes by default.

Plain language: the private control door is locked unless the request has the key.

## 7. Start A Local Worker

```ts
import { createWorker, defineJob } from '@batonkit/worker';
import { control, localStore } from '@/lib/batonkit';

const generatePreview = defineJob('generate-preview', async (payload, ctx) => {
  ctx.logger.info('Generating preview', { payload });
});

const worker = createWorker({
  store: localStore,
  control,
  platform: 'local',
  workerId: 'office-mac-mini',
  jobs: [generatePreview],
  heartbeatIntervalMs: 30_000,
});

await worker.start();
```

Plain language: this worker only picks up job names it knows how to run.

## 8. Wire Monitor Events

```ts
import { applyFailoverEvent } from '@batonkit/core';
import { parseMonitorWebhookEvent } from '@batonkit/monitor-webhook';

const monitorEvent = parseMonitorWebhookEvent(await request.json());

await applyFailoverEvent({
  control,
  provider,
  event: monitorEvent.event,
  reason: monitorEvent.reason,
  failbackCooldownMs: 5 * 60 * 1000,
});
```

Plain language: the monitor says "local is down" or "local is back", then BatonKit changes who is allowed to take jobs.

## 9. Run Failback Reconciliation

Call this on a timer, such as a worker interval or scheduled job:

```ts
import { reconcileFailback } from '@batonkit/core';

await reconcileFailback({
  control,
  provider,
});
```

Plain language: if there is a cooldown timer, this is the check that hands the baton home after the timer ends.

## 10. Verify Before Production

Run these in the BatonKit repo before publishing or upgrading:

```bash
npm run build
npm run typecheck
npm run test
npm run test:postgres
npm run test:pack
npm run drill:failover
npm run drill:railway-live
npm run drill:railway-live:remote
npm run lint
npm audit --omit=dev
```

