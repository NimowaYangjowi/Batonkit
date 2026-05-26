# Queue Core

BatonKit v1 uses Postgres as the durable job queue and control store.

Plain language: the database is the shared notebook where the app writes work, workers reserve work, and completed or failed work is recorded.

## Job Lifecycle

- `pending`: waiting to be claimed
- `running`: claimed by a worker lease
- `completed`: finished successfully
- `failed`: failed but can retry
- `dead_letter`: failed too many times and will not be retried automatically

## Minimal Usage

```ts
import { createJobs } from '@batonkit/core';
import { postgresStore } from '@batonkit/postgres';

const jobs = createJobs({
  store: postgresStore(db),
});

await jobs.enqueue('generate-preview', { fileId: 'file_123' });
```

The job name should describe a product task in generic terms. For example, `generate-preview` can mean creating an upload preview in one app and creating a PDF thumbnail in another.

You may pass an explicit job id when you need idempotency or outside-system tracing:

```ts
await jobs.enqueue(
  'generate-preview',
  { fileId: 'file_123' },
  { id: 'job_file_123_preview' }
);
```

Both the memory store and the Postgres store preserve caller-provided job ids.

Plain language: if your app already has a stable name for a piece of background work, BatonKit can use that same name instead of inventing a new one.

## Migration

`createQueueMigrationSql()` returns the initial SQL for:

- `lfw_jobs`
- `lfw_job_events`

Run this SQL before enqueueing jobs.
