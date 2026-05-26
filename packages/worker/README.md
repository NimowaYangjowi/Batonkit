# @batonkit/worker

Worker runtime for BatonKit jobs.

Plain language: this is the package that powers the actual worker process. It is the engine that sits on your local machine or on your cloud backup machine, looks at the queue, and runs the jobs you defined when it is that worker's turn to do the work.

## Install

```bash
npm install @batonkit/core @batonkit/worker
```

## What It Includes

- `defineJob(...)` for declaring job handlers
- `createWorker(...)` for starting a worker process
- support for worker IDs, logging, heartbeats, and single-run polling

Use this with a BatonKit store from `@batonkit/core` or `@batonkit/postgres` depending on whether you are running a local demo or a shared Postgres-backed deployment.

Workers only claim the job names you register in their `jobs` list. Plain language: a preview worker leaves report jobs in the queue for the report worker instead of marking them failed.

Pass `control`, `platform`, and `heartbeatIntervalMs` to report worker heartbeats. Plain language: this lets the shared baton state show that the local or backup worker has checked in recently.
