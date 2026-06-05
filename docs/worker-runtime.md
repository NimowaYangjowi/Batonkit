# Worker Runtime

The worker runtime executes registered job handlers against a `JobStore`.

## Minimal Usage

```ts
import { createWorker, defineJob } from '@batonkit/worker';

const generatePreview = defineJob('generate-preview', async (payload, ctx) => {
  ctx.logger.info('Generating preview', { payload });
});

const worker = createWorker({
  store,
  workerId: 'office-mac-mini',
  jobs: [generatePreview],
});

await worker.start();
```

## Behavior

- `runOnce()` claims at most one job.
- `runBatch()` claims up to the configured concurrency.
- Workers only claim job names registered in their `jobs` list.
- Jobs with unregistered names stay in the queue for another worker that knows that job name.
- Successful handlers mark jobs as `completed`.
- Failed handlers mark jobs as `failed` or `dead_letter`, depending on retry state.
- `stop()` prevents new claims.

## Heartbeats

Workers can report their health to a control store when you pass both `control` and `platform`:

```ts
const worker = createWorker({
  store,
  control,
  platform: 'local',
  workerId: 'office-mac-mini',
  jobs: [generatePreview],
  heartbeatIntervalMs: 30_000,
});
```

Heartbeat setup is optional. When enabled, the worker records an `ok` heartbeat on `start()`, keeps refreshing it on the configured interval, and records `stopping` when `stop()` completes.

If the main polling loop hits an unhandled store or runtime error, the worker logs the failure and starts reporting `degraded` heartbeats until you stop or replace that worker process.
