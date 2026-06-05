# @batonkit/worker

Worker runtime for BatonKit jobs.

## Install

```bash
npm install @batonkit/core @batonkit/worker
```

## What It Includes

- `defineJob(...)` for declaring job handlers
- `createWorker(...)` for starting a worker process
- support for worker IDs, logging, heartbeats, and single-run polling

Use this with a BatonKit store from `@batonkit/core` or `@batonkit/postgres` depending on whether you are running a local demo or a shared Postgres-backed deployment.

Workers only claim the job names you register in their `jobs` list.

Pass `control`, `platform`, and `heartbeatIntervalMs` to report worker heartbeats.

If the worker's main polling loop hits an unhandled runtime or store error, it logs that failure and starts reporting a `degraded` heartbeat instead of continuing to look fully healthy.
