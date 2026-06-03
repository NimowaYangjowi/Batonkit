import { describe, expect, it } from 'vitest';

import { createMemoryControlStore } from '@batonkit/core';

import { createHeartbeatStatusMirror } from './worker.js';

describe('railway live drill worker heartbeat mirror', () => {
  it('preserves a degraded worker status when the refresh door records another heartbeat', async () => {
    const control = createMemoryControlStore();
    const heartbeatMirror = createHeartbeatStatusMirror(control);

    await heartbeatMirror.control.recordHeartbeat({
      platform: 'backup',
      workerId: 'backup-drill-worker',
      status: 'degraded',
    });

    const refreshed = await control.recordHeartbeat({
      platform: 'backup',
      workerId: 'backup-drill-worker',
      status: heartbeatMirror.getStatus(),
    });

    expect(refreshed.backupHeartbeat?.status).toBe('degraded');
  });
});
