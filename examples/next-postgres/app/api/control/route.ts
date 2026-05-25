import { createControlPlaneHandlers } from '@local-first-worker/next';

import { control } from '../../../lib/localfirst';

export const { GET, POST } = createControlPlaneHandlers({
  control,
  secret: process.env.LOCALFIRST_WORKER_SECRET ?? 'dev-secret',
});

