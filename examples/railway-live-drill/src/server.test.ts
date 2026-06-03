import { createServer } from 'node:http';

import { describe, expect, it } from 'vitest';

import { createMemoryControlStore } from '@batonkit/core';

import {
  closeServerIfListening,
  createDrillServerHandler,
} from './server.js';

async function withServer(
  handler: ReturnType<typeof createDrillServerHandler>,
  run: (baseUrl: string) => Promise<void>
): Promise<void> {
  const server = createServer(handler);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Test server did not expose a numeric port.');
  }

  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

describe('railway live drill server', () => {
  it('does not mask startup failures by closing a server that never listened', async () => {
    const server = createServer();

    await expect(closeServerIfListening(server, false)).resolves.toBeUndefined();
  });

  it('reports public readiness without exposing the baton snapshot', async () => {
    const control = createMemoryControlStore();
    let stateReads = 0;
    await control.updateOwnership({
      mode: 'backup_active',
      activeOwner: 'backup',
      failoverReason: 'test',
      failbackNotBefore: null,
    });

    const handler = createDrillServerHandler(
      {
        control: {
          async getState() {
            stateReads += 1;
            return control.getState();
          },
        },
        platform: 'backup',
        recordHeartbeat: async () => control.getState(),
        workerId: 'backup-drill-worker',
      },
      'secret'
    );

    await withServer(handler, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ready`);

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ ok: true });
      expect(stateReads).toBe(1);
    });
  });

  it('returns a readable 500 when the public ready door cannot read control state', async () => {
    const handler = createDrillServerHandler(
      {
        control: {
          async getState() {
            throw new Error('control store offline');
          },
        },
        platform: 'backup',
        recordHeartbeat: async () => createMemoryControlStore().getState(),
        workerId: 'backup-drill-worker',
      },
      'secret'
    );

    await withServer(handler, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ready`);

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: 'drill_server_error',
        message: 'control store offline',
        route: '/ready',
      });
    });
  });

  it('reports detailed readiness from the backup worker door with the correct secret', async () => {
    const control = createMemoryControlStore();
    await control.updateOwnership({
      mode: 'backup_active',
      activeOwner: 'backup',
      failoverReason: 'test',
      failbackNotBefore: null,
    });

    const handler = createDrillServerHandler(
      {
        control,
        platform: 'backup',
        recordHeartbeat: async () => control.getState(),
        workerId: 'backup-drill-worker',
      },
      'secret'
    );

    await withServer(handler, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ready`, {
        headers: {
          Authorization: 'Bearer secret',
        },
      });

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        ok: true,
        platform: 'backup',
        workerId: 'backup-drill-worker',
        ownership: 'backup',
        mode: 'backup_active',
      });
    });
  });

  it('rejects detailed readiness requests with the wrong secret', async () => {
    const control = createMemoryControlStore();
    const handler = createDrillServerHandler(
      {
        control,
        platform: 'backup',
        recordHeartbeat: async () => control.getState(),
        workerId: 'backup-drill-worker',
      },
      'correct-secret'
    );

    await withServer(handler, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ready`, {
        headers: {
          Authorization: 'Bearer wrong-secret',
        },
      });

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({ error: 'unauthorized' });
    });
  });

  it('rejects refresh requests with the wrong secret', async () => {
    const control = createMemoryControlStore();
    let refreshCalls = 0;
    const handler = createDrillServerHandler(
      {
        control,
        platform: 'backup',
        recordHeartbeat: async () => {
          refreshCalls += 1;
          return control.getState();
        },
        workerId: 'backup-drill-worker',
      },
      'correct-secret'
    );

    await withServer(handler, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/control-plane/refresh`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer wrong-secret',
        },
      });

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({ error: 'unauthorized' });
      expect(refreshCalls).toBe(0);
    });
  });

  it('refreshes the backup worker heartbeat with the correct secret', async () => {
    const control = createMemoryControlStore();
    let refreshCalls = 0;
    const refreshedAt = new Date('2026-05-27T00:00:00.000Z');
    const handler = createDrillServerHandler(
      {
        control,
        platform: 'backup',
        recordHeartbeat: async () => {
          refreshCalls += 1;
          return control.recordHeartbeat({
            platform: 'backup',
            workerId: 'backup-drill-worker',
          });
        },
        workerId: 'backup-drill-worker',
      },
      'correct-secret',
      () => refreshedAt
    );

    await withServer(handler, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/control-plane/refresh`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer correct-secret',
        },
      });

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        ok: true,
        refreshedAt: refreshedAt.toISOString(),
        ownership: 'local',
      });
      expect(refreshCalls).toBe(1);
    });
  });

  it('returns a readable 500 when the ready door cannot read control state', async () => {
    const handler = createDrillServerHandler(
      {
        control: {
          async getState() {
            throw new Error('control store offline');
          },
        },
        platform: 'backup',
        recordHeartbeat: async () => createMemoryControlStore().getState(),
        workerId: 'backup-drill-worker',
      },
      'secret'
    );

    await withServer(handler, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ready`, {
        headers: {
          Authorization: 'Bearer secret',
        },
      });

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: 'drill_server_error',
        message: 'control store offline',
        route: '/ready',
      });
    });
  });

  it('returns a readable 500 when the refresh door cannot record a heartbeat', async () => {
    const control = createMemoryControlStore();
    const handler = createDrillServerHandler(
      {
        control,
        platform: 'backup',
        async recordHeartbeat() {
          throw new Error('heartbeat write failed');
        },
        workerId: 'backup-drill-worker',
      },
      'correct-secret'
    );

    await withServer(handler, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/control-plane/refresh`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer correct-secret',
        },
      });

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: 'drill_server_error',
        message: 'heartbeat write failed',
        route: '/control-plane/refresh',
      });
    });
  });
});
