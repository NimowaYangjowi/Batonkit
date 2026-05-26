import { describe, expect, it } from 'vitest';

import {
  applyFailoverEvent,
  createMemoryControlStore,
  type BackupProvider,
} from './index.js';

describe('failover decisions', () => {
  it('switches to backup on local down and wakes the provider', async () => {
    const control = createMemoryControlStore();
    const calls: string[] = [];
    const provider: BackupProvider = {
      wake: async () => {
        calls.push('wake');
      },
      park: async () => {
        calls.push('park');
      },
    };

    const result = await applyFailoverEvent({
      control,
      provider,
      event: 'down',
      reason: 'monitor_down',
      failbackCooldownMs: 300_000,
    });

    expect(result.action).toBe('failed_over');
    expect((await control.getState()).activeOwner).toBe('backup');
    expect(calls).toEqual(['wake']);
  });

  it('starts failback cooldown before restoring local ownership', async () => {
    const control = createMemoryControlStore({
      now: () => new Date('2026-05-25T00:00:00.000Z'),
    });
    const provider: BackupProvider = {
      wake: async () => undefined,
      park: async () => undefined,
    };

    await applyFailoverEvent({
      control,
      provider,
      event: 'down',
      failbackCooldownMs: 300_000,
    });
    const result = await applyFailoverEvent({
      control,
      provider,
      event: 'up',
      failbackCooldownMs: 300_000,
      observedAt: new Date('2026-05-25T00:01:00.000Z'),
    });

    expect(result.action).toBe('failback_cooldown');
    expect((await control.getState()).activeOwner).toBe('backup');
    expect((await control.getState()).failbackNotBefore?.toISOString()).toBe(
      '2026-05-25T00:06:00.000Z'
    );
  });

  it('restores local ownership immediately when cooldown is zero', async () => {
    const control = createMemoryControlStore();
    const calls: string[] = [];
    const provider: BackupProvider = {
      wake: async () => undefined,
      park: async () => {
        calls.push('park');
      },
    };

    await applyFailoverEvent({
      control,
      provider,
      event: 'down',
      failbackCooldownMs: 0,
    });
    const result = await applyFailoverEvent({
      control,
      provider,
      event: 'up',
      failbackCooldownMs: 0,
    });

    expect(result.action).toBe('restored_local');
    expect((await control.getState()).activeOwner).toBe('local');
    expect(calls).toEqual(['park']);
  });

  it('rolls ownership back when backup wake fails', async () => {
    const control = createMemoryControlStore();
    const provider: BackupProvider = {
      wake: async () => {
        throw new Error('wake failed');
      },
      park: async () => undefined,
    };

    await expect(
      applyFailoverEvent({
        control,
        provider,
        event: 'down',
        failbackCooldownMs: 300_000,
      })
    ).rejects.toThrow('wake failed');
    expect((await control.getState()).activeOwner).toBe('local');
  });
});
