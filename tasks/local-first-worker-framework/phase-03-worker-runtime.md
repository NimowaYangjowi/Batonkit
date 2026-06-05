# Phase 03: Worker Runtime

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

Build the worker runtime that runs registered job handlers.

## Scope

- `defineJob`
- `createWorker`
- polling loop
- concurrency limit
- graceful shutdown
- handler timeout
- structured result and error handling

## Public API Sketch

```ts
import { createWorker, defineJob } from '@localfirst/worker';

const generatePreview = defineJob('generate-preview', async (payload, ctx) => {
  ctx.logger.info('Generating preview', { fileId: payload.fileId });
});

const worker = createWorker({
  jobs: [generatePreview],
  store,
  workerId: 'local-dev-machine',
  concurrency: 2,
});

await worker.start();
```

The `workerId` is the name of the machine or process doing work. A small team might use `office-mac-mini` locally and `railway-backup` in the cloud.

## Implementation Tasks

1. Write failing tests for registering a job handler.
2. Implement `defineJob`.
3. Write failing tests for worker polling and successful completion.
4. Implement the runtime loop.
5. Write failing tests for handler errors and retry behavior.
6. Implement failure reporting through the queue core.
7. Write failing tests for graceful shutdown.
8. Implement signal-aware shutdown.
9. Add runtime docs and examples.
10. Run build, typecheck, and tests.
11. Commit the phase:

```bash
git add .
git commit -m "feat: add worker runtime"
```

## Acceptance Criteria

- A worker can execute a registered job.
- Unknown job names fail clearly.
- Failed handlers are retried according to queue policy.
- Shutdown stops new claims and allows in-flight work to settle.
- Runtime does not require Next.js.

## Phase Review

- Regression risk: Medium. This phase introduces execution behavior, but tests cover handler registration, successful processing, unknown handlers, and stop behavior.
- API clarity: Good for v1. `defineJob` and `createWorker` are small and generic.
- Overengineering risk: Low. The runtime supports a polling loop, `runOnce`, and `runBatch` without adding a larger scheduler.
- Test gaps: Handler timeout is not implemented yet. This remains a pre-release limitation.
- Docs gaps: Basic runtime docs were added in `docs/worker-runtime.md`.
- Performance/cost impact: Polling interval is configurable. Future control-plane work should avoid unnecessary polling when a worker is not the active owner.
- Public-package ergonomics: Good. Runtime does not require Next.js and works with any `JobStore`.
- Later phase update: Phase 04 should integrate claim gating into the store/runtime boundary instead of coupling the runtime to Next.js.

## Completion Checklist

- [x] Job definition API added
- [x] Worker runtime loop added
- [x] Concurrency supported
- [x] Graceful shutdown supported
- [x] Error handling covered by tests
- [x] Tests pass
- [x] Phase review completed
- [x] Phase committed
- [x] Later phase documents updated if needed
