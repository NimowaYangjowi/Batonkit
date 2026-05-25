import { createWorker, defineJob } from '@local-first-worker/worker';

import { backupStore } from '../lib/localfirst';

const generatePreview = defineJob('generate-preview', async (payload, ctx) => {
  ctx.logger.info('Generated preview on backup worker', { payload });
});

await createWorker({
  store: backupStore,
  workerId: 'backup-worker',
  jobs: [generatePreview],
}).start();
