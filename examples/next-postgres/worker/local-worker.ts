import { createWorker, defineJob } from '@batonkit/worker';

import { localStore } from '../lib/localfirst';

const generatePreview = defineJob('generate-preview', async (payload, ctx) => {
  ctx.logger.info('Generated preview', { payload });
});

await createWorker({
  store: localStore,
  workerId: 'local-worker',
  jobs: [generatePreview],
}).start();

