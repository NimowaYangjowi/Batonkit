# Phase 02: Postgres Queue Core

> **Phase Operating Rules**
>
> - Keep this phase independently shippable and commit it when complete.
> - At phase end, run a review focused on regression risk, API clarity, overengineering, test gaps, docs gaps, performance/cost impact, and public-package ergonomics.
> - Record review findings in this phase document under `Phase Review`.
> - Update the completion checklist in this phase document before moving on.
> - If implementation changes the architecture, update all later phase documents before starting the next phase.
> - Do not carry Redprint-specific names, database tables, job types, or deployment assumptions into the public API.
> - Prefer small, boring primitives over broad abstractions unless a later phase proves the abstraction is needed.

## Goal

Build the Postgres-backed job queue primitives.

Plain language: create the shared job line where apps can put work and workers can safely pick up one item at a time.

## Scope

- Job definition API
- Enqueue API
- Claim/lease API
- Complete/fail/retry/dead-letter transitions
- Job visibility states
- Minimal migration helper

## Public API Sketch

```ts
import { createJobs } from '@localfirst/worker';
import { postgresStore } from '@localfirst/worker/postgres';

const jobs = createJobs({
  store: postgresStore({ connectionString: process.env.DATABASE_URL }),
});

await jobs.enqueue('generate-preview', { fileId: 'file_123' });
```

`generate-preview` means a user-visible background task, such as creating a file preview after upload. It must not assume Redprint media, tagging, or transcode concepts.

## Data Model Draft

- `lfw_jobs`
  - `id`
  - `name`
  - `payload`
  - `status`
  - `run_at`
  - `attempts`
  - `max_attempts`
  - `lease_owner`
  - `lease_expires_at`
  - `last_error`
  - `created_at`
  - `updated_at`
- `lfw_job_events`
  - append-only job lifecycle log for debugging

## Implementation Tasks

1. Write failing tests for enqueueing a job.
2. Implement migration SQL for queue tables.
3. Write failing tests for claiming a pending job.
4. Implement lease-based claim with Postgres transactions.
5. Write failing tests for lease expiry and reclaim.
6. Implement completion and failure transitions.
7. Write failing tests for retry limit and dead-letter state.
8. Add queue API docs.
9. Run build, typecheck, and tests.
10. Commit the phase:

```bash
git add .
git commit -m "feat: add postgres queue core"
```

## Acceptance Criteria

- Jobs can be enqueued and claimed.
- Two workers cannot claim the same leased job.
- Expired leases can be reclaimed.
- Failed jobs retry until `max_attempts`.
- Exhausted jobs move to dead-letter state.
- All state changes are test-covered.

## Phase Review

To be completed after implementation.

## Completion Checklist

- [ ] Queue tables added
- [ ] Enqueue implemented
- [ ] Claim/lease implemented
- [ ] Complete/fail/retry implemented
- [ ] Dead-letter behavior implemented
- [ ] Tests pass
- [ ] Phase review completed
- [ ] Phase committed
- [ ] Later phase documents updated if needed

