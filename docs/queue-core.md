# Queue Core

Local First Worker v1 uses Postgres as the durable job queue and control store.

Plain language: the database is the shared notebook where the app writes work, workers reserve work, and completed or failed work is recorded.

## Job Lifecycle

- `pending`: waiting to be claimed
- `running`: claimed by a worker lease
- `completed`: finished successfully
- `failed`: failed but can retry
- `dead_letter`: failed too many times and will not be retried automatically

## Minimal Usage

```ts
import { createJobs } from '@local-first-worker/core';
import { postgresStore } from '@local-first-worker/postgres';

const jobs = createJobs({
  store: postgresStore(db),
});

await jobs.enqueue('generate-preview', { fileId: 'file_123' });
```

The job name should describe a product task in generic terms. For example, `generate-preview` can mean creating an upload preview in one app and creating a PDF thumbnail in another.

## Migration

`createQueueMigrationSql()` returns the initial SQL for:

- `lfw_jobs`
- `lfw_job_events`

Run this SQL before enqueueing jobs.

