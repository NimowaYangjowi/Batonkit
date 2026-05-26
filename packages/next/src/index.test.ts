import { describe, expect, it } from 'vitest';

import {
  createGatedStore,
  createJobs,
  createMemoryControlStore,
  createMemoryStore,
} from '@batonkit/core';

import { createControlPlaneHandlers } from './index.js';

describe('control plane', () => {
  it('defaults to local primary ownership', async () => {
    const control = createMemoryControlStore();

    const state = await control.getState();

    expect(state.activeOwner).toBe('local');
    expect(state.mode).toBe('local_primary');
    expect(await control.allowClaims('local')).toBe(true);
    expect(await control.allowClaims('backup')).toBe(false);
  });

  it('records worker heartbeat snapshots', async () => {
    const control = createMemoryControlStore();

    await control.recordHeartbeat({
      platform: 'local',
      workerId: 'office-mac-mini',
      status: 'ok',
    });

    const state = await control.getState();
    expect(state.localHeartbeat?.workerId).toBe('office-mac-mini');
  });

  it('blocks backup claims while local owns work', async () => {
    const baseStore = createMemoryStore();
    const control = createMemoryControlStore();
    const localJobs = createJobs({
      store: createGatedStore(baseStore, control, 'local'),
    });
    const backupJobs = createJobs({
      store: createGatedStore(baseStore, control, 'backup'),
    });

    await localJobs.enqueue('generate-preview', {});

    expect(await backupJobs.claimNext({ workerId: 'backup', leaseMs: 30_000 })).toBeNull();
    expect(await localJobs.claimNext({ workerId: 'local', leaseMs: 30_000 })).not.toBeNull();
  });

  it('requires a bearer secret for mutating route handlers', async () => {
    const handlers = createControlPlaneHandlers({
      control: createMemoryControlStore(),
      secret: 'test-secret',
    });

    const response = await handlers.POST(
      new Request('https://example.test/control', {
        method: 'POST',
        body: JSON.stringify({ type: 'heartbeat', platform: 'local', workerId: 'local-1' }),
      })
    );

    expect(response.status).toBe(401);
  });

  it('requires a bearer secret for reading route handlers by default', async () => {
    const handlers = createControlPlaneHandlers({
      control: createMemoryControlStore(),
      secret: 'test-secret',
    });

    const response = await handlers.GET(
      new Request('https://example.test/control')
    );

    expect(response.status).toBe(401);
  });

  it('allows authorized reads of route handler state', async () => {
    const handlers = createControlPlaneHandlers({
      control: createMemoryControlStore(),
      secret: 'test-secret',
    });

    const response = await handlers.GET(
      new Request('https://example.test/control', {
        headers: { authorization: 'Bearer test-secret' },
      })
    );
    const body = (await response.json()) as { activeOwner: string };

    expect(response.status).toBe(200);
    expect(body.activeOwner).toBe('local');
  });

  it('allows public reads only when explicitly enabled', async () => {
    const handlers = createControlPlaneHandlers({
      control: createMemoryControlStore(),
      secret: 'test-secret',
      publicRead: true,
    });

    const response = await handlers.GET(
      new Request('https://example.test/control')
    );

    expect(response.status).toBe(200);
  });
});
