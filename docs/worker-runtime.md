# Worker Runtime

The worker runtime executes registered job handlers against a `JobStore`.

Plain language: this is the background engine that picks up work from the queue and runs the matching function.

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
- Successful handlers mark jobs as `completed`.
- Failed handlers mark jobs as `failed` or `dead_letter`, depending on retry state.
- `stop()` prevents new claims.
